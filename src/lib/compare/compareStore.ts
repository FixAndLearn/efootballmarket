"use client";

import { useCallback, useEffect, useState } from "react";
import { Listing } from "@/types/database";
import { formatSmartListingTitle } from "@/lib/utils";

export const MAX_COMPARE_SQUADS = 4;
const COMPARE_STORAGE_KEY = "efm_compare_squads_v1";
const COMPARE_EVENT_NAME = "efm:compare-updated";

export interface CompareSquadSnapshot {
  id: string;
  title: string;
  price: number;
  currency: string;
  overall_team_strength: number;
  platform: string;
  primary_playstyle: string;
  epic_players_count: number;
  big_time_players_count: number;
  highlight_players_count: number;
  featured_players_count: number;
  coin_balance: number;
  gp_balance: number;
  current_division: number;
  highest_division: number;
  allows_swap: boolean;
  konami_id_status: string;
  manager_name: string | null;
  formation: string | null;
  key_players_list: string[];
  thumbUrl: string | null;
  sellerUsername: string | null;
  isVerifiedSeller: boolean;
}

export function listingToCompareSnapshot(listing: Listing): CompareSquadSnapshot {
  const thumb =
    listing.images?.find((img) => img.is_primary)?.image_url ||
    listing.images?.[0]?.image_url ||
    null;

  return {
    id: listing.id,
    title: formatSmartListingTitle(listing),
    price: Number(listing.price || 0),
    currency: listing.currency || "KES",
    overall_team_strength: Number(listing.overall_team_strength || 0),
    platform: listing.platform || "android",
    primary_playstyle: listing.primary_playstyle || "quick_counter",
    epic_players_count: Number(listing.epic_players_count || 0),
    big_time_players_count: Number(listing.big_time_players_count || 0),
    highlight_players_count: Number(listing.highlight_players_count || 0),
    featured_players_count: Number(listing.featured_players_count || 0),
    coin_balance: Number(listing.coin_balance || 0),
    gp_balance: Number(listing.gp_balance || 0),
    current_division: Number(listing.current_division || 10),
    highest_division: Number(listing.highest_division || listing.current_division || 10),
    allows_swap: Boolean(listing.allows_swap),
    konami_id_status: listing.konami_id_status || "linked_changeable",
    manager_name: listing.manager_name || null,
    formation: listing.formation || null,
    key_players_list: Array.isArray(listing.key_players_list) ? listing.key_players_list : [],
    thumbUrl: thumb,
    sellerUsername: listing.seller?.username || null,
    isVerifiedSeller: Boolean(listing.seller?.is_verified_seller),
  };
}

export function readCompareSquads(): CompareSquadSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_COMPARE_SQUADS) : [];
  } catch {
    return [];
  }
}

function writeCompareSquads(items: CompareSquadSnapshot[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(items.slice(0, MAX_COMPARE_SQUADS)));
    window.dispatchEvent(new CustomEvent(COMPARE_EVENT_NAME));
  } catch {
    // ignore
  }
}

export function toggleCompareListing(listing: Listing): {
  added: boolean;
  full: boolean;
  items: CompareSquadSnapshot[];
} {
  const current = readCompareSquads();
  const exists = current.some((item) => item.id === listing.id);
  if (exists) {
    const next = current.filter((item) => item.id !== listing.id);
    writeCompareSquads(next);
    return { added: false, full: false, items: next };
  }
  if (current.length >= MAX_COMPARE_SQUADS) {
    return { added: false, full: true, items: current };
  }
  const next = [...current, listingToCompareSnapshot(listing)];
  writeCompareSquads(next);
  return { added: true, full: false, items: next };
}

export function removeCompareSquad(id: string) {
  const current = readCompareSquads();
  writeCompareSquads(current.filter((item) => item.id !== id));
}

export function clearCompareSquads() {
  writeCompareSquads([]);
}

export function useCompareSquads() {
  const [items, setItems] = useState<CompareSquadSnapshot[]>([]);

  const sync = useCallback(() => {
    setItems(readCompareSquads());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(COMPARE_EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COMPARE_EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  const isSelected = useCallback(
    (id: string) => items.some((item) => item.id === id),
    [items]
  );

  return {
    items,
    count: items.length,
    isSelected,
    toggle: toggleCompareListing,
    remove: removeCompareSquad,
    clear: clearCompareSquads,
  };
}
