"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Listing } from "@/types/database";
import { Button } from "@/components/ui/Button";
import {
  formatCurrency,
  formatSmartListingTitle,
  getShortPlatformLabel,
} from "@/lib/utils";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Handshake,
  Loader2,
  Repeat2,
  Search,
  ShieldAlert,
  Target,
  Trophy,
  X,
} from "lucide-react";

const RECENT_SEARCHES_KEY = "efm_recent_searches_v1";

const POPULAR_QUERIES = [
  { label: "3200+ OVR", href: "/browse?minStrength=3200", query: "3200+" },
  { label: "Under KES 3,000", href: "/browse?maxPrice=3000", query: "" },
  { label: "Gullit", href: "/browse?search=Gullit", query: "Gullit" },
  { label: "Vieira", href: "/browse?search=Vieira", query: "Vieira" },
  { label: "Messi", href: "/browse?search=Messi", query: "Messi" },
  { label: "Swap Open", href: "/browse?swap=1", query: "" },
];

interface ServiceIntentMatch {
  title: string;
  subtitle: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

function getIntentMatches(rawQuery: string): ServiceIntentMatch[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [];

  const matches: ServiceIntentMatch[] = [];
  const digits = q.replace(/\s+/g, "");

  if (/^(\+?254|0)[17]\d{2,}/.test(digits) || q.includes("scam") || q.includes("fraud") || q.includes("report")) {
    const phoneParam = /^(\+?254|0)[17]\d{4,}/.test(digits)
      ? `?q=${encodeURIComponent(rawQuery.trim())}`
      : "";
    matches.push({
      title: phoneParam
        ? `Check "${rawQuery.trim()}" on Scammer Lookup`
        : "Run Trader Phone & Handle Check",
      subtitle: "Search verified Kenyan 07... / 01... fraud reports before paying",
      href: `/scammer-check${phoneParam}`,
      icon: ShieldAlert,
    });
  }

  if (q.includes("middleman") || q.includes("whatsapp") || q.includes("escrow") || q.includes("till") || q.includes("1572931")) {
    matches.push({
      title: "Open WhatsApp / Facebook Middleman Contract",
      subtitle: "Lock an off-platform squad deal safely on M-Pesa Till 1572931",
      href: "/middleman",
      icon: Handshake,
    });
  }

  if (q.includes("swap") || q.includes("trade") || q.includes("exchange") || q.includes("top up") || q.includes("top-up")) {
    matches.push({
      title: "Browse Squads Open to Account Swap",
      subtitle: "Clean Konami ID trade-in + M-Pesa top-up listings",
      href: "/browse?swap=1",
      icon: Repeat2,
    });
  }

  if (q.includes("tourna") || q.includes("cup") || q.includes("1v1") || q.includes("bracket") || q.includes("match")) {
    matches.push({
      title: "1v1 Matches & Paid Cup Brackets",
      subtitle: "Join open eFootball cups or host a 4–16 player clan tournament",
      href: "/tournaments",
      icon: Trophy,
    });
  }

  if (q.includes("want") || q.includes("request") || q.includes("budget") || q.includes("source")) {
    matches.push({
      title: "Buyer Squad Wanted Board",
      subtitle: "Post your target OVR, Epic cards & KES budget for sellers to match",
      href: "/wanted",
      icon: Target,
    });
  }

  if (q.includes("konami") || q.includes("clean") || q.includes("link data") || q.includes("guide") || q.includes("build")) {
    matches.push({
      title: "Clean Konami ID & Meta Guides",
      subtitle: "Step-by-step handover checklist, manager builds & Division 1 tactics",
      href: "/news",
      icon: BookOpen,
    });
  }

  return matches.slice(0, 2);
}

export interface SmartSearchBarProps {
  variant?: "hero" | "header" | "mobile";
  initialValue?: string;
  onNavigate?: () => void;
}

export function SmartSearchBar({
  variant = "header",
  initialValue = "",
  onNavigate,
}: SmartSearchBarProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Listing[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.filter((s) => typeof s === "string").slice(0, 4));
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const clean = term.trim();
    if (!clean || clean.length < 2) return;
    try {
      const next = [
        clean,
        ...recentSearches.filter((item) => item.toLowerCase() !== clean.toLowerCase()),
      ].slice(0, 4);
      setRecentSearches(next);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  // Debounced live squad preview
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/listings?limit=5&search=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(Array.isArray(data.listings) ? data.listings.slice(0, 5) : []);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const intentMatches = useMemo(() => getIntentMatches(query), [query]);

  const navigableItems = useMemo(() => {
    const items: { href: string; label: string }[] = [];
    intentMatches.forEach((m) => items.push({ href: m.href, label: m.title }));
    results.forEach((l) =>
      items.push({ href: `/listings/${l.id}`, label: formatSmartListingTitle(l) })
    );
    if (query.trim().length >= 2) {
      items.push({
        href: `/browse?search=${encodeURIComponent(query.trim())}`,
        label: `View all squads matching "${query.trim()}"`,
      });
    }
    return items;
  }, [intentMatches, results, query]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, results.length]);

  const goTo = (href: string, termToSave?: string) => {
    if (termToSave) saveRecentSearch(termToSave);
    setOpen(false);
    onNavigate?.();
    router.push(href);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && navigableItems[activeIndex]) {
      goTo(navigableItems[activeIndex].href, query);
      return;
    }
    const q = query.trim();
    if (q) {
      goTo(`/browse?search=${encodeURIComponent(q)}`, q);
    } else {
      goTo("/browse");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (navigableItems.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % navigableItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev <= 0 ? navigableItems.length - 1 : prev - 1
      );
    }
  };

  const trimmed = query.trim();

  return (
    <div ref={containerRef} className="relative w-full">
      {variant === "hero" ? (
        <form
          action="/browse"
          method="GET"
          onSubmit={handleSubmit}
          role="search"
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-sx-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="search"
              name="search"
              value={query}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              aria-label="Search squads by player, OVR, or coach"
              placeholder="Search by player (Gullit, Messi), OVR (3200), or coach..."
              className="w-full h-12 pl-10 pr-9 rounded-xl bg-sx-canvas border border-sx-border-strong text-sm text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-green transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-sx-muted hover:text-sx-ink cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Button type="submit" variant="primary" size="lg" className="h-12 shrink-0">
            <span>Search</span>
          </Button>
        </form>
      ) : variant === "mobile" ? (
        <form
          action="/browse"
          method="GET"
          onSubmit={handleSubmit}
          role="search"
          className="relative flex items-center"
        >
          <Search className="w-4 h-4 text-sx-muted absolute left-3.5 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            name="search"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            aria-label="Search marketplace squads"
            placeholder="Search squads, players, OVR..."
            className="w-full h-11 pl-9 pr-20 rounded-md bg-sx-stone text-base text-sx-ink placeholder:text-sx-muted focus:outline-none focus:ring-1 focus:ring-sx-ink"
          />
          <button
            type="submit"
            className="absolute right-1.5 px-3 py-1.5 rounded bg-sx-contrast text-sx-contrast-fg text-xs font-semibold cursor-pointer"
          >
            Search
          </button>
        </form>
      ) : (
        <form
          action="/browse"
          method="GET"
          onSubmit={handleSubmit}
          role="search"
          className="flex items-center w-full relative"
        >
          <Search className="w-4 h-4 text-sx-muted absolute left-3.5 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            name="search"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            aria-label="Search marketplace squads"
            placeholder="Search squads, Epic players, OVR..."
            className="w-full h-10 pl-10 pr-8 rounded-full bg-sx-stone border border-sx-border hover:border-sx-border-strong focus:bg-sx-canvas focus:border-sx-ink text-sm text-sx-ink placeholder:text-sx-muted focus:outline-none transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-2.5 p-1 rounded-full text-sx-muted hover:text-sx-ink cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      )}

      {/* Predictive Autocomplete Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl bg-sx-canvas border border-sx-border shadow-2xl overflow-hidden text-xs">
          {trimmed.length < 2 ? (
            <div className="p-3.5 space-y-3.5">
              {recentSearches.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-sx-muted font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Recent Searches</span>
                    </span>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-sx-muted hover:text-sx-ink underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() =>
                          goTo(`/browse?search=${encodeURIComponent(term)}`, term)
                        }
                        className="px-2.5 py-1 rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border text-sx-ink font-medium transition-colors cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="block text-[11px] text-sx-muted font-semibold">
                  Popular Squad Filters
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_QUERIES.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => goTo(item.href, item.query || undefined)}
                      className="px-2.5 py-1 rounded-full bg-sx-subtle hover:border-sx-green border border-sx-border text-sx-ink font-medium transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-sx-border max-h-[380px] overflow-y-auto">
              {/* Smart Service Intent Matches */}
              {intentMatches.length > 0 && (
                <div className="p-2 space-y-1 bg-sx-subtle">
                  {intentMatches.map((match, idx) => {
                    const Icon = match.icon;
                    const isFocused = activeIndex === idx;
                    return (
                      <Link
                        key={match.href}
                        href={match.href}
                        onClick={() => {
                          saveRecentSearch(trimmed);
                          setOpen(false);
                          onNavigate?.();
                        }}
                        className={`flex items-center justify-between gap-3 p-2.5 rounded-lg transition-colors ${
                          isFocused ? "bg-sx-green-tint" : "hover:bg-sx-stone"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-sx-canvas border border-sx-border flex items-center justify-center text-sx-green-text shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sx-ink truncate">{match.title}</p>
                            <p className="text-[11px] text-sx-muted truncate">
                              {match.subtitle}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-sx-green-text shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Live Squad Matches */}
              <div className="p-2">
                <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-sx-muted">
                  <span>Matching Verified Squads</span>
                  {loading && <Loader2 className="w-3 h-3 animate-spin text-sx-green-text" />}
                </div>

                {!loading && results.length === 0 ? (
                  <div className="px-2.5 py-3 text-sx-muted flex items-center justify-between gap-2">
                    <span>No exact squad title match for &ldquo;{trimmed}&rdquo;.</span>
                    <Link
                      href="/wanted"
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                      className="text-sx-green-text font-semibold hover:underline shrink-0"
                    >
                      Request Squad &rarr;
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {results.map((item, idx) => {
                      const navIdx = intentMatches.length + idx;
                      const isFocused = activeIndex === navIdx;
                      const thumb =
                        item.images?.find((img) => img.is_primary)?.image_url ||
                        item.images?.[0]?.image_url;
                      const canOpt =
                        Boolean(thumb) &&
                        (thumb!.startsWith("/") ||
                          thumb!.includes(".supabase.co") ||
                          thumb!.includes("images.unsplash.com"));
                      const title = formatSmartListingTitle(item);

                      return (
                        <Link
                          key={item.id}
                          href={`/listings/${item.id}`}
                          onClick={() => {
                            saveRecentSearch(trimmed);
                            setOpen(false);
                            onNavigate?.();
                          }}
                          className={`flex items-center justify-between gap-3 p-2 rounded-lg transition-colors ${
                            isFocused ? "bg-sx-green-tint" : "hover:bg-sx-stone"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative w-12 h-9 rounded-md bg-sx-stone border border-sx-border overflow-hidden shrink-0">
                              {thumb ? (
                                <Image
                                  src={thumb}
                                  alt={title}
                                  fill
                                  sizes="48px"
                                  unoptimized={!canOpt}
                                  className="object-cover"
                                />
                              ) : (
                                <span className="w-full h-full flex items-center justify-center text-[9px] font-mono font-bold text-sx-muted">
                                  {item.overall_team_strength}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sx-ink truncate">{title}</p>
                              <p className="text-[11px] text-sx-muted font-mono">
                                {getShortPlatformLabel(item.platform)} &middot;{" "}
                                <span className="text-sx-green-text font-bold">
                                  {item.overall_team_strength} OVR
                                </span>
                              </p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-sx-ink shrink-0">
                            {formatCurrency(item.price, item.currency)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Full Catalog Action */}
              <button
                type="button"
                onClick={() =>
                  goTo(`/browse?search=${encodeURIComponent(trimmed)}`, trimmed)
                }
                className={`w-full px-3.5 py-2.5 flex items-center justify-between text-sx-green-text font-semibold transition-colors cursor-pointer ${
                  activeIndex === navigableItems.length - 1
                    ? "bg-sx-green-tint"
                    : "bg-sx-subtle hover:bg-sx-stone"
                }`}
              >
                <span>Search all squads for &ldquo;{trimmed}&rdquo;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
