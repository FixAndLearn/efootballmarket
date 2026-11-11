"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Listing } from "@/types/database";
import { VerifiedSellerBadge } from "@/components/marketplace/VerifiedSellerBadge";
import { FavoriteButton } from "@/components/marketplace/FavoriteButton";
import {
  formatCompactNumber,
  formatCurrency,
  formatSmartListingTitle,
  getShortPlatformLabel,
  getShortPlaystyleLabel,
} from "@/lib/utils";
import { isListingOnFlashSale } from "@/lib/utils/flashSale";
import {
  ArrowUpRight,
  CheckCircle2,
  Coins,
  Lock,
  Repeat2,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";

export interface ListingCardProps {
  listing: Listing;
  featured?: boolean;
}

function StockXPitchPlaceholder({ ovr }: { ovr?: number }) {
  return (
    <div className="w-full h-full bg-sx-stone relative flex items-center justify-center p-4 overflow-hidden">
      <div
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(16, 185, 129, 0.16), transparent 72%)",
        }}
      />
      <svg
        viewBox="0 0 320 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-sx-green-text relative z-10"
        aria-hidden="true"
      >
        <rect
          x="22"
          y="16"
          width="276"
          height="168"
          rx="8"
          fill="currentColor"
          fillOpacity="0.08"
          stroke="currentColor"
          strokeOpacity="0.32"
          strokeWidth="1.5"
        />
        <line
          x1="160"
          y1="16"
          x2="160"
          y2="184"
          stroke="currentColor"
          strokeOpacity="0.24"
          strokeWidth="1.5"
        />
        <circle
          cx="160"
          cy="100"
          r="26"
          stroke="currentColor"
          strokeOpacity="0.28"
          strokeWidth="1.5"
        />
        <rect
          x="22"
          y="58"
          width="42"
          height="84"
          stroke="currentColor"
          strokeOpacity="0.24"
          strokeWidth="1.5"
        />
        <rect
          x="256"
          y="58"
          width="42"
          height="84"
          stroke="currentColor"
          strokeOpacity="0.24"
          strokeWidth="1.5"
        />
        {[
          [46, 100],
          [90, 44],
          [86, 82],
          [86, 118],
          [90, 156],
          [150, 56],
          [140, 100],
          [150, 144],
          [222, 48],
          [236, 100],
          [222, 152],
        ].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="5"
            fill="currentColor"
            fillOpacity="0.85"
          />
        ))}
      </svg>
      {ovr ? (
        <span className="absolute bottom-3 left-3.5 text-[11px] font-mono font-bold text-sx-muted z-10">
          SQUAD #{ovr}
        </span>
      ) : null}
    </div>
  );
}

export function ListingCard({ listing }: ListingCardProps) {
  const primaryImage =
    listing.images?.find((img) => img.is_primary)?.image_url ||
    listing.images?.[0]?.image_url;

  const isFlashDrop = isListingOnFlashSale(listing);
  const isAvailable = listing.status === "published";

  const epics =
    (listing.epic_players_count || 0) + (listing.big_time_players_count || 0);
  const specialCards =
    (listing.legend_players_count || 0) + (listing.highlight_players_count || 0);
  const coins = listing.coin_balance || 0;
  const gp = listing.gp_balance || 0;
  const division = listing.current_division || 0;
  const playstyle = getShortPlaystyleLabel(listing.primary_playstyle);
  const displayTitle = formatSmartListingTitle(listing);
  const keyPlayers = (listing.key_players_list || []).filter(Boolean).slice(0, 3);

  return (
    <div className="group relative w-full h-full flex flex-col rounded-xl bg-sx-subtle border border-sx-border hover:border-sx-green-border hover:bg-sx-stone/90 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md">
      {/* Top Media Stage */}
      <Link
        href={`/listings/${listing.id}`}
        className="block relative aspect-[4/3] w-full bg-sx-stone overflow-hidden border-b border-sx-border"
      >
        {primaryImage ? (
          <>
            <Image
              src={primaryImage}
              alt={displayTitle}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              unoptimized={
                !primaryImage.includes(".supabase.co") &&
                !primaryImage.includes("images.unsplash.com")
              }
              className="object-cover group-hover:scale-[1.04] transition-transform duration-300"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/30 pointer-events-none z-10"
              aria-hidden="true"
            />
          </>
        ) : (
          <StockXPitchPlaceholder ovr={listing.overall_team_strength} />
        )}

        {!isAvailable && (
          <div className="absolute inset-0 bg-sx-canvas/90 backdrop-blur-sm z-30 flex items-center justify-center p-3">
            <span className="px-3.5 py-1.5 rounded-full bg-sx-contrast text-sx-contrast-fg font-bold text-xs flex items-center gap-1.5 shadow-md">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>{listing.status === "sold" ? "Sold" : "In Escrow"}</span>
            </span>
          </div>
        )}

        {/* Top Badges: Platform + Team Strength */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none z-20">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/15 text-[10px] font-bold text-white uppercase tracking-wider">
              {getShortPlatformLabel(listing.platform)}
            </span>
            {listing.allows_swap && (
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/85 backdrop-blur-md text-[10px] font-bold text-white inline-flex items-center gap-1">
                <Repeat2 className="w-2.5 h-2.5" />
                <span>Swap</span>
              </span>
            )}
          </div>

          <span className="px-2.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-emerald-400/35 text-[11px] font-mono font-extrabold text-emerald-300 shadow-sm">
            {listing.overall_team_strength} OVR
          </span>
        </div>

        {/* Bottom Overlay Badges: Flash Drop / Division + Favorite */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5">
            {isFlashDrop ? (
              <span className="px-2 py-0.5 rounded-md bg-sx-green text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                Drop
              </span>
            ) : division >= 1 && division <= 3 ? (
              <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/15 text-[10px] font-bold text-amber-300 inline-flex items-center gap-1">
                <Trophy className="w-2.5 h-2.5" />
                <span>Div {division}</span>
              </span>
            ) : null}
          </div>

          {isAvailable && (
            <div className="pointer-events-auto">
              <FavoriteButton
                listingId={listing.id}
                initialCount={listing.favorites_count || 0}
                variant="icon"
              />
            </div>
          )}
        </div>
      </Link>

      {/* Structured Card Body */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-2.5">
          {/* Smart Title */}
          <Link href={`/listings/${listing.id}`} className="block">
            <h3 className="text-[14.5px] font-bold text-sx-ink line-clamp-2 leading-snug group-hover:text-sx-green-text transition-colors font-display">
              {displayTitle}
            </h3>
          </Link>

          {/* Tactical Spec Chips (Never renders orphan dots!) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {epics > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sx-green-tint border border-sx-green-border text-sx-green-text text-[11px] font-semibold">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>
                  {epics} {epics === 1 ? "Epic" : "Epics"}
                </span>
              </span>
            ) : specialCards > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sx-canvas border border-sx-border text-sx-ink-soft text-[11px] font-semibold">
                <Sparkles className="w-3 h-3 text-sx-green-text shrink-0" />
                <span>{specialCards} Cards</span>
              </span>
            ) : null}

            {coins > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sx-amber-tint border border-sx-amber-border text-sx-amber-text text-[11px] font-mono font-bold">
                <Coins className="w-3 h-3 shrink-0" />
                <span>{formatCompactNumber(coins)} Coins</span>
              </span>
            )}

            {playstyle && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sx-canvas border border-sx-border text-sx-muted text-[11px] font-medium">
                <Zap className="w-2.5 h-2.5 text-sx-green-text shrink-0" />
                <span>{playstyle}</span>
              </span>
            )}

            {epics === 0 && coins === 0 && gp > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sx-canvas border border-sx-border text-sx-muted text-[11px] font-mono font-semibold">
                {formatCompactNumber(gp)} GP
              </span>
            )}
          </div>

          {/* Optional Key Players Line */}
          {keyPlayers.length > 0 && (
            <p className="text-[11px] text-sx-muted truncate">
              <span className="font-semibold text-sx-ink-soft">Roster:</span>{" "}
              {keyPlayers.join(" · ")}
            </p>
          )}
        </div>

        {/* Bottom Price + CTA + Seller Trust Footer */}
        <div className="space-y-2.5 pt-2.5 border-t border-sx-border">
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-sx-muted">
                Ask Price
              </span>
              <span className="text-[19px] font-extrabold text-sx-ink font-display tracking-tight block leading-none mt-1">
                {formatCurrency(listing.price, listing.currency)}
              </span>
            </div>

            <Link
              href={`/listings/${listing.id}`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sx-elevated border border-sx-border-strong/70 text-[11px] font-bold text-sx-ink group-hover:bg-sx-green group-hover:border-sx-green group-hover:text-white transition-all shrink-0"
            >
              <span>Inspect</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="pt-2 border-t border-sx-border/60 flex items-center justify-between gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sx-green-text">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Verified Clean ID</span>
            </span>

            <VerifiedSellerBadge
              seller={listing.seller}
              size="sm"
              showPopover={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
