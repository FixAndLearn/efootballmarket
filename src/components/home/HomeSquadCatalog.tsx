"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Listing } from "@/types/database";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

type HomeTabId = "all" | "meta" | "android" | "ios" | "budget" | "swap";

interface HomeSquadCatalogProps {
  listings: Listing[];
  totalSquads: number;
}

export function HomeSquadCatalog({ listings, totalSquads }: HomeSquadCatalogProps) {
  const [activeTab, setActiveTab] = useState<HomeTabId>("all");

  const tabs = useMemo(() => {
    const counts = {
      all: listings.length,
      meta: listings.filter((l) => (l.overall_team_strength || 0) >= 3150).length,
      android: listings.filter((l) => l.platform === "android").length,
      ios: listings.filter((l) => l.platform === "ios").length,
      budget: listings.filter((l) => Number(l.price || 0) > 0 && Number(l.price) <= 3500).length,
      swap: listings.filter((l) => Boolean(l.allows_swap)).length,
    };

    const rawTabs: { id: HomeTabId; label: string; count: number; browseHref: string }[] = [
      { id: "all", label: "Latest Squads", count: counts.all, browseHref: "/browse" },
      { id: "meta", label: "3150+ OVR", count: counts.meta, browseHref: "/browse?minStrength=3150" },
      { id: "android", label: "Android", count: counts.android, browseHref: "/browse?platform=android" },
      { id: "ios", label: "iOS", count: counts.ios, browseHref: "/browse?platform=ios" },
      { id: "budget", label: "Under KES 3.5K", count: counts.budget, browseHref: "/browse?maxPrice=3500" },
      { id: "swap", label: "Swap Open", count: counts.swap, browseHref: "/browse?swap=1" },
    ];

    return rawTabs.filter((t) => t.id === "all" || t.count > 0);
  }, [listings]);

  const filtered = useMemo(() => {
    const subset = listings.filter((l) => {
      if (activeTab === "meta") return (l.overall_team_strength || 0) >= 3150;
      if (activeTab === "android") return l.platform === "android";
      if (activeTab === "ios") return l.platform === "ios";
      if (activeTab === "budget") return Number(l.price || 0) > 0 && Number(l.price) <= 3500;
      if (activeTab === "swap") return Boolean(l.allows_swap);
      return true;
    });
    return subset.slice(0, 8);
  }, [listings, activeTab]);

  const activeTabMeta = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <div className="space-y-5 min-w-0 max-w-full">
      {tabs.length > 1 && (
        <div
          role="tablist"
          aria-label="Filter available squads"
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5"
        >
          {tabs.map((tab) => {
            const isSelected = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[34px] px-3.5 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-sx-green border-sx-green text-white"
                    : "bg-sx-subtle border-sx-border text-sx-ink hover:border-sx-border-strong"
                }`}
              >
                <span>{tab.label}</span>
                {tab.id !== "all" && (
                  <span
                    className={`ml-1.5 font-mono text-[11px] ${
                      isSelected ? "text-white/90" : "text-sx-muted"
                    }`}
                  >
                    ({tab.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filtered.map((listing, idx) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            priority={activeTab === "all" && idx < 2}
          />
        ))}
      </div>

      {(totalSquads > filtered.length || activeTab !== "all") && (
        <div className="pt-2 flex justify-center">
          <Link href={activeTabMeta?.browseHref || "/browse"}>
            <Button variant="outline" size="md">
              <span>
                {activeTab === "all"
                  ? `View All ${totalSquads} Squad Listings`
                  : `Browse All ${activeTabMeta.label} Squads`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Dead-end recovery. With a catalog this small, the buyer who filters to
          zero results is the most likely one to leave. Give them the two paths
          that actually work: post what they want, or get alerted on a match. */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border border-sx-border bg-sx-subtle p-5 sm:p-6 text-center space-y-3">
          <p className="text-sm font-bold text-sx-ink font-display">
            No squads match that filter right now
          </p>
          <p className="text-xs text-sx-muted max-w-md mx-auto leading-relaxed">
            The catalog is small and turns over fast. Post what you are looking
            for and sellers will come to you, or set an alert and we will tell
            you the moment a match is listed.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 pt-1">
            <Link href="/wanted">
              <Button variant="primary" size="sm" className="w-full sm:w-auto">
                <span>Post what you want</span>
              </Button>
            </Link>
            <Link href="/browse">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <span>Clear filters &amp; browse all</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
