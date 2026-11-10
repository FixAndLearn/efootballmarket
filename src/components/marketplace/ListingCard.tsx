"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Listing } from "@/types/database";
import { VerifiedSellerBadge } from "@/components/marketplace/VerifiedSellerBadge";
import { FavoriteButton } from "@/components/marketplace/FavoriteButton";
import { formatCompactNumber, formatCurrency, getPlatformLabel } from "@/lib/utils";
import { isListingOnFlashSale } from "@/lib/utils/flashSale";
import { CheckCircle2, Lock } from "lucide-react";

export interface ListingCardProps {
  listing: Listing;
  featured?: boolean;
}

function StockXPitchPlaceholder() {
  return (
    <div className="w-full h-full bg-sx-stone relative flex items-center justify-center p-4">
      <svg
        viewBox="0 0 320 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-sx-green-text"
        aria-hidden="true"
      >
        <rect
          x="22"
          y="16"
          width="276"
          height="168"
          rx="6"
          fill="currentColor"
          fillOpacity="0.1"
          stroke="currentColor"
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
        <line x1="160" y1="16" x2="160" y2="184" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
        <circle cx="160" cy="100" r="26" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />
        <rect x="22" y="58" width="42" height="84" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
        <rect x="256" y="58" width="42" height="84" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
        {[
          [46, 100],
          [90, 44], [86, 82], [86, 118], [90, 156],
          [150, 56], [140, 100], [150, 144],
          [222, 48], [236, 100], [222, 152],
        ].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="5.5"
            fill="currentColor"
            fillOpacity="0.85"
          />
        ))}
      </svg>
    </div>
  );
}

export function ListingCard({ listing }: ListingCardProps) {
  const primaryImage =
    listing.images?.find((img) => img.is_primary)?.image_url || listing.images?.[0]?.image_url;

  const isFlashDrop = isListingOnFlashSale(listing);
  const isAvailable = listing.status === "published";

  const epics = (listing.epic_players_count || 0) + (listing.big_time_players_count || 0);
  const coins = listing.coin_balance || 0;

  return (
    <div className="group w-full h-full flex flex-col bg-sx-canvas">
      <Link
        href={`/listings/${listing.id}`}
        className="block relative aspect-[4/3] w-full rounded-md bg-sx-stone overflow-hidden border border-sx-border group-hover:border-sx-ink transition-colors"
      >
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            unoptimized={!primaryImage.includes(".supabase.co") && !primaryImage.includes("images.unsplash.com")}
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <StockXPitchPlaceholder />
        )}

        {!isAvailable && (
          <div className="absolute inset-0 bg-sx-canvas z-30 flex items-center justify-center p-3">
            <span className="px-3 py-1 rounded-full bg-sx-contrast text-sx-contrast-fg font-semibold text-xs flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>{listing.status === "sold" ? "Sold" : "In Escrow"}</span>
            </span>
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none z-20">
          <span className="px-2 py-0.5 rounded bg-sx-canvas border border-sx-border text-[10px] font-semibold text-sx-ink uppercase">
            {getPlatformLabel(listing.platform)}
          </span>

          <span className="px-2 py-0.5 rounded bg-sx-canvas border border-sx-border text-[11px] font-mono font-bold text-sx-ink">
            {listing.overall_team_strength} OVR
          </span>
        </div>

        {isFlashDrop && (
          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-sx-green text-white text-[10px] font-bold uppercase tracking-wider z-20">
            Drop
          </span>
        )}

        {isAvailable && (
          <div className="absolute bottom-2.5 right-2.5 z-20">
            <FavoriteButton
              listingId={listing.id}
              initialCount={listing.favorites_count || 0}
              variant="icon"
            />
          </div>
        )}
      </Link>

      <div className="pt-3 flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          <Link href={`/listings/${listing.id}`} className="block">
            <h3 className="text-[14px] font-medium text-sx-ink line-clamp-2 leading-snug group-hover:underline">
              {listing.title}
            </h3>
          </Link>

          <div className="pt-0.5">
            <span className="block text-[11px] text-sx-muted">Ask Price</span>
            <span className="text-[18px] font-extrabold text-sx-ink font-display tracking-tight block leading-tight">
              {formatCurrency(listing.price, listing.currency)}
            </span>
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sx-green-tint text-sx-green-text text-[11px] font-semibold">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>Verified Clean ID</span>
          </span>

          <div className="flex items-center gap-1.5 text-[11px] text-sx-muted font-mono">
            {epics > 0 && <span>{epics} Epics</span>}
            {coins > 0 && <span>· {formatCompactNumber(coins)}c</span>}
            <VerifiedSellerBadge seller={listing.seller} size="sm" showPopover={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
