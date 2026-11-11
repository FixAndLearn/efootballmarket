"use client";

import React, { useState } from "react";
import { ShieldCheck, Shield, Crown, CheckCircle2, HelpCircle, Star, X } from "lucide-react";
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
  const isVerified = Boolean(seller?.is_verified_seller);
  const tier = getSellerTier(salesCount, rating, isVerified);

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  const badgeTextSizes = {
    sm: "text-[10.5px]",
    md: "text-xs",
    lg: "text-sm font-bold",
  };

  const renderIcon = () => {
    switch (tier.iconType) {
      case "crown":
        return <Crown className={`${iconSizes[size]} text-sx-amber-text shrink-0`} />;
      case "shield-check":
        return <ShieldCheck className={`${iconSizes[size]} shrink-0`} />;
      default:
        return <Shield className={`${iconSizes[size]} shrink-0`} />;
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (showPopover) setPopoverOpen((prev) => !prev);
        }}
        onMouseEnter={() => showPopover && setPopoverOpen(true)}
        onMouseLeave={() => showPopover && setPopoverOpen(false)}
        title={tier.description}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-semibold transition-colors ${
          showPopover ? "cursor-pointer" : "cursor-default"
        } ${tier.badgeClass} ${badgeTextSizes[size]}`}
      >
        {renderIcon()}
        <span>{tier.label}</span>
        {showPopover && <HelpCircle className="w-2.5 h-2.5 opacity-70 shrink-0" />}
      </button>

      {showPopover && popoverOpen && (
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute bottom-full right-0 sm:left-0 sm:right-auto mb-2 z-50 w-72 p-3.5 rounded-xl bg-sx-canvas border border-sx-border-strong shadow-xl space-y-2.5 text-left pointer-events-auto"
        >
          <div className="flex items-start justify-between gap-2 border-b border-sx-border pb-2">
            <div>
              <h5 className="text-xs font-bold text-sx-ink">{tier.label}</h5>
              <p className="text-[10px] text-sx-muted">What this seller badge means</p>
            </div>
            <button
              type="button"
              onClick={() => setPopoverOpen(false)}
              className="p-0.5 text-sx-muted hover:text-sx-ink sm:hidden"
              aria-label="Close badge info"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-sx-ink-soft leading-relaxed">
            {tier.description}
          </p>

          <div className="space-y-1.5 pt-0.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-sx-muted">
              What was checked:
            </span>
            {tier.whatWasChecked.map((point, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[11px] text-sx-ink-soft">
                <CheckCircle2 className="w-3.5 h-3.5 text-sx-green-text shrink-0 mt-0.5" />
                <span>{point}</span>
              </div>
            ))}

            {salesCount > 0 && rating > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-sx-amber-text pt-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-sx-amber-text shrink-0" />
                <span>
                  <strong>{rating.toFixed(1)} / 5.0</strong> average buyer rating
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
