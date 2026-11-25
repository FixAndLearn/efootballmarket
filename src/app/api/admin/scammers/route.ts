import { isUserAdmin } from "@/lib/security/adminAuth";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * Admin queue for `scammer_reports`.
 *
 * The Scammer Check page has been collecting reports since launch, but every
 * row lands with verified_status = 'pending' and the public lookup only ever
 * returns verified_status = 'verified'. Nothing in the codebase could set that
 * column, so a submitted report could never appear in a lookup and could never
 * be rejected either: it dead-ended in the table forever.
 *
 * This route is the missing half. Once a moderator verifies a report here, the
 * public lookup returns it.
 */

const reviewSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(["verify", "reject"]),
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

    // Badge mode: `scammer_reports` is RLS-on with no public read policy, so a
    // browser-side client always sees 0. The count has to come from here.
    if (req.nextUrl.searchParams.get("count") === "true") {
      const { count, error: countErr } = await primaryClient
        .from("scammer_reports")
        .select("id", { count: "exact", head: true })
        .eq("verified_status", "pending");
      if (countErr) throw countErr;
      return NextResponse.json({ pendingScammerReports: count || 0 });
    }

    let query = primaryClient
      .from("scammer_reports")
      .select(
        "id, phone_number, username_alias, platform_source, incident_summary, amount_scammed_kes, evidence_notes, reporter_contact, verified_status, reviewed_by, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (status !== "all") {
      query = query.eq("verified_status", status);
    }

    const { data: reports, error } = await query;
    if (error) throw error;

    return NextResponse.json({ reports: reports || [] });
  } catch (err: any) {
    console.error("[admin/scammers] GET failed:", err?.message);
    return NextResponse.json(
      { error: "Could not load scammer reports." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAdmin();
    if ("error" in ctx) return ctx.error;
    const { user, primaryClient } = ctx;

    const body = await req.json().catch(() => ({}));
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid moderation request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { reportId, action } = parsed.data;
    const nextStatus = action === "verify" ? "verified" : "rejected";

    const { data: updated, error } = await primaryClient
      .from("scammer_reports")
      .update({
        verified_status: nextStatus,
        reviewed_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .eq("verified_status", "pending")
      .select("id, verified_status")
      .maybeSingle();

    if (error) throw error;

    if (!updated) {
      return NextResponse.json(
        { error: "Report not found, or it has already been reviewed." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      reportId: updated.id,
      verifiedStatus: updated.verified_status,
      // Spell out the consequence so a moderator knows what they just changed.
      note:
        action === "verify"
          ? "Report verified. It will now appear in public Scammer Check lookups."
          : "Report rejected. It stays hidden from public lookups.",
    });
  } catch (err: any) {
    console.error("[admin/scammers] POST failed:", err?.message);
    return NextResponse.json(
      { error: "Could not update the scammer report." },
      { status: 500 }
    );
  }
}
