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

  const ovrPresets = ["3150", "3200", "3250", "3300"];
  const metaCoaches = ["Xabi Alonso", "Pep Guardiola", "Luis Enrique", "Fabio Capello"];

  const filterFormFields = (
    <div className="space-y-4 text-xs">
      {/* Keyword */}
      <div>
        <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
          Player / Keyword
        </label>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Gullit, Vieira, Maldini..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="w-full pl-8 pr-3 py-2 bg-[#131923] border border-[#242E42] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Team Strength */}
      <div>
        <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
          Min Strength (OVR)
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {ovrPresets.map((ovr) => (
            <button
              key={ovr}
              type="button"
              onClick={() => setMinStrength(minStrength === ovr ? "" : ovr)}
              className={`py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-colors ${
                minStrength === ovr
                  ? "bg-emerald-500 text-zinc-950 border-emerald-400"
                  : "bg-[#131923] border-[#242E42] text-slate-300 hover:border-slate-500"
              }`}
            >
              {ovr}+
            </button>
          ))}
        </div>
      </div>

      {/* Platform */}
      <div>
        <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
          Platform
        </label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full bg-[#131923] border border-[#242E42] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Platforms</option>
          <option value="android">Android</option>
          <option value="ios">iOS</option>
          <option value="playstation_5">PlayStation 5</option>
          <option value="playstation_4">PlayStation 4</option>
          <option value="pc_steam">PC / Steam</option>
          <option value="xbox_series_x">Xbox Series X/S</option>
        </select>
      </div>

      {/* Coins */}
      <div>
        <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
          Min eFootball Coins
        </label>
        <select
          value={minCoins}
          onChange={(e) => setMinCoins(e.target.value)}
          className="w-full bg-[#131923] border border-[#242E42] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Any Balance</option>
          <option value="500">500+ Coins</option>
          <option value="1000">1,000+ Coins</option>
          <option value="2500">2,500+ Coins</option>
          <option value="5000">5,000+ Coins</option>
        </select>
      </div>

      {/* Manager */}
      <div>
        <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
          Manager / Booster Coach
        </label>
        <input
          type="text"
          placeholder="e.g. Xabi Alonso, Guardiola..."
          value={manager}
          onChange={(e) => setManager(e.target.value)}
          className="w-full px-3 py-2 bg-[#131923] border border-[#242E42] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 mb-1.5"
        />
        <div className="flex flex-wrap gap-1">
          {metaCoaches.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setManager(manager === c ? "" : c)}
              className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                manager === c
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold"
                  : "bg-[#131923] border-[#242E42] text-slate-400 hover:text-slate-200"
              }`}
            >
              {c.split(" ").pop()}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
          Price Range (KES)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full bg-[#131923] border border-[#242E42] rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full bg-[#131923] border border-[#242E42] rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full bg-[#131923] border border-[#242E42] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="newest">Newest Listed</option>
          <option value="strength_desc">Highest OVR</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="coins_desc">Most Coins</option>
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
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search players, coaches, OVR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              className="w-full h-10 pl-9 pr-8 bg-[#0D1117] border border-[#1E2636] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  applyFilters({ search: "" });
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Button type="button" variant="primary" size="sm" className="h-10 px-3.5" onClick={() => applyFilters()}>
            Search
          </Button>

          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className={`h-10 px-3 rounded-lg border flex items-center gap-1.5 text-xs font-medium shrink-0 ${
              activeFiltersCount > 0
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-[#0D1117] border-[#1E2636] text-slate-300"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{activeFiltersCount > 0 ? activeFiltersCount : "Filter"}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          {[
            { key: "minStrength", val: "3150", label: "3150+ OVR" },
            { key: "minStrength", val: "3200", label: "3200+ OVR" },
            { key: "platform", val: "android", label: "Android" },
            { key: "platform", val: "ios", label: "iOS" },
            { key: "minCoins", val: "1000", label: "1,000+ Coins" },
            { key: "maxPrice", val: "5000", label: "Under KES 5K" },
          ].map((chip) => {
            const active = searchParams.get(chip.key) === chip.val;
            return (
              <button
                key={`${chip.key}-${chip.val}`}
                type="button"
                onClick={() => toggleQuickFilter(chip.key, chip.val)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium shrink-0 border transition-colors ${
                  active
                    ? "bg-emerald-500 text-zinc-950 border-emerald-400 font-bold"
                    : "bg-[#0D1117] border-[#1E2636] text-slate-300"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Filter Sidebar */}
      <div className="hidden lg:block store-panel rounded-2xl p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-[#1E2636] pb-3">
          <div className="flex items-center gap-2 text-white font-display font-bold text-sm">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span>Filters</span>
          </div>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {filterFormFields}

        <Button
          variant="primary"
          size="md"
          className="w-full"
          onClick={() => applyFilters()}
        >
          Apply Filters
        </Button>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0D1117] border-t sm:border border-[#1E2636] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#1E2636] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-display">Filter Squads</h3>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">{filterFormFields}</div>

            <div className="p-4 border-t border-[#1E2636] bg-[#07090D] flex items-center gap-3">
              <Button variant="secondary" size="md" onClick={resetFilters} className="flex-1">
                Reset
              </Button>
              <Button variant="primary" size="md" onClick={() => applyFilters()} className="flex-1">
                Show Squads
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
