"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Listing } from "@/types/database";
import { formatCompactNumber, formatCurrency, getPlatformLabel, getPlaystyleLabel } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { isListingOnFlashSale } from "@/lib/utils/flashSale";
import { ChatSellerWhatsAppButton } from "@/components/marketplace/ChatSellerWhatsAppButton";
import {
  X,
  ShieldCheck,
  Zap,
  Star,
  Users,
  Coins,
  Trophy,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Smartphone,
  ZoomIn,
  Flame,
  Edit3,
} from "lucide-react";

interface SquadInspectorModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
}

export function SquadInspectorModal({ listing, isOpen, onClose }: SquadInspectorModalProps) {
  const [activeTab, setActiveTab] = useState<"startingXI" | "bench" | "resources">("startingXI");
  const [isZoomed, setIsZoomed] = useState(false);
  const { user } = useAuth();

  if (!isOpen) return null;

  const isOwner = user?.id && user.id === listing.seller_id;
  const isFlashDrop = isListingOnFlashSale(listing);
  const isAvailable = listing.status === "published";

  const images = listing.images || [];
  const primaryImage = images.find((img) => img.is_primary)?.image_url || images[0]?.image_url;
  const secondaryImage = images[1]?.image_url || primaryImage;
  const thirdImage = images[2]?.image_url || primaryImage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-[#0F172A] border border-[#C8C8C4] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#0F0F0F] relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#111827] border-b border-[#E2E2E0] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#B45309] font-mono font-black text-sm shrink-0">
              ⚡
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-[#EBF5F0] border border-[#BFE0CE] text-[10px] font-bold text-[#006340] shrink-0">
                  {getPlatformLabel(listing.platform)}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-black/70 border border-[#FDE68A] text-[10px] font-mono font-black text-[#92400E] shrink-0">
                  ⚡ {listing.overall_team_strength} CS
                </span>
                {isFlashDrop && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600/90 border border-rose-400 text-[10px] font-extrabold text-[#0F0F0F] shrink-0 animate-pulse flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    <span>Flash Drop</span>
                  </span>
                )}
                {!isAvailable && (
                  <span className="px-2 py-0.5 rounded-full bg-[#F4F3F1] border border-[#9E9E99] text-[10px] font-bold text-[#3D3D3D] shrink-0">
                    {listing.status === "sold" ? "Sold" : "In Escrow"}
                  </span>
                )}
              </div>
              <h3 className="text-xs sm:text-sm md:text-base font-bold text-[#0F0F0F] truncate mt-1">
                {listing.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#F4F3F1] hover:bg-slate-700 text-[#5F5F5F] hover:text-[#0F0F0F] transition-colors shrink-0"
            title="Close Inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center border-b border-[#E2E2E0] bg-[#0B1220] px-3 sm:px-4 gap-1.5 sm:gap-2 text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("startingXI")}
            className={`py-3 px-2 sm:px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === "startingXI"
                ? "border-emerald-400 text-[#006340]"
                : "border-transparent text-[#5F5F5F] hover:text-[#1F1F1F]"
            }`}
          >
            <Trophy className="w-4 h-4 text-[#006340] shrink-0" />
            <span className="hidden sm:inline">Tab 1: </span>
            <span>Starting XI</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bench")}
            className={`py-3 px-2 sm:px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === "bench"
                ? "border-amber-400 text-[#92400E]"
                : "border-transparent text-[#5F5F5F] hover:text-[#1F1F1F]"
            }`}
          >
            <Users className="w-4 h-4 text-[#B45309] shrink-0" />
            <span className="hidden sm:inline">Tab 2: </span>
            <span>Reserves &amp; Bench</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("resources")}
            className={`py-3 px-2 sm:px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === "resources"
                ? "border-indigo-400 text-[#3730A3]"
                : "border-transparent text-[#5F5F5F] hover:text-[#1F1F1F]"
            }`}
          >
            <Coins className="w-4 h-4 text-[#4338CA] shrink-0" />
            <span className="hidden sm:inline">Tab 3: </span>
            <span>Resources &amp; Tiers</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === "startingXI" && (
            <div className="space-y-4">
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-[#F9F9F8] border border-[#E2E2E0]">
                {primaryImage ? (
                  <Image
                    src={primaryImage}
                    alt={`${listing.title} Starting XI`}
                    fill
                    unoptimized={true}
                    className={`object-cover transition-transform duration-300 cursor-zoom-in ${
                      isZoomed ? "scale-150" : "scale-100"
                    }`}
                    onClick={() => setIsZoomed(!isZoomed)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#767676]">
                    <Trophy className="w-12 h-12 mb-2 opacity-50" />
                    <span className="text-xs uppercase font-bold">Screenshot Not Provided</span>
                  </div>
                )}
                <div className="absolute bottom-2.5 right-2.5 z-10">
                  <button
                    type="button"
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-[#C8C8C4] text-white text-[10px] font-bold flex items-center gap-1"
                  >
                    <ZoomIn className="w-3 h-3" />
                    <span>{isZoomed ? "Reset Zoom" : "Click to Zoom"}</span>
                  </button>
                </div>
              </div>

              {/* Manager & Tactical Boost Info */}
              <div className="p-4 rounded-2xl bg-[#111827] border border-[#E2E2E0] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[#5F5F5F] block text-[10px] uppercase font-bold">Manager Assigned</span>
                  <span className="font-bold text-[#0F0F0F] text-sm">{listing.manager_name || "Custom Specialist"}</span>
                </div>
                <div>
                  <span className="text-[#5F5F5F] block text-[10px] uppercase font-bold">Primary Playstyle</span>
                  <span className="font-bold text-[#006340]">{getPlaystyleLabel(listing.primary_playstyle)}</span>
                </div>
                <div>
                  <span className="text-[#5F5F5F] block text-[10px] uppercase font-bold">Division Record</span>
                  <span className="font-bold text-[#92400E]">
                    Div {listing.current_division || "1"} (Best: Div {listing.highest_division || "1"})
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "bench" && (
            <div className="space-y-4">
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-[#F9F9F8] border border-[#E2E2E0]">
                {secondaryImage ? (
                  <Image
                    src={secondaryImage}
                    alt={`${listing.title} Bench & Reserves`}
                    fill
                    unoptimized={true}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#767676]">
                    <Users className="w-12 h-12 mb-2 opacity-50" />
                    <span className="text-xs uppercase font-bold">Reserves Screenshot Included in Main View</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-[#111827] border border-[#E2E2E0] space-y-2 text-xs">
                <span className="text-[10px] text-[#B45309] uppercase font-bold block">
                  Showcase Players &amp; Substitutes
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(listing.key_players_list && listing.key_players_list.length > 0) ? (
                    listing.key_players_list.map((player, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs font-bold flex items-center gap-1"
                      >
                        <Star className="w-3 h-3 text-[#B45309] fill-amber-400" />
                        <span>{player}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[#5F5F5F] text-xs italic">
                      All key roster cards are visible in the primary squad screenshot above.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "resources" && (
            <div className="space-y-4">
              {/* Card Tier Counts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A]">
                  <span className="block text-[10px] text-[#B45309] uppercase font-black truncate">🔥 Epics</span>
                  <span className="text-2xl font-black text-[#92400E] font-mono mt-1 block">
                    {listing.epic_players_count || 0}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/40">
                  <span className="block text-[10px] text-purple-400 uppercase font-black truncate">⭐ Big Time</span>
                  <span className="text-2xl font-black text-purple-200 font-mono mt-1 block">
                    {listing.big_time_players_count || 0}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-500/40">
                  <span className="block text-[10px] text-sky-400 uppercase font-black truncate">💎 Show Time</span>
                  <span className="text-2xl font-black text-sky-200 font-mono mt-1 block">
                    {listing.featured_players_count || 0}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#EBF5F0] border border-[#BFE0CE]">
                  <span className="block text-[10px] text-[#006340] uppercase font-black truncate">⚡ Highlights</span>
                  <span className="text-2xl font-black text-emerald-200 font-mono mt-1 block">
                    {listing.highlight_players_count || 0}
                  </span>
                </div>
              </div>

              {/* In-Game Resource Balances */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <div className="p-3.5 rounded-2xl bg-[#111827] border border-[#E2E2E0]">
                  <span className="block text-[10px] text-[#B45309] uppercase font-bold truncate">eFootball Coins</span>
                  <span className="text-base sm:text-lg font-black text-[#0F0F0F] font-mono mt-1 block truncate">
                    {formatCompactNumber(listing.coin_balance)}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#111827] border border-[#E2E2E0]">
                  <span className="block text-[10px] text-[#006340] uppercase font-bold truncate">GP Balance</span>
                  <span className="text-base sm:text-lg font-black text-[#0F0F0F] font-mono mt-1 block truncate">
                    {formatCompactNumber(listing.gp_balance)}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#111827] border border-[#E2E2E0]">
                  <span className="block text-[10px] text-[#4338CA] uppercase font-bold truncate">ePoints</span>
                  <span className="text-base sm:text-lg font-black text-[#0F0F0F] font-mono mt-1 block truncate">
                    {formatCompactNumber(listing.efootball_points)}
                  </span>
                </div>
              </div>

              {/* Binding & Security Status Checklist */}
              <div className="p-4 rounded-2xl bg-[#111827] border border-[#E2E2E0] space-y-2 text-xs">
                <span className="font-bold text-[#0F0F0F] block text-[11px] uppercase tracking-wider">
                  Account Binding &amp; Security Handshake
                </span>
                <div className="space-y-2 text-[#3D3D3D]">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                    <span className="leading-snug">Konami ID: Ready (Email &amp; Password Changeable by Buyer)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                    <span className="leading-snug">Google Play / Game Center: 100% Unlinked (Clean transfer)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                    <span className="leading-snug">Platform: {getPlatformLabel(listing.platform)} / Cross-Save Ready</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Bottom Bar inside Modal */}
        <div className="p-3.5 sm:p-5 bg-[#111827] border-t border-[#E2E2E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <span className="text-[10px] text-[#5F5F5F] uppercase font-bold block">
              {isFlashDrop ? "Flash Drop Price (Locked)" : "Escrow Price (Till 1572931)"}
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-[#22C55E] font-mono truncate">
                {formatCurrency(listing.price, listing.currency)}
              </span>
              <span className="text-[11px] text-[#5F5F5F]">
                | 24h Buyer Inspection
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <Link href={`/listings/${listing.id}`} className="flex-1 sm:flex-none">
              <button
                type="button"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F3F1] hover:bg-slate-700 text-[#0F0F0F] font-bold text-xs transition-colors min-h-[44px]"
              >
                View Full Listing
              </button>
            </Link>

            {isOwner ? (
              listing.status === "sold" ? (
                <span className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#F4F3F1] border border-[#C8C8C4] text-[#5F5F5F] font-bold text-xs flex items-center justify-center gap-1.5 min-h-[44px] select-none">
                  <Lock className="w-3.5 h-3.5 text-[#767676]" />
                  <span>Account Sold</span>
                </span>
              ) : listing.status === "in_escrow" ? (
                <span className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] font-bold text-xs flex items-center justify-center gap-1.5 min-h-[44px] select-none">
                  <Lock className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>In Escrow</span>
                </span>
              ) : (
                <Link href={`/seller/edit-listing/${listing.id}`} className="flex-1 sm:flex-none">
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#006340] hover:bg-[#004D32] text-[#0F0F0F] font-bold text-xs shadow-md flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit in Seller Hub</span>
                  </button>
                </Link>
              )
            ) : !isAvailable ? (
              <button
                type="button"
                disabled
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#F4F3F1] border border-[#C8C8C4] text-[#5F5F5F] font-bold text-xs cursor-not-allowed min-h-[44px]"
              >
                {listing.status === "sold" ? "Account Sold" : "Under Escrow Lock"}
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-1 sm:flex-none">
                <ChatSellerWhatsAppButton
                  sellerPhone={listing.seller?.phone_number}
                  sellerUsername={listing.seller?.username}
                  listingId={listing.id}
                  listingTitle={listing.title}
                  listingPrice={listing.price}
                  listingCurrency={listing.currency}
                  overallTeamStrength={listing.overall_team_strength}
                  variant="compact"
                  label="Chat Seller"
                />
                <Link href={`/pay/${listing.id}`} className="flex-1 sm:flex-none">
                  <button
                    type="button"
                    className="w-full px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#22C55E] to-emerald-400 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition-all active:scale-95 min-h-[44px]"
                  >
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    <span>Buy Safely with M-Pesa Escrow</span>
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
