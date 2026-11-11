"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { formatSmartListingTitle } from "@/lib/utils";
import { Listing } from "@/types/database";
import {
  AlertCircle,
  CheckCircle2,
  Repeat2,
  ShieldCheck,
  X,
} from "lucide-react";

interface ProposeSwapModalProps {
  listing: Listing;
}

export function ProposeSwapModal({ listing }: ProposeSwapModalProps) {
  const { displayName, profile } = useAuth();
  const [open, setOpen] = useState(false);

  const [buyerName, setBuyerName] = useState(displayName || "");
  const [buyerPhone, setBuyerPhone] = useState(profile?.phone_number || "");
  const [yourOvr, setYourOvr] = useState("");
  const [yourPlatform, setYourPlatform] = useState(listing.platform || "android");
  const [yourEpicsAndPlayers, setYourEpicsAndPlayers] = useState("");
  const [cashTopUp, setCashTopUp] = useState(
    String(Math.max(500, Math.round((Number(listing.price || 2000) * 0.35) / 100) * 100))
  );
  const [cleanIdReady, setCleanIdReady] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const displayTitle = formatSmartListingTitle(listing);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const ovrNum = Number(yourOvr);
    if (!ovrNum || ovrNum < 2000) {
      setError("Enter your trade-in squad's OVR (minimum 2000 OVR).");
      return;
    }

    const topUpNum = Number(cashTopUp);
    if (!topUpNum || topUpNum < 100) {
      setError("Enter a cash top-up / escrow deposit of at least KES 100.");
      return;
    }

    if (!cleanIdReady) {
      setError(
        "Your trade-in squad must also have Google Play / Apple Game Center unlinked for safe escrow swap."
      );
      return;
    }

    if (!buyerPhone.trim()) {
      setError("Enter your M-Pesa / WhatsApp phone number so we can notify you when the seller replies.");
      return;
    }

    setSubmitting(true);
    try {
      const swapSummary = `[SWAP PROPOSAL] Offering ${ovrNum} OVR (${yourPlatform.replace(
        /_/g,
        " "
      )}) squad${
        yourEpicsAndPlayers.trim() ? ` [${yourEpicsAndPlayers.trim()}]` : ""
      } + KES ${topUpNum.toLocaleString()} M-Pesa Till 1572931 top-up. Clean Konami ID confirmed.`;

      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listing.id,
          buyer_name: (buyerName || displayName || "Verified Trader").trim(),
          buyer_phone: buyerPhone.trim(),
          offered_price: topUpNum,
          note: swapSummary.slice(0, 300),
          is_swap_proposal: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send swap proposal.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Could not submit swap proposal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSubmitted(false);
          setError("");
          setOpen(true);
        }}
        className="w-full py-2.5 px-4 rounded-xl bg-sx-green-tint hover:opacity-90 border border-sx-green-border text-sx-green-text text-xs font-bold flex items-center justify-center gap-2 transition-opacity cursor-pointer"
      >
        <Repeat2 className="w-4 h-4" />
        <span>Propose Squad Swap + Cash Top-Up</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-lg bg-sx-canvas border-t sm:border border-sx-border rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-sx-border flex items-center justify-between gap-3 bg-sx-subtle">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-sx-green-tint border border-sx-green-border text-sx-green-text flex items-center justify-center shrink-0">
                  <Repeat2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-sx-ink font-display truncate">
                    Propose Escrow Squad Swap
                  </h3>
                  <p className="text-[11px] text-sx-muted truncate">
                    Target: {displayTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-sx-muted hover:text-sx-ink cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {submitted ? (
                <div className="py-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-sx-green-tint border border-sx-green-border text-sx-green-text flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-extrabold text-sx-ink font-display">
                    Swap Proposal Sent to Seller!
                  </h4>
                  <p className="text-xs sm:text-sm text-sx-muted leading-relaxed max-w-sm mx-auto">
                    The seller has been notified via SMS &amp; Seller Hub. Once accepted, your{" "}
                    <strong>KES {Number(cashTopUp).toLocaleString()}</strong> top-up locks into{" "}
                    <strong>M-Pesa Till 1572931</strong> while our Escrow Middleman verifies both Konami IDs before swapping.
                  </p>
                  <div className="pt-2">
                    <Button variant="primary" size="md" onClick={() => setOpen(false)}>
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {listing.swap_preferences && (
                    <div className="p-3 rounded-xl bg-sx-subtle border border-sx-border text-xs text-sx-ink">
                      <span className="font-bold text-sx-green-text block mb-0.5">
                        Seller&apos;s Swap Preference:
                      </span>
                      <span>{listing.swap_preferences}</span>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 rounded-xl bg-sx-red-tint border border-sx-red-border text-xs text-sx-red-text flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Your Name / Handle"
                      placeholder="e.g. Brian_KE"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      required
                    />
                    <Input
                      label="M-Pesa / WhatsApp Phone"
                      placeholder="0712 345 678"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Your Squad OVR"
                      type="number"
                      placeholder="e.g. 3165"
                      value={yourOvr}
                      onChange={(e) => setYourOvr(e.target.value)}
                      required
                    />
                    <div>
                      <label className="block text-xs font-semibold text-sx-ink mb-1.5">
                        Your Squad Platform
                      </label>
                      <select
                        value={yourPlatform}
                        onChange={(e) => setYourPlatform(e.target.value as any)}
                        className="w-full h-10 bg-sx-canvas border border-sx-border-strong rounded-md px-3 text-sm text-sx-ink focus:outline-none focus:border-sx-green"
                      >
                        <option value="android">Android Mobile</option>
                        <option value="ios">iOS (iPhone)</option>
                        <option value="playstation_5">PlayStation 5</option>
                        <option value="playstation_4">PlayStation 4</option>
                        <option value="pc_steam">PC / Steam</option>
                        <option value="xbox_series_x">Xbox Series X/S</option>
                      </select>
                    </div>
                  </div>

                  <Input
                    label="Your Key Epics / Coaches"
                    placeholder="e.g. 8 Epics (Rummenigge, Vieira, Xabi Alonso 88)"
                    value={yourEpicsAndPlayers}
                    onChange={(e) => setYourEpicsAndPlayers(e.target.value)}
                    required
                  />

                  <Input
                    label="Cash Top-Up You Will Add via Till 1572931 (KES)"
                    type="number"
                    placeholder="e.g. 1500"
                    value={cashTopUp}
                    onChange={(e) => setCashTopUp(e.target.value)}
                    required
                  />

                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-sx-green-tint border border-sx-green-border cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleanIdReady}
                      onChange={(e) => setCleanIdReady(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-emerald-600 cursor-pointer"
                    />
                    <span className="text-[11px] text-sx-ink leading-relaxed">
                      My trade-in squad uses a <strong>Clean Konami ID</strong> (Google Play &amp; Apple Game Center unlinked) and I understand both accounts are verified by Escrow before swap release.
                    </span>
                  </label>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-[11px] text-sx-muted inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-sx-green-text shrink-0" />
                      <span>Never swap passwords in DMs</span>
                    </span>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      isLoading={submitting}
                    >
                      Send Swap Proposal
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
