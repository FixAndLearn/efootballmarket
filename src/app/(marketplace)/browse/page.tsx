import { ListingFilters } from "@/components/marketplace/ListingFilters";
import { ListingGrid } from "@/components/marketplace/ListingGrid";
import { TrustBadgeGuide } from "@/components/marketplace/TrustBadgeGuide";
import { AdBanner } from "@/components/common/AdBanner";
import { Button } from "@/components/ui/Button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ListingService } from "@/services/listingService";
import { Listing, Platform, Playstyle } from "@/types/database";
import { getPlaystyleLabel } from "@/lib/utils";
import { ArrowLeft, ArrowRight, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Browse Verified eFootball Squads in Kenya",
  description:
    "Compare Android, iOS, PlayStation, and PC eFootball squads in Kenya by price in KES, OVR, eFootball Coins, and notable Epic players. Protected by 24-hour M-Pesa Till 1572931 escrow.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/browse",
  },
};

const PAGE_SIZE = 24;

const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "price_asc", label: "Lowest Price" },
  { id: "strength_desc", label: "Highest OVR" },
  { id: "coins_desc", label: "Most Coins" },
  { id: "price_desc", label: "Highest Price" },
] as const;

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
  const activeSort = searchParams.sortBy || "newest";

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
    sortBy: activeSort,
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

  const buildQueryHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    Object.entries(searchParams || {}).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    Object.entries(overrides).forEach(([k, v]) => {
      if (!v || (k === "sortBy" && v === "newest") || (k === "page" && v === "1")) {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    });
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
      searchParams.maxPrice
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-10 w-full space-y-6">
      {/* Header */}
      <div className="border-b border-sx-border pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-sx-ink font-display tracking-tight">
              Browse Squads
            </h1>
            {totalCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-sx-green-tint border border-sx-green-border text-sx-green-text text-xs font-bold">
                {totalCount} {totalCount === 1 ? "Squad" : "Squads"}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-sx-muted flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sx-green-text shrink-0" />
            <span>
              Pay into M-Pesa Till <strong>1572931</strong> · Inspect the squad &amp; Link Data in-game for <strong>24 hours</strong> before the seller is paid.
            </span>
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          <Link href="/wanted">
            <Button variant="outline" size="sm">
              Request a Squad
            </Button>
          </Link>
          <Link href="/seller/create-listing">
            <Button variant="primary" size="sm">
              Sell Your Squad
            </Button>
          </Link>
        </div>
      </div>

      {/* Plain-Language Trust Badge Guide */}
      <TrustBadgeGuide />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <div className="lg:col-span-3 min-w-0 lg:sticky lg:top-[120px]">
          <ListingFilters />
        </div>

        <div className="lg:col-span-9 min-w-0 space-y-5">
          {/* Mobile & Desktop Quick Sort Bar */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-sx-border text-xs overflow-x-auto no-scrollbar">
            <span className="text-sx-muted font-medium shrink-0">
              Sort by:
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {SORT_OPTIONS.map((opt) => {
                const isSelected = activeSort === opt.id;
                return (
                  <Link
                    key={opt.id}
                    href={buildQueryHref({ sortBy: opt.id, page: "1" })}
                    className={`px-3 py-1.5 rounded-full border font-semibold whitespace-nowrap transition-colors ${
                      isSelected
                        ? "bg-sx-green border-sx-green text-white"
                        : "bg-sx-subtle border-sx-border text-sx-ink hover:border-sx-border-strong"
                    }`}
                  >
                    {opt.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-sx-border text-xs">
              <span className="text-sx-muted font-medium mr-1">Active Filters:</span>
              {searchParams.search && (
                <Link
                  href={buildQueryHref({ search: undefined, page: "1" })}
                  title="Remove search filter"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sx-subtle hover:bg-sx-stone border border-sx-border text-sx-ink font-medium transition-colors"
                >
                  <span>&ldquo;{searchParams.search}&rdquo;</span>
                  <X className="w-3 h-3 text-sx-muted" />
                </Link>
              )}
              {searchParams.swap === "1" && (
                <Link
                  href={buildQueryHref({ swap: undefined, page: "1" })}
                  title="Remove swap filter"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sx-green-tint border border-sx-green-border text-sx-green-text font-semibold transition-colors"
                >
                  <span>Swap Open</span>
                  <X className="w-3 h-3" />
                </Link>
              )}
              {searchParams.minStrength && (
                <Link
                  href={buildQueryHref({ minStrength: undefined, page: "1" })}
                  title="Remove minimum OVR filter"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sx-subtle hover:bg-sx-stone border border-sx-border text-sx-ink font-semibold transition-colors"
                >
                  <span>{searchParams.minStrength}+ OVR</span>
                  <X className="w-3 h-3 text-sx-muted" />
                </Link>
              )}
              {searchParams.minEpics && (
                <Link
                  href={buildQueryHref({ minEpics: undefined, page: "1" })}
                  title="Remove minimum Epics filter"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sx-subtle hover:bg-sx-stone border border-sx-border text-sx-ink font-semibold transition-colors"
                >
                  <span>{searchParams.minEpics}+ Epics</span>
                  <X className="w-3 h-3 text-sx-muted" />
                </Link>
              )}
              {searchParams.platform && searchParams.platform !== "all" && (
                <Link
                  href={buildQueryHref({ platform: undefined, page: "1" })}
                  title="Remove platform filter"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sx-subtle hover:bg-sx-stone border border-sx-border text-sx-ink capitalize font-medium transition-colors"
                >
                  <span>{searchParams.platform.replace(/_/g, " ")}</span>
                  <X className="w-3 h-3 text-sx-muted" />
                </Link>
              )}
              {searchParams.playstyle && searchParams.playstyle !== "all" && (
                <Link
                  href={buildQueryHref({ playstyle: undefined, page: "1" })}
                  title="Remove playstyle filter"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sx-subtle hover:bg-sx-stone border border-sx-border text-sx-ink font-medium transition-colors"
                >
                  <span>{getPlaystyleLabel(searchParams.playstyle)}</span>
                  <X className="w-3 h-3 text-sx-muted" />
                </Link>
              )}
              {searchParams.minCoins && (
                <Link
                  href={buildQueryHref({ minCoins: undefined, page: "1" })}
                  title="Remove minimum coins filter"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sx-subtle hover:bg-sx-stone border border-sx-border text-sx-ink font-medium transition-colors"
                >
                  <span>{Number(searchParams.minCoins).toLocaleString()}+ Coins</span>
                  <X className="w-3 h-3 text-sx-muted" />
                </Link>
              )}
              {searchParams.manager && (
                <Link
                  href={buildQueryHref({ manager: undefined, page: "1" })}
                  title="Remove manager filter"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sx-subtle hover:bg-sx-stone border border-sx-border text-sx-ink font-medium transition-colors"
                >
                  <span>{searchParams.manager}</span>
                  <X className="w-3 h-3 text-sx-muted" />
                </Link>
              )}
              {(searchParams.minPrice || searchParams.maxPrice) && (
                <Link
                  href={buildQueryHref({ minPrice: undefined, maxPrice: undefined, page: "1" })}
                  title="Remove price filter"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sx-subtle hover:bg-sx-stone border border-sx-border text-sx-ink font-mono font-medium transition-colors"
                >
                  <span>KES {searchParams.minPrice || "0"} – {searchParams.maxPrice || "Any"}</span>
                  <X className="w-3 h-3 text-sx-muted" />
                </Link>
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
                href={buildQueryHref({ page: String(Math.max(1, currentPage - 1)) })}
                aria-disabled={currentPage <= 1}
                className={`inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 rounded-lg border text-xs font-bold transition-colors ${
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
                href={buildQueryHref({ page: String(Math.min(totalPages, currentPage + 1)) })}
                aria-disabled={currentPage >= totalPages}
                className={`inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 rounded-lg border text-xs font-bold transition-colors ${
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
