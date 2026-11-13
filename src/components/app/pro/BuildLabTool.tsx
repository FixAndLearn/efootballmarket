"use client";

import React, { useMemo, useState } from "react";
import {
  META_PLAYERS_DB,
  SECOND_BOOSTERS,
  calcCategoryPointCost,
  computeAllocatedStats,
} from "@/lib/data/appMetaPlayers";
import { Sparkles, RotateCcw, Search, Zap, Plus, Minus } from "lucide-react";

interface BuildLabToolProps {
  onFindPlayerInMarket: (playerName: string) => void;
}

const CATEGORIES = [
  { idx: 0, label: "Shooting", short: "SHT", color: "text-rose-400" },
  { idx: 1, label: "Passing", short: "PAS", color: "text-sky-400" },
  { idx: 2, label: "Dribbling", short: "DRI", color: "text-amber-400" },
  { idx: 3, label: "Dexterity", short: "DEX", color: "text-emerald-400" },
  { idx: 4, label: "Lower Body", short: "LBS", color: "text-cyan-400" },
  { idx: 5, label: "Aerial", short: "AER", color: "text-orange-400" },
  { idx: 6, label: "Defending", short: "DEF", color: "text-indigo-400" },
  { idx: 7, label: "GK 1/2/3", short: "GK", color: "text-purple-400" },
] as const;

function getStatBadgeStyle(val: number): string {
  if (val >= 100) return "bg-fuchsia-500/25 text-fuchsia-300 border-fuchsia-500/50";
  if (val >= 90) return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
  if (val >= 80) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  if (val >= 70) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return "bg-slate-900 text-slate-400 border-slate-800";
}

function triggerHaptic(ms = 12) {
  try {
    if (typeof window !== "undefined" && (window as any).EFMNative?.vibrate) {
      (window as any).EFMNative.vibrate(ms);
    } else if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  } catch {
    // ignore
  }
}

export function BuildLabTool({ onFindPlayerInMarket }: BuildLabToolProps) {
  const [selectedId, setSelectedId] = useState(META_PLAYERS_DB[0].id);
  const [playerSearch, setPlayerSearch] = useState("");
  const [alloc, setAlloc] = useState<
    [number, number, number, number, number, number, number, number]
  >([...META_PLAYERS_DB[0].metaAllocation]);
  const [managerBoost, setManagerBoost] = useState(true);
  const [secondBooster, setSecondBooster] = useState("strikers");

  const player = useMemo(
    () => META_PLAYERS_DB.find((p) => p.id === selectedId) || META_PLAYERS_DB[0],
    [selectedId]
  );

  const filteredPlayers = useMemo(() => {
    if (!playerSearch.trim()) return META_PLAYERS_DB;
    const q = playerSearch.toLowerCase();
    return META_PLAYERS_DB.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q) ||
        p.playstyle.toLowerCase().includes(q)
    );
  }, [playerSearch]);

  const computed = useMemo(
    () => computeAllocatedStats(player, alloc, managerBoost, secondBooster),
    [player, alloc, managerBoost, secondBooster]
  );

  const selectCard = (id: string) => {
    const found = META_PLAYERS_DB.find((p) => p.id === id);
    if (!found) return;
    triggerHaptic(15);
    setSelectedId(id);
    setAlloc([...found.metaAllocation]);
    setSecondBooster(found.position === "GK" ? "goalkeeping" : found.position === "CB" || found.position === "DMF" ? "shutdown" : "strikers");
  };

  const stepCategory = (idx: number, delta: 1 | -1) => {
    setAlloc((prev) => {
      const cur = prev[idx];
      const nextLvl = cur + delta;
      if (nextLvl < 0 || nextLvl > 16) return prev;
      const nextArr = [...prev] as [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number
      ];
      nextArr[idx] = nextLvl;
      const totalUsed = nextArr.reduce(
        (sum, lvl) => sum + calcCategoryPointCost(lvl),
        0
      );
      if (delta > 0 && totalUsed > player.maxPoints) {
        return prev;
      }
      triggerHaptic(10);
      return nextArr;
    });
  };

  const tierGradient =
    player.tier === "big_time"
      ? "from-fuchsia-950/90 via-slate-900 to-amber-950/40 border-fuchsia-500/40"
      : player.tier === "show_time"
      ? "from-cyan-950/90 via-slate-900 to-slate-900 border-cyan-500/40"
      : "from-amber-950/80 via-slate-900 to-emerald-950/40 border-amber-500/40";

  const statRows: Array<{ label: string; value: number }> = [
    { label: "Offensive Awareness", value: computed.stats.offensiveAwareness },
    { label: "Ball Control", value: computed.stats.ballControl },
    { label: "Dribbling", value: computed.stats.dribbling },
    { label: "Tight Possession", value: computed.stats.tightPossession },
    { label: "Low Pass", value: computed.stats.lowPass },
    { label: "Lofted Pass", value: computed.stats.loftedPass },
    { label: "Finishing", value: computed.stats.finishing },
    { label: "Curl", value: computed.stats.curl },
    { label: "Speed", value: computed.stats.speed },
    { label: "Acceleration", value: computed.stats.acceleration },
    { label: "Kicking Power", value: computed.stats.kickingPower },
    { label: "Balance", value: computed.stats.balance },
    { label: "Physical Contact", value: computed.stats.physicalContact },
    { label: "Jumping", value: computed.stats.jumping },
    { label: "Stamina", value: computed.stats.stamina },
    { label: "Defensive Awareness", value: computed.stats.defensiveAwareness },
    { label: "Tackling", value: computed.stats.tackling },
    { label: "Defensive Engagement", value: computed.stats.defensiveEngagement },
    { label: "Aggression", value: computed.stats.aggression },
    { label: "GK Reflexes", value: computed.stats.gkReflexes },
  ];

  return (
    <div className="space-y-3.5">
      {/* Player Picker Strip */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={playerSearch}
            onChange={(e) => setPlayerSearch(e.target.value)}
            placeholder="Pick Epic / Big Time card (Rummenigge, Messi, Vieira...)"
            className="w-full h-9 pl-8 pr-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {filteredPlayers.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectCard(p.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap border transition-all cursor-pointer ${
                p.id === selectedId
                  ? "bg-amber-400 text-slate-950 border-amber-300 shadow"
                  : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
              }`}
            >
              <span className="font-mono mr-1 opacity-75">{p.position}</span>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Live Foil Card Header */}
      <div className={`p-4 rounded-3xl bg-gradient-to-br ${tierGradient} border space-y-3`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-16 rounded-2xl bg-black/60 border border-amber-400/50 flex flex-col items-center justify-center shrink-0 shadow-inner">
              <span className="text-xl font-mono font-black text-amber-300 leading-none">
                {computed.boostedOvr}
              </span>
              <span className="text-[10px] font-extrabold text-emerald-400 mt-0.5">
                {player.position}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[9px] font-extrabold uppercase">
                  {player.tier.replace("_", " ")}
                </span>
                <span className="text-[10px] text-slate-300 truncate">
                  {player.playstyle}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white truncate mt-0.5">
                {player.name}
              </h3>
              <p className="text-[11px] text-emerald-300 font-semibold truncate">
                {player.boosterName} · {player.clubOrNation}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase text-slate-400 font-bold">Points Left</p>
            <p
              className={`text-lg font-mono font-black ${
                computed.remainingPoints === 0 ? "text-slate-300" : "text-emerald-400"
              }`}
            >
              {computed.remainingPoints}
              <span className="text-xs text-slate-400">/{player.maxPoints}</span>
            </p>
          </div>
        </div>

        {/* Manager 88 Boost + 2nd Booster Row */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setManagerBoost((b) => !b);
            }}
            className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
              managerBoost
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                : "bg-slate-950/70 border-slate-800 text-slate-400"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>88 Manager {managerBoost ? "ON (+3)" : "OFF"}</span>
          </button>

          <select
            value={secondBooster}
            onChange={(e) => setSecondBooster(e.target.value)}
            aria-label="Select Second Booster"
            className="h-9 px-2.5 rounded-xl bg-slate-950/90 border border-slate-700 text-[11px] font-bold text-amber-300 focus:outline-none"
          >
            <option value="">No 2nd Booster</option>
            {SECOND_BOOSTERS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progression Allocator Controls */}
      <div className="p-3.5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-white">
            Progression Point Allocator
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                setAlloc([...player.metaAllocation]);
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Div-1 Meta</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic(12);
                setAlloc([0, 0, 0, 0, 0, 0, 0, 0]);
              }}
              className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => {
            const lvl = alloc[cat.idx];
            return (
              <div
                key={cat.idx}
                className="p-2 rounded-2xl bg-slate-950 border border-slate-800/90 flex items-center justify-between gap-1.5"
              >
                <div className="min-w-0">
                  <p className={`text-[10px] font-extrabold ${cat.color} truncate`}>
                    {cat.label}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    +{lvl} ({calcCategoryPointCost(lvl)}p)
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => stepCategory(cat.idx, -1)}
                    className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center active:scale-90 cursor-pointer"
                    aria-label={`Decrease ${cat.label}`}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center font-mono font-extrabold text-xs text-white">
                    {lvl}
                  </span>
                  <button
                    type="button"
                    onClick={() => stepCategory(cat.idx, 1)}
                    className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center active:scale-90 cursor-pointer"
                    aria-label={`Increase ${cat.label}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live 20-Attribute Color-Coded Breakdown */}
      <div className="p-3.5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5">
        <p className="text-xs font-extrabold text-white">
          Live In-Game Attributes (90+ Cyan · 100+ Violet)
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {statRows.map((row) => (
            <div
              key={row.label}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/70 flex items-center justify-between gap-1"
            >
              <span className="text-[10px] text-slate-300 truncate">{row.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded border text-[11px] font-mono font-extrabold ${getStatBadgeStyle(
                  row.value
                )}`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onFindPlayerInMarket(player.name.split(" ")[1] || player.name)}
          className="w-full mt-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span>Find Listed Squads With {player.name}</span>
        </button>
      </div>
    </div>
  );
}
