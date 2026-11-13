"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Listing } from "@/types/database";
import { META_PLAYERS_DB, computeAllocatedStats } from "@/lib/data/appMetaPlayers";
import { formatCurrency, formatSmartListingTitle } from "@/lib/utils";
import { Sparkles, RotateCcw, Swords, Trophy, ArrowRight } from "lucide-react";

interface PackSimulatorAndVsLabProps {
  mode: "pack" | "vs";
  listings: Listing[];
}

interface PackCardItem {
  id: string;
  rarity: "EPIC" | "HIGHLIGHT" | "STANDARD";
  name: string;
  ovr: number;
  pos: string;
}

function createFresh150Box(): PackCardItem[] {
  const epics: PackCardItem[] = [
    { id: "ep-1", rarity: "EPIC", name: "K. Rummenigge (Double Booster)", ovr: 105, pos: "CF" },
    { id: "ep-2", rarity: "EPIC", name: "R. Gullit (Double Booster)", ovr: 105, pos: "CF/AMF" },
    { id: "ep-3", rarity: "EPIC", name: "P. Vieira (Anchor Man)", ovr: 104, pos: "DMF" },
  ];
  const highlights: PackCardItem[] = Array.from({ length: 8 }).map((_, i) => ({
    id: `hl-${i}`,
    rarity: "HIGHLIGHT" as const,
    name: [
      "F. Valverde (Highlight)",
      "R. Leão (Highlight)",
      "T. Hernández (Highlight)",
      "A. Rüdiger (Highlight)",
      "B. Saka (Highlight)",
      "Pedri (Highlight)",
      "A. Hakimi (Highlight)",
      "M. Maignan (Highlight)",
    ][i],
    ovr: 99 - (i % 3),
    pos: ["CMF", "LWF", "LB", "CB", "RWF", "CMF", "RB", "GK"][i],
  }));
  const standards: PackCardItem[] = Array.from({ length: 139 }).map((_, i) => ({
    id: `st-${i}`,
    rarity: "STANDARD" as const,
    name: `Base GP Player #${i + 1}`,
    ovr: 82 + (i % 9),
    pos: ["CF", "CMF", "CB", "GK", "RWF"][i % 5],
  }));

  const all = [...epics, ...highlights, ...standards];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

export function PackSimulatorAndVsLab({ mode, listings }: PackSimulatorAndVsLabProps) {
  // ===== PACK SIMULATOR STATE =====
  const [box, setBox] = useState<PackCardItem[]>(() => createFresh150Box());
  const [lastPulls, setLastPulls] = useState<PackCardItem[]>([]);
  const [coinsSpent, setCoinsSpent] = useState(0);
  const [epicsPulled, setEpicsPulled] = useState<PackCardItem[]>([]);

  // ===== VS COMPARATOR STATE =====
  const [vsType, setVsType] = useState<"players" | "squads">("players");
  const [pLeftId, setPLeftId] = useState(META_PLAYERS_DB[0].id);
  const [pRightId, setPRightId] = useState(META_PLAYERS_DB[1].id);
  const [sqLeftId, setSqLeftId] = useState(listings[0]?.id || "");
  const [sqRightId, setSqRightId] = useState(listings[1]?.id || listings[0]?.id || "");

  const epicsRemaining = useMemo(
    () => box.filter((c) => c.rarity === "EPIC").length,
    [box]
  );

  // Exact probability of pulling >= 1 Epic in next 10x spin
  const next10EpicOdds = useMemo(() => {
    const N = box.length;
    const K = epicsRemaining;
    const n = Math.min(10, N);
    if (N === 0 || K === 0) return 0;
    let probZero = 1;
    for (let i = 0; i < n; i++) {
      probZero *= (N - K - i) / (N - i);
    }
    return Math.round((1 - probZero) * 1000) / 10;
  }, [box.length, epicsRemaining]);

  const spinBox = (count: 1 | 10) => {
    if (box.length === 0) return;
    const actual = Math.min(count, box.length);
    const pulled = box.slice(0, actual);
    const rest = box.slice(actual);
    setBox(rest);
    setLastPulls(pulled);
    setCoinsSpent((c) => c + (count === 10 && actual === 10 ? 900 : actual * 100));
    const foundEpics = pulled.filter((p) => p.rarity === "EPIC");
    if (foundEpics.length > 0) {
      setEpicsPulled((prev) => [...foundEpics, ...prev]);
      try {
        (window as any).EFMNative?.vibrate?.(60);
      } catch {
        // ignore
      }
    }
  };

  const resetBox = () => {
    setBox(createFresh150Box());
    setLastPulls([]);
    setCoinsSpent(0);
    setEpicsPulled([]);
  };

  // Approximate Kenyan M-Pesa PlayStore coin purchase equivalent (~KES 165 per 100 coins)
  const kesCoinEquivalent = Math.round(coinsSpent * 1.65);

  // VS Player stats
  const leftCard = useMemo(
    () => META_PLAYERS_DB.find((p) => p.id === pLeftId) || META_PLAYERS_DB[0],
    [pLeftId]
  );
  const rightCard = useMemo(
    () => META_PLAYERS_DB.find((p) => p.id === pRightId) || META_PLAYERS_DB[1],
    [pRightId]
  );
  const leftComputed = useMemo(
    () => computeAllocatedStats(leftCard, leftCard.metaAllocation, true, "strikers"),
    [leftCard]
  );
  const rightComputed = useMemo(
    () => computeAllocatedStats(rightCard, rightCard.metaAllocation, true, "strikers"),
    [rightCard]
  );

  const leftSquad = listings.find((l) => l.id === sqLeftId) || listings[0];
  const rightSquad = listings.find((l) => l.id === sqRightId) || listings[1] || listings[0];

  if (mode === "pack") {
    return (
      <div className="space-y-3.5">
        {/* Box Header */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-950/80 via-slate-900 to-fuchsia-950/50 border border-amber-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                150-Player European Legends Box
              </span>
              <h3 className="text-base font-extrabold text-white">
                Rummenigge · Gullit · Vieira
              </h3>
            </div>
            <button
              type="button"
              onClick={resetBox}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-[11px] font-bold text-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset 150</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <p className="text-[10px] text-slate-400">Box Left</p>
              <p className="text-sm font-mono font-black text-white">{box.length}/150</p>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <p className="text-[10px] text-slate-400">Epics Left</p>
              <p className="text-sm font-mono font-black text-amber-300">
                {epicsRemaining}/3
              </p>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <p className="text-[10px] text-slate-400">Next 10x Odds</p>
              <p className="text-sm font-mono font-black text-emerald-400">
                {next10EpicOdds}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={box.length === 0}
              onClick={() => spinBox(1)}
              className="py-3 rounded-2xl bg-slate-950 border border-amber-400/50 text-amber-300 font-extrabold text-xs cursor-pointer"
            >
              1x Spin (100 Coins)
            </button>
            <button
              type="button"
              disabled={box.length === 0}
              onClick={() => spinBox(10)}
              className="py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-lg cursor-pointer"
            >
              10x Spin (900 Coins)
            </button>
          </div>
        </div>

        {/* Coin Spend Reality Check vs Buying Verified Squad */}
        {coinsSpent > 0 && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold text-white">
                Simulated Spend: {coinsSpent.toLocaleString()} Coins (~KES{" "}
                {kesCoinEquivalent.toLocaleString()})
              </p>
              <p className="text-[11px] text-emerald-300">
                Epics pulled: {epicsPulled.length}/3 — Verified full Epic squads start under KES 3,500!
              </p>
            </div>
          </div>
        )}

        {/* Walkout Results */}
        {lastPulls.length > 0 && (
          <div className="p-3.5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
            <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Pack Walkout Results</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {lastPulls.map((c) => (
                <div
                  key={c.id}
                  className={`p-2.5 rounded-xl border ${
                    c.rarity === "EPIC"
                      ? "bg-gradient-to-r from-amber-500/25 to-fuchsia-500/20 border-amber-400 text-amber-200"
                      : c.rarity === "HIGHLIGHT"
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span>{c.rarity}</span>
                    <span>{c.ovr} OVR</span>
                  </div>
                  <p className="text-xs font-extrabold truncate mt-0.5">{c.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ===== VS ARENA MODE ===== */
  const vsMetrics = [
    {
      label: "Max Boosted OVR",
      l: leftComputed.boostedOvr,
      r: rightComputed.boostedOvr,
    },
    {
      label: "Speed",
      l: leftComputed.stats.speed,
      r: rightComputed.stats.speed,
    },
    {
      label: "Acceleration",
      l: leftComputed.stats.acceleration,
      r: rightComputed.stats.acceleration,
    },
    {
      label: "Finishing",
      l: leftComputed.stats.finishing,
      r: rightComputed.stats.finishing,
    },
    {
      label: "Dribbling",
      l: leftComputed.stats.dribbling,
      r: rightComputed.stats.dribbling,
    },
    {
      label: "Low Pass",
      l: leftComputed.stats.lowPass,
      r: rightComputed.stats.lowPass,
    },
    {
      label: "Physical Contact",
      l: leftComputed.stats.physicalContact,
      r: rightComputed.stats.physicalContact,
    },
    {
      label: "Tackling",
      l: leftComputed.stats.tackling,
      r: rightComputed.stats.tackling,
    },
  ];

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          type="button"
          onClick={() => setVsType("players")}
          className={`py-2 rounded-xl text-xs font-extrabold cursor-pointer ${
            vsType === "players" ? "bg-emerald-500 text-slate-950" : "text-slate-400"
          }`}
        >
          Compare Meta Cards
        </button>
        <button
          type="button"
          onClick={() => setVsType("squads")}
          className={`py-2 rounded-xl text-xs font-extrabold cursor-pointer ${
            vsType === "squads" ? "bg-emerald-500 text-slate-950" : "text-slate-400"
          }`}
        >
          Compare Live Squads
        </button>
      </div>

      {vsType === "players" ? (
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={pLeftId}
              onChange={(e) => setPLeftId(e.target.value)}
              aria-label="Left Player"
              className="h-10 px-2.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs font-bold text-emerald-300"
            >
              {META_PLAYERS_DB.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={pRightId}
              onChange={(e) => setPRightId(e.target.value)}
              aria-label="Right Player"
              className="h-10 px-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-xs font-bold text-amber-300"
            >
              {META_PLAYERS_DB.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 pt-1">
            {vsMetrics.map((m) => {
              const lWin = m.l > m.r;
              const rWin = m.r > m.l;
              return (
                <div
                  key={m.label}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 grid grid-cols-12 items-center text-xs"
                >
                  <span
                    className={`col-span-3 font-mono font-black ${
                      lWin ? "text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    {m.l}
                  </span>
                  <span className="col-span-6 text-center text-[11px] font-semibold text-slate-300">
                    {m.label}
                  </span>
                  <span
                    className={`col-span-3 text-right font-mono font-black ${
                      rWin ? "text-amber-300" : "text-slate-400"
                    }`}
                  >
                    {m.r}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : leftSquad && rightSquad ? (
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={leftSquad.id}
              onChange={(e) => setSqLeftId(e.target.value)}
              aria-label="Left Squad"
              className="h-10 px-2 rounded-xl bg-slate-950 border border-emerald-500/40 text-[11px] font-bold text-emerald-300"
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {formatSmartListingTitle(l).slice(0, 30)} · {formatCurrency(l.price)}
                </option>
              ))}
            </select>
            <select
              value={rightSquad.id}
              onChange={(e) => setSqRightId(e.target.value)}
              aria-label="Right Squad"
              className="h-10 px-2 rounded-xl bg-slate-950 border border-amber-500/40 text-[11px] font-bold text-amber-300"
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {formatSmartListingTitle(l).slice(0, 30)} · {formatCurrency(l.price)}
                </option>
              ))}
            </select>
          </div>

          {[
            {
              label: "KES Price",
              l: formatCurrency(leftSquad.price),
              r: formatCurrency(rightSquad.price),
              win: Number(leftSquad.price) <= Number(rightSquad.price) ? "L" : "R",
            },
            {
              label: "Team OVR",
              l: String(leftSquad.overall_team_strength || 0),
              r: String(rightSquad.overall_team_strength || 0),
              win:
                (leftSquad.overall_team_strength || 0) >=
                (rightSquad.overall_team_strength || 0)
                  ? "L"
                  : "R",
            },
            {
              label: "Epics + Big Times",
              l: String(
                (leftSquad.epic_players_count || 0) +
                  (leftSquad.big_time_players_count || 0)
              ),
              r: String(
                (rightSquad.epic_players_count || 0) +
                  (rightSquad.big_time_players_count || 0)
              ),
              win:
                (leftSquad.epic_players_count || 0) +
                  (leftSquad.big_time_players_count || 0) >=
                (rightSquad.epic_players_count || 0) +
                  (rightSquad.big_time_players_count || 0)
                  ? "L"
                  : "R",
            },
            {
              label: "Coins Included",
              l: (leftSquad.coin_balance || 0).toLocaleString(),
              r: (rightSquad.coin_balance || 0).toLocaleString(),
              win: (leftSquad.coin_balance || 0) >= (rightSquad.coin_balance || 0) ? "L" : "R",
            },
          ].map((row) => (
            <div
              key={row.label}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-12 items-center text-xs"
            >
              <span
                className={`col-span-4 font-mono font-extrabold ${
                  row.win === "L" ? "text-emerald-400" : "text-slate-300"
                }`}
              >
                {row.l}
              </span>
              <span className="col-span-4 text-center text-[10px] font-bold text-slate-400">
                {row.label}
              </span>
              <span
                className={`col-span-4 text-right font-mono font-extrabold ${
                  row.win === "R" ? "text-amber-300" : "text-slate-300"
                }`}
              >
                {row.r}
              </span>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href={`/listings/${leftSquad.id}`}
              className="py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold text-center flex items-center justify-center gap-1"
            >
              <span>Inspect Left</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href={`/listings/${rightSquad.id}`}
              className="py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-extrabold text-center flex items-center justify-center gap-1"
            >
              <span>Inspect Right</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
          <Swords className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
          Need at least 2 live squads to compare side-by-side.
        </div>
      )}
    </div>
  );
}
