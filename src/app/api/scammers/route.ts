import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp, maskPhoneNumber } from "@/lib/security/guards";
import { normalizePhoneNumber } from "@/lib/utils/phone";

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
