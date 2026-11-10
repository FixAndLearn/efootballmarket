import { ListingFilters } from "@/components/marketplace/ListingFilters";
import { ListingGrid } from "@/components/marketplace/ListingGrid";
import { AdBanner } from "@/components/common/AdBanner";
import { Button } from "@/components/ui/Button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ListingService } from "@/services/listingService";
import { Listing, Platform } from "@/types/database";
import { Plus, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Marketplace — Browse Verified eFootball Squads",
  description:
    "Browse unlinked Konami ID eFootball accounts in Kenya. Filter by Collective Strength (OVR), Epic legends, Coin balance, and KES price with M-Pesa Till 1572931 escrow.",
};

interface BrowsePageProps {
  searchParams: {
    search?: string;
    platform?: Platform | "all";
    minStrength?: string;
    minCoins?: string;
    manager?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: "newest" | "price_asc" | "price_desc" | "strength_desc" | "coins_desc" | "views";
    page?: string;
  };
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const supabase = createServerSupabaseClient();
  const listingService = new ListingService(supabase);

  const filters = {
    search: searchParams.search,
    platform: searchParams.platform,
    minStrength: searchParams.minStrength ? Number(searchParams.minStrength) : undefined,
    minCoins: searchParams.minCoins ? Number(searchParams.minCoins) : undefined,
    manager: searchParams.manager,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    sortBy: searchParams.sortBy,
    limit: 24,
  };

  let listings: Listing[] = [];
  let totalCount = 0;
  let hasSearchError = false;

  try {
    const result = await listingService.getListings(filters);
    listings = result.listings;
    totalCount = result.totalCount;
  } catch {
    hasSearchError = true;
  }

  const hasActiveFilters = Boolean(
    searchParams.search ||
      (searchParams.platform && searchParams.platform !== "all") ||
      searchParams.minStrength ||
      searchParams.minCoins ||
      searchParams.manager ||
      searchParams.minPrice ||
      searchParams.maxPrice ||
      (searchParams.sortBy && searchParams.sortBy !== "newest")
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Storefront Header Bar */}
      <div className="store-panel rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
              Squad Marketplace
            </h1>
            {totalCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 font-mono text-xs font-bold text-emerald-300">
                {totalCount} LIVE
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Unlinked Konami ID accounts protected via Safaricom Till 1572931 (24-hour buyer check).</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/wanted">
            <Button variant="secondary" size="sm">
              Wanted Board
            </Button>
          </Link>
          <Link href="/seller/create-listing">
            <Button variant="primary" size="sm">
              <Plus className="w-3.5 h-3.5" />
              <span>Sell Squad</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Filter Rail */}
        <div className="lg:col-span-3 lg:sticky lg:top-28">
          <ListingFilters />
        </div>

        {/* Right Listings Catalog */}
        <div className="lg:col-span-9 space-y-5">
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl store-panel text-xs">
              <span className="text-slate-400 font-medium mr-1">Filters:</span>
              {searchParams.search && (
                <span className="px-2.5 py-1 rounded-md bg-[#131923] border border-[#242E42] text-slate-200 font-mono">
                  &ldquo;{searchParams.search}&rdquo;
                </span>
              )}
              {searchParams.minStrength && (
                <span className="px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono font-semibold">
                  {searchParams.minStrength}+ OVR
                </span>
              )}
              {searchParams.platform && searchParams.platform !== "all" && (
                <span className="px-2.5 py-1 rounded-md bg-[#131923] border border-[#242E42] text-slate-200 capitalize">
                  {searchParams.platform.replace(/_/g, " ")}
                </span>
              )}
              {searchParams.minCoins && (
                <span className="px-2.5 py-1 rounded-md bg-[#131923] border border-[#242E42] text-slate-200 font-mono">
                  {Number(searchParams.minCoins).toLocaleString()}+ Coins
                </span>
              )}
              {searchParams.manager && (
                <span className="px-2.5 py-1 rounded-md bg-[#131923] border border-[#242E42] text-slate-200">
                  Coach: {searchParams.manager}
                </span>
              )}
              {(searchParams.minPrice || searchParams.maxPrice) && (
                <span className="px-2.5 py-1 rounded-md bg-[#131923] border border-[#242E42] text-slate-200 font-mono">
                  KES {searchParams.minPrice || "0"} – {searchParams.maxPrice || "Any"}
                </span>
              )}
              {searchParams.sortBy && searchParams.sortBy !== "newest" && (
                <span className="px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 capitalize">
                  {searchParams.sortBy.replace("_", " ")}
                </span>
              )}
              <Link
                href="/browse"
                className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-medium ml-auto"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear all</span>
              </Link>
            </div>
          )}

          <ListingGrid listings={listings} filters={filters} />

          <AdBanner
            slot="browse_bottom_feed"
            format="horizontal"
            hasContent={listings.length >= 4 && !hasSearchError}
          />
        </div>
      </div>
    </div>
  );
}
