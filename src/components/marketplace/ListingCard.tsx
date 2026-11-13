"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Listing } from "@/types/database";
import { VerifiedSellerBadge } from "@/components/marketplace/VerifiedSellerBadge";
import { FavoriteButton } from "@/components/marketplace/FavoriteButton";
import { CompareButton } from "@/components/marketplace/CompareButton";
import {
  formatCompactNumber,
  formatCurrency,
  formatSmartListingTitle,
  getListingPriceContext,
  getShortPlatformLabel,
  getShortPlaystyleLabel,
} from "@/lib/utils";
import { isListingOnFlashSale } from "@/lib/utils/flashSale";
import {
  ArrowRight,
  Coins,
  Images,
  Lock,
  Repeat2,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";

export interface ListingCardProps {
  listing: Listing;
  featured?: boolean;
  priority?: boolean;
}

function SquadPlaceholder({ ovr }: { ovr?: number }) {
  return (
    <div className="w-full h-full bg-sx-stone relative flex items-center justify-center p-4 overflow-hidden">
      <svg
        viewBox="0 0 320 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-sx-green-text/75"
        aria-hidden="true"
      >
        <rect
          x="22"
          y="16"
          width="276"
          height="168"
          rx="8"
          fill="currentColor"
          fillOpacity="0.06"
          stroke="currentColor"
          strokeOpacity="0.28"
          strokeWidth="1.5"
        />
        <line
          x1="160"
          y1="16"
          x2="160"
          y2="184"
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="1.5"
        />
        <circle
          cx="160"
          cy="100"
          r="24"
          stroke="currentColor"
          strokeOpacity="0.24"
          strokeWidth="1.5"
        />
      </svg>
      {ovr ? (
        <span className="absolute bottom-3 left-3.5 text-[11px] font-mono font-bold text-sx-muted">
          {ovr} OVR
        </span>
      ) : null}
    </div>
  );
}

export function ListingCard({ listing, priority = false }: ListingCardProps) {
  const galleryImages = useMemo(() => {
    const raw = Array.isArray(listing.images) ? [...listing.images] : [];
    return raw
      .filter((img) => Boolean(img?.image_url))
      .sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return (a.display_order || 0) - (b.display_order || 0);
      });
  }, [listing.images]);

  const [imgIdx, setImgIdx] = useState(0);
  const activeImage = galleryImages[imgIdx]?.image_url || galleryImages[0]?.image_url;

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
  const priceContext = getListingPriceContext(listing);

  const canOptimize =
    Boolean(activeImage) &&
    (activeImage!.startsWith("/") ||
      activeImage!.includes(".supabase.co") ||
      activeImage!.includes("images.unsplash.com"));

  return (
    <article className="group sx-card-lift relative w-full h-full flex flex-col rounded-2xl bg-sx-subtle border border-sx-border hover:border-sx-green-border overflow-hidden shadow-sm">
      {/* 1. Squad Screenshot + Multi-Photo Scrubber */}
      <Link
        href={`/listings/${listing.id}`}
        onMouseLeave={() => setImgIdx(0)}
        className="block relative aspect-[4/3] w-full bg-sx-stone overflow-hidden border-b border-sx-border"
      >
        {activeImage ? (
          <Image
            src={activeImage}
            alt={displayTitle}
            fill
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            sizes="(max-width: 640px) 94vw, (max-width: 1024px) 46vw, 24vw"
            unoptimized={!canOptimize}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <SquadPlaceholder ovr={listing.overall_team_strength} />
        )}

        {/* Desktop Hover Scrub Zones when seller uploaded multiple screenshots */}
        {galleryImages.length > 1 && isAvailable && (
          <>
            <div className="hidden md:grid absolute inset-0 z-10" style={{ gridTemplateColumns: `repeat(${galleryImages.length}, minmax(0, 1fr))` }}>
              {galleryImages.map((img, i) => (
                <span
                  key={img.id || i}
                  onMouseEnter={() => setImgIdx(i)}
                  className="h-full w-full"
                />
              ))}
            </div>
            {/* Top Progress Segments */}
            <div className="absolute top-1.5 left-2.5 right-2.5 flex items-center gap-1 z-20 pointer-events-none opacity-80">
              {galleryImages.map((img, i) => (
                <span
                  key={img.id || i}
                  className={`h-0.5 flex-1 rounded-full transition-colors ${
                    i === imgIdx ? "bg-emerald-400" : "bg-white/35"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {!isAvailable && (
          <div className="absolute inset-0 bg-sx-canvas/90 z-30 flex items-center justify-center p-3">
            <span className="px-3.5 py-1.5 rounded-full bg-sx-contrast text-sx-contrast-fg font-bold text-xs flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>{listing.status === "sold" ? "Sold" : "In Escrow"}</span>
            </span>
          </div>
        )}

        {/* Top Bar: Platform & OVR */}
        <div
          className={`absolute ${
            galleryImages.length > 1 ? "top-3.5" : "top-2.5"
          } left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none z-20`}
        >
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-black/75 border border-white/15 text-[10.5px] font-bold text-white uppercase tracking-wide">
              {getShortPlatformLabel(listing.platform)}
            </span>
            {listing.allows_swap && (
              <span className="px-2 py-0.5 rounded-md bg-indigo-600/90 text-[10px] font-bold text-white inline-flex items-center gap-1">
                <Repeat2 className="w-2.5 h-2.5" />
                <span>Swap</span>
              </span>
            )}
          </div>

          <span className="px-2.5 py-0.5 rounded-md bg-black/80 border border-emerald-400/40 text-[11px] font-mono font-extrabold text-emerald-300">
            {listing.overall_team_strength} OVR
          </span>
        </div>

        {/* Bottom Overlay: Optional Division / Photo Count + Compare & Save */}
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between gap-2 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5">
            {isFlashDrop ? (
              <span className="px-2 py-0.5 rounded-md bg-sx-green text-white text-[10px] font-bold uppercase tracking-wide">
                Friday Drop
              </span>
            ) : division >= 1 && division <= 3 ? (
              <span className="px-2 py-0.5 rounded-md bg-black/75 border border-white/15 text-[10px] font-bold text-amber-300 inline-flex items-center gap-1">
                <Trophy className="w-2.5 h-2.5" />
                <span>Div {division}</span>
              </span>
            ) : null}

            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setImgIdx((prev) => (prev + 1) % galleryImages.length);
                }}
                title="Tap to cycle squad screenshots"
                className="pointer-events-auto px-1.5 py-0.5 rounded-md bg-black/75 border border-white/15 text-[10px] font-mono font-bold text-white inline-flex items-center gap-1 cursor-pointer"
              >
                <Images className="w-2.5 h-2.5 text-emerald-300" />
                <span>
                  {imgIdx + 1}/{galleryImages.length}
                </span>
              </button>
            )}
          </div>

          {isAvailable && (
            <div className="pointer-events-auto flex items-center gap-1.5">
              <CompareButton listing={listing} variant="icon" />
              <FavoriteButton
                listingId={listing.id}
                initialCount={listing.favorites_count || 0}
                variant="icon"
              />
            </div>
          )}
        </div>
      </Link>

      {/* 2. Key Comparable Details + One Clear Price */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-2">
          <Link href={`/listings/${listing.id}`} className="block">
            <h3 className="text-sm sm:text-[15px] font-bold text-sx-ink line-clamp-2 leading-snug group-hover:text-sx-green-text transition-colors font-display">
              {displayTitle}
            </h3>
          </Link>

          {/* Comparable Spec Pills: Epics, Coins, Playstyle */}
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

          {/* Notable Players */}
          {keyPlayers.length > 0 && (
            <p className="text-[11.5px] text-sx-muted truncate">
              <span className="font-semibold text-sx-ink-soft">Players:</span>{" "}
              {keyPlayers.join(", ")}
            </p>
          )}
        </div>

        {/* One Clear Price + Single Clear Seller Badge */}
        <div className="space-y-2.5 pt-2.5 border-t border-sx-border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-lg sm:text-[19px] font-extrabold text-sx-ink font-display tracking-tight leading-none font-mono">
                {formatCurrency(listing.price, listing.currency)}
              </span>
              {isAvailable && priceContext.tier === "great_deal" && (
                <span className="px-1.5 py-0.5 rounded bg-sx-green-tint border border-sx-green-border text-[10px] font-bold text-sx-green-text shrink-0">
                  Great Value
                </span>
              )}
            </div>

            <Link
              href={`/listings/${listing.id}`}
              className="inline-flex items-center gap-1 min-h-[34px] px-3 py-1.5 rounded-lg bg-sx-canvas hover:bg-sx-green hover:text-white border border-sx-border-strong/70 hover:border-sx-green text-xs font-bold text-sx-ink transition-colors shrink-0"
            >
              <span>Inspect</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="pt-2 border-t border-sx-border/60 flex items-center justify-between gap-1.5">
            <VerifiedSellerBadge
              seller={listing.seller}
              size="sm"
              showPopover={true}
            />

            <span
              title="Your M-Pesa payment stays on Till 1572931 while you log in and check the squad for 24 hours."
              className="inline-flex items-center gap-1 text-[10.5px] font-medium text-sx-muted"
            >
              <Lock className="w-3 h-3 text-sx-green-text shrink-0" />
              <span>24h Escrow</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
