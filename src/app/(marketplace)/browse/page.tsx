import { ListingFilters } from "@/components/marketplace/ListingFilters";
import { ListingGrid } from "@/components/marketplace/ListingGrid";
import { AdBanner } from "@/components/common/AdBanner";
import { Button } from "@/components/ui/Button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ListingService } from "@/services/listingService";
import { Listing, Platform, Playstyle } from "@/types/database";
import { getPlaystyleLabel } from "@/lib/utils";
import { ArrowLeft, ArrowRight, CheckCircle2, X } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Browse Verified eFootball Squads | eFootballMarket Kenya",
  description:
    "Browse Clean Konami ID eFootball accounts in Kenya. Filter by Collective Strength (OVR), Epic legends, Playstyle, Swap availability, and Ask Price in KES with M-Pesa Till 1572931 verification.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/browse",
  },
};

const PAGE_SIZE = 24;

interface BrowsePageProps {
  searchParams: {
    search?: string;
    platform?: Platform | "all";
    playstyle?: Playstyle | "all";
    minStrength?: string;
    minEpics?: string;
    minCoins?: string;
    swap?: string;
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

  const currentPage = Math.max(1, Number(searchParams.page) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const filters = {
    search: searchParams.search,
    platform: searchParams.platform,
    playstyle: searchParams.playstyle,
    minStrength: searchParams.minStrength ? Number(searchParams.minStrength) : undefined,
    minEpics: searchParams.minEpics ? Number(searchParams.minEpics) : undefined,
    minCoins: searchParams.minCoins ? Number(searchParams.minCoins) : undefined,
    allowsSwap: searchParams.swap === "1",
    manager: searchParams.manager,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    sortBy: searchParams.sortBy,
    limit: PAGE_SIZE,
    offset,
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

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams || {}).forEach(([k, v]) => {
      if (v && k !== "page") params.set(k, v);
    });
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/browse?${qs}` : "/browse";
  };

  const hasActiveFilters = Boolean(
    searchParams.search ||
      (searchParams.platform && searchParams.platform !== "all") ||
      (searchParams.playstyle && searchParams.playstyle !== "all") ||
      searchParams.minStrength ||
      searchParams.minEpics ||
      searchParams.minCoins ||
      searchParams.swap === "1" ||
      searchParams.manager ||
      searchParams.minPrice ||
      searchParams.maxPrice ||
      (searchParams.sortBy && searchParams.sortBy !== "newest")
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      <div className="border-b border-sx-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="text-xs text-sx-muted flex items-center gap-1.5">
            <Link href="/" className="hover:text-sx-ink">
              Home
            </Link>
            <span>/</span>
            <span className="text-sx-ink font-medium">eFootball Squads</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-sx-ink font-display tracking-tight">
              Verified eFootball Squads
            </h1>
            {totalCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-sx-green-tint border border-sx-green-border text-sx-green-text text-xs font-bold">
                {totalCount} Available
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-sx-muted flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-sx-green-text shrink-0" />
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <div className="lg:col-span-3 lg:sticky lg:top-28">
          <ListingFilters />
        </div>

        <div className="lg:col-span-9 space-y-6">
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-sx-border text-xs">
              <span className="text-sx-muted font-medium mr-1">Active:</span>
              {searchParams.search && (
                <span className="px-2.5 py-1 rounded-full bg-sx-subtle border border-sx-border text-sx-ink font-medium">
                  &ldquo;{searchParams.search}&rdquo;
                </span>
              )}
              {searchParams.swap === "1" && (
                <span className="px-2.5 py-1 rounded-full bg-sx-green-tint border border-sx-green-border text-sx-green-text font-semibold">
                  Swap Open
                </span>
              )}
              {searchParams.minStrength && (
                <span className="px-2.5 py-1 rounded-full bg-sx-subtle border border-sx-border text-sx-ink font-semibold">
                  {searchParams.minStrength}+ OVR
                </span>
              )}
              {searchParams.minEpics && (
                <span className="px-2.5 py-1 rounded-full bg-sx-subtle border border-sx-border text-sx-ink font-semibold">
                  {searchParams.minEpics}+ Epics
                </span>
              )}
              {searchParams.platform && searchParams.platform !== "all" && (
                <span className="px-2.5 py-1 rounded-full bg-sx-subtle border border-sx-border text-sx-ink capitalize font-medium">
                  {searchParams.platform.replace(/_/g, " ")}
                </span>
              )}
              {searchParams.playstyle && searchParams.playstyle !== "all" && (
                <span className="px-2.5 py-1 rounded-full bg-sx-subtle border border-sx-border text-sx-ink font-medium">
                  {getPlaystyleLabel(searchParams.playstyle)}
                </span>
              )}
              {searchParams.minCoins && (
                <span className="px-2.5 py-1 rounded-full bg-sx-subtle border border-sx-border text-sx-ink font-medium">
                  {Number(searchParams.minCoins).toLocaleString()}+ Coins
                </span>
              )}
              {searchParams.manager && (
                <span className="px-2.5 py-1 rounded-full bg-sx-subtle border border-sx-border text-sx-ink font-medium">
                  {searchParams.manager}
                </span>
              )}
              {(searchParams.minPrice || searchParams.maxPrice) && (
                <span className="px-2.5 py-1 rounded-full bg-sx-subtle border border-sx-border text-sx-ink font-mono font-medium">
                  KES {searchParams.minPrice || "0"} – {searchParams.maxPrice || "Any"}
                </span>
              )}
              <Link
                href="/browse"
                className="inline-flex items-center gap-1 text-xs text-sx-green-text hover:underline font-semibold ml-auto"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </Link>
            </div>
          )}

          <ListingGrid listings={listings} filters={filters} />

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <nav
              aria-label="Squad catalog pagination"
              className="pt-4 border-t border-sx-border flex items-center justify-between gap-3"
            >
              <Link
                href={buildPageHref(Math.max(1, currentPage - 1))}
                aria-disabled={currentPage <= 1}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-bold transition-colors ${
                  currentPage <= 1
                    ? "pointer-events-none opacity-45 bg-sx-subtle border-sx-border text-sx-muted"
                    : "bg-sx-subtle hover:bg-sx-stone border-sx-border text-sx-ink"
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </Link>

              <span className="text-xs text-sx-muted font-mono">
                Page <strong className="text-sx-ink">{currentPage}</strong> of{" "}
                <strong className="text-sx-ink">{totalPages}</strong>
              </span>

              <Link
                href={buildPageHref(Math.min(totalPages, currentPage + 1))}
                aria-disabled={currentPage >= totalPages}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-bold transition-colors ${
                  currentPage >= totalPages
                    ? "pointer-events-none opacity-45 bg-sx-subtle border-sx-border text-sx-muted"
                    : "bg-sx-subtle hover:bg-sx-stone border-sx-border text-sx-ink"
                }`}
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </nav>
          )}

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
