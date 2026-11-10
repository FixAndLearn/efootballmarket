"use client";

import React from "react";
import Link from "next/link";
import { Listing } from "@/types/database";
import { SearchX, ArrowRight, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ListingCard } from "./ListingCard";
import { AdBanner } from "@/components/common/AdBanner";
import { useRealtimeListings } from "@/hooks/useRealtimeListings";
import { formatCurrency } from "@/lib/utils";

export interface ListingGridProps {
  listings: Listing[];
  filters?: {
    search?: string;
    platform?: string;
    playstyle?: string;
    minStrength?: number;
    minCoins?: number;
    minEpics?: number;
    minPrice?: number;
    maxPrice?: number;
    manager?: string;
    sortBy?: string;
  };
  isLoading?: boolean;
}

export function ListingGrid({ listings: initialListings, filters, isLoading = false }: ListingGridProps) {
  const { listings, newListingAlert, dismissAlert } = useRealtimeListings({
    initialListings,
    filters,
    limit: 24,
    autoRefreshIntervalMs: 8000,
  });

  const hasActiveFilters = Boolean(
    filters?.search ||
      (filters?.platform && filters.platform !== "all") ||
      filters?.minStrength ||
      filters?.minCoins ||
      filters?.minEpics ||
      filters?.minPrice ||
      filters?.maxPrice ||
      filters?.manager
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-[#11141B] border border-[#242A36] rounded-xl p-4 animate-pulse space-y-4"
          >
            <div className="aspect-[16/10] bg-[#171B24] rounded-lg" />
            <div className="h-4 bg-[#171B24] rounded w-3/4" />
            <div className="h-6 bg-[#171B24] rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {newListingAlert && (
        <div className="p-4 rounded-xl bg-[#11141B] border border-emerald-500/40 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-emerald-400">
              New listing published
            </span>
            <p className="text-sm font-semibold text-white truncate">
              {newListingAlert.title} &middot; {formatCurrency(newListingAlert.price)} ({newListingAlert.overall_team_strength} OVR)
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/listings/${newListingAlert.id}`}>
              <Button variant="primary" size="sm">
                <span>View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <button
              type="button"
              onClick={dismissAlert}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {listings.length === 0 ? (
        <div className="space-y-5">
          <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-[#242A36] bg-[#11141B]">
            <div className="w-11 h-11 rounded-lg bg-[#171B24] border border-[#283040] flex items-center justify-center text-slate-400 mb-4">
              <SearchX className="w-5 h-5" />
            </div>

            <h3 className="text-base font-semibold text-white mb-1.5">
              {hasActiveFilters ? "No listings match your filters" : "No open listings right now"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-5 leading-relaxed">
              {hasActiveFilters
                ? "Try clearing some filters or adjusting your price and OVR range."
                : "Available squads are currently sold or in a buyer's 24-hour inspection window. Have an unlinked Konami ID squad to sell?"}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {hasActiveFilters ? (
                <Link href="/browse">
                  <Button variant="primary" size="sm">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Filters</span>
                  </Button>
                </Link>
              ) : (
                <Link href="/seller/create-listing">
                  <Button variant="primary" size="sm">
                    List an Account
                  </Button>
                </Link>
              )}
              <Link href="/wanted">
                <Button variant="secondary" size="sm">
                  Post on Wanted Board
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {listings.map((listing, index) => (
            <React.Fragment key={listing.id}>
              <ListingCard listing={listing} />
              {index === 5 && listings.length > 6 && (
                <div className="col-span-full">
                  <AdBanner slot="browse_in_feed_grid" format="in-feed" hasContent={true} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
