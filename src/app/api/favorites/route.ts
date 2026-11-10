import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { ListingService } from "@/services/listingService";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp, isValidUuid } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

const toggleSchema = z.object({
  listingId: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isFavorited: false, favoritedIds: [] });
    }

    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get("listingId");

    const client = hasServiceRoleKey() ? createAdminClient() : supabase;

    if (listingId && isValidUuid(listingId)) {
      const { data } = await client
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", listingId)
        .maybeSingle();

      return NextResponse.json({ isFavorited: Boolean(data) });
    }

    const { data: rows } = await client
      .from("favorites")
      .select("listing_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    return NextResponse.json({
      favoritedIds: (rows || []).map((r: any) => r.listing_id),
    });
  } catch {
    return NextResponse.json({ isFavorited: false, favoritedIds: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sign in to save squads to your watchlist." },
        { status: 401 }
      );
    }

    const rate = checkRateLimit(`fav_toggle:${user.id}:${ip}`, 30, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many watchlist updates. Please wait a moment." },
        { status: 429 }
      );
    }

    const json = await req.json();
    const parsed = toggleSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    const client = hasServiceRoleKey() ? createAdminClient() : supabase;
    const service = new ListingService(client);
    const result = await service.toggleFavorite(user.id, parsed.data.listingId);

    return NextResponse.json({
      success: true,
      listingId: parsed.data.listingId,
      isFavorited: result.isFavorited,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update watchlist" },
      { status: 500 }
    );
  }
}
