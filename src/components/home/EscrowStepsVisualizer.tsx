"use client";

import React from "react";
import Link from "next/link";
import {
  CreditCard,
  KeyRound,
  Smartphone,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface Step {
  num: string;
  title: string;
  subtitle: string;
  tag: string;
  icon: any;
  details: string[];
}

const STEPS: Step[] = [
  {
    num: "01",
    title: "Buyer Selects Squad",
    subtitle: "Verified specs & screenshot proof",
    tag: "Catalog",
    icon: Sparkles,
    details: [
      "Check team collective strength (OVR)",
      "Verify Epics, Big Time & coin balance",
      "Confirm Google Play & Game Center unlinked",
    ],
  },
  {
    num: "02",
    title: "M-Pesa Escrow Deposit",
    subtitle: "Locked safely in Till 1572931",
    tag: "STK Push",
    icon: CreditCard,
    details: [
      "Instant STK push prompt to Safaricom phone",
      "Funds held in segregated Till 1572931",
      "Seller cannot touch funds before approval",
    ],
  },
  {
    num: "03",
    title: "Credentials Handshake",
    subtitle: "AES-256 encrypted vault delivery",
    tag: "AES-256 Vault",
    icon: KeyRound,
    details: [
      "Seller submits Konami ID & login password",
      "Automated encryption with full audit trail",
      "Credentials revealed exclusively to buyer",
    ],
  },
  {
    num: "04",
    title: "24-Hour Inspection & Bind",
    subtitle: "Test on device & secure account",
    tag: "24h Window",
    icon: Smartphone,
    details: [
      "Log into eFootball Mobile on your device",
      "Bind your personal email to Konami ID",
      "Enable Konami Two-Factor Authentication",
    ],
  },
  {
    num: "05",
    title: "Release or Full Refund",
    subtitle: "Payout disbursed only when satisfied",
    tag: "Settlement",
    icon: CheckCircle2,
    details: [
      "Click 'Release Funds' once satisfied",
      "Seller receives instant M-Pesa payout",
      "100% refund if credentials or specs fail",
    ],
  },
];

export function EscrowStepsVisualizer() {
  return (
    <section className="py-14 md:py-20 border-b border-slate-800/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-emerald-400">
            How Escrow Works
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-display tracking-tight mt-1">
            The 5-Step Escrow Guarantee
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
            Every trade follows a strict custody pipeline so neither buyer nor seller ever takes blind risk.
          </p>
        </div>

        {/* 5-Step Timeline Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-5 rounded-2xl border border-slate-800 bg-[#0B1424] flex flex-col justify-between transition-colors hover:border-slate-700"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      {step.num}
                    </span>
                    <span className="text-[9px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#070D18] border border-slate-800 text-slate-400">
                      {step.tag}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <Icon className="w-4 h-4 shrink-0 text-emerald-400" />
                    <h3 className="font-bold text-white text-sm leading-tight">
                      {step.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.subtitle}
                  </p>

                  <div className="pt-3 border-t border-slate-800/90 space-y-1.5">
                    {step.details.map((detail, dIdx) => (
                      <div key={dIdx} className="flex items-start gap-1.5 text-[11px] text-slate-300 leading-snug">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Clean Institutional Guarantee Callout */}
        <div className="rounded-3xl bg-[#0B1424] border border-emerald-500/30 p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base sm:text-lg font-extrabold text-white font-display flex items-center gap-2">
                  <span>Zero Prepayment Risk</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase">
                    Guaranteed
                  </span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                  The seller <strong className="text-white">never touches your money</strong> until you log in on your device, confirm the squad matches every screenshot, update the Konami ID email &amp; password, and click &apos;Release Funds&apos;.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link href="/browse">
                <button
                  type="button"
                  className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <span>Browse Squads</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
              <Link href="/escrow-guarantee">
                <button
                  type="button"
                  className="px-4 py-3 rounded-xl bg-[#070D18] hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition-colors"
                >
                  Read Rules
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
