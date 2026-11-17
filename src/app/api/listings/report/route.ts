import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/guards";
import { dispatchAdminWhatsAppAlert } from "@/lib/notifications/adminAlert";

export const dynamic = "force-dynamic";

/**
 * Buyer-facing listing report endpoint.
 *
 * Before this route existed the only way to flag a fraudulent squad was to
 * email support@. The `reports` table already had schema (target_type,
 * target_id, reason, details, status, reviewed_by) but zero callers, so scam
 * reports never reached a moderator in a structured way.
 */

const REPORT_REASONS = [
  "scam_or_fraud",
  "fake_screenshot",
  "account_already_sold",
  "mismatched_details",
  "prohibited_content",
  "other",
] as const;

const reportSchema = z.object({
  listingId: z.string().uuid(),
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(2000).optional().default(""),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Reports are tied to a real account: anonymous reports are trivially
    // spammable and cannot be followed up on.
    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to report a listing." },
        { status: 401 }
      );
    }

    const ip = getClientIp(req);
    const rate = await checkRateLimit(`report_listing:${user.id}:${ip}`, 5, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many reports submitted. Please wait a moment." },
        { status: 429 }
      );
    }

    const json = await req.json().catch(() => null);
    const parsed = reportSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid report payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { listingId, reason, details } = parsed.data;
    const client = hasServiceRoleKey() ? createAdminClient() : supabase;

    const { data: listing } = await client
      .from("listings")
      .select("id, title, seller_id, status, deleted_at")
      .eq("id", listingId)
      .maybeSingle();

    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    if (listing.seller_id === user.id) {
      return NextResponse.json(
        { error: "You cannot report your own listing." },
        { status: 400 }
      );
    }

    // One open report per user per listing; re-reporting the same item just
    // inflates the queue without adding information.
    const { data: existing } = await client
      .from("reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("target_type", "listing")
      .eq("target_id", listingId)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: true, alreadyReported: true, message: "You already reported this listing. Our team is reviewing it." },
        { status: 200 }
      );
    }

    const { error: insertError } = await client.from("reports").insert({
      reporter_id: user.id,
      target_type: "listing",
      target_id: listingId,
      reason,
      details: details || null,
      status: "pending",
    });

    if (insertError) {
      console.error("Report insert failed:", insertError.message);
      return NextResponse.json(
        { error: "Could not save your report. Please try again." },
        { status: 500 }
      );
    }

    // Alert the desk immediately: a reported listing may still be live and
    // taking other buyers' money.
    try {
      await dispatchAdminWhatsAppAlert({
        eventType: "LISTING_REPORTED",
        listingTitle: listing.title || listingId.slice(0, 8),
        userEmail: user.email || undefined,
        details: `Reason: ${reason}${details ? ` | Details: ${details.slice(0, 400)}` : ""}`,
      });
    } catch {
      // Never fail the buyer's report because the alert channel is down.
    }

    return NextResponse.json({
      success: true,
      message: "Thank you. Our team will review this listing.",
    });
  } catch (error: any) {
    console.error("Report listing error:", error?.message);
    return NextResponse.json(
      { error: "Could not submit report." },
      { status: 500 }
    );
  }
}
