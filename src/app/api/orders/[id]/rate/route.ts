import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp, isValidUuid } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(300).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isValidUuid(params.id)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ rated: false }, { status: 401 });
    }

    const client = hasServiceRoleKey() ? createAdminClient() : supabase;

    const { data: existingLog } = await client
      .from("audit_logs")
      .select("changes, created_at")
      .eq("action", "ORDER_SELLER_RATING")
      .eq("resource_id", params.id)
      .maybeSingle();

    if (existingLog) {
      const changes = (existingLog.changes as any) || {};
      return NextResponse.json({
        rated: true,
        rating: Number(changes.rating || 5),
        comment: changes.comment || "",
        createdAt: existingLog.created_at,
      });
    }

    return NextResponse.json({ rated: false });
  } catch {
    return NextResponse.json({ rated: false });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    if (!isValidUuid(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const ip = getClientIp(req);
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to rate this transaction." },
        { status: 401 }
      );
    }

    const rate = checkRateLimit(`rate_order:${user.id}:${ip}`, 6, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many rating requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const json = await req.json();
    const parsed = ratingSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Select a rating between 1 and 5 stars." },
        { status: 400 }
      );
    }

    const { rating, comment } = parsed.data;
    const client = hasServiceRoleKey() ? createAdminClient() : supabase;

    // 1. Verify order exists, is completed, and caller is the verified buyer
    const { data: order, error: orderErr } = await client
      .from("orders")
      .select("id, order_number, status, buyer_id, seller_id")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.buyer_id !== user.id) {
      return NextResponse.json(
        { error: "Only the verified buyer of this order can submit a seller rating." },
        { status: 403 }
      );
    }

    if (order.status !== "completed") {
      return NextResponse.json(
        { error: "Seller ratings can only be submitted once the order is completed." },
        { status: 400 }
      );
    }

    // 2. Enforce strict 1-rating-per-order invariant via audit_logs
    const { data: duplicate } = await client
      .from("audit_logs")
      .select("id")
      .eq("action", "ORDER_SELLER_RATING")
      .eq("resource_id", orderId)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        { error: "You have already submitted a rating for this order." },
        { status: 409 }
      );
    }

    await client.from("audit_logs").insert({
      actor_id: user.id,
      action: "ORDER_SELLER_RATING",
      resource_type: "orders",
      resource_id: orderId,
      changes: {
        rating,
        comment: comment || null,
        seller_id: order.seller_id,
        order_number: order.order_number,
      },
    });

    // Optional insert into reviews table if present
    try {
      await client.from("reviews").insert({
        order_id: orderId,
        reviewer_id: user.id,
        seller_id: order.seller_id,
        rating,
        comment: comment || "",
      });
    } catch {
      // non-blocking if reviews table is omitted
    }

    // 3. Recompute rolling seller_rating & total_reviews_count on seller profile
    const { data: sellerProf } = await client
      .from("profiles")
      .select("seller_rating, total_reviews_count")
      .eq("id", order.seller_id)
      .maybeSingle();

    const prevCount = Math.max(0, Number(sellerProf?.total_reviews_count || 0));
    const prevRating = Math.max(0, Number(sellerProf?.seller_rating || 0));
    const nextCount = prevCount + 1;
    const nextRating =
      Math.round(((prevRating * prevCount + rating) / nextCount) * 100) / 100;

    await client
      .from("profiles")
      .update({
        seller_rating: nextRating,
        total_reviews_count: nextCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.seller_id);

    // 4. Notify seller
    try {
      await client.from("notifications").insert({
        recipient_id: order.seller_id,
        type: "order_update",
        title: `New ${rating}/5 Seller Rating (#${order.order_number})`,
        message: comment
          ? `Buyer rated your handover ${rating}/5 stars: "${comment}"`
          : `Buyer rated your squad handover ${rating}/5 stars. New overall rating: ${nextRating.toFixed(1)}.`,
        action_url: `/orders/${orderId}`,
        is_read: false,
      });
    } catch {
      // non-blocking
    }

    return NextResponse.json({
      success: true,
      rating,
      comment: comment || "",
      sellerNewRating: nextRating,
      sellerTotalReviews: nextCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to submit seller rating." },
      { status: 500 }
    );
  }
}
