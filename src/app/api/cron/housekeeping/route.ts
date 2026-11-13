import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EscrowService } from "@/services/escrowService";

export const dynamic = "force-dynamic";

/**
 * Automated Daily Housekeeping Cron Route (`/api/cron/housekeeping`)
 * Triggered daily at 02:00 UTC via Vercel Cron (`vercel.json`).
 * Protected strictly by `Authorization: Bearer <CRON_SECRET>`.
 *
 * Responsibilities:
 * 1. Auto-release escrow funds for `seller_delivered` orders where the 24-hour buyer inspection window has elapsed without dispute.
 * 2. Expire stale pending `listing_offers` older than 48 hours.
 * 3. Cancel abandoned `payment_pending` orders (>24 hours without completed payment or buyer receipt) and unlock un-funded `in_escrow` squads.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET?.trim();

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron invocation" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const escrowService = new EscrowService(supabase);
    const now = new Date();
    const results = {
      auto_released_orders: 0,
      expired_offers: 0,
      stale_orders_cancelled: 0,
      unlocked_listings: 0,
      errors: [] as string[],
    };

    // 1. Auto-release orders in `seller_delivered` where 24h inspection window elapsed without open dispute
    try {
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const { data: deliveredOrders } = await supabase
        .from("orders")
        .select(
          "id, buyer_id, seller_id, order_number, inspection_deadline_at, deliveries:account_deliveries(delivered_at)"
        )
        .eq("status", "seller_delivered");

      if (deliveredOrders && deliveredOrders.length > 0) {
        for (const order of deliveredOrders) {
          const deliveryRows = Array.isArray((order as any).deliveries)
            ? (order as any).deliveries
            : (order as any).deliveries
            ? [(order as any).deliveries]
            : [];
          const deliveredAt = deliveryRows[0]?.delivered_at || null;

          const deadlinePassed = order.inspection_deadline_at
            ? order.inspection_deadline_at < now.toISOString()
            : Boolean(deliveredAt && deliveredAt < twentyFourHoursAgo);

          if (!deadlinePassed) continue;

          // Ensure no open/investigating dispute exists
          const { data: openDispute } = await supabase
            .from("disputes")
            .select("id")
            .eq("order_id", order.id)
            .in("status", ["open", "under_review", "investigating"])
            .maybeSingle();

          if (!openDispute) {
            try {
              await escrowService.confirmAndRelease(order.id, order.buyer_id);
              results.auto_released_orders += 1;
            } catch (relErr: any) {
              results.errors.push(`Order ${order.id} auto-release error: ${relErr?.message}`);
            }
          }
        }
      }
    } catch (step1Err: any) {
      results.errors.push(`Step 1 error: ${step1Err?.message}`);
    }

    // 2. Expire stale pending offers (>48 hours or past expires_at)
    try {
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

      const { data: expiredByAge } = await supabase
        .from("listing_offers")
        .update({ status: "expired", updated_at: now.toISOString() })
        .eq("status", "pending")
        .lt("created_at", fortyEightHoursAgo)
        .select("id");

      results.expired_offers += expiredByAge?.length || 0;
    } catch (step2Err: any) {
      results.errors.push(`Step 2 error: ${step2Err?.message}`);
    }

    // 3. Cancel abandoned `payment_pending` orders (>24h with no completed payment or manual receipt)
    try {
      const staleOrderCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const { data: stalePendingOrders } = await supabase
        .from("orders")
        .select("id, listing_id")
        .eq("status", "payment_pending")
        .lt("created_at", staleOrderCutoff);

      if (stalePendingOrders && stalePendingOrders.length > 0) {
        for (const staleOrd of stalePendingOrders) {
          const { data: payments } = await supabase
            .from("payments")
            .select("id, status, raw_callback")
            .eq("order_id", staleOrd.id);

          const hasProtectedPayment = (payments || []).some((p: any) => {
            if (p.status === "completed") return true;
            const cb = p.raw_callback;
            return cb && typeof cb === "object" && Boolean(cb.buyer_submitted_receipt);
          });

          if (!hasProtectedPayment) {
            await supabase
              .from("orders")
              .update({ status: "cancelled", updated_at: now.toISOString() })
              .eq("id", staleOrd.id);

            await supabase
              .from("escrow_accounts")
              .update({ escrow_state: "cancelled", updated_at: now.toISOString() })
              .eq("order_id", staleOrd.id)
              .eq("escrow_state", "pending");

            results.stale_orders_cancelled += 1;
          }
        }
      }

      // 4. Safety net: unlock any `in_escrow` listing that has zero active funded orders
      const { data: lockedListings } = await supabase
        .from("listings")
        .select("id")
        .eq("status", "in_escrow")
        .is("deleted_at", null);

      if (lockedListings && lockedListings.length > 0) {
        for (const item of lockedListings) {
          const { data: fundedOrder } = await supabase
            .from("orders")
            .select("id")
            .eq("listing_id", item.id)
            .in("status", [
              "escrow_locked",
              "seller_delivered",
              "buyer_reviewing",
              "disputed",
              "completed",
            ])
            .limit(1)
            .maybeSingle();

          if (!fundedOrder) {
            await supabase
              .from("listings")
              .update({ status: "published", updated_at: now.toISOString() })
              .eq("id", item.id)
              .eq("status", "in_escrow");

            results.unlocked_listings += 1;
          }
        }
      }
    } catch (step3Err: any) {
      results.errors.push(`Step 3 error: ${step3Err?.message}`);
    }

    return NextResponse.json({
      success: true,
      ran_at: now.toISOString(),
      ...results,
    });
  } catch (err: any) {
    console.error("Housekeeping cron error:", err);
    return NextResponse.json({ error: "Housekeeping job failed" }, { status: 500 });
  }
}
