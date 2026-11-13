"use client";

import React, { useMemo, useState } from "react";
import {
  BOOSTER_MANAGERS,
  META_PLAYERS_DB,
  MetaPlayerCard,
  PitchPosition,
  computeAllocatedStats,
} from "@/lib/data/appMetaPlayers";
import { Sparkles, Shuffle, Search, X } from "lucide-react";

interface SquadPitchBuilderProps {
  onMatchSquadInMarket: (minOvr: number) => void;
}

interface FormationSlot {
  slotId: string;
  pos: PitchPosition;
  x: number; // % from left
  y: number; // % from top
  defaultCardId: string;
}

const FORMATIONS: Record<string, { label: string; slots: FormationSlot[] }> = {
  "4-2-1-3": {
    label: "4-2-1-3 Meta QC",
    slots: [
      { slotId: "s1", pos: "LWF", x: 18, y: 18, defaultCardId: "neymar-epic-santos" },
      { slotId: "s2", pos: "CF", x: 50, y: 12, defaultCardId: "rummenigge-epic" },
      { slotId: "s3", pos: "RWF", x: 82, y: 18, defaultCardId: "messi-bt-2015" },
      { slotId: "s4", pos: "AMF", x: 50, y: 34, defaultCardId: "gullit-epic" },
      { slotId: "s5", pos: "DMF", x: 34, y: 52, defaultCardId: "vieira-epic" },
      { slotId: "s6", pos: "CMF", x: 66, y: 52, defaultCardId: "pirlo-epic" },
      { slotId: "s7", pos: "LB", x: 15, y: 72, defaultCardId: "costacurta-epic" },
      { slotId: "s8", pos: "CB", x: 38, y: 74, defaultCardId: "maldini-epic" },
      { slotId: "s9", pos: "CB", x: 62, y: 74, defaultCardId: "araujo-bt" },
      { slotId: "s10", pos: "RB", x: 85, y: 72, defaultCardId: "thuram-epic" },
      { slotId: "s11", pos: "GK", x: 50, y: 90, defaultCardId: "schmeichel-epic" },
    ],
  },
  "4-2-2-2": {
    label: "4-2-2-2 Double AMF",
    slots: [
      { slotId: "s1", pos: "CF", x: 35, y: 14, defaultCardId: "rummenigge-epic" },
      { slotId: "s2", pos: "CF", x: 65, y: 14, defaultCardId: "etoo-epic" },
      { slotId: "s3", pos: "AMF", x: 24, y: 34, defaultCardId: "cruyff-epic" },
      { slotId: "s4", pos: "AMF", x: 76, y: 34, defaultCardId: "hoeness-epic" },
      { slotId: "s5", pos: "DMF", x: 36, y: 53, defaultCardId: "vieira-epic" },
      { slotId: "s6", pos: "DMF", x: 64, y: 53, defaultCardId: "rijkaard-epic" },
      { slotId: "s7", pos: "LB", x: 15, y: 72, defaultCardId: "carlos-epic" },
      { slotId: "s8", pos: "CB", x: 38, y: 74, defaultCardId: "maldini-epic" },
      { slotId: "s9", pos: "CB", x: 62, y: 74, defaultCardId: "araujo-bt" },
      { slotId: "s10", pos: "RB", x: 85, y: 72, defaultCardId: "thuram-epic" },
      { slotId: "s11", pos: "GK", x: 50, y: 90, defaultCardId: "cech-epic" },
    ],
  },
  "3-2-4-1": {
    label: "3-2-4-1 Meta LBC",
    slots: [
      { slotId: "s1", pos: "CF", x: 50, y: 12, defaultCardId: "mbappe-st" },
      { slotId: "s2", pos: "LWF", x: 16, y: 30, defaultCardId: "ronaldinho-epic" },
      { slotId: "s3", pos: "AMF", x: 38, y: 32, defaultCardId: "gullit-epic" },
      { slotId: "s4", pos: "AMF", x: 62, y: 32, defaultCardId: "bellingham-st" },
      { slotId: "s5", pos: "RWF", x: 84, y: 30, defaultCardId: "messi-bt-2015" },
      { slotId: "s6", pos: "DMF", x: 36, y: 53, defaultCardId: "vieira-epic" },
      { slotId: "s7", pos: "DMF", x: 64, y: 53, defaultCardId: "davids-epic" },
      { slotId: "s8", pos: "CB", x: 24, y: 74, defaultCardId: "maldini-epic" },
      { slotId: "s9", pos: "CB", x: 50, y: 76, defaultCardId: "nesta-epic" },
      { slotId: "s10", pos: "CB", x: 76, y: 74, defaultCardId: "araujo-bt" },
      { slotId: "s11", pos: "GK", x: 50, y: 90, defaultCardId: "schmeichel-epic" },
    ],
  },
};

export function SquadPitchBuilder({ onMatchSquadInMarket }: SquadPitchBuilderProps) {
  const [formationKey, setFormationKey] = useState<string>("4-2-1-3");
  const [managerId, setManagerId] = useState<string>(BOOSTER_MANAGERS[0].id);
  const [customSlots, setCustomSlots] = useState<Record<string, string>>({});
  const [editingSlot, setEditingSlot] = useState<FormationSlot | null>(null);

  const formation = FORMATIONS[formationKey] || FORMATIONS["4-2-1-3"];
  const manager =
    BOOSTER_MANAGERS.find((m) => m.id === managerId) || BOOSTER_MANAGERS[0];

  const resolvedPitch = useMemo(() => {
    return formation.slots.map((slot) => {
      const cardId = customSlots[`${formationKey}:${slot.slotId}`] || slot.defaultCardId;
      const card =
        META_PLAYERS_DB.find((p) => p.id === cardId) || META_PLAYERS_DB[0];
      const maxBuild = computeAllocatedStats(
        card,
        card.metaAllocation,
        true,
        "strikers"
      );
      return {
        ...slot,
        card,
        ovr: maxBuild.boostedOvr,
      };
    });
  }, [formation, formationKey, customSlots]);

  const collectiveStrength = useMemo(() => {
    const avgOvr =
      resolvedPitch.reduce((acc, s) => acc + s.ovr, 0) /
      Math.max(1, resolvedPitch.length);
    // Authentic eFootball Collective Strength scaling (~3180-3265 for 102-105 avg XI)
    return Math.round(2160 + avgOvr * 10.2 + manager.ovrBonus * 3);
  }, [resolvedPitch, manager]);

  const estimatedKes = useMemo(() => {
    const epicCount = resolvedPitch.filter(
      (s) => s.card.tier === "epic_booster" || s.card.tier === "big_time"
    ).length;
    return Math.round((3200 + epicCount * 420 + (collectiveStrength - 3150) * 28) / 100) * 100;
  }, [resolvedPitch, collectiveStrength]);

  const randomizeMetaXI = () => {
    const next: Record<string, string> = {};
    formation.slots.forEach((slot) => {
      const candidates = META_PLAYERS_DB.filter(
        (p) => p.position === slot.pos || p.altPositions.includes(slot.pos)
      );
      const pool = candidates.length > 0 ? candidates : META_PLAYERS_DB;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      next[`${formationKey}:${slot.slotId}`] = pick.id;
    });
    setCustomSlots((prev) => ({ ...prev, ...next }));
  };

  return (
    <div className="space-y-3.5">
      {/* Top Team Strength & Formation Bar */}
      <div className="p-3.5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-extrabold">
              11v11 Dream XI Pitch Lab
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-mono font-black text-white">
                {collectiveStrength}
              </span>
              <span className="text-xs font-bold text-slate-400">Collective OVR</span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase text-slate-400 font-bold">Est. Squad Value</p>
            <p className="text-sm font-mono font-extrabold text-amber-300">
              KES {Math.max(2500, estimatedKes).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={formationKey}
            onChange={(e) => setFormationKey(e.target.value)}
            aria-label="Select Formation"
            className="h-9 px-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none"
          >
            {Object.entries(FORMATIONS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          <select
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            aria-label="Select Booster Manager"
            className="h-9 px-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-emerald-300 focus:outline-none"
          >
            {BOOSTER_MANAGERS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* INTERACTIVE STADIUM FOOTBALL PITCH */}
      <div
        className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl"
        style={{
          background:
            "repeating-linear-gradient(0deg, #064e3b 0px, #064e3b 34px, #065f46 34px, #065f46 68px)",
        }}
      >
        {/* Authentic Pitch Markings */}
        <div className="absolute inset-3 border border-white/25 rounded-xl pointer-events-none">
          {/* Halfway line & center circle */}
          <div className="absolute top-1/2 inset-x-0 h-px bg-white/25" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-white/25" />
          {/* Top Penalty Box */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-16 border-b border-x border-white/25" />
          {/* Bottom Penalty Box */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-16 border-t border-x border-white/25" />
        </div>

        {/* 11 Interactive Player Tokens */}
        {resolvedPitch.map((slot) => (
          <button
            key={slot.slotId}
            type="button"
            onClick={() => setEditingSlot(slot)}
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group active:scale-95 transition-transform cursor-pointer z-10"
          >
            <div className="w-11 h-12 rounded-xl bg-slate-950/90 border-2 border-amber-400 shadow-lg flex flex-col items-center justify-center px-1 group-hover:border-emerald-300">
              <span className="text-xs font-mono font-black text-amber-300 leading-none">
                {slot.ovr}
              </span>
              <span className="text-[8px] font-extrabold text-emerald-400 uppercase leading-tight mt-0.5">
                {slot.pos}
              </span>
            </div>
            <span className="mt-0.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-white max-w-[68px] truncate">
              {slot.card.name.split(" ").pop()}
            </span>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-center text-slate-400">
        Tap any player token on the pitch to swap cards and test OVR chemistry
      </p>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={randomizeMetaXI}
          className="py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Shuffle className="w-3.5 h-3.5 text-amber-400" />
          <span>Auto-Draft Meta XI</span>
        </button>

        <button
          type="button"
          onClick={() => onMatchSquadInMarket(Math.min(3150, collectiveStrength - 60))}
          className="py-3 rounded-2xl bg-emerald-500 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Shop 3150+ Squads</span>
        </button>
      </div>

      {/* Slot Replacement Bottom Sheet */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end justify-center p-3">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 p-4 space-y-3 max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <p className="text-sm font-extrabold text-white">
                  Swap {editingSlot.pos} Slot
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-1.5 pr-1">
              {META_PLAYERS_DB.sort((a, b) => {
                const aMatch =
                  a.position === editingSlot.pos ||
                  a.altPositions.includes(editingSlot.pos)
                    ? 0
                    : 1;
                const bMatch =
                  b.position === editingSlot.pos ||
                  b.altPositions.includes(editingSlot.pos)
                    ? 0
                    : 1;
                return aMatch - bMatch;
              }).map((card: MetaPlayerCard) => {
                const maxOvr = computeAllocatedStats(
                  card,
                  card.metaAllocation,
                  true,
                  "strikers"
                ).boostedOvr;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setCustomSlots((prev) => ({
                        ...prev,
                        [`${formationKey}:${editingSlot.slotId}`]: card.id,
                      }));
                      setEditingSlot(null);
                    }}
                    className="w-full p-2.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-extrabold text-white">{card.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {card.position} · {card.playstyle} · {card.boosterName}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-amber-400/15 text-amber-300 font-mono font-black text-xs">
                      {maxOvr} OVR
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
