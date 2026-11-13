"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Coins,
  ShieldCheck,
  Sparkles,
  Store,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { calculateEscrowCommission } from "@/lib/utils/commission";
import { formatCurrency } from "@/lib/utils";

interface SquadValuatorCalculatorProps {
  compact?: boolean;
}

export function SquadValuatorCalculator({ compact = false }: SquadValuatorCalculatorProps) {
  const [ovr, setOvr] = useState(3195);
  const [epics, setEpics] = useState(5);
  const [bigTime, setBigTime] = useState(2);
  const [coins, setCoins] = useState(250);
  const [peakDiv, setPeakDiv] = useState(2);
  const [platform, setPlatform] = useState<"android" | "ios" | "playstation_5" | "pc_steam">("android");
  const [hasBoosterManager, setHasBoosterManager] = useState(true);
  const [cleanKonamiOnly, setCleanKonamiOnly] = useState(true);

  const valuation = useMemo(() => {
    let base = 550;
    if (ovr >= 3250) base = 2900 + (ovr - 3250) * 42;
    else if (ovr >= 3210) base = 1550 + (ovr - 3210) * 33;
    else if (ovr >= 3160) base = 900 + (ovr - 3160) * 13;
    else if (ovr >= 3050) base = 420 + (ovr - 3050) * 4.5;
    else base = 250;

    const epicBonus = Math.min(2400, epics * 115 + bigTime * 140);
    const coinBonus = Math.min(1800, Math.round(coins * 0.85));
    const divBonus = peakDiv === 1 ? 300 : peakDiv === 2 ? 150 : peakDiv === 3 ? 75 : 0;
    const managerBonus = hasBoosterManager ? 150 : 0;
    const platformBonus =
      platform === "playstation_5" || platform === "pc_steam" ? 350 : 0;

    let rawMid = base + epicBonus + coinBonus + divBonus + managerBonus + platformBonus;

    if (!cleanKonamiOnly) {
      rawMid = rawMid * 0.55;
    }

    const fastSaleKes = Math.max(150, Math.round((rawMid * 0.85) / 50) * 50);
    const fairMidKes = Math.max(200, Math.round(rawMid / 50) * 50);
    const collectorAskKes = Math.max(fairMidKes + 200, Math.round((rawMid * 1.22) / 50) * 50);

    const fastFee = calculateEscrowCommission(fastSaleKes);
    const fairFee = calculateEscrowCommission(fairMidKes);

    return {
      fastSaleKes,
      fairMidKes,
      collectorAskKes,
      fairFee,
      sellerNetFair: fairMidKes - fairFee,
      sellerNetFast: fastSaleKes - fastFee,
    };
  }, [ovr, epics, bigTime, coins, peakDiv, platform, hasBoosterManager, cleanKonamiOnly]);

  const compStrengthParam = Math.max(3000, Math.floor((ovr - 30) / 50) * 50);

  return (
    <div className="rounded-2xl bg-sx-canvas border border-sx-border overflow-hidden shadow-panel">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Interactive Telemetry Controls */}
        <div className="lg:col-span-7 p-5 sm:p-7 space-y-5 border-b lg:border-b-0 lg:border-r border-sx-border">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider font-bold text-sx-green-text">
                <Calculator className="w-3.5 h-3.5" />
                <span>Kenyan Market Pricing Engine</span>
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-sx-ink font-display mt-0.5">
                Instant KES Squad Valuator &amp; Payout Estimator
              </h3>
            </div>
            {compact && (
              <Link
                href="/valuator"
                className="text-xs font-semibold text-sx-green-text hover:underline shrink-0"
              >
                Full Page &rarr;
              </Link>
            )}
          </div>

          {/* Sliders Grid */}
          <div className="space-y-4">
            {/* Collective OVR */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="val-ovr" className="font-semibold text-sx-ink">
                  Collective Team Strength (OVR)
                </label>
                <span className="px-2 py-0.5 rounded bg-sx-green-tint border border-sx-green-border font-mono font-extrabold text-sx-green-text">
                  {ovr} OVR
                </span>
              </div>
              <input
                id="val-ovr"
                type="range"
                min={2950}
                max={3310}
                step={5}
                value={ovr}
                onChange={(e) => setOvr(Number(e.target.value))}
                className="w-full accent-[#006340] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-sx-muted">
                <span>2950</span>
                <span>3150</span>
                <span>3210</span>
                <span>3310+</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Epics */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="val-epics" className="font-semibold text-sx-ink flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-sx-amber-text" />
                    <span>Epic / Booster Cards</span>
                  </label>
                  <span className="font-mono font-bold text-sx-ink">{epics}</span>
                </div>
                <input
                  id="val-epics"
                  type="range"
                  min={0}
                  max={35}
                  step={1}
                  value={epics}
                  onChange={(e) => setEpics(Number(e.target.value))}
                  className="w-full accent-[#006340] cursor-pointer"
                />
              </div>

              {/* Big Time / ShowTime */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="val-bt" className="font-semibold text-sx-ink">
                    Big Time / ShowTime
                  </label>
                  <span className="font-mono font-bold text-sx-ink">{bigTime}</span>
                </div>
                <input
                  id="val-bt"
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={bigTime}
                  onChange={(e) => setBigTime(Number(e.target.value))}
                  className="w-full accent-[#006340] cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Coins */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="val-coins" className="font-semibold text-sx-ink flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-sx-amber-text" />
                    <span>eFootball Coins</span>
                  </label>
                  <span className="font-mono font-bold text-sx-ink">
                    {coins.toLocaleString()}
                  </span>
                </div>
                <input
                  id="val-coins"
                  type="range"
                  min={0}
                  max={5000}
                  step={50}
                  value={coins}
                  onChange={(e) => setCoins(Number(e.target.value))}
                  className="w-full accent-[#006340] cursor-pointer"
                />
              </div>

              {/* Peak Division */}
              <div className="space-y-1.5">
                <label htmlFor="val-div" className="block text-xs font-semibold text-sx-ink">
                  Peak eFootball League Division
                </label>
                <select
                  id="val-div"
                  value={peakDiv}
                  onChange={(e) => setPeakDiv(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg bg-sx-stone border border-sx-border text-xs font-semibold text-sx-ink focus:outline-none focus:border-sx-green"
                >
                  <option value={1}>Division 1 Badge</option>
                  <option value={2}>Division 2</option>
                  <option value={3}>Division 3</option>
                  <option value={5}>Division 4 – 6</option>
                  <option value={9}>Division 7 – 10</option>
                </select>
              </div>
            </div>

            {/* Platform + Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                aria-label="Platform"
                className="h-9 px-3 rounded-lg bg-sx-stone border border-sx-border text-xs font-semibold text-sx-ink focus:outline-none"
              >
                <option value="android">Android Mobile</option>
                <option value="ios">iOS Mobile</option>
                <option value="playstation_5">PlayStation 5 / 4</option>
                <option value="pc_steam">PC / Steam</option>
              </select>

              <button
                type="button"
                onClick={() => setHasBoosterManager((v) => !v)}
                className={`h-9 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                  hasBoosterManager
                    ? "bg-sx-green-tint border-sx-green-border text-sx-green-text"
                    : "bg-sx-stone border-sx-border text-sx-muted"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>88+ Booster Coach</span>
              </button>

              <button
                type="button"
                onClick={() => setCleanKonamiOnly((v) => !v)}
                className={`h-9 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                  cleanKonamiOnly
                    ? "bg-sx-green-tint border-sx-green-border text-sx-green-text"
                    : "bg-sx-amber-tint border-sx-amber-border text-sx-amber-text"
                }`}
              >
                {cleanKonamiOnly ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                <span>{cleanKonamiOnly ? "Clean Konami ID" : "Google/Apple Linked"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live KES Output & Net Seller Payout */}
        <div className="lg:col-span-5 p-5 sm:p-7 bg-sx-subtle flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-sx-canvas border border-sx-border space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-sx-muted">
                Estimated Kenyan Market Value
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-sx-ink">
                {formatCurrency(valuation.fastSaleKes)} –{" "}
                {formatCurrency(valuation.collectorAskKes)}
              </div>
              <p className="text-xs text-sx-muted">
                Sweet-spot ask:{" "}
                <strong className="text-sx-green-text font-mono">
                  {formatCurrency(valuation.fairMidKes)}
                </strong>{" "}
                (calibrated against live Till 1572931 sales)
              </p>
            </div>

            {!cleanKonamiOnly && (
              <div className="p-3 rounded-xl bg-sx-amber-tint border border-sx-amber-border text-xs text-sx-amber-text flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Dual-Link Discount Applied:</strong> eFootballMarket requires{" "}
                  <em>Google Play / Apple ID = Not Linked</em> before payout so sellers cannot reclaim accounts. Unlink first to unlock full KES value.
                </span>
              </div>
            )}

            {/* Seller Net M-Pesa Payout Box */}
            <div className="p-4 rounded-xl bg-sx-canvas border border-sx-border space-y-2.5 text-xs">
              <div className="font-bold text-sx-ink flex items-center justify-between">
                <span>If Listed at Recommended Ask</span>
                <span className="font-mono">{formatCurrency(valuation.fairMidKes)}</span>
              </div>
              <div className="flex items-center justify-between text-sx-muted">
                <span>Buyer Fee on Till 1572931</span>
                <span className="font-mono font-semibold text-sx-green-text">KES 0 (Free)</span>
              </div>
              <div className="flex items-center justify-between text-sx-muted">
                <span>Platform Escrow Fee (5%, max KES 500)</span>
                <span className="font-mono">-{formatCurrency(valuation.fairFee)}</span>
              </div>
              <div className="pt-2 border-t border-sx-border flex items-center justify-between text-sm font-extrabold text-sx-ink">
                <span>Your Net M-Pesa Payout</span>
                <span className="font-mono text-sx-green-text">
                  {formatCurrency(valuation.sellerNetFair)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Link href="/seller/create-listing" className="block">
                <Button variant="primary" size="md" className="w-full">
                  <Store className="w-4 h-4" />
                  <span>Sell for {formatCurrency(valuation.fairMidKes)}</span>
                </Button>
              </Link>
              <Link
                href={`/browse?minStrength=${compStrengthParam}&platform=${platform}`}
                className="block"
              >
                <Button variant="outline" size="md" className="w-full">
                  <span>See {compStrengthParam}+ Comps</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
            <p className="text-[11px] text-sx-muted flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sx-green-text shrink-0" />
              <span> Fast-sale 24h price: {formatCurrency(valuation.fastSaleKes)} (Net {formatCurrency(valuation.sellerNetFast)})</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
