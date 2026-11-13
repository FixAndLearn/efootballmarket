import React from "react";
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { ListingService } from "@/services/listingService";
import { TournamentService } from "@/services/tournamentService";
import { Listing, Tournament, WantedRequest } from "@/types/database";
import { MobileAppShell } from "@/components/app/MobileAppShell";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "eFootball Market App — Squad Swipe, KES Valuator & Live Radar",
  description:
    "Official eFootball Market mobile trading app with Squad Swipe Deck, Instant KES Squad Valuator, Live Deal Radar, and 1-Tap Scammer Scanner.",
};

export default async function MobileAppExperiencePage() {
  const supabase = createServerSupabaseClient();
  const adminOrUser = hasServiceRoleKey() ? createAdminClient() : supabase;
  const listingService = new ListingService(supabase);

  let listings: Listing[] = [];
  let tournaments: Tournament[] = [];
  let wanted: WantedRequest[] = [];

  try {
    const [listingsRes, tourneysRes, wantedRes] = await Promise.all([
      listingService
        .getListings({ limit: 24, sortBy: "newest" })
        .catch(() => ({ listings: [], totalCount: 0 })),
      TournamentService.getAllTournaments().catch(() => []),
      Promise.resolve(
        adminOrUser
          .from("wanted_requests")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(6)
      )
        .then((r) => (r.data as WantedRequest[]) || [])
        .catch(() => [] as WantedRequest[]),
    ]);

    listings = listingsRes.listings || [];
    tournaments = (tourneysRes || []).filter((t) => t.status !== "completed");
    wanted = wantedRes || [];
  } catch {
    // non-blocking
  }

  return (
    <MobileAppShell
      initialListings={listings}
      initialTournaments={tournaments}
      initialWanted={wanted}
    />
  );
}
