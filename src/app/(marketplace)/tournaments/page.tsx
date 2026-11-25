import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { TournamentService } from "@/services/tournamentService";
import { maskPhoneNumber } from "@/lib/security/guards";
import { isUserAdmin } from "@/lib/security/adminAuth";
import type { Tournament } from "@/types/database";
import TournamentsClient from "./TournamentsClient";

export const metadata: Metadata = {
  title: "eFootball Kenya Tournaments & Wager Duels",
  description:
    "Join open eFootball tournaments and 1v1 wager duels in Kenya. Escrow-held entry fees, published brackets, and prize payouts through eFootballMarket.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/tournaments" },
};

// Brackets change as people join, so never serve a stale shell.
export const revalidate = 0;

/**
 * The cup list is fetched here, on the server, instead of in a useEffect.
 *
 * The page used to render nothing but "Loading brackets..." into the HTML and
 * fill in after hydration: a crawler indexed an empty page, and a user on a
 * slow connection watched a spinner that a server render would have made
 * instant. The client fetch still runs afterwards to pick up changes made in
 * another tab, so this is additive -- initialTournaments is only a first paint.
 *
 * Phone masking mirrors GET /api/tournaments exactly: participant numbers are
 * shown only to the host and to admins. The public page must not leak what the
 * API deliberately hides.
 */
export default async function TournamentsPage() {
  let initialTournaments: Tournament[] = [];

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

    initialTournaments = tournaments.map((t) => {
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
  } catch (err) {
    // A failed lookup must not take the page down; the client fetch retries.
    console.warn("Tournaments page server fetch failed:", err);
  }

  return <TournamentsClient initialTournaments={initialTournaments} />;
}
