"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Plus,
  Scale,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Listing } from "@/types/database";
import {
  MAX_COMPARE_SQUADS,
  toggleCompareListing,
  useCompareSquads,
} from "@/lib/compare/compareStore";
import {
  formatCompactNumber,
  formatCurrency,
  formatSmartListingTitle,
  getKonamiIdStatusInfo,
  getListingPriceContext,
  getPlatformLabel,
  getPlaystyleLabel,
} from "@/lib/utils";

export default function CompareSquadsPage() {
  const { items, remove, clear } = useCompareSquads();
  const [catalog, setCatalog] = useState<Listing[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/listings?limit=20&sortBy=newest")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (mounted && Array.isArray(data?.listings)) {
          setCatalog(data.listings);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoadingCatalog(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const unselectedCatalog = useMemo(() => {
    const selectedIds = new Set(items.map((i) => i.id));
    return catalog.filter((l) => !selectedIds.has(l.id));
  }, [catalog, items]);

  // Compute winners across active columns (only meaningful when >= 2 squads)
  const winners = useMemo(() => {
    if (items.length < 2) {
      return {
        lowestPrice: null as number | null,
        highestOvr: null as number | null,
        bestKesPerOvr: null as number | null,
        mostStackedCards: null as number | null,
        mostCoins: null as number | null,
        bestDiv: null as number | null,
      };
    }

    const prices = items.map((i) => i.price).filter((p) => p > 0);
    const ovrs = items.map((i) => i.overall_team_strength);
    const ratios = items.map((i) =>
      i.overall_team_strength > 0 ? i.price / i.overall_team_strength : Infinity
    );
    const cards = items.map(
      (i) => i.epic_players_count + i.big_time_players_count
    );
    const coins = items.map((i) => i.coin_balance);
    const divs = items.map((i) => Math.min(i.highest_division || 10, i.current_division || 10));

    return {
      lowestPrice: prices.length ? Math.min(...prices) : null,
      highestOvr: Math.max(...ovrs),
      bestKesPerOvr: Math.min(...ratios),
      mostStackedCards: Math.max(...cards) > 0 ? Math.max(...cards) : null,
      mostCoins: Math.max(...coins) > 0 ? Math.max(...coins) : null,
      bestDiv: Math.min(...divs),
    };
  }, [items]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-sx-border pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-sx-green-text font-bold">
            <Scale className="w-3.5 h-3.5" />
            <span>Side-by-Side Telemetry Matrix</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-sx-ink font-display tracking-tight">
            Compare Squads ({items.length}/{MAX_COMPARE_SQUADS})
          </h1>
          <p className="text-xs sm:text-sm text-sx-muted">
            Green highlights mark the category leader across price, Collective OVR, Epic stack, Coins, and Division rank.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clear}>
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </Button>
          )}
          <Link href="/browse">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Browse</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      {items.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-sx-border bg-sx-canvas shadow-panel">
          <table className="w-full min-w-[640px] border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-sx-border bg-sx-subtle">
                <th className="w-44 p-4 align-top font-mono text-[11px] uppercase tracking-wider text-sx-muted">
                  Telemetry Spec
                </th>
                {items.map((sq) => {
                  const ctx = getListingPriceContext(sq);
                  return (
                    <th key={sq.id} className="p-4 align-top min-w-[210px] border-l border-sx-border">
                      <div className="space-y-3">
                        <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-sx-stone border border-sx-border">
                          {sq.thumbUrl ? (
                            <Image
                              src={sq.thumbUrl}
                              alt={sq.title}
                              fill
                              sizes="240px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-mono font-bold text-sx-green-text">
                              {sq.overall_team_strength} OVR
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => remove(sq.id)}
                            title="Remove from comparison"
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/75 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <Link
                            href={`/listings/${sq.id}`}
                            className="font-bold text-sx-ink hover:text-sx-green-text line-clamp-2 leading-snug block font-display"
                          >
                            {sq.title}
                          </Link>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-base font-extrabold font-mono text-sx-ink">
                              {formatCurrency(sq.price, sq.currency)}
                            </span>
                            {ctx.tier === "great_deal" && (
                              <span className="px-1.5 py-0.5 rounded bg-sx-green-tint border border-sx-green-border text-[10px] font-bold text-sx-green-text">
                                Great Value
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-sx-border">
              {/* Purchase Price */}
              <tr>
                <td className="p-3.5 font-semibold text-sx-muted bg-sx-subtle/60">
                  Lowest Ask (KES)
                </td>
                {items.map((sq) => {
                  const win = winners.lowestPrice !== null && sq.price === winners.lowestPrice;
                  return (
                    <td
                      key={sq.id}
                      className={`p-3.5 border-l border-sx-border font-mono font-bold ${
                        win ? "bg-sx-green-tint/50 text-sx-green-text" : "text-sx-ink"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{formatCurrency(sq.price, sq.currency)}</span>
                        {win && <Trophy className="w-3.5 h-3.5 shrink-0" />}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Collective OVR */}
              <tr>
                <td className="p-3.5 font-semibold text-sx-muted bg-sx-subtle/60">
                  Collective Strength
                </td>
                {items.map((sq) => {
                  const win =
                    winners.highestOvr !== null &&
                    sq.overall_team_strength === winners.highestOvr;
                  return (
                    <td
                      key={sq.id}
                      className={`p-3.5 border-l border-sx-border font-mono font-bold ${
                        win ? "bg-sx-green-tint/50 text-sx-green-text" : "text-sx-ink"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{sq.overall_team_strength} OVR</span>
                        {win && <Trophy className="w-3.5 h-3.5 shrink-0" />}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Market Value Benchmark */}
              <tr>
                <td className="p-3.5 font-semibold text-sx-muted bg-sx-subtle/60">
                  Market Benchmark
                </td>
                {items.map((sq) => {
                  const ctx = getListingPriceContext(sq);
                  return (
                    <td key={sq.id} className="p-3.5 border-l border-sx-border">
                      <span
                        className={`font-bold block ${
                          ctx.tier === "great_deal"
                            ? "text-sx-green-text"
                            : "text-sx-ink"
                        }`}
                      >
                        {ctx.label}
                      </span>
                      <span className="text-[11px] text-sx-muted">{ctx.detail}</span>
                    </td>
                  );
                })}
              </tr>

              {/* Epic + Big Time Stack */}
              <tr>
                <td className="p-3.5 font-semibold text-sx-muted bg-sx-subtle/60">
                  Epic + Big Time Cards
                </td>
                {items.map((sq) => {
                  const total = sq.epic_players_count + sq.big_time_players_count;
                  const win =
                    winners.mostStackedCards !== null &&
                    total === winners.mostStackedCards;
                  return (
                    <td
                      key={sq.id}
                      className={`p-3.5 border-l border-sx-border font-mono font-bold ${
                        win ? "bg-sx-green-tint/50 text-sx-green-text" : "text-sx-ink"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-sx-amber-text" />
                        <span>
                          {total} ({sq.epic_players_count}E / {sq.big_time_players_count}BT)
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Coins & GP */}
              <tr>
                <td className="p-3.5 font-semibold text-sx-muted bg-sx-subtle/60">
                  Coins &amp; GP Balance
                </td>
                {items.map((sq) => {
                  const win =
                    winners.mostCoins !== null && sq.coin_balance === winners.mostCoins;
                  return (
                    <td
                      key={sq.id}
                      className={`p-3.5 border-l border-sx-border font-mono ${
                        win ? "bg-sx-green-tint/50 text-sx-green-text font-bold" : "text-sx-ink"
                      }`}
                    >
                      {formatCompactNumber(sq.coin_balance)} Coins &middot;{" "}
                      {formatCompactNumber(sq.gp_balance)} GP
                    </td>
                  );
                })}
              </tr>

              {/* Platform & Playstyle */}
              <tr>
                <td className="p-3.5 font-semibold text-sx-muted bg-sx-subtle/60">
                  Platform &amp; Playstyle
                </td>
                {items.map((sq) => (
                  <td key={sq.id} className="p-3.5 border-l border-sx-border text-sx-ink">
                    <span className="font-semibold block">
                      {getPlatformLabel(sq.platform)}
                    </span>
                    <span className="text-xs text-sx-muted">
                      {getPlaystyleLabel(sq.primary_playstyle)}
                      {sq.manager_name ? ` · ${sq.manager_name}` : ""}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Peak Division */}
              <tr>
                <td className="p-3.5 font-semibold text-sx-muted bg-sx-subtle/60">
                  Peak Division
                </td>
                {items.map((sq) => {
                  const peak = Math.min(sq.highest_division || 10, sq.current_division || 10);
                  const win = winners.bestDiv !== null && peak === winners.bestDiv;
                  return (
                    <td
                      key={sq.id}
                      className={`p-3.5 border-l border-sx-border font-mono font-semibold ${
                        win ? "bg-sx-green-tint/50 text-sx-green-text" : "text-sx-ink"
                      }`}
                    >
                      Division {peak}
                    </td>
                  );
                })}
              </tr>

              {/* Konami ID & Swap */}
              <tr>
                <td className="p-3.5 font-semibold text-sx-muted bg-sx-subtle/60">
                  Handover &amp; Swap
                </td>
                {items.map((sq) => {
                  const k = getKonamiIdStatusInfo(sq.konami_id_status);
                  return (
                    <td key={sq.id} className="p-3.5 border-l border-sx-border space-y-1">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-sx-green-text">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {k.label}
                      </span>
                      <span className="block text-[11px] text-sx-muted">
                        {sq.allows_swap ? "✓ Open to Account Swap + Top-Up" : "Cash Sale Only"}
                      </span>
                    </td>
                  );
                })}
              </tr>

              {/* Action Row */}
              <tr className="bg-sx-subtle">
                <td className="p-4 font-semibold text-sx-ink">
                  Escrow Checkout
                  <span className="block text-[11px] font-normal text-sx-muted mt-0.5">
                    KES 0 Buyer Fee · Till 1572931
                  </span>
                </td>
                {items.map((sq) => (
                  <td key={sq.id} className="p-4 border-l border-sx-border space-y-2">
                    <Link href={`/pay/${sq.id}`} className="block">
                      <Button variant="primary" size="sm" className="w-full">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Buy {formatCurrency(sq.price, sq.currency)}</span>
                      </Button>
                    </Link>
                    <Link href={`/listings/${sq.id}`} className="block">
                      <Button variant="outline" size="sm" className="w-full">
                        <span>Inspect Full Roster</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl bg-sx-subtle border border-sx-border p-8 text-center space-y-3">
          <Scale className="w-8 h-8 text-sx-green-text mx-auto" />
          <h2 className="text-lg font-bold text-sx-ink font-display">
            Pick 2 to 4 Squads Below to Compare Side-by-Side
          </h2>
          <p className="text-xs sm:text-sm text-sx-muted max-w-md mx-auto">
            Tap <strong>+ Add to Compare</strong> on any live squad below (or while browsing the marketplace) to unlock instant side-by-side winner highlights.
          </p>
        </div>
      )}

      {/* Quick Live Catalog Picker right on /compare */}
      {items.length < MAX_COMPARE_SQUADS && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-sx-ink font-display">
              {items.length === 0
                ? "Select Live Squads to Compare"
                : `Add Another Squad (${MAX_COMPARE_SQUADS - items.length} slot${
                    MAX_COMPARE_SQUADS - items.length === 1 ? "" : "s"
                  } left)`}
            </h2>
            <Link href="/browse" className="text-xs font-semibold text-sx-green-text hover:underline">
              Full Marketplace &rarr;
            </Link>
          </div>

          {loadingCatalog ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-sx-stone animate-pulse" />
              ))}
            </div>
          ) : unselectedCatalog.length === 0 ? (
            <p className="text-xs text-sx-muted">No additional live squads available to add right now.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {unselectedCatalog.slice(0, 8).map((sq) => {
                const thumb =
                  sq.images?.find((img) => img.is_primary)?.image_url ||
                  sq.images?.[0]?.image_url;
                const smart = formatSmartListingTitle(sq);
                return (
                  <div
                    key={sq.id}
                    className="rounded-xl bg-sx-subtle border border-sx-border p-3 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-12 rounded-lg overflow-hidden bg-sx-stone border border-sx-border shrink-0 flex items-center justify-center">
                        {thumb ? (
                          <Image
                            src={thumb}
                            alt={smart}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-sx-green-text">
                            {sq.overall_team_strength}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-sx-ink line-clamp-2 leading-tight">
                          {smart}
                        </p>
                        <p className="text-xs font-mono font-extrabold text-sx-green-text mt-1">
                          {formatCurrency(sq.price, sq.currency)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => toggleCompareListing(sq)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Compare</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
