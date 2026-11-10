import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { verifyAdminOrSecret } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

async function runHousekeeping(req: NextRequest) {
  const auth = await verifyAdminOrSecret(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const client = hasServiceRoleKey()
    ? createAdminClient()
    : createServerSupabaseClient();

  const now = Date.now();
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date(now).toISOString();

  let scrubbedDeliveries = 0;
  let expiredOffers = 0;
  let cancelledAbandonedOrders = 0;

  // 1. Scrub Konami credentials on completed orders older than 14 days (KDPA 2019 retention rule)
  const { data: oldCompletedOrders } = await client
    .from("orders")
    .select("id")
    .eq("status", "completed")
    .lt("updated_at", fourteenDaysAgo)
    .limit(200);

  const completedIds = (oldCompletedOrders || []).map((o: any) => o.id);
  if (completedIds.length > 0) {
    const { data: activeVaults } = await client
      .from("account_deliveries")
      .select("id, order_id, encrypted_konami_email, encrypted_konami_password")
      .in("order_id", completedIds);

    const vaultsToScrub = (activeVaults || []).filter(
      (v: any) =>
        Boolean(v.encrypted_konami_email && v.encrypted_konami_email.length > 0) ||
        Boolean(v.encrypted_konami_password && v.encrypted_konami_password.length > 0)
    );

    for (const vault of vaultsToScrub) {
      const { error } = await client
        .from("account_deliveries")
        .update({
          encrypted_konami_email: "",
          encrypted_konami_password: "",
          encrypted_backup_codes: null,
          transfer_instructions: "[SCRUBBED_AFTER_14D_RETENTION]",
          updated_at: nowIso,
        })
        .eq("id", vault.id);

      if (!error) {
        scrubbedDeliveries += 1;
      }
    }
  }

  // 2. Expire accepted buyer offers past their 24h checkout window
  const { data: staleOffers } = await client
    .from("listing_offers")
    .select("id")
    .eq("status", "accepted")
    .lt("expires_at", nowIso)
    .limit(200);

  if (staleOffers && staleOffers.length > 0) {
    const staleIds = staleOffers.map((o: any) => o.id);
    const { error } = await client
      .from("listing_offers")
      .update({ status: "expired", updated_at: nowIso })
      .in("id", staleIds);

    if (!error) {
      expiredOffers = staleIds.length;
    }
  }

  // 3. Cancel abandoned payment_pending orders (>24h old) that do NOT have a manual receipt claim
  const { data: stalePendingOrders } = await client
    .from("orders")
    .select("id, listing_id")
    .eq("status", "payment_pending")
    .lt("created_at", twentyFourHoursAgo)
    .limit(150);

  if (stalePendingOrders && stalePendingOrders.length > 0) {
    const candidateOrderIds = stalePendingOrders.map((o: any) => o.id);
    const { data: activeReceiptClaims } = await client
      .from("payments")
      .select("order_id, raw_callback_payload")
      .in("order_id", candidateOrderIds);

    const protectedOrderIds = new Set(
      (activeReceiptClaims || [])
        .filter((p: any) => Boolean((p.raw_callback_payload as any)?.buyer_submitted_receipt))
        .map((p: any) => p.order_id)
    );

    for (const staleOrder of stalePendingOrders) {
      if (protectedOrderIds.has(staleOrder.id)) continue;

      const { error } = await client
        .from("orders")
        .update({ status: "cancelled", updated_at: nowIso })
        .eq("id", staleOrder.id)
        .eq("status", "payment_pending");

      if (!error) {
        cancelledAbandonedOrders += 1;
        if (staleOrder.listing_id) {
          await client
            .from("listings")
            .update({ status: "published", updated_at: nowIso })
            .eq("id", staleOrder.listing_id)
            .eq("status", "in_escrow");
        }
      }
    }
  }

  // Record audit trail
  try {
    await client.from("audit_logs").insert({
      actor_id: auth.userId || null,
      action: "CRON_HOUSEKEEPING_RUN",
      resource_type: "system",
      resource_id: "housekeeping",
      changes: {
        scrubbedDeliveries,
        expiredOffers,
        cancelledAbandonedOrders,
        triggeredBy: auth.email || "cron",
      },
    });
  } catch {
    // non-blocking
  }

  return NextResponse.json({
    success: true,
    timestamp: nowIso,
    scrubbedDeliveries,
    expiredOffers,
    cancelledAbandonedOrders,
  });
}

export async function GET(req: NextRequest) {
  try {
    return await runHousekeeping(req);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Housekeeping failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    return await runHousekeeping(req);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Housekeeping failed" },
      { status: 500 }
    );
  }
}
