"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, ChevronUp, Scale, Trash2, X } from "lucide-react";
import { useCompareSquads, MAX_COMPARE_SQUADS } from "@/lib/compare/compareStore";
import { isStandaloneDocPath } from "@/components/legal/StandaloneDocLayout";
import { formatCurrency } from "@/lib/utils";

export function SquadCompareTray() {
  const pathname = usePathname() || "/";
  const { items, count, remove, clear } = useCompareSquads();
  const [minimized, setMinimized] = useState(true);

  if (
    count === 0 ||
    pathname.startsWith("/compare") ||
    pathname.startsWith("/pay/") ||
    pathname.startsWith("/orders/") ||
    isStandaloneDocPath(pathname)
  ) {
    return null;
  }

  const isListingDetail = pathname.startsWith("/listings/");

  return (
    <div
      className={`fixed bottom-20 md:bottom-5 left-3 sm:left-5 z-40 max-w-[calc(100vw-5.5rem)] sm:max-w-md ${
        isListingDetail ? "hidden lg:block" : ""
      }`}
    >
      {minimized ? (
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="h-11 px-4 rounded-full bg-sx-contrast text-sx-contrast-fg shadow-xl border border-sx-border-strong inline-flex items-center gap-2 text-xs font-bold cursor-pointer"
        >
          <Scale className="w-4 h-4 text-emerald-400" />
          <span>
            Compare ({count}/{MAX_COMPARE_SQUADS})
          </span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="rounded-2xl bg-sx-canvas/95 backdrop-blur-md border border-sx-border-strong shadow-2xl p-3 sm:p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sx-ink">
              <Scale className="w-3.5 h-3.5 text-sx-green-text shrink-0" />
              <span>
                Squad Compare ({count}/{MAX_COMPARE_SQUADS})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clear}
                title="Clear all compared squads"
                className="px-2 py-1 rounded text-[11px] font-medium text-sx-muted hover:text-sx-red-text transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
              <button
                type="button"
                onClick={() => setMinimized(true)}
                aria-label="Minimize compare tray"
                className="p-1 rounded text-sx-muted hover:text-sx-ink transition-colors cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {items.map((sq) => (
              <div
                key={sq.id}
                className="relative shrink-0 w-36 rounded-xl bg-sx-stone border border-sx-border p-2 pr-6 flex items-center gap-2"
              >
                <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-sx-elevated shrink-0 flex items-center justify-center">
                  {sq.thumbUrl ? (
                    <Image
                      src={sq.thumbUrl}
                      alt={sq.title}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-[9px] font-mono font-bold text-sx-green-text">
                      {sq.overall_team_strength}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-mono font-extrabold text-sx-ink leading-tight">
                    {sq.overall_team_strength} OVR
                  </p>
                  <p className="text-[10.5px] font-semibold text-sx-green-text truncate">
                    {formatCurrency(sq.price, sq.currency)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(sq.id)}
                  aria-label={`Remove ${sq.title}`}
                  className="absolute top-1 right-1 p-0.5 rounded-full text-sx-muted hover:text-sx-ink cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-[11px] text-sx-muted">
              {count === 1 ? "Add 1+ more or open matrix" : "Side-by-side winner highlights"}
            </span>
            <Link
              href="/compare"
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-sx-green hover:bg-sx-green-hover text-white text-xs font-bold transition-colors shrink-0"
            >
              <span>Compare Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
