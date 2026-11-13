import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PaymentService } from "@/services/paymentService";
import { normalizePhoneNumber } from "@/lib/utils/phone";
import { dispatchAdminWhatsAppAlert } from "@/lib/notifications/adminAlert";
import { checkRateLimit, getIdempotencyResult, setIdempotencyResult } from "@/lib/security/rateLimiter";
import { isListingOnFlashSale } from "@/lib/utils/flashSale";
import { calculateEscrowCommission } from "@/lib/utils/commission";
import { z } from "zod";

export const dynamic = "force-dynamic";

const directCheckoutSchema = z.object({
  listingId: z.string().min(1, "Listing ID required"),
  phoneNumber: z.string().min(9, "Valid Safaricom phone number required"),
  buyerName: z.string().optional(),
  offerId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const rateCheck = checkRateLimit(`checkout:${ip}`, 12, 60000);

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please wait a moment before trying again." },
        { status: 429 }
      );
    }
    const json = await req.json();
    const parsed = directCheckoutSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid checkout request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { listingId, phoneNumber, buyerName, offerId } = parsed.data;
    const adminSupabase = createAdminClient();

    // 1. Fetch listing
    const { data: listing, error: listingError } = await adminSupabase
      .from("listings")
      .select("*, seller:profiles(username, phone_number)")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found or expired" }, { status: 404 });
    }

    if (listing.status !== "published") {
      return NextResponse.json({ error: "This listing is no longer available for purchase." }, { status: 400 });
    }

    // 2. Determine price: backend is aware of Friday Flash Drop promotional pricing & bargaining rules
    const isFlashSale = isListingOnFlashSale(listing);
    let finalPrice = Number(listing.price);

    if (isFlashSale) {
      // On Fridays, squads are locked at promotional flash drop price and bargaining is withdrawn
      finalPrice = Number(listing.price);
    } else if (offerId) {
      // Strictly verify offer belongs to THIS listing, is accepted, and has not expired
      try {
        const { data: offerData } = await adminSupabase
          .from("listing_offers")
          .select("*")
          .eq("id", offerId)
          .eq("listing_id", listingId)
          .maybeSingle();

        const notExpired =
          !offerData?.expires_at ||
          new Date(offerData.expires_at).getTime() > Date.now();

        if (
          offerData &&
          (offerData.status === "accepted" || offerData.status === "countered") &&
          notExpired
        ) {
          const agreed =
            offerData.status === "countered"
              ? Number(offerData.counter_price || offerData.counter_amount || listing.price)
              : Number(
                  offerData.counter_price ||
                    offerData.offered_price ||
                    offerData.offer_amount ||
                    listing.price
                );
          if (agreed >= 50) {
            finalPrice = agreed;
          }
        }
      } catch {
        // Continue with original listing price if offer lookup fails
      }
    }

    // 3. Determine buyer identity
    const serverSupabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

    const normPhone = normalizePhoneNumber(phoneNumber);
    const internationalPhone = normPhone.isValid ? normPhone.international : phoneNumber;
    const cleanDigits = normPhone.digits || phoneNumber.replace(/\D/g, "");

    // Financial Idempotency Check (prevents duplicate orders & double STK pushes within 45s)
    const idempotencyKey =
      req.headers.get("x-idempotency-key") ||
      `direct-checkout:${listingId}:${cleanDigits}:${finalPrice}`;
    const cachedResult = getIdempotencyResult(idempotencyKey, 45000);
    if (cachedResult) {
      return NextResponse.json({
        ...cachedResult,
        idempotent: true,
      });
    }

    const buyerId = user?.id;

    if (!buyerId) {
      return NextResponse.json(
        {
          error:
            "Please sign in or create a free account first so your encrypted Konami ID credentials can be delivered privately to your Order Room.",
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    // Ensure authenticated buyer has a public.profiles row before order FK insert
    try {
      const { data: existingProfile } = await adminSupabase
        .from("profiles")
        .select("id")
        .eq("id", buyerId)
        .maybeSingle();

      if (!existingProfile) {
        const cleanId = buyerId.replace(/-/g, "").slice(0, 6);
        const baseName = (
          buyerName?.trim() ||
          user.user_metadata?.username ||
          user.email?.split("@")[0] ||
          "trader"
        )
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "")
          .slice(0, 16);

        await adminSupabase.from("profiles").upsert(
          {
            id: buyerId,
            username: `${baseName || "trader"}_${cleanId}`,
            first_name: buyerName?.trim() || user.user_metadata?.first_name || "Trader",
            phone_number: internationalPhone,
            country: "KEN",
            email: user.email || null,
            role: "user",
          },
          { onConflict: "id" }
        );
      }
    } catch (profErr) {
      console.warn("Buyer profile sync note:", profErr);
    }

    if (listing.seller_id === buyerId) {
      return NextResponse.json({ error: "You cannot purchase your own account listing." }, { status: 400 });
    }

    // 4. Reuse existing recent `payment_pending` order for this buyer + listing + price, or create atomically
    let order: any = null;
    const { data: reusableOrder } = await adminSupabase
      .from("orders")
      .select("*")
      .eq("buyer_id", buyerId)
      .eq("listing_id", listing.id)
      .eq("status", "payment_pending")
      .eq("total_amount", finalPrice)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reusableOrder) {
      order = reusableOrder;
    } else {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
      const orderNumber = `EFM-${timestamp}-${random}`;

      const { data: createdOrder, error: orderError } = await adminSupabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          listing_id: listing.id,
          buyer_id: buyerId,
          seller_id: listing.seller_id,
          total_amount: finalPrice,
          platform_fee: calculateEscrowCommission(finalPrice),
          seller_net_amount: Math.max(0, finalPrice - calculateEscrowCommission(finalPrice)),
          currency: listing.currency || "KES",
          status: "payment_pending",
        })
        .select()
        .single();

      if (orderError || !createdOrder) {
        return NextResponse.json(
          { error: `Failed to create order: ${orderError?.message || "Unknown error"}` },
          { status: 500 }
        );
      }
      order = createdOrder;

      // 5. Create Escrow Account record
      try {
        await adminSupabase.from("escrow_accounts").insert({
          order_id: order.id,
          seller_id: listing.seller_id,
          gross_amount: finalPrice,
          fee_amount: calculateEscrowCommission(finalPrice),
          net_amount: Math.max(0, finalPrice - calculateEscrowCommission(finalPrice)),
          escrow_state: "pending",
        });
      } catch (err) {
        console.warn("Escrow insert note:", err);
      }
    }

    // 6. Trigger M-Pesa STK Push
    const paymentService = new PaymentService(adminSupabase);
    const paymentResult = await paymentService.initiateOrderPayment(order.id, cleanDigits);

    // Automated WhatsApp alert to Brian Okibo (+254794400365)
    dispatchAdminWhatsAppAlert({
      eventType: "NEW_ORDER_CREATED",
      orderId: order.id,
      orderNumber: order.order_number,
      listingTitle: listing.title,
      amount: finalPrice,
      buyerPhone: internationalPhone,
    }).catch(() => {});

    const responsePayload = {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      totalAmount: finalPrice,
      checkoutRequestId: paymentResult.checkoutRequestId,
      customerMessage: paymentResult.customerMessage,
      tillNumber: "1572931",
      redirectUrl: `/orders/${order.id}`,
    };

    setIdempotencyResult(idempotencyKey, responsePayload);

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error("Direct Checkout Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process checkout" }, { status: 500 });
  }
}
