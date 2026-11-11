"use client";

import { Button } from "@/components/ui/Button";
import {
  ArrowUpDown,
  Repeat2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function ListingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [platform, setPlatform] = useState(searchParams.get("platform") || "all");
  const [playstyle, setPlaystyle] = useState(searchParams.get("playstyle") || "all");
  const [minStrength, setMinStrength] = useState(searchParams.get("minStrength") || "");
  const [minEpics, setMinEpics] = useState(searchParams.get("minEpics") || "");
  const [minCoins, setMinCoins] = useState(searchParams.get("minCoins") || "");
  const [allowsSwap, setAllowsSwap] = useState(searchParams.get("swap") === "1");
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
    setPlaystyle(searchParams.get("playstyle") || "all");
    setMinStrength(searchParams.get("minStrength") || "");
    setMinEpics(searchParams.get("minEpics") || "");
    setMinCoins(searchParams.get("minCoins") || "");
    setAllowsSwap(searchParams.get("swap") === "1");
    setManager(searchParams.get("manager") || "");
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
    setSortBy(searchParams.get("sortBy") || "newest");
  }, [searchParams]);

  const activeFiltersCount = [
    search.trim() ? 1 : 0,
    platform && platform !== "all" ? 1 : 0,
    playstyle && playstyle !== "all" ? 1 : 0,
    minStrength ? 1 : 0,
    minEpics ? 1 : 0,
    minCoins ? 1 : 0,
    allowsSwap ? 1 : 0,
    manager.trim() ? 1 : 0,
    minPrice ? 1 : 0,
    maxPrice ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const applyFilters = (customOverrides: Record<string, string> = {}) => {
    const params = new URLSearchParams();

    const finalSearch =
      customOverrides.search !== undefined ? customOverrides.search : search;
    const finalPlatform =
      customOverrides.platform !== undefined ? customOverrides.platform : platform;
    const finalPlaystyle =
      customOverrides.playstyle !== undefined ? customOverrides.playstyle : playstyle;
    const finalMinStrength =
      customOverrides.minStrength !== undefined
        ? customOverrides.minStrength
        : minStrength;
    const finalMinEpics =
      customOverrides.minEpics !== undefined ? customOverrides.minEpics : minEpics;
    const finalMinCoins =
      customOverrides.minCoins !== undefined ? customOverrides.minCoins : minCoins;
    const finalSwap =
      customOverrides.swap !== undefined
        ? customOverrides.swap
        : allowsSwap
        ? "1"
        : "";
    const finalManager =
      customOverrides.manager !== undefined ? customOverrides.manager : manager;
    const finalMinPrice =
      customOverrides.minPrice !== undefined ? customOverrides.minPrice : minPrice;
    const finalMaxPrice =
      customOverrides.maxPrice !== undefined ? customOverrides.maxPrice : maxPrice;
    const finalSortBy =
      customOverrides.sortBy !== undefined ? customOverrides.sortBy : sortBy;

    if (finalSearch.trim()) params.set("search", finalSearch.trim());
    if (finalPlatform && finalPlatform !== "all")
      params.set("platform", finalPlatform);
    if (finalPlaystyle && finalPlaystyle !== "all")
      params.set("playstyle", finalPlaystyle);
    if (finalMinStrength) params.set("minStrength", finalMinStrength);
    if (finalMinEpics) params.set("minEpics", finalMinEpics);
    if (finalMinCoins) params.set("minCoins", finalMinCoins);
    if (finalSwap === "1") params.set("swap", "1");
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
    setPlaystyle("all");
    setMinStrength("");
    setMinEpics("");
    setMinCoins("");
    setAllowsSwap(false);
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
  const epicPresets = ["1", "3", "6", "10"];
  const notablePlayers = ["Gullit", "Vieira", "Rummenigge", "Maldini", "Messi", "Salah"];
  const priceCapPresets = [
    { label: "Under 3K", val: "3000" },
    { label: "Under 5K", val: "5000" },
    { label: "Under 10K", val: "10000" },
  ];

  const filterFormFields = (
    <div className="space-y-5 text-xs">
      {/* 1. Notable Players & Search */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-sx-ink mb-2">
          Notable Players or Coach
        </label>
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 text-sx-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="e.g. Gullit, Vieira, Xabi Alonso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="w-full min-h-[40px] pl-8 pr-3 py-2 bg-sx-canvas border border-sx-border focus:border-sx-green rounded-lg text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {notablePlayers.map((player) => (
            <button
              key={player}
              type="button"
              onClick={() => setSearch(search === player ? "" : player)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                search.toLowerCase() === player.toLowerCase()
                  ? "bg-sx-green border-sx-green text-white font-semibold"
                  : "bg-sx-canvas border-sx-border text-sx-ink hover:border-sx-border-strong"
              }`}
            >
              {player}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Platform */}
      <div className="pt-3 border-t border-sx-border">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-sx-ink mb-2">
          Platform
        </label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full min-h-[40px] bg-sx-canvas border border-sx-border rounded-lg px-3 py-2 text-xs font-medium text-sx-ink focus:outline-none focus:border-sx-green"
        >
          <option value="all">All Platforms</option>
          <option value="android">Android Mobile</option>
          <option value="ios">iOS (iPhone / iPad)</option>
          <option value="playstation_5">PlayStation 5</option>
          <option value="playstation_4">PlayStation 4</option>
          <option value="pc_steam">PC / Steam</option>
          <option value="xbox_series_x">Xbox Series X/S</option>
        </select>
      </div>

      {/* 3. Price (KES) */}
      <div className="pt-3 border-t border-sx-border space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-sx-ink">
          Price in KES
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Min KES"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full min-h-[40px] bg-sx-canvas border border-sx-border rounded-lg px-2.5 py-2 text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-green font-mono"
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder="Max KES"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full min-h-[40px] bg-sx-canvas border border-sx-border rounded-lg px-2.5 py-2 text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-green font-mono"
          />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {priceCapPresets.map((p) => (
            <button
              key={p.val}
              type="button"
              onClick={() => setMaxPrice(maxPrice === p.val ? "" : p.val)}
              className={`py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                maxPrice === p.val
                  ? "bg-sx-green text-white border-sx-green"
                  : "bg-sx-canvas border-sx-border text-sx-ink hover:border-sx-border-strong"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Team Strength (OVR) */}
      <div className="pt-3 border-t border-sx-border">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-sx-ink mb-2">
          Minimum OVR (Team Strength)
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {ovrPresets.map((ovr) => (
            <button
              key={ovr}
              type="button"
              onClick={() => setMinStrength(minStrength === ovr ? "" : ovr)}
              className={`min-h-[38px] py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                minStrength === ovr
                  ? "bg-sx-green text-white border-sx-green"
                  : "bg-sx-canvas border-sx-border text-sx-ink hover:border-sx-border-strong"
              }`}
            >
              {ovr}+ OVR
            </button>
          ))}
        </div>
      </div>

      {/* 5. eFootball Coins */}
      <div className="pt-3 border-t border-sx-border">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-sx-ink mb-2">
          Minimum eFootball Coins
        </label>
        <select
          value={minCoins}
          onChange={(e) => setMinCoins(e.target.value)}
          className="w-full min-h-[40px] bg-sx-canvas border border-sx-border rounded-lg px-3 py-2 text-xs font-medium text-sx-ink focus:outline-none focus:border-sx-green"
        >
          <option value="">Any Coin Balance</option>
          <option value="300">300+ Coins</option>
          <option value="1000">1,000+ Coins</option>
          <option value="2500">2,500+ Coins</option>
          <option value="5000">5,000+ Coins</option>
        </select>
      </div>

      {/* 6. Epic Count & Playstyle */}
      <div className="pt-3 border-t border-sx-border space-y-3">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-sx-ink mb-2">
            Epic / Big Time Cards
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {epicPresets.map((ep) => (
              <button
                key={ep}
                type="button"
                onClick={() => setMinEpics(minEpics === ep ? "" : ep)}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  minEpics === ep
                    ? "bg-sx-green text-white border-sx-green"
                    : "bg-sx-canvas border-sx-border text-sx-ink hover:border-sx-border-strong"
                }`}
              >
                {ep}+
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-sx-ink mb-1.5">
            Playstyle
          </label>
          <select
            value={playstyle}
            onChange={(e) => setPlaystyle(e.target.value)}
            className="w-full min-h-[40px] bg-sx-canvas border border-sx-border rounded-lg px-3 py-2 text-xs font-medium text-sx-ink focus:outline-none focus:border-sx-green"
          >
            <option value="all">All Playstyles</option>
            <option value="quick_counter">Quick Counter</option>
            <option value="long_ball_counter">Long Ball Counter (LBC)</option>
            <option value="possession">Possession Game</option>
            <option value="out_wide">Out Wide</option>
            <option value="long_ball">Long Ball</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-sx-ink mb-1.5">
            Manager
          </label>
          <input
            type="text"
            placeholder="e.g. Xabi Alonso, Deschamps..."
            value={manager}
            onChange={(e) => setManager(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="w-full min-h-[40px] bg-sx-canvas border border-sx-border rounded-lg px-3 py-2 text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-green"
          />
        </div>

        <label className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-sx-canvas border border-sx-border cursor-pointer hover:border-sx-green-border transition-colors">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sx-ink">
            <Repeat2 className="w-3.5 h-3.5 text-sx-green-text" />
            <span>Open to Squad Swap</span>
          </span>
          <input
            type="checkbox"
            checked={allowsSwap}
            onChange={(e) => setAllowsSwap(e.target.checked)}
            className="w-4 h-4 accent-emerald-500 cursor-pointer"
          />
        </label>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile One-Handed Sticky Search, Sort & Filter Bar */}
      <div className="lg:hidden space-y-2.5 sticky top-16 z-30 bg-sx-canvas/95 backdrop-blur-md py-2.5 -mx-4 px-4 border-b border-sx-border">
        <div className="flex items-center gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters();
            }}
            className="relative flex-1"
          >
            <Search className="w-4 h-4 text-sx-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              placeholder="Search player, OVR, manager..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-9 pr-8 bg-sx-subtle border border-sx-border rounded-xl text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-green"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  applyFilters({ search: "" });
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-sx-muted hover:text-sx-ink"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className={`h-11 px-3.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer ${
              activeFiltersCount > 0
                ? "bg-sx-green border-sx-green text-white"
                : "bg-sx-subtle border-sx-border text-sx-ink"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}</span>
          </button>
        </div>

        {/* One-Handed Mobile Sort + Quick Filter Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs">
          <div className="relative shrink-0">
            <ArrowUpDown className="w-3 h-3 text-sx-green-text absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              aria-label="Sort squads"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                applyFilters({ sortBy: e.target.value });
              }}
              className="h-8 pl-7 pr-2.5 rounded-full bg-sx-subtle border border-sx-border-strong text-[11px] font-bold text-sx-ink focus:outline-none focus:border-sx-green"
            >
              <option value="newest">Sort: Newest</option>
              <option value="price_asc">Lowest Price</option>
              <option value="strength_desc">Highest OVR</option>
              <option value="price_desc">Highest Price</option>
              <option value="coins_desc">Most Coins</option>
            </select>
          </div>

          {[
            { key: "platform", val: "android", label: "Android" },
            { key: "platform", val: "ios", label: "iOS" },
            { key: "minStrength", val: "3150", label: "3150+ OVR" },
            { key: "maxPrice", val: "5000", label: "Under KES 5K" },
            { key: "minCoins", val: "1000", label: "1K+ Coins" },
          ].map((chip) => {
            const active = searchParams.get(chip.key) === chip.val;
            return (
              <button
                key={`${chip.key}-${chip.val}`}
                type="button"
                onClick={() => toggleQuickFilter(chip.key, chip.val)}
                className={`h-8 px-3 rounded-full text-[11px] font-semibold shrink-0 border transition-colors cursor-pointer ${
                  active
                    ? "bg-sx-green text-white border-sx-green"
                    : "bg-sx-subtle border-sx-border text-sx-ink"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Left Rail */}
      <div className="hidden lg:block rounded-xl bg-sx-subtle border border-sx-border p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-sx-border pb-3">
          <span className="text-sm font-bold text-sx-ink uppercase tracking-wider">
            Compare &amp; Filter
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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-sx-canvas border-t sm:border border-sx-border rounded-t-2xl sm:rounded-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-sx-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-sx-ink">Filter &amp; Compare Squads</h3>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 rounded-md text-sx-muted hover:text-sx-ink"
                aria-label="Close filters"
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
                Show Squads
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
