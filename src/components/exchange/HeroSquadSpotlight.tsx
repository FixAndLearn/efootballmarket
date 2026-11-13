"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Coins,
  Lock,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { Listing } from "@/types/database";
import { CompareButton } from "@/components/marketplace/CompareButton";
import {
  formatCompactNumber,
  formatCurrency,
  formatSmartListingTitle,
  getListingPriceContext,
  getShortPlatformLabel,
  getShortPlaystyleLabel,
} from "@/lib/utils";

interface HeroSquadSpotlightProps {
  listings: Listing[];
}

export function HeroSquadSpotlight({ listings }: HeroSquadSpotlightProps) {
  const featuredDeck = useMemo(() => {
    if (!listings || listings.length === 0) return [];
    const sorted = [...listings].sort((a, b) => {
      const aDeal = getListingPriceContext(a).tier === "great_deal" ? 1 : 0;
      const bDeal = getListingPriceContext(b).tier === "great_deal" ? 1 : 0;
      if (aDeal !== bDeal) return bDeal - aDeal;
      return (b.overall_team_strength || 0) - (a.overall_team_strength || 0);
    });
    return sorted.slice(0, 4);
  }, [listings]);

  const [activeIdx, setActiveIdx] = useState(0);

  if (featuredDeck.length === 0) {
    return (
      <div className="relative min-h-[340px] h-full w-full bg-sx-elevated">
        <Image
          src="/images/sx-hero-banner.jpg"
          alt="eFootball Mobile and PlayStation squads in Kenya"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 42vw"
          className="object-cover object-center"
        />
      </div>
    );
  }

  const active = featuredDeck[activeIdx % featuredDeck.length];
  const imgUrl =
    active.images?.find((img) => img.is_primary)?.image_url ||
    active.images?.[0]?.image_url ||
    "/images/sx-hero-banner.jpg";
  const smartTitle = formatSmartListingTitle(active);
  const priceCtx = getListingPriceContext(active);
  const epics =
    (active.epic_players_count || 0) + (active.big_time_players_count || 0);
  const styleLabel = getShortPlaystyleLabel(active.primary_playstyle);

  return (
    <div className="h-full flex flex-col justify-between bg-sx-canvas/60 p-4 sm:p-6">
      {/* Top Spotlight Header */}
      <div className="flex items-center justify-between gap-2 pb-3">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider font-bold text-sx-green-text">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Featured Live Listing</span>
        </div>

        {featuredDeck.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setActiveIdx(
                  (prev) => (prev - 1 + featuredDeck.length) % featuredDeck.length
                )
              }
              aria-label="Previous spotlight squad"
              className="w-7 h-7 rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border flex items-center justify-center text-sx-ink transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-sx-muted px-1">
              {(activeIdx % featuredDeck.length) + 1}/{featuredDeck.length}
            </span>
            <button
              type="button"
              onClick={() => setActiveIdx((prev) => (prev + 1) % featuredDeck.length)}
              aria-label="Next spotlight squad"
              className="w-7 h-7 rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border flex items-center justify-center text-sx-ink transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Card Preview */}
      <div className="rounded-2xl bg-sx-canvas border border-sx-border overflow-hidden shadow-card flex-1 flex flex-col justify-between">
        <Link
          href={`/listings/${active.id}`}
          className="relative aspect-[16/10] w-full bg-sx-stone overflow-hidden block group"
        >
          <Image
            src={imgUrl}
            alt={smartTitle}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 38vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
            <span className="px-2 py-0.5 rounded-md bg-black/80 border border-white/15 text-[10.5px] font-bold text-white uppercase">
              {getShortPlatformLabel(active.platform)}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-black/85 border border-emerald-400/40 text-xs font-mono font-extrabold text-emerald-300">
              {active.overall_team_strength} OVR
            </span>
          </div>

          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between gap-2">
            <div>
              {priceCtx.tier === "great_deal" && (
                <span className="mb-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase">
                  <TrendingDown className="w-2.5 h-2.5" />
                  <span>Great Value Deal</span>
                </span>
              )}
              <h3 className="text-sm sm:text-base font-extrabold text-white line-clamp-1 font-display">
                {smartTitle}
              </h3>
            </div>
            <div onClick={(e) => e.preventDefault()}>
              <CompareButton listing={active} variant="icon" />
            </div>
          </div>
        </Link>

        <div className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            {epics > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-sx-green-tint border border-sx-green-border text-sx-green-text font-semibold">
                {epics} {epics === 1 ? "Epic" : "Epics"}
              </span>
            )}
            {(active.coin_balance || 0) > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sx-amber-tint border border-sx-amber-border text-sx-amber-text font-mono font-bold">
                <Coins className="w-3 h-3" />
                {formatCompactNumber(active.coin_balance)} Coins
              </span>
            )}
            {styleLabel && (
              <span className="px-2 py-0.5 rounded-md bg-sx-stone border border-sx-border text-sx-muted font-medium">
                {styleLabel}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-sx-muted ml-auto">
              <Lock className="w-3 h-3 text-sx-green-text" />
              <span>Till 1572931</span>
            </span>
          </div>

          <div className="pt-2.5 border-t border-sx-border flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-sx-muted block">
                Verified Ask
              </span>
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-sx-ink leading-none">
                {formatCurrency(active.price, active.currency)}
              </span>
            </div>

            <Link
              href={`/listings/${active.id}`}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-sx-green hover:bg-sx-green-hover text-white text-xs font-bold transition-colors shrink-0"
            >
              <span>Inspect Squad</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Selector Dots */}
      {featuredDeck.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-3">
          {featuredDeck.map((sq, i) => (
            <button
              key={sq.id}
              type="button"
              onClick={() => setActiveIdx(i)}
              aria-label={`Select squad ${i + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === activeIdx % featuredDeck.length
                  ? "w-6 bg-sx-green"
                  : "w-2 bg-sx-border-strong hover:bg-sx-muted"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
