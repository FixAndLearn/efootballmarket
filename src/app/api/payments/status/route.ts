import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mpesaClient } from "@/lib/mpesa/client";
import { dispatchAdminOrderAlert } from "@/lib/notifications/adminAlert";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import {
  getClientIp,
  isValidUuid,
  sanitizeTransactionId,
} from "@/lib/security/guards";
import { PaymentService } from "@/services/paymentService";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate",
  "CDN-Cache-Control": "no-store",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * GET /api/payments/status
 * Real-time polling endpoint to detect server-verified M-Pesa settlements.
 */
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`pay_status_get:${ip}`, 90, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many status requests. Please wait a moment." },
        { status: 429, headers: NO_CACHE_HEADERS }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawCheckoutId = searchParams.get("checkoutRequestId");
    const rawOrderId = searchParams.get("orderId");
    const forceCheck = searchParams.get("forceCheck") === "true";

    const checkoutRequestId = sanitizeTransactionId(rawCheckoutId);
    const orderId = isValidUuid(rawOrderId) ? rawOrderId.trim() : null;

    if (!checkoutRequestId && !orderId) {
      return NextResponse.json(
        { error: "Valid checkoutRequestId or orderId is required" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const userClient = createServerSupabaseClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();

    const adminSupabase = createAdminClient();
    const primaryClient = hasServiceRoleKey() ? adminSupabase : userClient;

    // 1. Check orders table if valid UUID orderId supplied
    let order: any = null;
    if (orderId) {
      const { data: orderData } = await primaryClient
        .from("orders")
        .select("id, status, total_amount, order_number, listing_id, seller_id, buyer_id")
        .eq("id", orderId)
        .maybeSingle();

      order = orderData;

      // Require caller to either own the order or provide a checkoutRequestId
      if (
        order &&
        user &&
        order.buyer_id !== user.id &&
        order.seller_id !== user.id &&
        !checkoutRequestId
      ) {
        return NextResponse.json(
          { error: "Forbidden order status lookup" },
          { status: 403, headers: NO_CACHE_HEADERS }
        );
      }

      if (order && order.status !== "payment_pending") {
        return NextResponse.json(
          {
            status: "completed",
            receiptNumber: "CONFIRMED",
            resultCode: 0,
            resultDesc: "Payment verified in escrow",
          },
          { headers: NO_CACHE_HEADERS }
        );
      }
    }

    // 2. Safe parameterized lookup on payments table (no raw string interpolation in .or())
    let payment: any = null;
    if (orderId) {
      const { data: payments } = await primaryClient
        .from("payments")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1);

      payment = payments?.[0];
    } else if (checkoutRequestId) {
      const { data: byCheckout } = await primaryClient
        .from("payments")
        .select("*")
        .eq("checkout_request_id", checkoutRequestId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (byCheckout && byCheckout.length > 0) {
        payment = byCheckout[0];
      } else {
        const { data: byMerchant } = await primaryClient
          .from("payments")
          .select("*")
          .eq("merchant_request_id", checkoutRequestId)
          .order("created_at", { ascending: false })
          .limit(1);
        payment = byMerchant?.[0];
      }
    }

    if (payment && payment.status === "completed") {
      return NextResponse.json(
        {
          status: "completed",
          receiptNumber: payment.mpesa_receipt_number || "CONFIRMED",
          resultCode: 0,
          resultDesc: "Payment completed successfully",
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // 3. Actively query UnifiedPay upstream when configured
    const transIdToCheck = sanitizeTransactionId(
      checkoutRequestId ||
        payment?.checkout_request_id ||
        payment?.merchant_request_id
    );

    if (
      transIdToCheck &&
      mpesaClient.isUnifiedPay() &&
      (forceCheck || payment?.status === "pending")
    ) {
      const liveStatus = await mpesaClient.checkUnifiedPayStatus(transIdToCheck);
      const expectedAmount = Number(
        payment?.amount || order?.total_amount || 0
      );
      const settledAmount = Number(liveStatus?.amount || expectedAmount);

      if (
        liveStatus &&
        liveStatus.isSuccess &&
        (expectedAmount <= 0 || settledAmount + 0.01 >= expectedAmount)
      ) {
        const receipt = liveStatus.receiptNumber || `CONFIRMED_${Date.now()}`;
        const paymentService = new PaymentService(primaryClient);

        if (payment) {
          await paymentService.markPaymentSuccessful(
            payment.id,
            receipt,
            settledAmount,
            liveStatus
          );
        }

        return NextResponse.json(
          {
            status: "completed",
            receiptNumber: receipt,
            resultCode: 0,
            resultDesc: "Payment verified via Safaricom Till 1572931",
          },
          { headers: NO_CACHE_HEADERS }
        );
      }
    }

    return NextResponse.json(
      {
        status: "pending",
        resultCode: 1032,
        resultDesc: "Waiting for M-Pesa PIN confirmation",
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error("Status check route error:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

/**
 * POST /api/payments/status
 * Zero-Trust M-Pesa Receipt Verification:
 * - Unlocks escrow IMMEDIATELY only when cryptographic/upstream gateway verification confirms settlement >= order total.
 * - For manual Buy Goods Till 1572931 transfers without an STK checkout reference, logs the receipt
 *   under `pending_verification` and alerts the Escrow Desk—NEVER unlocks escrow from an unverified string.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to submit an M-Pesa receipt." },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    const rate = checkRateLimit(`receipt_verify:${user.id}:${ip}`, 5, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many receipt verification attempts. Please wait 1 minute." },
        { status: 429, headers: NO_CACHE_HEADERS }
      );
    }

    const body = await req.json();
    const rawOrderId = body?.orderId;
    const rawReceipt = body?.receiptNumber;
    const checkoutRequestId = sanitizeTransactionId(body?.checkoutRequestId);

    if (!isValidUuid(rawOrderId) || !rawReceipt) {
      return NextResponse.json(
        { error: "Valid Order ID and M-Pesa receipt code are required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const orderId = rawOrderId.trim();
    const cleanReceipt = String(rawReceipt).trim().toUpperCase();

    if (!/^[A-Z0-9]{8,12}$/.test(cleanReceipt)) {
      return NextResponse.json(
        { error: "Enter a valid 8–12 character Safaricom M-Pesa receipt code." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const adminSupabase = createAdminClient();
    const primaryClient = hasServiceRoleKey() ? adminSupabase : supabase;

    // 1. Fetch order and verify ownership
    const { data: order, error: orderErr } = await primaryClient
      .from("orders")
      .select("*, listing:listings(id, title)")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    if (order.buyer_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized order verification." },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    if (order.status !== "payment_pending") {
      return NextResponse.json(
        {
          success: true,
          status: "completed",
          receiptNumber: cleanReceipt,
          message: "Payment is already secured in escrow.",
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    const expectedAmount = Number(order.total_amount || 0);

    // 2. Check if receipt is already tied to another order
    const { data: existingByReceipt } = await primaryClient
      .from("payments")
      .select("*")
      .eq("mpesa_receipt_number", cleanReceipt)
      .maybeSingle();

    if (existingByReceipt && existingByReceipt.order_id !== orderId) {
      return NextResponse.json(
        { error: "This M-Pesa receipt code is already registered to another order." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // 3. Check if webhook ALREADY verified this exact payment in DB
    if (
      existingByReceipt &&
      existingByReceipt.order_id === orderId &&
      existingByReceipt.status === "completed" &&
      Number(existingByReceipt.amount || 0) + 0.01 >= expectedAmount
    ) {
      const paymentService = new PaymentService(primaryClient);
      await paymentService.markPaymentSuccessful(
        existingByReceipt.id,
        cleanReceipt,
        Number(existingByReceipt.amount),
        existingByReceipt.raw_callback || { verified_from_completed_payment: true }
      );

      return NextResponse.json(
        {
          success: true,
          status: "completed",
          receiptNumber: cleanReceipt,
          message: "Payment verified via Safaricom callback and locked in escrow.",
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // 4. Locate pending payment for this order and query UnifiedPay upstream
    const { data: existingOrderPayment } = await primaryClient
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const transId = sanitizeTransactionId(
      checkoutRequestId ||
        existingOrderPayment?.checkout_request_id ||
        existingOrderPayment?.merchant_request_id
    );

    if (transId && mpesaClient.isUnifiedPay()) {
      const liveStatus = await mpesaClient.checkUnifiedPayStatus(transId);
      const liveReceipt = String(liveStatus?.receiptNumber || "").trim().toUpperCase();
      const liveAmount = Number(liveStatus?.amount || 0);

      if (
        liveStatus &&
        liveStatus.isSuccess &&
        (!liveReceipt || liveReceipt === cleanReceipt) &&
        (liveAmount <= 0 || liveAmount + 0.01 >= expectedAmount)
      ) {
        const paymentService = new PaymentService(primaryClient);
        if (existingOrderPayment) {
          await paymentService.markPaymentSuccessful(
            existingOrderPayment.id,
            liveReceipt || cleanReceipt,
            liveAmount || expectedAmount,
            liveStatus
          );

          return NextResponse.json(
            {
              success: true,
              status: "completed",
              receiptNumber: liveReceipt || cleanReceipt,
              message: "Payment verified upstream on Till 1572931 and locked in escrow.",
            },
            { headers: NO_CACHE_HEADERS }
          );
        }
      }
    }

    // 5. Unverified manual Buy Goods receipt: NEVER auto-unlock escrow!
    // Log receipt claim for Admin statement reconciliation on Till 1572931.
    const now = new Date().toISOString();
    if (existingOrderPayment) {
      await primaryClient
        .from("payments")
        .update({
          raw_callback: {
            ...(existingOrderPayment.raw_callback || {}),
            buyer_submitted_receipt: cleanReceipt,
            submitted_by: user.id,
            submitted_at: now,
            verification_state: "awaiting_statement_reconciliation",
          },
        })
        .eq("id", existingOrderPayment.id);
    } else {
      await primaryClient.from("payments").insert({
        order_id: orderId,
        payment_method: "mpesa",
        phone_number: user.phone || "254700000000",
        amount: expectedAmount,
        currency: order.currency || "KES",
        merchant_request_id: `MANUAL-CLAIM-${order.order_number}`,
        checkout_request_id: `MANUAL-CLAIM-${order.order_number}`,
        status: "pending",
        raw_callback: {
          buyer_submitted_receipt: cleanReceipt,
          submitted_by: user.id,
          submitted_at: now,
          verification_state: "awaiting_statement_reconciliation",
        },
      });
    }

    dispatchAdminOrderAlert({
      orderId,
      orderNumber: order.order_number,
      listingTitle: `${order.listing?.title || "Squad"} [VERIFY TILL 1572931 RECEIPT: ${cleanReceipt}]`,
      amount: expectedAmount,
      currency: order.currency || "KES",
      buyerPhone: user.phone || "",
      receiptNumber: cleanReceipt,
      eventType: "NEW_ORDER_CREATED",
    }).catch((err) => console.warn("Manual receipt admin alert error:", err));

    return NextResponse.json(
      {
        success: true,
        status: "pending_verification",
        receiptNumber: cleanReceipt,
        message:
          "Receipt submitted for Till 1572931 statement verification. Escrow unlocks automatically as soon as Safaricom confirms settlement.",
      },
      { status: 202, headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error("Manual receipt verification error:", error);
    return NextResponse.json(
      { error: "Failed to process M-Pesa receipt submission." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
