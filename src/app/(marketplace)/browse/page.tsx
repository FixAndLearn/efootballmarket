import { ListingFilters } from "@/components/marketplace/ListingFilters";
import { ListingGrid } from "@/components/marketplace/ListingGrid";
import { AdBanner } from "@/components/common/AdBanner";
import { Button } from "@/components/ui/Button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ListingService } from "@/services/listingService";
import { Listing, Platform } from "@/types/database";
import { CheckCircle2, X } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Browse Verified eFootball Squads | eFootballMarket Kenya",
  description:
    "Browse Clean Konami ID eFootball accounts in Kenya. Filter by Collective Strength (OVR), Epic legends, Coin balance, and Ask Price in KES with M-Pesa Till 1572931 verification.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/browse",
  },
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* StockX Breadcrumb + Category Header */}
      <div className="border-b border-[#E2E2E0] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="text-xs text-[#5F5F5F] flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#0F0F0F]">
              Home
            </Link>
            <span>/</span>
            <span className="text-[#0F0F0F] font-medium">eFootball Squads</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F0F0F] font-display tracking-tight">
              Verified eFootball Squads
            </h1>
            {totalCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#EBF5F0] text-[#006340] text-xs font-bold">
                {totalCount} Available
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#5F5F5F] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#006340] shrink-0" />
            <span>
              Every squad requires Clean Konami ID status (zero Google Play / Apple links) and 24-hour M-Pesa Till 1572931 buyer inspection.
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/wanted">
            <Button variant="outline" size="sm">
              Buyer Requests
            </Button>
          </Link>
          <Link href="/seller/create-listing">
            <Button variant="primary" size="sm">
              Sell Squad
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left StockX Filter Rail */}
        <div className="lg:col-span-3 lg:sticky lg:top-32">
          <ListingFilters />
        </div>

        {/* Right StockX Product Grid */}
        <div className="lg:col-span-9 space-y-5">
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#E2E2E0] text-xs">
              <span className="text-[#5F5F5F] font-medium mr-1">Active:</span>
              {searchParams.search && (
                <span className="px-2.5 py-1 rounded-full bg-[#F4F3F1] text-[#0F0F0F] font-medium">
                  &ldquo;{searchParams.search}&rdquo;
                </span>
              )}
              {searchParams.minStrength && (
                <span className="px-2.5 py-1 rounded-full bg-[#F4F3F1] text-[#0F0F0F] font-semibold">
                  {searchParams.minStrength}+ OVR
                </span>
              )}
              {searchParams.platform && searchParams.platform !== "all" && (
                <span className="px-2.5 py-1 rounded-full bg-[#F4F3F1] text-[#0F0F0F] capitalize font-medium">
                  {searchParams.platform.replace(/_/g, " ")}
                </span>
              )}
              {searchParams.minCoins && (
                <span className="px-2.5 py-1 rounded-full bg-[#F4F3F1] text-[#0F0F0F] font-medium">
                  {Number(searchParams.minCoins).toLocaleString()}+ Coins
                </span>
              )}
              {searchParams.manager && (
                <span className="px-2.5 py-1 rounded-full bg-[#F4F3F1] text-[#0F0F0F] font-medium">
                  {searchParams.manager}
                </span>
              )}
              {(searchParams.minPrice || searchParams.maxPrice) && (
                <span className="px-2.5 py-1 rounded-full bg-[#F4F3F1] text-[#0F0F0F] font-mono font-medium">
                  KES {searchParams.minPrice || "0"} – {searchParams.maxPrice || "Any"}
                </span>
              )}
              <Link
                href="/browse"
                className="inline-flex items-center gap-1 text-xs text-[#006340] hover:underline font-semibold ml-auto"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear All</span>
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
