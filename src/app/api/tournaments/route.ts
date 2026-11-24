import { dispatchAdminWhatsAppAlert } from "@/lib/notifications/adminAlert";
import { isSuperAdminEmail, isUserAdmin } from "@/lib/security/adminAuth";
import { getClientIp, maskPhoneNumber } from "@/lib/security/guards";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizePhoneNumber } from "@/lib/utils/phone";
import { TournamentService } from "@/services/tournamentService";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user: viewer },
    } = await supabase.auth.getUser();

    let viewerRole: string | null = null;
    if (viewer) {
      const client = hasServiceRoleKey() ? createAdminClient() : supabase;
      const { data: prof } = await client
        .from("profiles")
        .select("role")
        .eq("id", viewer.id)
        .maybeSingle();
      viewerRole = prof?.role || null;
    }

    const viewerIsAdmin = isUserAdmin(viewer?.email, viewerRole);
    const tournaments = await TournamentService.getAllTournaments();

    // Mask participant phone numbers on public responses unless viewer is host or admin
    const sanitized = tournaments.map((t) => {
      const canSeeParticipantPhones =
        viewerIsAdmin || Boolean(viewer && t.created_by === viewer.id);
      return {
        ...t,
        participants: (t.participants || []).map((p) => ({
          ...p,
          phone_number: canSeeParticipantPhones
            ? p.phone_number
            : maskPhoneNumber(p.phone_number),
        })),
      };
    });

    return NextResponse.json({ tournaments: sanitized });
  } catch (err: any) {
    console.error("GET /api/tournaments error:", err);
    return NextResponse.json({ tournaments: [], error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = await checkRateLimit(`tourney_post:${ip}`, 12, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many tournament requests. Please wait 1 minute." },
        { status: 429 }
      );
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        {
          error:
            "Unauthorized: Please sign in to host or register for a tournament.",
        },
        { status: 401 }
      );
    }

    const client = hasServiceRoleKey() ? createAdminClient() : supabase;
    const { data: memberProfile } = await client
      .from("profiles")
      .select("id, username, available_balance, is_suspended")
      .eq("id", authUser.id)
      .maybeSingle();

    if (memberProfile?.is_suspended) {
      return NextResponse.json(
        { error: "Forbidden: Suspended accounts cannot join or host tournaments." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const action = body.action;

    // 1. ACTION: Host / Create New Tournament
    if (action === "create" || body.prize_pool_kes !== undefined) {
      const {
        title,
        subtitle,
        description,
        platform = "all",
        tournament_type,
        payout_split = "winner_takes_all",
        entry_fee_kes = 0,
        format = "Single Knockout 1v1",
        max_players = 8,
        start_date,
      } = body;

      if (typeof title !== "string" || !title.trim() || typeof start_date !== "string" || !start_date.trim()) {
        return NextResponse.json(
          { error: "Tournament title and match start date/time are required." },
          { status: 400 }
        );
      }

      const requestedType = tournament_type ?? (Number(max_players) === 2 ? "1v1" : "tournament");
      if (requestedType !== "1v1" && requestedType !== "tournament") {
        return NextResponse.json({ error: "Unsupported tournament type." }, { status: 400 });
      }
      const safeMaxPlayers = Number(max_players ?? (requestedType === "1v1" ? 2 : 8));
      const allowedMaxPlayers = requestedType === "1v1" ? [2] : [4, 8, 16];
      if (!Number.isInteger(safeMaxPlayers) || !allowedMaxPlayers.includes(safeMaxPlayers)) {
        return NextResponse.json({ error: "Choose a supported tournament size." }, { status: 400 });
      }

      const safeEntryFee = Number(entry_fee_kes);
      if (
        !Number.isSafeInteger(safeEntryFee) ||
        safeEntryFee < 0 ||
        !Number.isSafeInteger(safeEntryFee * safeMaxPlayers)
      ) {
        return NextResponse.json({ error: "Entry fee must be a non-negative whole KES amount." }, { status: 400 });
      }

      const allowedPlatforms = new Set(["all", "android", "ios", "crossplay", "console_pc"]);
      if (typeof platform !== "string" || !allowedPlatforms.has(platform)) {
        return NextResponse.json({ error: "Choose a supported platform." }, { status: 400 });
      }
      const safePlatform = platform as "all" | "android" | "ios" | "crossplay" | "console_pc";

      if (!["winner_takes_all", "80_20", "70_30"].includes(payout_split)) {
        return NextResponse.json({ error: "Choose a supported prize split." }, { status: 400 });
      }
      const safePayoutSplit = requestedType === "1v1" ? "winner_takes_all" : payout_split;

      const createdTournament = await TournamentService.createTournament({
        title: String(title).slice(0, 140),
        subtitle: subtitle ? String(subtitle).slice(0, 180) : undefined,
        description: description ? String(description).slice(0, 1200) : undefined,
        platform: safePlatform,
        tournament_type: requestedType,
        payout_split: safePayoutSplit,
        entry_fee_kes: safeEntryFee,
        format: String(format).slice(0, 120),
        max_players: safeMaxPlayers,
        start_date: String(start_date),
        created_by: authUser.id,
      });

      await dispatchAdminWhatsAppAlert({
        eventType: "TOURNAMENT_REGISTRATION",
        listingTitle: createdTournament.title,
        username: memberProfile?.username || authUser.email || "Community Host",
        buyerPhone: "254105472373",
        amount: createdTournament.entry_fee_kes,
        details: `Tournament hosted: ${createdTournament.title} (${createdTournament.max_players} players, Prize KES ${createdTournament.prize_pool_kes})`,
      }).catch((e) => console.warn("WhatsApp alert error:", e));

      return NextResponse.json({ success: true, tournament: createdTournament });
    }

    // 2. ACTION: Register Authenticated Participant for a Tournament
    const { tournament_id, gamer_tag, friend_id, phone_number, payment_method } = body;

    if (!tournament_id || !gamer_tag || !friend_id || !phone_number) {
      return NextResponse.json(
        { error: "Gamer tag, eFootball Friend ID, and Safaricom phone number are required." },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone_number).international;

    // Strictly bind registration & wallet deduction to authenticated authUser.id (never body.user_id)
    const result = await TournamentService.registerParticipant({
      tournament_id: String(tournament_id),
      gamer_tag: String(gamer_tag).trim().slice(0, 60),
      friend_id: String(friend_id).trim().slice(0, 40),
      phone_number: normalizedPhone,
      user_id: authUser.id,
      payment_method: payment_method || "mpesa_till",
    });

    if (!result.success) {
      const status = result.error?.includes("temporarily unavailable") ||
        result.error?.includes("could not be confirmed") ||
        result.error?.includes("status could not be verified")
        ? 503
        : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    const tourney = await TournamentService.getTournamentById(String(tournament_id));

    await dispatchAdminWhatsAppAlert({
      eventType: "TOURNAMENT_REGISTRATION",
      listingTitle: tourney?.title || "eFootball Tournament",
      username: String(gamer_tag).trim().slice(0, 60),
      buyerPhone: normalizedPhone,
      amount: tourney?.entry_fee_kes || 0,
      details: `Gamer Tag: ${gamer_tag} | Friend ID: ${friend_id} | Payment: ${result.participant?.payment_method || "till"}`,
    }).catch((e) => console.warn("WhatsApp alert error:", e));

    return NextResponse.json({
      success: true,
      participant: result.participant,
      remainingBalance: result.remainingBalance,
      message:
        result.participant?.payment_method === "wallet"
          ? `Successfully registered! KES ${tourney?.entry_fee_kes || 0} deducted from your account balance.`
          : "Successfully registered for tournament!",
    });
  } catch (err: any) {
    console.error("POST /api/tournaments error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Tournament ID required." }, { status: 400 });
    }

    const tourney = await TournamentService.getTournamentById(id);
    if (!tourney) {
      return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = hasServiceRoleKey() ? createAdminClient() : supabase;
    const { data: prof } = await client
      .from("profiles")
      .select("role, is_suspended")
      .eq("id", user.id)
      .maybeSingle();

    const isAuthorized =
      !prof?.is_suspended &&
      (isSuperAdminEmail(user.email) ||
        isUserAdmin(user.email, prof?.role) ||
        tourney.created_by === user.id);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Only the tournament host or platform administrator can delete this tournament." },
        { status: 403 }
      );
    }

    const deletion = await TournamentService.deleteTournament(id);
    if (deletion === "blocked") {
      return NextResponse.json(
        { error: "This tournament has payment or registration activity, or changed during removal. It was not deleted; contact support about cancellation and any refund request." },
        { status: 409 }
      );
    }
    if (deletion === "unavailable") {
      return NextResponse.json(
        { error: "Tournament removal could not be safely verified. Nothing was removed; please try again later or contact support." },
        { status: 503 }
      );
    }
    return NextResponse.json({ success: true, message: "Tournament removed. No refund was issued." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
