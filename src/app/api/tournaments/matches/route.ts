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

    const rate = await checkRateLimit(`tourney_match:${user.id}:${ip}`, 20, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many match updates. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { tournament_id, match_id, score1, score2, winner_name, match_code } = body;

    if (!tournament_id || !match_id || score1 === undefined || score2 === undefined || typeof winner_name !== "string") {
      return NextResponse.json(
        { error: "tournament_id, match_id, scores, and winner_name are required." },
        { status: 400 }
      );
    }

    const safeScore1 = Number(score1);
    const safeScore2 = Number(score2);
    if (
      !Number.isSafeInteger(safeScore1) ||
      safeScore1 < 0 ||
      !Number.isSafeInteger(safeScore2) ||
      safeScore2 < 0 ||
      safeScore1 === safeScore2
    ) {
      return NextResponse.json({ error: "Enter non-negative whole-number scores with a winner." }, { status: 400 });
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
      score1: safeScore1,
      score2: safeScore2,
      winner_name: String(winner_name).trim(),
      match_code,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Notify the desk to arrange any published prizes manually. This event does
    // not send M-Pesa money or confirm that a payout has been completed.
    if (result.isChampionCrowned && result.championName && result.tournament) {
      const tourney = result.tournament;
      if (tourney.first_place_kes > 0 || tourney.second_place_kes > 0) {
        const champion = (tourney.participants || []).find(
          (participant) => participant.friend_id === result.championFriendId
        );
        const runnerUp = result.runnerUpFriendId
          ? (tourney.participants || []).find(
              (participant) => participant.friend_id === result.runnerUpFriendId
            )
          : undefined;
        const runnerUpPrize = result.runnerUpName
          ? ` Runner-up ${result.runnerUpName}: KES ${tourney.second_place_kes}.`
          : "";

        await dispatchAdminWhatsAppAlert({
          eventType: "TOURNAMENT_WINNER_CROWNED",
          listingTitle: tourney.title,
          username: result.championName,
          buyerPhone: champion?.phone_number,
          sellerPhone: runnerUp?.phone_number,
          amount: tourney.first_place_kes,
          details: `Final result recorded. Manually review and arrange first-place prize KES ${tourney.first_place_kes} for ${result.championName}.${runnerUpPrize}`,
        }).catch(() => console.warn("Tournament prize review alert failed."));
      }
    }

    return NextResponse.json({
      success: true,
      isChampionCrowned: result.isChampionCrowned,
      championName: result.championName,
      runnerUpName: result.runnerUpName,
      tournament: result.tournament,
      message: result.isChampionCrowned
        ? `Final result recorded. ${result.championName} is the tournament champion; the tournament desk has been notified to arrange any published prize manually.`
        : `Match result updated! ${result.winnerName} advances to the next round.`,
    });
  } catch (err: any) {
    console.error("POST /api/tournaments/matches error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
