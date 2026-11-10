"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Listing } from "@/types/database";
import {
  getFridayDropCountdown,
  FridayDropCountdown,
} from "@/lib/utils/flashSale";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { Button } from "@/components/ui/Button";
import {
  Clock,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Heart,
  Flame,
  PlusCircle,
} from "lucide-react";

interface FridayDropsProps {
  listings: Listing[];
}

export function FridayDropsSection({ listings }: FridayDropsProps) {
  const [countdown, setCountdown] = useState<FridayDropCountdown>({
    isActive: false,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    targetDateUtc: new Date(),
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateCountdown = () => {
      setCountdown(getFridayDropCountdown());
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const isDropActive = mounted && countdown.isActive;

  const featuredDrops = listings.filter(
    (item) => item.is_featured || (item as any).is_flash_sale
  );
  const showcaseItems = (
    featuredDrops.length > 0 ? featuredDrops : listings
  ).slice(0, 4);

  return (
    <section id="friday-drops" className="py-8 sm:py-10 bg-sx-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* StockX Release Calendar Split Hero */}
        <div className="rounded-2xl bg-sx-stone border border-sx-border overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Editorial Copy & Countdown */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-widest text-sx-green-text">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isDropActive ? "bg-sx-green animate-ping" : "bg-sx-green"
                  }`}
                />
                <span>
                  {isDropActive
                    ? "Release Window Open Now"
                    : "Weekly Curated Release · Fridays 2:00 PM EAT"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-sx-ink font-display tracking-tight leading-tight">
                {isDropActive
                  ? "The Friday Release Is Live."
                  : "The Friday Squad Release."}
              </h1>

              <p className="text-sm text-sx-ink-soft max-w-xl leading-relaxed">
                {isDropActive
                  ? "Hand-vetted Double-Booster, Show Time, and dual-88 Manager accounts are live until 10:00 PM EAT at fixed ask prices — first M-Pesa escrow lock takes the squad."
                  : "Once a week, we group verified collector rosters — stacked spines, rare Booster Managers, and clean unlinked Konami IDs — into an 8-hour fixed-price release."}
              </p>
            </div>

            {/* Clean StockX Ticker */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-sx-muted">
                <Clock className="w-3.5 h-3.5 text-sx-green-text" />
                <span>
                  {isDropActive
                    ? "Window closes at 10:00 PM EAT in"
                    : "Next release opens in"}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2.5 max-w-sm font-mono">
                {[
                  { val: countdown.days, label: "Days" },
                  { val: countdown.hours, label: "Hours" },
                  { val: countdown.minutes, label: "Mins" },
                  { val: countdown.seconds, label: "Secs", accent: true },
                ].map((unit) => (
                  <div
                    key={unit.label}
                    className="p-3 rounded-xl bg-sx-canvas border border-sx-border text-center"
                  >
                    <span
                      className={`block text-xl sm:text-2xl font-extrabold leading-none ${
                        unit.accent ? "text-sx-green-text" : "text-sx-ink"
                      }`}
                    >
                      {mounted ? String(unit.val).padStart(2, "0") : "--"}
                    </span>
                    <span className="block text-[10px] text-sx-muted uppercase font-semibold mt-1">
                      {unit.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Curation Pillars + Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link href="/browse">
                <Button variant="primary" size="md" className="font-bold">
                  <span>Shop Live Market</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/seller/create-listing">
                <Button variant="secondary" size="md" className="font-semibold">
                  <PlusCircle className="w-4 h-4" />
                  <span>Consign a Squad for Friday</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Real Match-Night Stadium Photography + Standards Overlay */}
          <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-full bg-sx-elevated border-t lg:border-t-0 lg:border-l border-sx-border overflow-hidden">
            <img
              src="/images/articles/live-update-condition-night.jpg"
              alt="Floodlit football stadium match night"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-6 text-white space-y-2.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 font-bold">
                Selection Criteria
              </span>
              <div className="space-y-1.5 text-xs text-white/90">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Permanent-B Epic, Big Time &amp; Show Time spines</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>100% unlinked Google Play &amp; Game Center status</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Fixed ask price · Till 1572931 M-Pesa escrow custody</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Lineup OR Early Radar Watchlist */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-sx-border pb-3">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-sx-green-text font-bold flex items-center gap-1.5">
                {isDropActive ? (
                  <>
                    <Flame className="w-3.5 h-3.5" />
                    <span>Now Unlocking</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-3.5 h-3.5" />
                    <span>On The Radar</span>
                  </>
                )}
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-sx-ink font-display mt-0.5">
                {isDropActive
                  ? "Friday Release Lineup"
                  : "Available Now & Watchlist Picks"}
              </h2>
            </div>

            <Link
              href="/browse"
              className="text-xs font-bold text-sx-green-text hover:underline inline-flex items-center gap-1"
            >
              <span>View Full Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {showcaseItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {showcaseItems.map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-sx-subtle border border-sx-border p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-sx-ink font-display">
                  Next Friday Lineup In Curation
                </h3>
                <p className="text-xs text-sx-muted max-w-xl leading-relaxed">
                  Have a clean Konami ID with meta Double-Booster cards or 88-proficiency Booster Managers? List your squad before Friday 12:00 PM EAT to be featured in the weekly release.
                </p>
              </div>
              <Link href="/seller/create-listing" className="shrink-0">
                <Button variant="primary" size="sm">
                  <span>List Your Squad</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
