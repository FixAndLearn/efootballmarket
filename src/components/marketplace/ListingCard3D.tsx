"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Listing } from "@/types/database";
import { VerifiedSellerBadge } from "@/components/marketplace/VerifiedSellerBadge";
import { SquadInspectorModal } from "@/components/marketplace/SquadInspectorModal";
import { ChatSellerWhatsAppButton } from "@/components/marketplace/ChatSellerWhatsAppButton";
import { formatCompactNumber, formatCurrency, getPlatformLabel } from "@/lib/utils";
import { isListingOnFlashSale } from "@/lib/utils/flashSale";
import {
  ShieldCheck,
  Lock,
  ArrowUpRight,
} from "lucide-react";

export interface ListingCard3DProps {
  listing: Listing;
  featured?: boolean;
}

function TacticalPitchFallback() {
  return (
    <div className="w-full h-full bg-[#091310] relative flex items-center justify-center overflow-hidden">
      <svg
        viewBox="0 0 320 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full opacity-45"
        aria-hidden="true"
      >
        <rect x="16" y="14" width="288" height="172" rx="4" stroke="#10B981" strokeOpacity="0.45" strokeWidth="1.5" />
        <line x1="160" y1="14" x2="160" y2="186" stroke="#10B981" strokeOpacity="0.35" strokeWidth="1.5" />
        <circle cx="160" cy="100" r="28" stroke="#10B981" strokeOpacity="0.4" strokeWidth="1.5" />
        <rect x="16" y="58" width="44" height="84" stroke="#10B981" strokeOpacity="0.35" strokeWidth="1.5" />
        <rect x="260" y="58" width="44" height="84" stroke="#10B981" strokeOpacity="0.35" strokeWidth="1.5" />
        {/* 4-3-3 Formation Nodes */}
        {[
          [42, 100],
          [88, 44], [84, 82], [84, 118], [88, 156],
          [148, 56], [138, 100], [148, 144],
          [222, 46], [238, 100], [222, 154],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="6" fill="#10B981" fillOpacity="0.25" stroke="#34D399" strokeWidth="1.5" />
          </g>
        ))}
      </svg>
      <span className="absolute bottom-2.5 right-3 text-[10px] font-mono uppercase tracking-wider text-emerald-400/70">
        4-3-3 Squad Sheet
      </span>
    </div>
  );
}

export function ListingCard3D({ listing }: ListingCard3DProps) {
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const primaryImage =
    listing.images?.find((img) => img.is_primary)?.image_url || listing.images?.[0]?.image_url;

  const isElite = (listing.overall_team_strength || 0) >= 3150;
  const isFlashDrop = isListingOnFlashSale(listing);
  const isAvailable = listing.status === "published";

  const epics = (listing.epic_players_count || 0) + (listing.big_time_players_count || 0);
  const coins = listing.coin_balance || 0;

  return (
    <>
      <div className="w-full h-full flex flex-col">
        <div className="group store-panel rounded-xl overflow-hidden relative flex flex-col h-full justify-between hover:border-emerald-500/50 transition-all duration-200">
          {/* Media Frame */}
          <Link
            href={`/listings/${listing.id}`}
            className="block relative aspect-[16/10] w-full bg-[#0A0E15] overflow-hidden border-b border-[#1E2636]"
          >
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={listing.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                unoptimized={!primaryImage.includes(".supabase.co") && !primaryImage.includes("images.unsplash.com")}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <TacticalPitchFallback />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-transparent to-black/45 pointer-events-none" />

            {/* Lock / Sold Overlay */}
            {!isAvailable && (
              <div className="absolute inset-0 bg-black/75 z-30 flex items-center justify-center pointer-events-none p-3">
                <span className="px-3 py-1.5 rounded-lg bg-[#0D1117] border border-amber-500/50 text-amber-300 font-mono font-bold text-xs uppercase flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{listing.status === "sold" ? "Sold" : "In Escrow"}</span>
                </span>
              </div>
            )}

            {/* Top HUD Chips */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none z-20">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="px-2 py-0.5 rounded bg-[#07090D]/90 border border-[#253045] text-[10px] font-mono font-semibold text-slate-200 uppercase truncate">
                  {getPlatformLabel(listing.platform)}
                </span>
                {isFlashDrop && (
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-zinc-950 text-[10px] font-mono font-bold uppercase">
                    Drop
                  </span>
                )}
              </div>

              <span
                className={`px-2 py-0.5 rounded border text-[11px] font-mono font-bold shrink-0 ${
                  isElite
                    ? "bg-amber-950/90 border-amber-400/60 text-amber-300"
                    : "bg-[#07090D]/90 border-emerald-500/50 text-emerald-300"
                }`}
              >
                {listing.overall_team_strength} OVR
              </span>
            </div>
          </Link>

          {/* Card Body */}
          <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
            <div className="space-y-2.5">
              <Link href={`/listings/${listing.id}`} className="flex items-start justify-between gap-2">
                <h3 className="font-display font-bold text-white text-sm line-clamp-1 group-hover:text-emerald-400 transition-colors">
                  {listing.title}
                </h3>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0 mt-0.5 transition-colors" />
              </Link>

              {/* 3-Cell Esports Telemetry Strip */}
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="py-1.5 px-1 rounded-md bg-[#131923] border border-[#20293A]">
                  <span className="block text-[9px] font-mono uppercase text-slate-500">Epics</span>
                  <span className="text-xs font-mono font-bold text-amber-300">{epics}</span>
                </div>
                <div className="py-1.5 px-1 rounded-md bg-[#131923] border border-[#20293A]">
                  <span className="block text-[9px] font-mono uppercase text-slate-500">Coins</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {formatCompactNumber(coins)}
                  </span>
                </div>
                <div className="py-1.5 px-1 rounded-md bg-[#131923] border border-[#20293A]">
                  <span className="block text-[9px] font-mono uppercase text-slate-500">Link</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">Clean</span>
                </div>
              </div>
            </div>

            {/* Seller & Price Footer */}
            <div className="pt-3 border-t border-[#1E2636] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <div className="w-7 h-7 rounded-md bg-[#131923] border border-[#242E42] flex items-center justify-center text-[10px] font-mono font-bold text-slate-300 shrink-0">
                  {listing.seller?.username ? listing.seller.username.slice(0, 2).toUpperCase() : "EF"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 truncate">
                    <span className="text-xs font-medium text-slate-200 truncate">
                      {listing.seller?.username || "Trader"}
                    </span>
                    <VerifiedSellerBadge seller={listing.seller} size="sm" showPopover={false} />
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {(listing.seller?.completed_sales_count || 0) > 0
                      ? `${listing.seller?.completed_sales_count} trades`
                      : "Verified ID"}
                  </span>
                </div>
                <ChatSellerWhatsAppButton
                  sellerPhone={listing.seller?.phone_number}
                  sellerUsername={listing.seller?.username}
                  listingId={listing.id}
                  listingTitle={listing.title}
                  listingPrice={listing.price}
                  listingCurrency={listing.currency}
                  overallTeamStrength={listing.overall_team_strength}
                  variant="icon"
                  className="w-7 h-7 shrink-0"
                />
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 justify-end text-[9px] font-mono uppercase text-emerald-400">
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span>Escrow</span>
                </div>
                <span className="text-sm font-bold text-white font-mono block">
                  {formatCurrency(listing.price, listing.currency)}
                </span>
              </div>
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
