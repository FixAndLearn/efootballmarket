import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
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

    if (!hasServiceRoleKey()) {
      return NextResponse.json(
        { error: "Secure housekeeping operations are unavailable without the server-only service role key." },
        { status: 503 }
      );
    }

    const supabase = createAdminClient();
    const escrowService = new EscrowService(supabase);
    const now = new Date();


    const results = {
      auto_released_orders: 0,
      expired_offers: 0,
      stale_orders_cancelled: 0,
      unlocked_listings: 0,
      runtime_state_pruned: 0,
      errors: [] as string[],
    };

    // 0. Prune unbounded runtime state. api_rate_limit_buckets and
    // api_idempotency_records previously grew forever; nothing deleted
    // expired rows.
    try {
      const { data: pruneData, error: pruneError } = await supabase.rpc("prune_runtime_state");
      if (pruneError) {
        results.errors.push(`Runtime state pruning skipped: ${pruneError.message}`);
        console.error("[housekeeping]", `Runtime state pruning skipped: ${pruneError.message}`);
      } else {
        const raw = (pruneData ?? {}) as Record<string, unknown>;
        const buckets = Number(raw.rate_limit_buckets_pruned || 0);
        const idem = Number(raw.idempotency_records_pruned || 0);
        results.runtime_state_pruned = buckets + idem;
      }
    } catch (pruneErr: any) {
      results.errors.push(`Runtime state pruning error: ${pruneErr?.message}`);
        console.error("[housekeeping]", `Runtime state pruning error: ${pruneErr?.message}`);
    }


    // 1. Auto-release orders in `seller_delivered` where the 24h inspection
    //    window elapsed without an open dispute.
    //
    //    BUG FIXED: this step previously selected `orders.inspection_deadline_at`
    //    and embedded `account_deliveries(delivered_at)`, but neither exists.
    //    `orders` has only 12 columns and the deadline lives on
    //    `escrow_accounts.inspection_deadline`. PostgREST therefore rejected the
    //    whole query with 42703 "column does not exist" on EVERY run, the error
    //    was swallowed into results.errors, and escrow was never auto-released.
    try {
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const { data: deliveredOrders, error: deliveredErr } = await supabase
        .from("orders")
        .select("id, buyer_id, seller_id, order_number")
        .eq("status", "seller_delivered");

      if (deliveredErr) {
        results.errors.push(`Step 1 order fetch error: ${deliveredErr.message}`);
        console.error("[housekeeping]", `Step 1 order fetch error: ${deliveredErr.message}`);
      }

      if (deliveredOrders && deliveredOrders.length > 0) {
        const orderIds = deliveredOrders.map((o: any) => o.id);
        const { data: escrowRows, error: escrowErr } = await supabase
          .from("escrow_accounts")
          .select("order_id, inspection_deadline, delivered_at, escrow_state")
          .in("order_id", orderIds);

        if (escrowErr) {
          results.errors.push(`Step 1 escrow fetch error: ${escrowErr.message}`);
        console.error("[housekeeping]", `Step 1 escrow fetch error: ${escrowErr.message}`);
        }

        const escrowByOrder = new Map<string, any>();
        for (const row of escrowRows || []) {
          escrowByOrder.set((row as any).order_id, row);
        }

        for (const order of deliveredOrders) {
          const escrow = escrowByOrder.get(order.id);
          if (!escrow) continue;

          // Prefer the explicit deadline; otherwise fall back to 24h after
          // delivery was recorded.
          const deadline: string | null = escrow.inspection_deadline || null;
          const deliveredAt: string | null = escrow.delivered_at || null;

          const deadlinePassed = deadline
            ? deadline < now.toISOString()
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
        console.error("[housekeeping]", `Order ${order.id} auto-release error: ${relErr?.message}`);
            }
          }
        }
      }
    } catch (step1Err: any) {
      results.errors.push(`Step 1 error: ${step1Err?.message}`);
        console.error("[housekeeping]", `Step 1 error: ${step1Err?.message}`);
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
        console.error("[housekeeping]", `Step 2 error: ${step2Err?.message}`);
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
        console.error("[housekeeping]", `Step 3 error: ${step3Err?.message}`);
    }

    // Report non-200 when a step failed: the previous version always returned
    // success:true, so a permanently broken step (like the escrow auto-release
    // 42703 above) looked healthy forever in the Vercel cron logs.
    return NextResponse.json(
      {
        success: results.errors.length === 0,
        ran_at: now.toISOString(),
        ...results,
      },
      { status: results.errors.length === 0 ? 200 : 500 }
    );
  } catch (err: any) {
    console.error("Housekeeping cron error:", err);
    return NextResponse.json({ error: "Housekeeping job failed" }, { status: 500 });
  }
}
