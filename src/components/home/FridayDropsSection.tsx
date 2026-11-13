"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Listing } from "@/types/database";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { QuietAlertOptIn } from "@/components/common/QuietAlertOptIn";
import {
  getFridayDropCountdown,
  FridayDropCountdown,
} from "@/lib/utils/flashSale";
import { Flame, ArrowRight, ShieldCheck } from "lucide-react";

interface FridayDropsSectionProps {
  listings: Listing[];
  showFullHeader?: boolean;
}

export function FridayDropsSection({
  listings,
  showFullHeader = false,
}: FridayDropsSectionProps) {
  const [countdown, setCountdown] = useState<FridayDropCountdown | null>(null);

  useEffect(() => {
    const update = () => setCountdown(getFridayDropCountdown());
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  // Only listings explicitly marked as featured are curated Friday Drops
  const featuredDrops = listings.filter((l) => l.is_featured);
  const standardListings = listings.slice(0, 6);
  const hasActiveCuratedDrops = Boolean(countdown?.isActive && featuredDrops.length > 0);

  return (
    <section className="relative rounded-2xl store-panel p-6 sm:p-8 overflow-hidden">
      <div className="relative space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-sx-border">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-[11px] font-mono font-bold uppercase ${
                  hasActiveCuratedDrops
                    ? "bg-sx-green-tint border-emerald-500/40 text-sx-green-text"
                    : "bg-sx-amber-tint border-amber-500/35 text-sx-amber-text"
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>
                  {hasActiveCuratedDrops
                    ? `${featuredDrops.length} Friday Drop Squads Live Now`
                    : "Weekly Friday Window · Fridays 2:00 PM – 10:00 PM EAT"}
                </span>
              </span>
            </div>

            {showFullHeader ? (
              <h1 className="text-2xl sm:text-3xl font-extrabold text-sx-ink font-display tracking-tight">
                {hasActiveCuratedDrops
                  ? "Fixed-Price Friday Drops"
                  : "Friday Drops Return Every Friday at 2:00 PM EAT"}
              </h1>
            ) : (
              <h2 className="text-xl sm:text-2xl font-bold text-sx-ink font-display tracking-tight">
                {hasActiveCuratedDrops
                  ? "Fixed-Price Friday Drops"
                  : "Friday Drops Return Every Friday at 2:00 PM EAT"}
              </h2>
            )}
            <p className="text-xs sm:text-sm text-sx-muted leading-relaxed">
              {hasActiveCuratedDrops
                ? "Fixed-price featured squads during the Friday 2:00 PM – 10:00 PM EAT window. Payment goes to eFootballMarket's Till 1572931 and stays on hold during your 24-hour login & Link Data check."
                : "No featured Friday Drop window is live right now. Leave your number for a Friday 2:00 PM EAT WhatsApp alert, or browse standard marketplace squads available today below."}
            </p>
          </div>

          {hasActiveCuratedDrops && countdown ? (
            <div className="p-3.5 rounded-xl bg-sx-stone border border-sx-border shrink-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-sx-muted mb-1.5 text-center">
                Friday Window Closes In
              </div>
              <div className="flex items-center justify-center gap-1.5 font-mono">
                {[
                  { val: String(countdown.hours).padStart(2, "0"), unit: "HRS" },
                  { val: String(countdown.minutes).padStart(2, "0"), unit: "MIN" },
                  { val: String(countdown.seconds).padStart(2, "0"), unit: "SEC" },
                ].map((b) => (
                  <div
                    key={b.unit}
                    className="px-2.5 py-1.5 rounded-lg bg-sx-canvas border border-sx-border text-center min-w-[48px]"
                  >
                    <span className="text-base sm:text-lg font-bold text-sx-ink block leading-none">
                      {b.val}
                    </span>
                    <span className="text-[9px] text-sx-muted uppercase mt-0.5 block">
                      {b.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full lg:max-w-sm shrink-0">
              <QuietAlertOptIn topic="new_squads" compact />
            </div>
          )}
        </div>

        {/* Squads Grid */}
        {hasActiveCuratedDrops ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredDrops.slice(0, 6).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : standardListings.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-sx-ink font-display">
                Available Now in Standard Marketplace
              </h3>
              <Link
                href="/browse"
                className="inline-flex items-center gap-1 text-xs font-semibold text-sx-green-text hover:underline"
              >
                <span>Browse all squads</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {standardListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-sx-border text-xs text-sx-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sx-green-text shrink-0" />
            <span>
              Every squad uses eFootballMarket&apos;s Till 1572931 payment hold (KES 0 added buyer fee) &amp; 24-hour buyer login inspection.
            </span>
          </div>

          {!showFullHeader && (
            <Link
              href="/friday-drops"
              className="inline-flex items-center gap-1 text-sx-green-text hover:underline font-semibold shrink-0"
            >
              <span>About Friday Drops</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
