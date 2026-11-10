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
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-3 animate-pulse">
            <div className="aspect-[4/3] bg-[#F4F3F1] rounded-md" />
            <div className="h-4 bg-[#EAE9E6] rounded w-4/5" />
            <div className="h-5 bg-[#EAE9E6] rounded w-2/5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {newListingAlert && (
        <div className="p-4 rounded-lg bg-[#EBF5F0] border border-[#BFE0CE] flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#006340]">
              New Verified Squad Listed
            </span>
            <p className="text-sm font-semibold text-[#0F0F0F] truncate">
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
              className="p-1.5 rounded-md text-[#5F5F5F] hover:text-[#0F0F0F] transition-colors cursor-pointer"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-10 sm:p-14 rounded-lg border border-[#E2E2E0] bg-[#F9F9F8]">
          <div className="w-12 h-12 rounded-full bg-[#EBF5F0] flex items-center justify-center text-[#006340] mb-4">
            <SearchX className="w-5 h-5" />
          </div>

          <h3 className="text-base font-bold text-[#0F0F0F] mb-1.5">
            {hasActiveFilters ? "No squads match your current filters" : "No open squads available right now"}
          </h3>
          <p className="text-xs sm:text-sm text-[#5F5F5F] max-w-md mb-6 leading-relaxed">
            {hasActiveFilters
              ? "Try clearing some filters or widening your KES price and Collective Strength range."
              : "Active squads are currently sold or inside a buyer's 24-hour inspection window. Have a Clean Konami ID squad ready to list?"}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {hasActiveFilters ? (
              <Link href="/browse">
                <Button variant="primary" size="sm">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </Button>
              </Link>
            ) : (
              <Link href="/seller/create-listing">
                <Button variant="primary" size="sm">
                  Sell Your Squad
                </Button>
              </Link>
            )}
            <Link href="/wanted">
              <Button variant="outline" size="sm">
                Post Buyer Request
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
          {listings.map((listing, index) => (
            <React.Fragment key={listing.id}>
              <ListingCard listing={listing} />
              {index === 7 && listings.length > 8 && (
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
