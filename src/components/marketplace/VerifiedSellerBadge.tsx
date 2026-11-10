"use client";

import React, { useState } from "react";
import { ShieldCheck, Shield, Crown, Zap, Award, CheckCircle2, Phone, Star } from "lucide-react";
import { Profile } from "@/types/database";
import { getSellerTier } from "@/lib/utils/sellerTier";

export interface VerifiedSellerBadgeProps {
  seller?: Partial<Profile> | null;
  size?: "sm" | "md" | "lg";
  showPopover?: boolean;
}

export function VerifiedSellerBadge({
  seller,
  size = "sm",
  showPopover = true,
}: VerifiedSellerBadgeProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const salesCount = Number(seller?.completed_sales_count || 0);
  const rating = Number(seller?.seller_rating || 0);
  const tier = getSellerTier(salesCount, rating);

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  const badgeTextSizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm font-bold",
  };

  const renderIcon = () => {
    switch (tier.iconType) {
      case "crown":
        return <Crown className={`${iconSizes[size]} text-[#92400E] fill-amber-300/30 animate-pulse`} />;
      case "shield-check":
        return <ShieldCheck className={`${iconSizes[size]} text-[#006340] fill-emerald-400/20`} />;
      default:
        return <Shield className={`${iconSizes[size]} text-[#5F5F5F]`} />;
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (showPopover) setPopoverOpen(!popoverOpen);
        }}
        onMouseEnter={() => showPopover && setPopoverOpen(true)}
        onMouseLeave={() => showPopover && setPopoverOpen(false)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold transition-all cursor-pointer ${tier.badgeClass} ${badgeTextSizes[size]}`}
      >
        {renderIcon()}
        <span>{tier.label}</span>
      </button>

      {/* Trust Popover */}
      {showPopover && popoverOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full left-0 mb-2 z-50 w-72 p-3.5 rounded-2xl bg-[#F9F9F8] backdrop-blur-xl border border-[#C8C8C4] shadow-2xl space-y-2.5 text-left animate-in fade-in zoom-in-95 pointer-events-auto"
        >
          <div className="flex items-center gap-2 border-b border-[#E2E2E0] pb-2">
            <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#92400E] flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-[#0F0F0F] flex items-center gap-1.5">
                <span>{tier.label}</span>
                <span className="text-[9px] uppercase px-1 rounded bg-[#F4F3F1] text-[#3D3D3D]">
                  Level {tier.level === "master" ? "3" : tier.level === "verified" ? "2" : "1"}
                </span>
              </h5>
              <p className="text-[10px] text-[#006340] font-medium">Safaricom Till 1572931 Escrow</p>
            </div>
          </div>

          <p className="text-[11px] text-[#3D3D3D] leading-normal">
            {tier.description}
          </p>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-[#1F1F1F]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#006340] shrink-0" />
              <span>
                <strong>{salesCount}</strong> completed escrow transfers
              </span>
            </div>

            {salesCount > 0 && rating > 0 ? (
                <div className="flex items-center gap-1.5 text-[#92400E]">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-[#B45309] shrink-0" />
                  <span>
                    <strong>{rating.toFixed(1)} / 5.0</strong> seller satisfaction rating
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[#5F5F5F]">
                  <Star className="w-3.5 h-3.5 text-[#767676] shrink-0" />
                  <span>No buyer reviews yet</span>
                </div>
              )}

            <div className="flex items-center gap-1.5 text-[#1F1F1F]">
              <Phone className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
              <span><strong>M-Pesa Registered:</strong> Safaricom mobile phone registered</span>
            </div>
          </div>

          {tier.nextTierLabel && (
            <div className="p-2 rounded-lg bg-[#F4F3F1] border border-[#C8C8C4] text-[10px] text-[#3D3D3D]">
              <span className="text-[#92400E] font-bold">{tier.salesRequiredForNext} more sales</span> until {tier.nextTierLabel} promotion.
            </div>
          )}

          <div className="pt-1.5 border-t border-[#E2E2E0] text-[9px] text-[#5F5F5F]">
            Funds held securely until buyer verifies Konami ID login.
          </div>
        </div>
      )}
    </div>
  );
}
