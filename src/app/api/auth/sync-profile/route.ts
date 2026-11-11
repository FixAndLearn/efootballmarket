import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/guards";
import { normalizePhoneNumber } from "@/lib/utils/phone";

export const dynamic = "force-dynamic";

const syncProfileSchema = z.object({
  username: z.string().trim().min(3).max(32).optional(),
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().max(60).optional(),
  phoneNumber: z.string().trim().max(24).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rate = checkRateLimit(`sync_prof:${user.id}:${ip}`, 15, 60000);
    if (!rate.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = syncProfileSchema.safeParse(body);
    const input = parsed.success ? parsed.data : {};

    const meta = user.user_metadata || {};
    const rawUsername = (
      input.username ||
      meta.username ||
      meta.user_name ||
      user.email?.split("@")[0] ||
      `trader_${user.id.slice(0, 6)}`
    )
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 28);

    const baseUsername = rawUsername.length >= 3 ? rawUsername : `trader_${user.id.slice(0, 6)}`;
    const firstName = (input.firstName || meta.first_name || "Trader").trim();
    const lastName = (input.lastName ?? meta.last_name ?? "").trim();
    const rawPhone = (input.phoneNumber || meta.phone_number || "").trim();
    const normPhone = rawPhone ? normalizePhoneNumber(rawPhone) : null;
    const phoneNumber = normPhone?.isValid ? normPhone.international : rawPhone || "+254700000000";

    const client = hasServiceRoleKey() ? createAdminClient() : supabase;

    const { data: existing } = await client
      .from("profiles")
      .select("id, username, phone_number, first_name")
      .eq("id", user.id)
      .maybeSingle();

    if (!existing) {
      // Check if baseUsername is already taken by another user
      let finalUsername = baseUsername;
      const { data: taken } = await client
        .from("profiles")
        .select("id")
        .eq("username", baseUsername)
        .maybeSingle();

      if (taken && taken.id !== user.id) {
        finalUsername = `${baseUsername.slice(0, 22)}_${user.id.slice(0, 4)}`;
      }

      await client.from("profiles").upsert(
        {
          id: user.id,
          username: finalUsername,
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          country: "KEN",
          is_verified_seller: false,
          available_balance: 0.0,
          escrow_balance: 0.0,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

      await client.from("user_roles").upsert(
        { user_id: user.id, role_id: "buyer" },
        { onConflict: "user_id,role_id", ignoreDuplicates: true }
      );
    } else {
      // Only enrich placeholder fields — never touch balances, role, or verification status
      const patch: Record<string, any> = {};
      if (
        (!existing.phone_number || existing.phone_number === "+254700000000") &&
        phoneNumber &&
        phoneNumber !== "+254700000000"
      ) {
        patch.phone_number = phoneNumber;
      }
      if ((!existing.first_name || existing.first_name === "Trader") && firstName !== "Trader") {
        patch.first_name = firstName;
        if (lastName) patch.last_name = lastName;
      }
      if (Object.keys(patch).length > 0) {
        await client.from("profiles").update(patch).eq("id", user.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.warn("Profile sync notice:", err?.message);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
