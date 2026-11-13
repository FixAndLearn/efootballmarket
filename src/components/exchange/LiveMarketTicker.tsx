"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles, TrendingDown, Zap } from "lucide-react";
import { Listing } from "@/types/database";
import {
  formatCurrency,
  formatSmartListingTitle,
  getListingPriceContext,
  getShortPlatformLabel,
} from "@/lib/utils";

export function LiveMarketTicker() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/listings?limit=8&sortBy=newest")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.listings)) {
          setListings(data.listings);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const tickerItems = listings.map((item) => {
    const ctx = getListingPriceContext(item);
    return {
      id: item.id,
      href: `/listings/${item.id}`,
      ovr: item.overall_team_strength,
      platform: getShortPlatformLabel(item.platform),
      price: formatCurrency(item.price, item.currency),
      epics: (item.epic_players_count || 0) + (item.big_time_players_count || 0),
      isDeal: ctx.tier === "great_deal",
      title: formatSmartListingTitle(item),
    };
  });

  return (
    <div className="w-full bg-sx-subtle border-b border-sx-border text-[11px] overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center gap-3">
        {/* Static Left Live Status Pill */}
        <div className="inline-flex items-center gap-1.5 pr-3 border-r border-sx-border shrink-0 font-mono font-bold text-sx-green-text">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>LIVE EXCHANGE</span>
        </div>

        {/* Scrolling Ticker Stream */}
        <div className="flex-1 overflow-hidden relative">
          {tickerItems.length > 0 ? (
            <div className="sx-marquee-track items-center gap-6">
              {[...tickerItems, ...tickerItems].map((t, idx) => (
                <Link
                  key={`${t.id}-${idx}`}
                  href={t.href}
                  className="inline-flex items-center gap-1.5 text-sx-muted hover:text-sx-ink transition-colors whitespace-nowrap"
                >
                  <span className="font-mono font-extrabold text-sx-ink">
                    {t.ovr} OVR
                  </span>
                  <span className="text-sx-faint">({t.platform})</span>
                  {t.epics > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-sx-amber-text font-semibold">
                      <Sparkles className="w-2.5 h-2.5" />
                      {t.epics}E
                    </span>
                  )}
                  <span className="font-mono font-bold text-sx-green-text">
                    {t.price}
                  </span>
                  {t.isDeal && (
                    <span className="px-1.5 py-0.2 rounded bg-sx-green-tint border border-sx-green-border text-[9.5px] font-bold text-sx-green-text inline-flex items-center gap-0.5">
                      <TrendingDown className="w-2.5 h-2.5" />
                      DEAL
                    </span>
                  )}
                  <span className="text-sx-border-strong pl-3">&bull;</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-5 text-sx-muted whitespace-nowrap overflow-x-auto no-scrollbar">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-sx-green-text" />
                <span>Safaricom M-Pesa Till <strong>1572931</strong> Hold</span>
              </span>
              <span>&middot;</span>
              <span>KES 0 Extra Buyer Fee</span>
              <span>&middot;</span>
              <span>24-Hour Login &amp; Clean Konami ID Verification</span>
              <span>&middot;</span>
              <Link href="/valuator" className="font-semibold text-sx-green-text hover:underline inline-flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>Free KES Squad Valuator &rarr;</span>
              </Link>
            </div>
          )}
        </div>

        {/* Static Right Quick Tool Links (Desktop) */}
        <div className="hidden xl:flex items-center gap-3 pl-3 border-l border-sx-border shrink-0 font-semibold">
          <Link
            href="/valuator"
            className="text-sx-muted hover:text-sx-green-text transition-colors"
          >
            KES Valuator
          </Link>
          <span className="text-sx-border-strong">&middot;</span>
          <Link
            href="/compare"
            className="text-sx-muted hover:text-sx-green-text transition-colors"
          >
            Compare Squads
          </Link>
          <span className="text-sx-border-strong">&middot;</span>
          <span className="font-mono text-sx-ink">Till 1572931</span>
        </div>
      </div>
    </div>
  );
}
