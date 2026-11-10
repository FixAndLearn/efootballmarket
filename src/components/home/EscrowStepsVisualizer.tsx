import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const STEPS = [
  {
    num: "1",
    title: "Choose a Squad",
    description:
      "Review Starting XI screenshots, Collective Strength (OVR), Epic player counts, and confirm the account has no Google or Apple link.",
  },
  {
    num: "2",
    title: "Pay via M-Pesa STK",
    description:
      "Approve the STK push to Till 1572931. Your payment is held by eFootballMarket while the listing locks automatically.",
  },
  {
    num: "3",
    title: "Get Login Details",
    description:
      "The seller has up to 12 hours to submit encrypted Konami ID credentials and share the email verification code in order chat.",
  },
  {
    num: "4",
    title: "24-Hour Check",
    description:
      "Log in on your phone, verify every player and coin balance, change the Konami ID email and password, and enable 2FA.",
  },
  {
    num: "5",
    title: "Release or Refund",
    description:
      "Click Release Funds to pay the seller via M-Pesa—or open a dispute before 24 hours ends if anything doesn't match.",
  },
];

export function EscrowStepsVisualizer() {
  return (
    <section className="py-14 border-b border-[#E2E2E0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F0F0F] font-display">
              How Every Trade Works
            </h2>
            <p className="text-xs sm:text-sm text-[#5F5F5F] mt-1">
              Five clear steps from M-Pesa payment to full Konami ID ownership.
            </p>
          </div>
          <Link
            href="/escrow-guarantee"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006340] hover:text-[#006340] shrink-0"
          >
            <span>Read buyer protection rules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="p-5 rounded-xl border border-[#E2E2E0] bg-white space-y-2.5"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#F4F3F1] border border-[#C8C8C4] font-mono font-semibold text-xs text-[#006340]">
                {step.num}
              </span>
              <h3 className="font-semibold text-[#0F0F0F] text-sm">
                {step.title}
              </h3>
              <p className="text-xs text-[#5F5F5F] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
