import { dispatchAdminWhatsAppAlert } from "@/lib/notifications/adminAlert";
import { TournamentService } from "@/services/tournamentService";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { isUserAdmin } from "@/lib/security/adminAuth";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/guards";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Sign in as the tournament host or administrator." },
        { status: 401 }
      );
    }

    const rate = checkRateLimit(`tourney_match:${user.id}:${ip}`, 20, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many match updates. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { tournament_id, match_id, score1, score2, winner_name, match_code } = body;

    if (!tournament_id || !match_id || score1 === undefined || score2 === undefined || !winner_name) {
      return NextResponse.json(
        { error: "tournament_id, match_id, score1, score2, and winner_name are required." },
        { status: 400 }
      );
    }

    // Verify caller is the tournament host or a verified Admin
    const existingTourney = await TournamentService.getTournamentById(tournament_id);
    if (!existingTourney) {
      return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
    }

    const client = hasServiceRoleKey() ? createAdminClient() : supabase;
    const { data: callerProfile } = await client
      .from("profiles")
      .select("role, is_suspended")
      .eq("id", user.id)
      .maybeSingle();

    const isHostOrAdmin =
      !callerProfile?.is_suspended &&
      (existingTourney.created_by === user.id || isUserAdmin(user.email, callerProfile?.role));

    if (!isHostOrAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only the tournament host or an escrow administrator can record match scores." },
        { status: 403 }
      );
    }

    const result = await TournamentService.submitMatchResult({
      tournament_id,
      match_id,
      score1: Number(score1),
      score2: Number(score2),
      winner_name: String(winner_name).trim(),
      match_code,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // If Grand Final was won and a Champion is officially crowned:
    if (result.isChampionCrowned && result.championName && result.tournament) {
      const tourney = result.tournament;
      // 1. WhatsApp alert to Brian Okibo to disburse M-Pesa prize pool
      await dispatchAdminWhatsAppAlert({
        eventType: "TOURNAMENT_WINNER_CROWNED",
        listingTitle: tourney.title,
        username: result.championName,
        amount: tourney.first_place_kes,
        details: `Grand Final Champion: ${result.championName}! Total prize pool KES ${tourney.prize_pool_kes}. Disburse KES ${tourney.first_place_kes} to champion via Till 1572931.`,
      }).catch((e) => console.warn("WhatsApp champion alert error:", e));
    }

    return NextResponse.json({
      success: true,
      isChampionCrowned: result.isChampionCrowned,
      championName: result.championName,
      tournament: result.tournament,
      message: result.isChampionCrowned
        ? `Grand Final complete! ${result.championName} is crowned Tournament Champion!`
        : `Match result updated! Winner ${winner_name} advances to the next round.`,
    });
  } catch (err: any) {
    console.error("POST /api/tournaments/matches error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
