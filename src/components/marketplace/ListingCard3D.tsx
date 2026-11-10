"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Listing } from "@/types/database";
import { VerifiedSellerBadge } from "@/components/marketplace/VerifiedSellerBadge";
import { SquadInspectorModal } from "@/components/marketplace/SquadInspectorModal";
import { formatCompactNumber, formatCurrency, getPlatformLabel } from "@/lib/utils";
import { isListingOnFlashSale } from "@/lib/utils/flashSale";
import { CheckCircle2, Lock } from "lucide-react";

export interface ListingCard3DProps {
  listing: Listing;
  featured?: boolean;
}

function StockXPitchPlaceholder() {
  return (
    <div className="w-full h-full bg-[#F4F3F1] relative flex items-center justify-center p-4">
      <svg
        viewBox="0 0 320 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        aria-hidden="true"
      >
        <rect
          x="22"
          y="16"
          width="276"
          height="168"
          rx="6"
          fill="#EBF5F0"
          stroke="#006340"
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
        <line x1="160" y1="16" x2="160" y2="184" stroke="#006340" strokeOpacity="0.25" strokeWidth="1.5" />
        <circle cx="160" cy="100" r="26" stroke="#006340" strokeOpacity="0.3" strokeWidth="1.5" />
        <rect x="22" y="58" width="42" height="84" stroke="#006340" strokeOpacity="0.25" strokeWidth="1.5" />
        <rect x="256" y="58" width="42" height="84" stroke="#006340" strokeOpacity="0.25" strokeWidth="1.5" />
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
            fill="#006340"
            fillOpacity="0.85"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        ))}
      </svg>
    </div>
  );
}

export function ListingCard3D({ listing }: ListingCard3DProps) {
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const primaryImage =
    listing.images?.find((img) => img.is_primary)?.image_url || listing.images?.[0]?.image_url;

  const isFlashDrop = isListingOnFlashSale(listing);
  const isAvailable = listing.status === "published";

  const epics = (listing.epic_players_count || 0) + (listing.big_time_players_count || 0);
  const coins = listing.coin_balance || 0;

  return (
    <>
      <div className="group w-full h-full flex flex-col bg-white">
        {/* StockX Signature Neutral Stone Image Well */}
        <Link
          href={`/listings/${listing.id}`}
          className="block relative aspect-[4/3] w-full rounded-md bg-[#F4F3F1] overflow-hidden border border-[#EAE9E6] group-hover:border-[#0F0F0F] transition-colors"
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
            <div className="absolute inset-0 bg-white/80 z-30 flex items-center justify-center p-3">
              <span className="px-3 py-1 rounded-full bg-[#0F0F0F] text-white font-semibold text-xs flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>{listing.status === "sold" ? "Sold" : "In Escrow"}</span>
              </span>
            </div>
          )}

          {/* Subtle Top Pills */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none z-20">
            <span className="px-2 py-0.5 rounded bg-white/95 border border-[#E2E2E0] text-[10px] font-semibold text-[#0F0F0F] uppercase">
              {getPlatformLabel(listing.platform)}
            </span>

            <span className="px-2 py-0.5 rounded bg-white/95 border border-[#E2E2E0] text-[11px] font-mono font-bold text-[#0F0F0F]">
              {listing.overall_team_strength} OVR
            </span>
          </div>

          {isFlashDrop && (
            <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-[#006340] text-white text-[10px] font-bold uppercase tracking-wider z-20">
              Drop
            </span>
          )}
        </Link>

        {/* StockX Clean Product Details Below Tile */}
        <div className="pt-3 flex-1 flex flex-col justify-between space-y-2">
          <div className="space-y-1">
            <Link href={`/listings/${listing.id}`} className="block">
              <h3 className="text-[14px] font-medium text-[#0F0F0F] line-clamp-2 leading-snug group-hover:underline">
                {listing.title}
              </h3>
            </Link>

            <div className="pt-0.5">
              <span className="block text-[11px] text-[#5F5F5F]">Ask Price</span>
              <span className="text-[18px] font-extrabold text-[#0F0F0F] font-display tracking-tight block leading-tight">
                {formatCurrency(listing.price, listing.currency)}
              </span>
            </div>
          </div>

          {/* StockX Green Verified Tag + Spec Strip */}
          <div className="pt-1 flex items-center justify-between gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EBF5F0] text-[#006340] text-[11px] font-semibold">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>Verified Clean ID</span>
            </span>

            <div className="flex items-center gap-1.5 text-[11px] text-[#5F5F5F] font-mono">
              {epics > 0 && <span>{epics} Epics</span>}
              {coins > 0 && <span>· {formatCompactNumber(coins)}c</span>}
              <VerifiedSellerBadge seller={listing.seller} size="sm" showPopover={false} />
            </div>
          </div>
        </div>
      </div>

      <SquadInspectorModal
        listing={listing}
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
      />
    </>
  );
}
