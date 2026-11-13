import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp, maskPhoneNumber } from "@/lib/security/guards";
import { normalizePhoneNumber } from "@/lib/utils/phone";
import { dispatchAdminWhatsAppAlert } from "@/lib/notifications/adminAlert";

export const dynamic = "force-dynamic";

/**
 * GET /api/scammers?q=...
 * Moderator-reviewed fraud incident lookup.
 * - Rate-limited per IP to prevent bulk enumeration.
 * - Strictly sanitizes query tokens so no PostgREST filter operators can be injected.
 * - Returns only verified reports and masks middle phone digits on output.
 */
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`scammer_lookup:${ip}`, 30, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many lookup requests. Please wait 1 minute.", scammers: [] },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawQuery = (searchParams.get("q") || "").trim();
    if (rawQuery.length < 3 || rawQuery.length > 80) {
      return NextResponse.json({ scammers: [] }, { status: 200 });
    }

    // Strip characters that could inject PostgREST `.or()` syntax (commas, parens, quotes, wildcards)
    const safeToken = rawQuery.replace(/[^a-zA-Z0-9@_+\s.-]/g, "").trim();
    if (safeToken.length < 3) {
      return NextResponse.json({ scammers: [] }, { status: 200 });
    }

    const digitsOnly = safeToken.replace(/\D/g, "");
    const normalizedPhone =
      digitsOnly.length >= 9 ? normalizePhoneNumber(digitsOnly).international : "";
    const handleClean = safeToken.replace(/^@+/, "").replace(/\s+/g, "");

    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (!sbUrl || sbUrl.includes("placeholder-project")) {
      return NextResponse.json({ scammers: [] }, { status: 200 });
    }

    const client = hasServiceRoleKey()
      ? createAdminClient()
      : createServerSupabaseClient();

    const matchedMap = new Map<string, any>();

    // Parameterized equality / ilike queries (zero raw `.or()` interpolation)
    if (normalizedPhone) {
      const { data: byIntlPhone } = await client
        .from("scammer_reports")
        .select(
          "id, phone_number, username_alias, platform_source, incident_summary, amount_scammed_kes, verified_status, created_at"
        )
        .eq("verified_status", "verified")
        .ilike("phone_number", `%${digitsOnly.slice(-8)}%`)
        .limit(10);

      (byIntlPhone || []).forEach((row: any) => matchedMap.set(String(row.id), row));
    }

    if (handleClean.length >= 3) {
      const { data: byAlias } = await client
        .from("scammer_reports")
        .select(
          "id, phone_number, username_alias, platform_source, incident_summary, amount_scammed_kes, verified_status, created_at"
        )
        .eq("verified_status", "verified")
        .ilike("username_alias", `%${handleClean.slice(0, 40)}%`)
        .limit(10);

      (byAlias || []).forEach((row: any) => matchedMap.set(String(row.id), row));
    }

    const sanitizedResults = Array.from(matchedMap.values()).map((r) => ({
      id: r.id,
      phone_number: r.phone_number ? maskPhoneNumber(r.phone_number) : undefined,
      username_alias: r.username_alias || "Reported Alias",
      platform_source: r.platform_source || "Verified Incident",
      incident_summary: String(r.incident_summary || "").slice(0, 500),
      amount_scammed_kes: r.amount_scammed_kes ? Number(r.amount_scammed_kes) : undefined,
      verified_status: "verified",
      created_at: r.created_at,
    }));

    return NextResponse.json({ scammers: sanitizedResults }, { status: 200 });
  } catch {
    return NextResponse.json({ scammers: [] }, { status: 200 });
  }
}

/**
 * POST /api/scammers
 * Submits a structured fraud incident report into the private moderation queue (`verified_status = 'pending'`).
 * Never displays publicly until an administrator independently verifies M-Pesa/chat evidence.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`scammer_report:${ip}`, 5, 600000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many incident reports submitted recently. Please wait 10 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const cleanPhone = String(body.phoneNumber || "").replace(/\D/g, "").slice(0, 20);
    const cleanAlias = String(body.usernameAlias || "").trim().slice(0, 100);
    const cleanPlatform = String(body.platformSource || "WhatsApp / Off-Platform").trim().slice(0, 80);
    const cleanSummary = String(body.incidentSummary || "").trim().slice(0, 1200);
    const cleanReporter = String(body.reporterContact || "").trim().slice(0, 100);
    const cleanAmount =
      body.amountScammedKes !== undefined &&
      body.amountScammedKes !== "" &&
      Number(body.amountScammedKes) >= 0
        ? Math.round(Number(body.amountScammedKes))
        : null;

    if (!cleanPhone && cleanAlias.length < 2) {
      return NextResponse.json(
        { error: "Please provide the suspected scammer's phone number or @username." },
        { status: 400 }
      );
    }

    if (cleanSummary.length < 15) {
      return NextResponse.json(
        { error: "Please provide a brief factual summary (at least 15 characters)." },
        { status: 400 }
      );
    }

    const normalizedPhone =
      cleanPhone.length >= 9 ? normalizePhoneNumber(cleanPhone).international : cleanPhone || null;

    const adminSupabase = createAdminClient();
    const { data: report, error } = await adminSupabase
      .from("scammer_reports")
      .insert({
        phone_number: normalizedPhone,
        username_alias: cleanAlias || null,
        platform_source: cleanPlatform,
        incident_summary: cleanSummary,
        amount_scammed_kes: cleanAmount,
        reporter_contact: cleanReporter || null,
        verified_status: "pending",
      })
      .select("id")
      .single();

    if (error || !report) {
      console.error("Failed to insert scammer_reports:", error?.message);
      return NextResponse.json(
        { error: "Could not submit incident report right now. Please try again." },
        { status: 500 }
      );
    }

    dispatchAdminWhatsAppAlert({
      eventType: "DISPUTE_OPENED",
      listingTitle: `Scam Report: ${cleanAlias || normalizedPhone} (${cleanPlatform})`,
      amount: cleanAmount || 0,
      buyerPhone: cleanReporter || undefined,
      details: cleanSummary.slice(0, 240),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message:
        "Incident logged in our moderation queue. Send M-Pesa/chat screenshots on WhatsApp so we can verify faster.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to submit incident report." },
      { status: 500 }
    );
  }
}
