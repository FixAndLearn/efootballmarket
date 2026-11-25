import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { sendWhatsAppMessage } from "@/lib/whatsapp/cloudApi";
import { sendTransactionalEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

/**
 * Review prompt cron (`/api/cron/review-prompts`)
 *
 * Problem it solves: the seller rating UI lives only inside the order page, so
 * a buyer who closes the tab after receiving their squad never rates. Result:
 * 5 completed orders and zero reviews in production.
 *
 * This nudges buyers who completed an order and have not rated it yet. Runs on
 * a schedule; each order is prompted at most once per channel because we record
 * the prompt in audit_logs.
 */

const MAX_PER_RUN = 100;

function reviewLink(orderId: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://www.efootballmarket.co.ke";
  return `${base.replace(/\/$/, "")}/orders/${orderId}`;
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET?.trim();

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron invocation" }, { status: 401 });
    }

    if (!hasServiceRoleKey()) {
      return NextResponse.json(
        { error: "Service role key required." },
        { status: 503 }
      );
    }

    const admin = createAdminClient();
    const now = new Date();

    // Vercel Hobby permits only daily crons, so this runs once a day: prompt
    // orders that completed more than a few hours ago.
    //
    // There used to be a 14-day upper bound here. It looked reasonable and was
    // fatal: every order older than two weeks became invisible to this cron
    // forever, so a marketplace that went quiet for a fortnight would never
    // prompt anyone again. A buyer who has not rated an order does not stop
    // being able to rate it -- the prompt is still worth sending on day 30.
    // The once-only guarantee comes from the ORDER_REVIEW_PROMPTED check below,
    // not from an age cutoff.
    const minAge = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();

    const { data: orders, error: ordersErr } = await admin
      .from("orders")
      .select("id, order_number, buyer_id, seller_id, status, updated_at")
      .eq("status", "completed")
      .lte("updated_at", minAge)
      .order("updated_at", { ascending: false })
      .limit(MAX_PER_RUN);

    if (ordersErr) {
      return NextResponse.json({ error: ordersErr.message }, { status: 500 });
    }

    const results = { scanned: orders?.length || 0, prompted: 0, skipped_rated: 0, skipped_prompted: 0, failed: 0 };

    for (const order of orders || []) {
      // Already rated?
      const { data: rated } = await admin
        .from("audit_logs")
        .select("id")
        .eq("action", "ORDER_SELLER_RATING")
        .eq("resource_id", order.id)
        .maybeSingle();

      if (rated) {
        results.skipped_rated += 1;
        continue;
      }

      // Already prompted?
      const { data: prompted } = await admin
        .from("audit_logs")
        .select("id")
        .eq("action", "ORDER_REVIEW_PROMPTED")
        .eq("resource_id", order.id)
        .maybeSingle();

      if (prompted) {
        results.skipped_prompted += 1;
        continue;
      }

      const { data: buyer } = await admin
        .from("profiles")
        .select("id, username, phone_number, email")
        .eq("id", order.buyer_id)
        .maybeSingle();

      if (!buyer) {
        results.failed += 1;
        continue;
      }

      const sellerName = (() => null)();
      const link = reviewLink(order.id);
      const message =
        `Hi ${buyer.username || "there"}, your eFootballMarket order ${order.order_number} is complete. ` +
        `How did it go? Rate the seller in 30 seconds so the next buyer knows who is reliable: ${link}`;

      // In-app notification first: always works, costs nothing.
      let delivered = false;
      // supabase-js resolves with { error }; it does not throw. The old
      // try/catch here could never fire, so `delivered` was set to true even
      // when the insert was rejected.
      const { error: notifyError } = await admin.from("notifications").insert({
        recipient_id: buyer.id,
        type: "review_request",
        title: "Rate your completed order",
        message: `Order ${order.order_number} is complete. Rate the seller to help other buyers.`,
        action_url: `/orders/${order.id}`,
        is_read: false,
      });
      if (notifyError) {
        console.warn("[review-prompts] in-app insert failed:", notifyError.code, notifyError.message);
      } else {
        delivered = true;
      }

      // WhatsApp if we have a number and a provider is configured.
      const phone = String(buyer.phone_number || "").replace(/[^0-9]/g, "");
      if (phone.length >= 9) {
        try {
          const res = await sendWhatsAppMessage({ toPhone: phone, message });
          if (res?.success && res.provider !== "simulated_local") delivered = true;
        } catch {
          // non-fatal
        }
      }

      // Email as a fallback channel.
      if (buyer.email) {
        try {
          const res = await sendTransactionalEmail({
            to: buyer.email,
            subject: `How was your eFootballMarket order ${order.order_number}?`,
            html: `<p>Hi ${buyer.username || "there"},</p><p>Your order <strong>${order.order_number}</strong> is complete. Please take 30 seconds to rate the seller — verified buyer reviews are what make this marketplace safe for everyone.</p><p><a href="${link}">Rate this seller</a></p><p>— eFootballMarket</p>`,
          });
          if (res?.success) delivered = true;
        } catch {
          // non-fatal
        }
      }

      // Record the prompt so we never repeat it, and so a failed run is visible.
      try {
        await admin.from("audit_logs").insert({
          action: "ORDER_REVIEW_PROMPTED",
          resource_type: "orders",
          resource_id: order.id,
          changes: { delivered, channels: ["in_app", "whatsapp", "email"] },
        });
      } catch {
        // ignore
      }

      if (delivered) results.prompted += 1;
      else results.failed += 1;
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    console.error("review-prompts cron error:", error?.message);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
