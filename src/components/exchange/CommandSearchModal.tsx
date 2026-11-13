"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  Calculator,
  Handshake,
  Loader2,
  Scale,
  Search,
  ShieldAlert,
  Sparkles,
  Store,
  Trophy,
  X,
} from "lucide-react";
import { Listing } from "@/types/database";
import {
  formatCurrency,
  formatSmartListingTitle,
  getListingPriceContext,
  getShortPlatformLabel,
} from "@/lib/utils";

interface CommandSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  {
    label: "Instant KES Squad Valuator & Seller Payout Calculator",
    sub: "Estimate fair KES market value & exact M-Pesa payout",
    href: "/valuator",
    icon: Calculator,
  },
  {
    label: "Side-by-Side Squad Comparator",
    sub: "Compare up to 4 squads across OVR, Epics, Coins & KES price",
    href: "/compare",
    icon: Scale,
  },
  {
    label: "Scammer Phone & Handle Lookup (07... / 01...)",
    sub: "Check any Kenyan phone number before paying",
    href: "/scammer-check",
    icon: ShieldAlert,
  },
  {
    label: "WhatsApp & Facebook Middleman Escrow Desk",
    sub: "Protect off-platform trades via Till 1572931",
    href: "/middleman",
    icon: Handshake,
  },
  {
    label: "1v1 Matches & Paid Clan Tournaments",
    sub: "Automated brackets with M-Pesa prize custody",
    href: "/tournaments",
    icon: Trophy,
  },
  {
    label: "Sell Your Clean Konami ID Squad",
    sub: "Free listing · Capped 5% seller fee (KES 50–500)",
    href: "/seller/create-listing",
    icon: Store,
  },
];

export function CommandSearchModal({ isOpen, onClose }: CommandSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => inputRef.current?.focus(), 40);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const qs = trimmed
          ? `/api/listings?search=${encodeURIComponent(trimmed)}&limit=6`
          : `/api/listings?limit=5&sortBy=newest`;
        const res = await fetch(qs);
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data.listings) ? data.listings : []);
        }
      } catch {
        // non-blocking
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const navigate = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/browse?search=${encodeURIComponent(trimmed)}` : "/browse");
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-sx-canvas border border-sx-border-strong shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 px-4 py-3.5 border-b border-sx-border"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 text-sx-green-text animate-spin shrink-0" />
          ) : (
            <Search className="w-4 h-4 text-sx-muted shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search squads by player (Gullit, Messi), OVR (3200+), coach, or tool..."
            className="flex-1 bg-transparent text-sm sm:text-base text-sx-ink placeholder:text-sx-muted focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="px-2 py-0.5 rounded text-xs text-sx-muted hover:text-sx-ink cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close spotlight search"
            className="p-1.5 rounded-lg bg-sx-stone text-sx-muted hover:text-sx-ink cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </form>

        {/* Results Body */}
        <div className="overflow-y-auto p-3 sm:p-4 space-y-5">
          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[11px] font-mono uppercase text-sx-muted mr-1">
              Instant Filters:
            </span>
            {[
              { label: "Under KES 1,000", href: "/browse?maxPrice=1000" },
              { label: "3200+ OVR", href: "/browse?minStrength=3200" },
              { label: "3+ Epics", href: "/browse?minEpics=3" },
              { label: "Swap Open", href: "/browse?swap=1" },
              { label: "Lowest Ask", href: "/browse?sortBy=price_asc" },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => navigate(chip.href)}
                className="px-2.5 py-1 rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border text-sx-ink font-medium transition-colors cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Live Squad Results */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-sx-muted font-bold">
                {query.trim() ? `Matching Squads` : `Latest Live Squads`}
              </span>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    query.trim()
                      ? `/browse?search=${encodeURIComponent(query.trim())}`
                      : "/browse"
                  )
                }
                className="text-xs font-semibold text-sx-green-text hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View all in Market</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {results.length === 0 && !loading ? (
              <div className="p-4 rounded-xl bg-sx-subtle border border-sx-border text-center space-y-2">
                <p className="text-xs text-sx-muted">
                  No live squad matched &ldquo;{query}&rdquo;. Post a buyer request and let verified sellers pitch you directly!
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/wanted")}
                  className="px-3 py-1.5 rounded-lg bg-sx-green text-white text-xs font-bold cursor-pointer"
                >
                  Post Buyer Request on Wanted Board
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {results.map((item) => {
                  const thumb =
                    item.images?.find((img) => img.is_primary)?.image_url ||
                    item.images?.[0]?.image_url;
                  const smartTitle = formatSmartListingTitle(item);
                  const epics =
                    (item.epic_players_count || 0) + (item.big_time_players_count || 0);
                  const isDeal = getListingPriceContext(item).tier === "great_deal";

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(`/listings/${item.id}`)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-sx-stone border border-transparent hover:border-sx-border flex items-center justify-between gap-3 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-12 h-10 rounded-lg overflow-hidden bg-sx-elevated border border-sx-border shrink-0 flex items-center justify-center">
                          {thumb ? (
                            <Image
                              src={thumb}
                              alt={smartTitle}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-mono font-bold text-sx-green-text">
                              {item.overall_team_strength}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-sx-ink truncate">
                            {smartTitle}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-sx-muted mt-0.5">
                            <span className="font-mono font-bold text-sx-green-text">
                              {item.overall_team_strength} OVR
                            </span>
                            <span>&middot;</span>
                            <span>{getShortPlatformLabel(item.platform)}</span>
                            {epics > 0 && (
                              <>
                                <span>&middot;</span>
                                <span className="inline-flex items-center gap-0.5 text-sx-amber-text font-semibold">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  {epics} Epics
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs sm:text-sm font-extrabold font-mono text-sx-ink block">
                          {formatCurrency(item.price, item.currency)}
                        </span>
                        {isDeal && (
                          <span className="text-[10px] font-bold text-sx-green-text">
                            Great Value
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Exchange Tools & Services */}
          <div className="space-y-2 pt-2 border-t border-sx-border">
            <span className="text-[11px] font-mono uppercase tracking-wider text-sx-muted font-bold px-1 block">
              Exchange Tools &amp; Escrow Services
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.href}
                    type="button"
                    onClick={() => navigate(action.href)}
                    className="text-left p-2.5 rounded-xl bg-sx-subtle hover:bg-sx-stone border border-sx-border flex items-start gap-2.5 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sx-canvas border border-sx-border flex items-center justify-center text-sx-green-text shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-sx-ink line-clamp-1">
                        {action.label}
                      </p>
                      <p className="text-[11px] text-sx-muted line-clamp-1 mt-0.5">
                        {action.sub}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2.5 bg-sx-subtle border-t border-sx-border flex items-center justify-between text-[11px] text-sx-muted">
          <span>Protected by Safaricom M-Pesa Till 1572931 (0% Buyer Fee)</span>
          <span className="hidden sm:inline font-mono">ESC to close &middot; ENTER to search</span>
        </div>
      </div>
    </div>
  );
}
