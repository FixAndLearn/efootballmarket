"use client";

import React from "react";
import Link from "next/link";
import { Listing } from "@/types/database";
import { SearchX, ArrowRight, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ListingCard } from "./ListingCard";
import { AdBanner } from "@/components/common/AdBanner";
import { useRealtimeListings } from "@/hooks/useRealtimeListings";
import { formatCurrency, formatSmartListingTitle } from "@/lib/utils";

export interface ListingGridProps {
  listings: Listing[];
  filters?: {
    search?: string;
    platform?: string;
    playstyle?: string;
    minStrength?: number;
    minCoins?: number;
    minEpics?: number;
    allowsSwap?: boolean;
    minPrice?: number;
    maxPrice?: number;
    manager?: string;
    sortBy?: string;
    limit?: number;
    offset?: number;
  };
  isLoading?: boolean;
}

export function ListingGrid({ listings: initialListings, filters, isLoading = false }: ListingGridProps) {
  const { listings, newListingAlert, dismissAlert } = useRealtimeListings({
    initialListings,
    filters,
    limit: filters?.limit || 24,
    autoRefreshIntervalMs: 25000,
  });

  const hasActiveFilters = Boolean(
    filters?.search ||
      (filters?.platform && filters.platform !== "all") ||
      (filters?.playstyle && filters.playstyle !== "all") ||
      filters?.allowsSwap ||
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
            <div className="aspect-[4/3] bg-sx-stone rounded-md" />
            <div className="h-4 bg-sx-elevated rounded w-4/5" />
            <div className="h-5 bg-sx-elevated rounded w-2/5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {newListingAlert && (
        <div className="p-4 rounded-lg bg-sx-green-tint border border-sx-green-border flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sx-green-text">
              New Verified Squad Listed
            </span>
            <p className="text-sm font-semibold text-sx-ink truncate">
              {formatSmartListingTitle(newListingAlert)} &middot; {formatCurrency(newListingAlert.price)} ({newListingAlert.overall_team_strength} OVR)
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
              className="p-1.5 rounded-md text-sx-muted hover:text-sx-ink transition-colors cursor-pointer"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-10 sm:p-14 rounded-lg border border-sx-border bg-sx-subtle">
          <div className="w-12 h-12 rounded-full bg-sx-green-tint flex items-center justify-center text-sx-green-text mb-4">
            <SearchX className="w-5 h-5" />
          </div>

          <h3 className="text-base font-bold text-sx-ink mb-1.5">
            {hasActiveFilters ? "No squads match your current filters" : "No open squads available right now"}
          </h3>
          <p className="text-xs sm:text-sm text-sx-muted max-w-md mb-6 leading-relaxed">
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

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-5 text-xs">
              <span className="text-sx-muted mr-1">Try popular:</span>
              {[
                { label: "Under KES 1,000", href: "/browse?maxPrice=1000" },
                { label: "3150+ OVR", href: "/browse?minStrength=3150" },
                { label: "Android Squads", href: "/browse?platform=android" },
                { label: "Lowest Price", href: "/browse?sortBy=price_asc" },
              ].map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="px-2.5 py-1 rounded-full bg-sx-canvas border border-sx-border hover:border-sx-green text-sx-ink font-medium transition-colors"
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {listings.map((listing, index) => (
            <React.Fragment key={listing.id}>
              <ListingCard listing={listing} priority={index < 2} />
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
