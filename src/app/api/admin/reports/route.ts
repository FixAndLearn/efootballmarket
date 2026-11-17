import { isUserAdmin } from "@/lib/security/adminAuth";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * Admin report queue.
 *
 * Buyers can submit listing reports since the report dialog shipped, but
 * nothing could read them: the row was written, the desk got a WhatsApp ping,
 * and then the report dead-ended with no way to triage or resolve it.
 */

const resolveSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(["dismiss", "takedown", "suspend_seller"]),
  notes: z.string().trim().max(1000).optional(),
});

async function requireAdmin() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const adminSupabase = createAdminClient();
  const primaryClient = hasServiceRoleKey() ? adminSupabase : supabase;

  const { data: callerProfile } = await primaryClient
    .from("profiles")
    .select("role, is_suspended")
    .eq("id", user.id)
    .single();

  if (!isUserAdmin(user.email, callerProfile?.role, callerProfile?.is_suspended)) {
    return {
      error: NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      ),
    };
  }

  return { user, primaryClient };
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAdmin();
    if ("error" in ctx) return ctx.error;
    const { primaryClient } = ctx;

    const status = req.nextUrl.searchParams.get("status") || "pending";

    // Lightweight badge mode: `reports` is RLS-on with zero policies, so the
    // browser-side sidebar client reads 0 rows no matter what. The count has
    // to come from here, where the service role can actually see the table.
    if (req.nextUrl.searchParams.get("count") === "true") {
      const { count, error: countErr } = await primaryClient
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (countErr) throw countErr;
      return NextResponse.json({ pendingReports: count || 0 });
    }

    let query = primaryClient
      .from("reports")
      .select(
        `id, target_type, target_id, reason, details, status, created_at,
         reviewed_by, reporter:profiles!reports_reporter_id_fkey(id, username)`
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data: reports, error } = await query;

    if (error) {
      // The FK hint can be absent on some deployments; fall back to a plain
      // select so the queue still loads.
      const { data: plain, error: plainErr } = await primaryClient
        .from("reports")
        .select("id, target_type, target_id, reason, details, status, created_at, reviewed_by, reporter_id")
        .order("created_at", { ascending: false })
        .limit(200);
      if (plainErr) throw plainErr;
      return NextResponse.json({ reports: plain || [] });
    }

    // Attach the reported listing so a moderator can act without a second hop.
    const listingIds = Array.from(
      new Set((reports || []).filter((r: any) => r.target_type === "listing").map((r: any) => r.target_id))
    );

    let listingMap = new Map<string, any>();
    if (listingIds.length > 0) {
      const { data: listings } = await primaryClient
        .from("listings")
        .select("id, title, status, price, seller_id, deleted_at")
        .in("id", listingIds);
      for (const l of listings || []) listingMap.set((l as any).id, l);
    }

    const hydrated = (reports || []).map((r: any) => ({
      ...r,
      listing: listingMap.get(r.target_id) || null,
    }));

    return NextResponse.json({ reports: hydrated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireAdmin();
    if ("error" in ctx) return ctx.error;
    const { user, primaryClient } = ctx;

    const json = await req.json().catch(() => null);
    const parsed = resolveSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { reportId, action, notes } = parsed.data;

    const { data: report } = await primaryClient
      .from("reports")
      .select("id, target_type, target_id, status")
      .eq("id", reportId)
      .maybeSingle();

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const nowIso = new Date().toISOString();

    // Act on the listing BEFORE closing the report, so a failure leaves the
    // report open rather than marking something resolved that was not.
    if (action === "takedown" && report.target_type === "listing") {
      await primaryClient
        .from("listings")
        .update({ status: "suspended", updated_at: nowIso })
        .eq("id", report.target_id);
    }

    if (action === "suspend_seller" && report.target_type === "listing") {
      const { data: listing } = await primaryClient
        .from("listings")
        .select("seller_id")
        .eq("id", report.target_id)
        .maybeSingle();

      if (listing?.seller_id) {
        await primaryClient
          .from("profiles")
          .update({ is_suspended: true })
          .eq("id", listing.seller_id);

        await primaryClient.from("notifications").insert({
          recipient_id: listing.seller_id,
          type: "account_suspended",
          title: "Account Suspended",
          message:
            "Your account has been suspended following a review of a reported listing. Contact support if you believe this is a mistake.",
          action_url: "/contact",
          is_read: false,
        });
      }
    }

    await primaryClient
      .from("reports")
      .update({
        // reports_status_check only permits
        // pending | investigating | resolved | dismissed.
        status: action === "dismiss" ? "dismissed" : "resolved",
        reviewed_by: user.id,
        updated_at: nowIso,
      })
      .eq("id", reportId);

    await primaryClient.from("audit_logs").insert({
      actor_id: user.id,
      action: `REPORT_${action.toUpperCase()}`,
      resource_type: "reports",
      resource_id: reportId,
      changes: {
        target_type: report.target_type,
        target_id: report.target_id,
        notes: notes || null,
        actor_email: user.email || null,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        action === "dismiss"
          ? "Report dismissed. Listing left untouched."
          : action === "takedown"
          ? "Listing suspended and report closed."
          : "Seller suspended and report closed.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
