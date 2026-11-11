"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, Lock, Shield, ShieldCheck } from "lucide-react";

export function TrustBadgeGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl bg-sx-subtle border border-sx-border px-4 py-3 text-xs">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <HelpCircle className="w-4 h-4 text-sx-green-text shrink-0" />
          <span className="font-bold text-sx-ink">
            What do Seller Badges &amp; Escrow Protection mean?
          </span>
          <span className="hidden sm:inline text-sx-muted">
            — See exactly what we check before and after you pay
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-sx-green-text font-semibold shrink-0">
          <span>{open ? "Hide" : "Explain"}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3.5 mt-3 border-t border-sx-border">
          <div className="p-3 rounded-lg bg-sx-canvas border border-sx-border space-y-1">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sx-elevated border border-sx-border-strong/70 text-[10.5px] font-semibold text-sx-muted">
              <Shield className="w-3 h-3" />
              <span>New Seller</span>
            </div>
            <p className="text-[11px] text-sx-ink-soft leading-relaxed pt-1">
              <strong>Checked:</strong> Email &amp; Kenyan phone number.{" "}
              <strong>0 sales so far</strong> and ID not yet submitted. Your M-Pesa payment still stays in escrow until you log in and check the squad.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-sx-canvas border border-sx-border space-y-1">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sx-info-tint border border-sx-info-border text-[10.5px] font-semibold text-sx-info-text">
              <ShieldCheck className="w-3 h-3" />
              <span>Proven Seller · 1+ Sales</span>
            </div>
            <p className="text-[11px] text-sx-ink-soft leading-relaxed pt-1">
              <strong>Checked:</strong> Previous buyers on eFootballMarket logged into the delivered squads and confirmed the accounts matched before releasing payment.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-sx-canvas border border-sx-border space-y-1">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sx-green-tint border border-sx-green-border text-[10.5px] font-semibold text-sx-green-text">
              <ShieldCheck className="w-3 h-3" />
              <span>ID-Verified Seller</span>
            </div>
            <p className="text-[11px] text-sx-ink-soft leading-relaxed pt-1">
              <strong>Checked:</strong> Kenyan National ID / Passport and matching Safaricom M-Pesa number reviewed by our team.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-sx-canvas border border-sx-border space-y-1">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sx-stone border border-sx-border text-[10.5px] font-semibold text-sx-ink">
              <Lock className="w-3 h-3 text-sx-green-text" />
              <span>24h Escrow Check</span>
            </div>
            <p className="text-[11px] text-sx-ink-soft leading-relaxed pt-1">
              <strong>Every order:</strong> We do not pre-login to seller accounts before listing. Instead, we hold your M-Pesa payment on Till <strong>1572931</strong> for <strong>24 hours</strong> so you verify the squad and <em>Link Data = Not Linked</em> yourself before payout.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
