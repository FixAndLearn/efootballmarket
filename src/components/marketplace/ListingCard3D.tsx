"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Listing } from "@/types/database";
import { VerifiedSellerBadge } from "@/components/marketplace/VerifiedSellerBadge";
import { SquadInspectorModal } from "@/components/marketplace/SquadInspectorModal";
import { ChatSellerWhatsAppButton } from "@/components/marketplace/ChatSellerWhatsAppButton";
import { formatCurrency, getPlatformLabel, getPlaystyleLabel } from "@/lib/utils";
import { isListingOnFlashSale } from "@/lib/utils/flashSale";
import {
  ShieldCheck,
  Trophy,
  Lock,
} from "lucide-react";

export interface ListingCard3DProps {
  listing: Listing;
  featured?: boolean;
}

export function ListingCard3D({ listing }: ListingCard3DProps) {
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const primaryImage =
    listing.images?.find((img) => img.is_primary)?.image_url || listing.images?.[0]?.image_url;

  const isFlashDrop = isListingOnFlashSale(listing);
  const isAvailable = listing.status === "published";

  const epics = (listing.epic_players_count || 0) + (listing.big_time_players_count || 0);

  return (
    <>
      <div className="w-full h-full flex flex-col">
        <div className="group bg-[#11141B] border border-[#242A36] hover:border-slate-600 rounded-xl overflow-hidden relative flex flex-col h-full justify-between transition-colors">
          {/* Media Header / Image */}
          <Link href={`/listings/${listing.id}`} className="block relative aspect-[16/10] w-full bg-[#171B24] overflow-hidden cursor-pointer">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={listing.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                unoptimized={!primaryImage.includes(".supabase.co") && !primaryImage.includes("images.unsplash.com")}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#171B24] text-slate-600">
                <Trophy className="w-9 h-9 stroke-[1.5] mb-1" />
                <span className="text-[11px] font-medium">Squad Preview</span>
              </div>
            )}

            {/* Lock / Sold Overlay if not published */}
            {!isAvailable && (
              <div className="absolute inset-0 bg-black/70 z-30 flex items-center justify-center pointer-events-none p-3">
                <span className="px-3 py-1.5 rounded-lg bg-[#11141B] border border-amber-500/50 text-amber-300 font-semibold text-xs flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{listing.status === "sold" ? "Sold" : "In Escrow"}</span>
                </span>
              </div>
            )}

            {/* Top Badges */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none z-20">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="px-2 py-0.5 rounded bg-[#090B0E]/90 border border-[#242A36] text-[10px] font-medium text-slate-200 truncate">
                  {getPlatformLabel(listing.platform)}
                </span>
                {isFlashDrop && (
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-zinc-950 text-[10px] font-semibold">
                    Discounted
                  </span>
                )}
              </div>

              <span className="px-2 py-0.5 rounded bg-[#090B0E]/90 border border-[#242A36] text-[11px] font-mono font-semibold text-emerald-400 shrink-0">
                {listing.overall_team_strength} OVR
              </span>
            </div>
          </Link>

          {/* Card Body */}
          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
            <div>
              <Link href={`/listings/${listing.id}`}>
                <h3 className="font-semibold text-slate-100 text-sm line-clamp-1 group-hover:text-emerald-400 transition-colors">
                  {listing.title}
                </h3>
              </Link>

              <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                {epics > 0 && (
                  <>
                    <span className="text-slate-200 font-medium">{epics} Epics</span>
                    <span className="text-slate-600">&middot;</span>
                  </>
                )}
                <span className="truncate">{getPlaystyleLabel(listing.primary_playstyle)}</span>
                <span className="text-slate-600">&middot;</span>
                <span className="text-emerald-400">Unlinked</span>
              </div>
            </div>

            {/* Seller & Price Footer */}
            <div className="pt-3 border-t border-[#242A36] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <div className="w-7 h-7 rounded-full bg-[#171B24] border border-[#283040] flex items-center justify-center text-[11px] font-semibold text-slate-300 shrink-0">
                  {listing.seller?.username ? listing.seller.username.slice(0, 2).toUpperCase() : "EF"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 truncate">
                    <span className="text-xs font-medium text-slate-200 truncate">
                      {listing.seller?.username || "Seller"}
                    </span>
                    <VerifiedSellerBadge seller={listing.seller} size="sm" showPopover={false} />
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {(listing.seller?.completed_sales_count || 0) > 0
                      ? `${listing.seller?.completed_sales_count} completed`
                      : "New seller"}
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
                <div className="flex items-center gap-1 justify-end text-[10px] text-slate-400 font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
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
