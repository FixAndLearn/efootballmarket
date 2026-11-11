import { isUserAdmin } from "@/lib/security/adminAuth";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/guards";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TournamentService } from "@/services/tournamentService";
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
        { error: "Unauthorized: Sign in as the tournament host or administrator." },
        { status: 401 }
      );
    }

    const rate = checkRateLimit(`tourney_brackets:${user.id}:${ip}`, 12, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many bracket requests. Please wait 1 minute." },
        { status: 429 }
      );
    }

    const client = hasServiceRoleKey() ? createAdminClient() : supabase;
    const { data: callerProfile } = await client
      .from("profiles")
      .select("role, is_suspended")
      .eq("id", user.id)
      .maybeSingle();

    if (callerProfile?.is_suspended) {
      return NextResponse.json(
        { error: "Forbidden: Account is suspended." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { tournament_id, shuffle = false } = body;
    if (!tournament_id) {
      return NextResponse.json({ error: "Tournament ID is required." }, { status: 400 });
    }

    const tourney = await TournamentService.getTournamentById(String(tournament_id));
    if (!tourney) {
      return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
    }

    // Strictly verify from server-authenticated session (never client body)
    const isAdmin = isUserAdmin(user.email, callerProfile?.role);
    const isModerator = tourney.created_by === user.id;

    if (!isAdmin && !isModerator) {
      return NextResponse.json(
        { error: "Forbidden: Only the tournament moderator or platform administrator can form brackets." },
        { status: 403 }
      );
    }

    const result = await TournamentService.generateBrackets(String(tournament_id), {
      shuffle: Boolean(shuffle),
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      matches: result.matches,
      message: "Brackets successfully formed and tournament is live!",
    });
  } catch (err: any) {
    console.error("POST /api/tournaments/brackets error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
