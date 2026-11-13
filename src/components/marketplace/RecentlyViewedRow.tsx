"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Listing } from "@/types/database";
import {
  formatCurrency,
  formatSmartListingTitle,
  getShortPlatformLabel,
} from "@/lib/utils";
import { Clock, Trash2 } from "lucide-react";

const RECENTLY_VIEWED_KEY = "efm_recently_viewed_v1";
const MAX_RECENT_SQUADS = 4;

export interface RecentSquadSummary {
  id: string;
  title: string;
  price: number;
  currency: string;
  ovr: number;
  platform: string;
  imageUrl?: string;
}

export function recordRecentlyViewedSquad(listing: Listing) {
  if (typeof window === "undefined" || !listing?.id) return;
  try {
    const primaryImage =
      listing.images?.find((img) => img.is_primary)?.image_url ||
      listing.images?.[0]?.image_url;
    const entry: RecentSquadSummary = {
      id: listing.id,
      title: formatSmartListingTitle(listing),
      price: Number(listing.price || 0),
      currency: listing.currency || "KES",
      ovr: Number(listing.overall_team_strength || 0),
      platform: listing.platform || "android",
      imageUrl: primaryImage,
    };

    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const prev: RecentSquadSummary[] = raw ? JSON.parse(raw) : [];
    const filtered = Array.isArray(prev)
      ? prev.filter((item) => item && item.id !== entry.id)
      : [];
    const next = [entry, ...filtered].slice(0, MAX_RECENT_SQUADS + 1);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

export function RecentlyViewedTracker({ listing }: { listing: Listing }) {
  useEffect(() => {
    recordRecentlyViewedSquad(listing);
  }, [listing]);

  return null;
}

export function RecentlyViewedRow({
  excludeId,
  minItems = 2,
  title = "Recently Inspected Squads",
}: {
  excludeId?: string;
  minItems?: number;
  title?: string;
}) {
  const [items, setItems] = useState<RecentSquadSummary[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const visible = parsed
          .filter((item) => item?.id && item.id !== excludeId)
          .slice(0, MAX_RECENT_SQUADS);
        setItems(visible);
      }
    } catch {
      // ignore
    }
  }, [excludeId]);

  if (items.length < minItems) return null;

  const handleClear = () => {
    setItems([]);
    try {
      localStorage.removeItem(RECENTLY_VIEWED_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <section
      aria-label="Recently Viewed Squads"
      className="py-6 sm:py-7 border-t border-sx-border bg-sx-subtle/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sx-green-text" />
            <h2 className="text-sm sm:text-base font-bold text-sx-ink font-display">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-xs text-sx-muted hover:text-sx-ink transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {items.map((item) => {
            const canOptimize =
              Boolean(item.imageUrl) &&
              (item.imageUrl!.startsWith("/") ||
                item.imageUrl!.includes(".supabase.co") ||
                item.imageUrl!.includes("images.unsplash.com"));

            return (
              <Link
                key={item.id}
                href={`/listings/${item.id}`}
                className="group flex items-center gap-3 p-2.5 rounded-xl bg-sx-canvas border border-sx-border hover:border-sx-green-border transition-colors"
              >
                <div className="relative w-16 h-12 rounded-lg bg-sx-stone border border-sx-border overflow-hidden shrink-0">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="64px"
                      unoptimized={!canOptimize}
                      className="object-cover"
                    />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-[10px] font-mono font-bold text-sx-muted">
                      {item.ovr}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-sx-ink truncate group-hover:text-sx-green-text transition-colors">
                    {item.title}
                  </p>
                  <div className="flex items-center justify-between gap-2 mt-0.5 text-[11px]">
                    <span className="text-sx-muted font-mono">
                      {getShortPlatformLabel(item.platform)} &middot; {item.ovr} OVR
                    </span>
                    <span className="font-mono font-bold text-sx-ink shrink-0">
                      {formatCurrency(item.price, item.currency)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
