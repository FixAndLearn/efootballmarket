"use client";

import React, { useState } from "react";
import { Scale, Check } from "lucide-react";
import { Listing } from "@/types/database";
import { useCompareSquads } from "@/lib/compare/compareStore";

interface CompareButtonProps {
  listing: Listing;
  variant?: "icon" | "pill";
}

export function CompareButton({ listing, variant = "icon" }: CompareButtonProps) {
  const { isSelected, toggle } = useCompareSquads();
  const [limitFlash, setLimitFlash] = useState(false);

  const active = isSelected(listing.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = toggle(listing);
    if (res.full) {
      setLimitFlash(true);
      setTimeout(() => setLimitFlash(false), 1800);
    }
  };

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={
          limitFlash
            ? "Max 4 squads in compare tray"
            : active
            ? "Remove from side-by-side comparison"
            : "Compare squad specs side-by-side"
        }
        className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
          limitFlash
            ? "bg-sx-amber-tint border-sx-amber-border text-sx-amber-text"
            : active
            ? "bg-sx-green-tint border-sx-green-border text-sx-green-text"
            : "bg-sx-stone hover:bg-sx-elevated border-sx-border text-sx-ink"
        }`}
      >
        {active ? <Check className="w-3.5 h-3.5" /> : <Scale className="w-3.5 h-3.5" />}
        <span>{limitFlash ? "Max 4 Squads" : active ? "Comparing" : "Compare"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={
        limitFlash
          ? "Maximum 4 squads in compare tray"
          : active
          ? "Remove from Compare"
          : "Add to Compare"
      }
      aria-label={active ? "Remove squad from comparison" : "Add squad to comparison"}
      className={`h-7 px-2 rounded-full backdrop-blur-md border text-[10.5px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer ${
        limitFlash
          ? "bg-amber-500/95 border-amber-300 text-slate-950"
          : active
          ? "bg-emerald-600/95 border-emerald-300/60 text-white shadow-sm"
          : "bg-black/70 hover:bg-black/90 border-white/20 text-white"
      }`}
    >
      {active ? <Check className="w-3 h-3" /> : <Scale className="w-3 h-3" />}
      <span className="hidden sm:inline">{limitFlash ? "Max 4" : active ? "Added" : "Compare"}</span>
    </button>
  );
}
