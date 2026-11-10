"use client";

import { Button } from "@/components/ui/Button";
import {
  RotateCcw,
  Search,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function ListingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [platform, setPlatform] = useState(searchParams.get("platform") || "all");
  const [minStrength, setMinStrength] = useState(searchParams.get("minStrength") || "");
  const [minCoins, setMinCoins] = useState(searchParams.get("minCoins") || "");
  const [manager, setManager] = useState(searchParams.get("manager") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMobileDrawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileDrawerOpen]);

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setPlatform(searchParams.get("platform") || "all");
    setMinStrength(searchParams.get("minStrength") || "");
    setMinCoins(searchParams.get("minCoins") || "");
    setManager(searchParams.get("manager") || "");
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
    setSortBy(searchParams.get("sortBy") || "newest");
  }, [searchParams]);

  const activeFiltersCount = [
    search.trim() ? 1 : 0,
    platform && platform !== "all" ? 1 : 0,
    minStrength ? 1 : 0,
    minCoins ? 1 : 0,
    manager.trim() ? 1 : 0,
    minPrice ? 1 : 0,
    maxPrice ? 1 : 0,
    sortBy && sortBy !== "newest" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const applyFilters = (customOverrides: Record<string, string> = {}) => {
    const params = new URLSearchParams();

    const finalSearch = customOverrides.search !== undefined ? customOverrides.search : search;
    const finalPlatform = customOverrides.platform !== undefined ? customOverrides.platform : platform;
    const finalMinStrength = customOverrides.minStrength !== undefined ? customOverrides.minStrength : minStrength;
    const finalMinCoins = customOverrides.minCoins !== undefined ? customOverrides.minCoins : minCoins;
    const finalManager = customOverrides.manager !== undefined ? customOverrides.manager : manager;
    const finalMinPrice = customOverrides.minPrice !== undefined ? customOverrides.minPrice : minPrice;
    const finalMaxPrice = customOverrides.maxPrice !== undefined ? customOverrides.maxPrice : maxPrice;
    const finalSortBy = customOverrides.sortBy !== undefined ? customOverrides.sortBy : sortBy;

    if (finalSearch.trim()) params.set("search", finalSearch.trim());
    if (finalPlatform && finalPlatform !== "all") params.set("platform", finalPlatform);
    if (finalMinStrength) params.set("minStrength", finalMinStrength);
    if (finalMinCoins) params.set("minCoins", finalMinCoins);
    if (finalManager.trim()) params.set("manager", finalManager.trim());
    if (finalMinPrice) params.set("minPrice", finalMinPrice);
    if (finalMaxPrice) params.set("maxPrice", finalMaxPrice);
    if (finalSortBy && finalSortBy !== "newest") params.set("sortBy", finalSortBy);

    setIsMobileDrawerOpen(false);
    router.push(`/browse?${params.toString()}`);
  };

  const resetFilters = () => {
    setSearch("");
    setPlatform("all");
    setMinStrength("");
    setMinCoins("");
    setManager("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setIsMobileDrawerOpen(false);
    router.push("/browse");
  };

  const toggleQuickFilter = (key: string, value: string) => {
    const currentVal = searchParams.get(key);
    applyFilters({ [key]: currentVal === value ? "" : value });
  };

  const ovrPresets = ["3100", "3150", "3200", "3250"];
  const metaCoaches = ["Xabi Alonso", "Pep Guardiola", "Luis Enrique", "Fabio Capello"];

  const filterFormFields = (
    <div className="space-y-5 text-xs">
      {/* Keyword */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-sx-ink mb-2">
          Keyword / Player
        </label>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-sx-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Gullit, Vieira, Maldini..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="w-full pl-8 pr-3 py-2 bg-sx-stone border border-transparent focus:bg-sx-canvas focus:border-sx-ink rounded-md text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none"
          />
        </div>
      </div>

      {/* Team Strength */}
      <div className="pt-3 border-t border-sx-border">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-sx-ink mb-2">
          Collective Strength
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {ovrPresets.map((ovr) => (
            <button
              key={ovr}
              type="button"
              onClick={() => setMinStrength(minStrength === ovr ? "" : ovr)}
              className={`py-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                minStrength === ovr
                  ? "bg-sx-contrast text-sx-contrast-fg border-sx-contrast"
                  : "bg-sx-canvas border-sx-border-strong text-sx-ink hover:border-sx-ink"
              }`}
            >
              {ovr}+ OVR
            </button>
          ))}
        </div>
      </div>

      {/* Platform */}
      <div className="pt-3 border-t border-sx-border">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-sx-ink mb-2">
          Platform
        </label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full bg-sx-canvas border border-sx-border-strong rounded-md px-3 py-2 text-xs font-medium text-sx-ink focus:outline-none focus:border-sx-ink"
        >
          <option value="all">All Platforms</option>
          <option value="android">Android Mobile</option>
          <option value="ios">iOS Mobile</option>
          <option value="playstation_5">PlayStation 5</option>
          <option value="playstation_4">PlayStation 4</option>
          <option value="pc_steam">PC / Steam</option>
          <option value="xbox_series_x">Xbox Series X/S</option>
        </select>
      </div>

      {/* Coins */}
      <div className="pt-3 border-t border-sx-border">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-sx-ink mb-2">
          eFootball Coins
        </label>
        <select
          value={minCoins}
          onChange={(e) => setMinCoins(e.target.value)}
          className="w-full bg-sx-canvas border border-sx-border-strong rounded-md px-3 py-2 text-xs font-medium text-sx-ink focus:outline-none focus:border-sx-ink"
        >
          <option value="">Any Balance</option>
          <option value="500">500+ Coins</option>
          <option value="1000">1,000+ Coins</option>
          <option value="2500">2,500+ Coins</option>
          <option value="5000">5,000+ Coins</option>
        </select>
      </div>

      {/* Manager */}
      <div className="pt-3 border-t border-sx-border">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-sx-ink mb-2">
          Booster Manager
        </label>
        <input
          type="text"
          placeholder="e.g. Xabi Alonso, Guardiola..."
          value={manager}
          onChange={(e) => setManager(e.target.value)}
          className="w-full px-3 py-2 bg-sx-canvas border border-sx-border-strong rounded-md text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-ink mb-2"
        />
        <div className="flex flex-wrap gap-1.5">
          {metaCoaches.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setManager(manager === c ? "" : c)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                manager === c
                  ? "bg-sx-contrast border-sx-contrast text-sx-contrast-fg font-semibold"
                  : "bg-sx-stone border-transparent text-sx-ink hover:border-sx-border-strong"
              }`}
            >
              {c.split(" ").pop()}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="pt-3 border-t border-sx-border">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-sx-ink mb-2">
          Ask Price (KES)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full bg-sx-canvas border border-sx-border-strong rounded-md px-2.5 py-2 text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-ink font-mono"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full bg-sx-canvas border border-sx-border-strong rounded-md px-2.5 py-2 text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-ink font-mono"
          />
        </div>
      </div>

      {/* Sort */}
      <div className="pt-3 border-t border-sx-border">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-sx-ink mb-2">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full bg-sx-canvas border border-sx-border-strong rounded-md px-3 py-2 text-xs font-medium text-sx-ink focus:outline-none focus:border-sx-ink"
        >
          <option value="newest">Recently Listed</option>
          <option value="price_asc">Lowest Ask</option>
          <option value="price_desc">Highest Ask</option>
          <option value="strength_desc">Highest Strength (OVR)</option>
          <option value="coins_desc">Most eFootball Coins</option>
        </select>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Compact Search + Quick Pills */}
      <div className="lg:hidden space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-sx-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search players, coaches, OVR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              className="w-full h-10 pl-9 pr-8 bg-sx-stone border border-sx-border rounded-md text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-ink"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  applyFilters({ search: "" });
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sx-muted hover:text-sx-ink"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className={`h-10 px-3.5 rounded-full border flex items-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer ${
              activeFiltersCount > 0
                ? "bg-sx-contrast border-sx-contrast text-sx-contrast-fg"
                : "bg-sx-canvas border-sx-border-strong text-sx-ink"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          {[
            { key: "minStrength", val: "3150", label: "3150+ OVR" },
            { key: "platform", val: "android", label: "Android" },
            { key: "platform", val: "ios", label: "iOS" },
            { key: "platform", val: "playstation_5", label: "PS5" },
            { key: "maxPrice", val: "5000", label: "Under KES 5K" },
          ].map((chip) => {
            const active = searchParams.get(chip.key) === chip.val;
            return (
              <button
                key={`${chip.key}-${chip.val}`}
                type="button"
                onClick={() => toggleQuickFilter(chip.key, chip.val)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-colors cursor-pointer ${
                  active
                    ? "bg-sx-contrast text-sx-contrast-fg border-sx-contrast"
                    : "bg-sx-stone border-transparent text-sx-ink"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop StockX Left Rail */}
      <div className="hidden lg:block pr-2 space-y-5">
        <div className="flex items-center justify-between border-b border-sx-border pb-3">
          <span className="text-sm font-bold text-sx-ink uppercase tracking-wider">
            Filter
          </span>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-sx-green-text hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear ({activeFiltersCount})</span>
            </button>
          )}
        </div>

        {filterFormFields}

        <Button
          variant="secondary"
          size="md"
          className="w-full"
          onClick={() => applyFilters()}
        >
          Apply Filters
        </Button>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-sx-canvas border-t sm:border border-sx-border rounded-t-2xl sm:rounded-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-sx-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-sx-ink">Filter Squads</h3>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-md text-sx-muted hover:text-sx-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">{filterFormFields}</div>

            <div className="p-4 border-t border-sx-border bg-sx-subtle flex items-center gap-3">
              <Button variant="outline" size="md" onClick={resetFilters} className="flex-1">
                Reset
              </Button>
              <Button variant="primary" size="md" onClick={() => applyFilters()} className="flex-1">
                View Results
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
