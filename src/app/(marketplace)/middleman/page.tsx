"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { normalizePhoneNumber } from "@/lib/utils/phone";
import { MiddlemanDeal } from "@/app/api/middleman/route";
import { AdBanner } from "@/components/common/AdBanner";
import {
  Handshake,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Smartphone,
  ExternalLink,
  MessageCircle,
  Clock,
  Lock,
  Search,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Share2,
  Link2,
  Check,
} from "lucide-react";

function MiddlemanContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"create" | "generator" | "track">("create");

  // Create Deal Form
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [dealTitle, setDealTitle] = useState("");
  const [dealDescription, setDealDescription] = useState("");
  const [dealAmount, setDealAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdDeal, setCreatedDeal] = useState<MiddlemanDeal | null>(null);
  const [formError, setFormError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Generator State
  const [genTitle, setGenTitle] = useState("");
  const [genAmount, setGenAmount] = useState("");
  const [genSellerPhone, setGenSellerPhone] = useState("");
  const [genBuyerPhone, setGenBuyerPhone] = useState("");
  const [copiedInviteText, setCopiedInviteText] = useState(false);
  const [copiedInviteUrl, setCopiedInviteUrl] = useState(false);

  // Track Deal
  const [searchCode, setSearchCode] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedDeals, setTrackedDeals] = useState<MiddlemanDeal[] | null>(null);
  const [trackError, setTrackError] = useState("");

  const searchDealByCode = async (codeToSearch: string) => {
    if (!codeToSearch) return;
    setTrackingLoading(true);
    setTrackError("");
    try {
      const isPhone = codeToSearch.replace(/[^0-9]/g, "").length >= 9;
      const url = isPhone
        ? `/api/middleman?phone=${encodeURIComponent(codeToSearch)}`
        : `/api/middleman?code=${encodeURIComponent(codeToSearch)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.deals && data.deals.length > 0) {
        setTrackedDeals(data.deals);
      } else {
        setTrackError("No active escrow contract found with this code or phone.");
        setTrackedDeals([]);
      }
    } catch {
      setTrackError("Error searching for deal.");
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    const qCode = searchParams.get("code");
    const qTitle = searchParams.get("title");
    const qAmount = searchParams.get("amount");
    const qSeller = searchParams.get("seller") || searchParams.get("seller_phone");
    const qBuyer = searchParams.get("buyer") || searchParams.get("buyer_phone");
    const qTab = searchParams.get("tab");

    if (qCode) {
      setSearchCode(qCode);
      setActiveTab("track");
      searchDealByCode(qCode);
    } else if (qTitle || qAmount || qSeller || qBuyer) {
      if (qTitle) {
        setDealTitle(qTitle);
        setGenTitle(qTitle);
      }
      if (qAmount) {
        setDealAmount(qAmount);
        setGenAmount(qAmount);
      }
      if (qSeller) {
        setSellerPhone(qSeller);
        setGenSellerPhone(qSeller);
      }
      if (qBuyer) {
        setBuyerPhone(qBuyer);
        setGenBuyerPhone(qBuyer);
      }
      if (qTab === "generator") {
        setActiveTab("generator");
      } else {
        setActiveTab("create");
      }
    } else if (qTab === "generator") {
      setActiveTab("generator");
    }
  }, [searchParams]);

  const numAmount = Number(dealAmount) || 0;
  const escrowFee = numAmount > 0 ? Math.max(50, Math.min(500, Math.round(numAmount * 0.05))) : 0;
  const sellerNetPayout = Math.max(0, numAmount - escrowFee);
  const totalPayable = numAmount;

  const appBaseUrl = typeof window !== "undefined" ? window.location.origin : "https://www.efootballmarket.co.ke";
  const effectiveGenTitle = genTitle || dealTitle || "";
  const effectiveGenAmount = genAmount || dealAmount || "";
  const displayAmount = effectiveGenAmount ? `KES ${Number(effectiveGenAmount).toLocaleString()}` : "Agreed Price";
  const generatedInviteUrl = `${appBaseUrl}/middleman?title=${encodeURIComponent(effectiveGenTitle || "eFootball Deal")}${effectiveGenAmount ? `&amount=${encodeURIComponent(effectiveGenAmount)}` : ""}${genSellerPhone ? `&seller=${encodeURIComponent(genSellerPhone)}` : ""}${genBuyerPhone ? `&buyer=${encodeURIComponent(genBuyerPhone)}` : ""}`;

  const generatedWhatsAppGroupMessage =
    `*eFootballMarket Middleman Contract*\n\n` +
    `*Squad / Item:* ${effectiveGenTitle || "eFootball Account"}\n` +
    `*Agreed Price (Buyer Pays):* ${displayAmount} (KES 0 extra buyer fee)\n` +
    `*Payment Account:* M-Pesa Buy Goods Till 1572931 (eFootballMarket Kenya)\n` +
    `*Support Desk:* +254 794 400 365 (support@efootballmarket.co.ke)\n\n` +
    `*How Funds Are Held:* Safaricom M-Pesa transfers payment to Till 1572931; eFootballMarket holds the funds during the buyer's 24-hour login & Konami ID check, then sends seller net payout (minus 5% fee, KES 50–500).\n\n` +
    `*Open Contract:* ${generatedInviteUrl}`;

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!buyerPhone || !sellerPhone || !dealTitle || !dealAmount) {
      setFormError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/middleman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_name: buyerName || "Verified Buyer",
          buyer_phone: normalizePhoneNumber(buyerPhone).international,
          seller_name: sellerName || "Verified Seller",
          seller_phone: normalizePhoneNumber(sellerPhone).international,
          deal_title: dealTitle,
          deal_description: dealDescription,
          item_amount_kes: numAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create escrow contract");
      }

      setCreatedDeal(data.deal);
    } catch (err: any) {
      setFormError(err.message || "Failed to create deal.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError("");

    if (!searchCode) return;

    setTrackingLoading(true);
    try {
      const isPhone = searchCode.replace(/[^0-9]/g, "").length >= 9;
      const url = isPhone
        ? `/api/middleman?phone=${encodeURIComponent(searchCode)}`
        : `/api/middleman?code=${encodeURIComponent(searchCode)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.deals && data.deals.length > 0) {
        setTrackedDeals(data.deals);
      } else {
        setTrackError("No active escrow contract found with this code or phone.");
        setTrackedDeals([]);
      }
    } catch (err: any) {
      setTrackError("Error searching for deal.");
    } finally {
      setTrackingLoading(false);
    }
  };

  const copyDealText = (deal: MiddlemanDeal) => {
    const text = `*eFootballMarket Middleman Contract [${deal.deal_code}]*\nAccount: ${deal.deal_title}\nAmount: KES ${deal.item_amount_kes}\nEscrow Till: 1572931 (eFootballMarket)\nSupport: 0794 400 365\nTrack Contract: https://www.efootballmarket.co.ke/middleman?code=${deal.deal_code}`;
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Header */}
      <div className="relative rounded-2xl store-panel p-6 sm:p-9 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
          style={{ backgroundImage: "url('/images/cat-middleman.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-sx-canvas via-sx-canvas/95 to-sx-canvas/80 pointer-events-none" />

        <div className="relative z-10 space-y-3 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-sx-green-tint border border-emerald-500/35 text-[11px] font-mono font-bold text-sx-green-text uppercase">
            Off-Platform Trade Protection
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold text-sx-ink font-display tracking-tight">
            Middleman Escrow for WhatsApp &amp; Facebook Deals
          </h1>

          <p className="text-xs sm:text-sm text-sx-ink-soft leading-relaxed">
            Finding a buyer or seller on WhatsApp, Facebook, Discord, or TikTok is allowed when you settle the trade here: the buyer pays the agreed price into <strong>eFootballMarket Kenya&apos;s Buy Goods Till 1572931</strong> (KES 0 extra buyer fee; Safaricom processes the transfer and eFootballMarket holds the funds), the seller delivers within 12 hours, and the buyer has 24 hours from credential delivery to verify Clean Konami ID before net payout (minus 5% seller fee, KES 50–500).
          </p>
        </div>
      </div>

      {/* 4-Step Pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { num: "01", tag: "CONTRACT", title: "Open Deal Code", desc: "Enter agreed KES amount and both trader phone numbers to generate a contract code." },
          { num: "02", tag: "DEPOSIT", title: "Pay Till 1572931", desc: "Buyer completes payment into Till 1572931. Funds stay locked on the platform." },
          { num: "03", tag: "VERIFY", title: "24h Buyer Check", desc: "Seller delivers Konami ID. Buyer verifies squad, Link Data, and rebinds email." },
          { num: "04", tag: "PAYOUT", title: "Release M-Pesa", desc: "Buyer confirms handover (or 24h passes without dispute) to trigger seller payout." },
        ].map((s) => (
          <div key={s.num} className="p-4 rounded-xl store-panel space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-1.5 py-0.5 rounded bg-sx-stone border border-sx-border font-mono text-[11px] font-bold text-sx-green-text">
                {s.num}
              </span>
              <span className="text-[10px] font-mono uppercase text-sx-muted">{s.tag}</span>
            </div>
            <h3 className="text-xs font-bold text-sx-ink font-display">{s.title}</h3>
            <p className="text-[11px] text-sx-muted leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-sx-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("create")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "create"
              ? "bg-sx-green hover:bg-sx-green-hover text-sx-ink font-bold"
              : "bg-sx-canvas border border-sx-border text-sx-ink-soft hover:text-sx-ink"
          }`}
        >
          <Handshake className="w-3.5 h-3.5" />
          <span>New Contract</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("generator")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "generator"
              ? "bg-sx-green hover:bg-sx-green-hover text-sx-ink font-bold"
              : "bg-sx-canvas border border-sx-border text-sx-ink-soft hover:text-sx-ink"
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Deal Link</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("track")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "track"
              ? "bg-sx-green hover:bg-sx-green-hover text-sx-ink font-bold"
              : "bg-sx-canvas border border-sx-border text-sx-ink-soft hover:text-sx-ink"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Track Contract</span>
        </button>
      </div>

      {/* Tab 1: Create Deal */}
      {activeTab === "create" && (
        <div>
          {createdDeal ? (
            /* Created Contract Summary Screen */
            <div className="bg-pitch-surface border border-emerald-500/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-pitch-border pb-5">
                <div>
                  <span className="px-3 py-1 rounded-full bg-sx-green-tint text-sx-green-text text-xs font-bold border border-sx-green-border">
                    Escrow Contract Generated
                  </span>
                  <h2 className="text-2xl font-bold text-sx-ink mt-2 font-display">
                    Deal Code: {createdDeal.deal_code}
                  </h2>
                  <p className="text-xs text-sx-muted mt-0.5">
                    Account: <strong>{createdDeal.deal_title}</strong>
                  </p>
                </div>

                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => copyDealText(createdDeal)}
                  className="font-bold shrink-0"
                >
                  <Copy className="w-4 h-4 mr-1.5" />
                  {copiedCode ? "Copied Deal!" : "Copy Contract Info"}
                </Button>
              </div>

              {/* Deal Breakdown Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-sx-green-tint border border-sx-green-border space-y-1">
                  <span className="text-xs text-sx-green-text">Buyer Pays to Till 1572931</span>
                  <p className="text-2xl font-black text-sx-green-text font-display">
                    {formatCurrency(createdDeal.total_amount_kes, "KES")}
                  </p>
                  <span className="text-[11px] text-sx-green-text block font-semibold">
                    KES 0 extra buyer fee · 100% refundable if undelivered
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-pitch-card border border-pitch-border space-y-1">
                  <span className="text-xs text-sx-muted">Platform Seller Fee (5%, KES 50–500)</span>
                  <p className="text-xl font-bold text-sx-amber-text font-display">
                    -{formatCurrency(createdDeal.escrow_fee_kes, "KES")}
                  </p>
                  <span className="text-[11px] text-sx-muted block">
                    Deducted from seller payout upon completion
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-pitch-card border border-pitch-border space-y-1">
                  <span className="text-xs text-sx-muted">Expected Seller Net Payout</span>
                  <p className="text-xl font-bold text-sx-ink font-display">
                    {formatCurrency(Math.max(0, createdDeal.item_amount_kes - createdDeal.escrow_fee_kes), "KES")}
                  </p>
                  <span className="text-[11px] text-sx-muted block">
                    Seller: {createdDeal.seller_name} ({createdDeal.seller_phone})
                  </span>
                </div>
              </div>

              {/* Step-by-Step Execution Guide */}
              <div className="p-5 rounded-2xl bg-sx-subtle border border-sx-border space-y-3">
                <h4 className="text-sm font-bold text-sx-ink flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sx-green-text" />
                  <span>How Payment Holding &amp; Handover Work</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-sx-ink-soft pt-1">
                  <div className="p-3 rounded-xl bg-pitch-card border border-pitch-border">
                    <strong className="text-sx-green-text block mb-1">1. Pay Till 1572931</strong>
                    Buyer pays KES {createdDeal.total_amount_kes.toLocaleString()} via M-Pesa to eFootballMarket&apos;s Till <strong>1572931</strong>.
                  </div>
                  <div className="p-3 rounded-xl bg-pitch-card border border-pitch-border">
                    <strong className="text-sx-green-text block mb-1">2. Held by Platform</strong>
                    eFootballMarket confirms receipt and holds the balance while notifying the seller (12h delivery deadline).
                  </div>
                  <div className="p-3 rounded-xl bg-pitch-card border border-pitch-border">
                    <strong className="text-sx-green-text block mb-1">3. 24h Buyer Check</strong>
                    24h timer starts when credentials are submitted. Buyer checks Link Data &amp; rebinds email/2FA.
                  </div>
                  <div className="p-3 rounded-xl bg-pitch-card border border-pitch-border">
                    <strong className="text-sx-green-text block mb-1">4. Payout to Seller</strong>
                    Buyer confirms ownership &rarr; KES {createdDeal.item_amount_kes} sent to seller M-Pesa.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `*eFootballMarket Safe Escrow Deal [${createdDeal.deal_code}]*\n*Account*: ${createdDeal.deal_title}\n*Escrow Amount*: KES ${createdDeal.item_amount_kes}\n*Funds Locked In*: Till 1572931 (EFootballMarket)\n*Escrow Officer*: Brian Okibo (0794400365)\n*Track Contract*: https://www.efootballmarket.co.ke/middleman?code=${createdDeal.deal_code}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl transition-all"
                >
                  <MessageCircle className="w-5 h-5 fill-white" />
                  <span>Send Contract to WhatsApp Group / Counterparty</span>
                </a>

                <a
                  href={`https://wa.me/254794400365?text=${encodeURIComponent(
                    `Hello Brian Okibo, I created a Middleman Escrow deal [${createdDeal.deal_code}] for "${createdDeal.deal_title}". Total: KES ${createdDeal.total_amount_kes}. Ready to pay to Till 1572931.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sx-stone hover:bg-slate-700 text-sx-ink font-bold text-xs border border-sx-border-strong transition-all"
                >
                  <span>Notify Officer Brian (0794400365)</span>
                </a>

                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setCreatedDeal(null)}
                  className="w-full sm:w-auto text-xs"
                >
                  Create Another Deal
                </Button>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form
              onSubmit={handleCreateDeal}
              className="bg-pitch-surface border border-pitch-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="border-b border-pitch-border pb-4">
                <h3 className="text-lg font-bold text-sx-ink font-display">
                  Initiate a Private Middleman Escrow Deal
                </h3>
                <p className="text-xs text-sx-muted mt-0.5">
                  Input details agreed with your counterparty. A neutral contract will be created instantly.
                </p>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Counterparty Information */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase text-sx-muted tracking-wider">
                  1. Participants Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-pitch-card border border-pitch-border space-y-3">
                    <span className="text-xs font-bold text-sx-green-text block">Buyer (Sending M-Pesa)</span>
                    <Input
                      label="Buyer Name"
                      placeholder="e.g. Dennis K."
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      required
                    />
                    <Input
                      label="Buyer Safaricom Phone"
                      placeholder="e.g. +254 712 345 678"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-pitch-card border border-pitch-border space-y-3">
                    <span className="text-xs font-bold text-sx-amber-text block">Seller (Handing over Konami ID)</span>
                    <Input
                      label="Seller Name"
                      placeholder="e.g. Eric M."
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                    />
                    <Input
                      label="Seller Safaricom Phone"
                      placeholder="e.g. +254 798 765 432"
                      value={sellerPhone}
                      onChange={(e) => setSellerPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Deal Specifics */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase text-sx-muted tracking-wider">
                  2. Deal Details & Agreed Amount
                </h4>

                <Input
                  label="Account / Squad Name"
                  placeholder="e.g. 3120 OVR Quick Counter with 105 Messi & Blitz Curler Son"
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Agreed Squad Price (KES)"
                    type="number"
                    placeholder="e.g. 2500"
                    value={dealAmount}
                    onChange={(e) => setDealAmount(e.target.value)}
                    required
                  />

                  {/* Live Calculation Preview */}
                  <div className="p-3.5 rounded-xl bg-pitch-card border border-pitch-border flex flex-col justify-center">
                    <div className="flex items-center justify-between text-xs text-sx-ink-soft">
                      <span>Buyer Pays to Till 1572931:</span>
                      <strong className="text-sx-ink">KES {totalPayable.toLocaleString()} (KES 0 extra fee)</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs text-sx-ink-soft mt-1">
                      <span>Seller Fee (5%, min 50 / max 500):</span>
                      <strong className="text-sx-amber-text">-KES {escrowFee.toLocaleString()}</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs text-sx-green-text font-bold border-t border-sx-border-strong pt-1 mt-1">
                      <span>Seller Net M-Pesa Payout:</span>
                      <span className="text-base font-extrabold">KES {sellerNetPayout.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-sx-ink-soft mb-1">
                    Special Transfer Conditions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Seller agreed to provide first email creation proof and test match access."
                    value={dealDescription}
                    onChange={(e) => setDealDescription(e.target.value)}
                    className="w-full bg-pitch-card border border-pitch-border rounded-lg p-3 text-xs text-sx-ink-soft"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  className="w-full font-bold shadow-xl"
                  isLoading={loading}
                >
                  <Handshake className="w-5 h-5 mr-2" />
                  Generate Protected Escrow Contract
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab: WhatsApp Group Link Generator */}
      {activeTab === "generator" && (
        <div className="bg-pitch-surface border border-sx-green-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-pitch-border/80 pb-4">
            <h3 className="text-xl font-bold text-sx-ink font-display">
              Generate 1-Click WhatsApp Escrow Contract Invite
            </h3>
            <p className="text-xs text-sx-ink-soft mt-1 max-w-2xl leading-relaxed">
              Drop a formatted escrow invitation into your WhatsApp gaming groups or send it directly to a buyer/seller. When they tap the link, the contract opens pre-filled and ready to lock funds via <strong>Safaricom Till 1572931</strong>!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form Inputs */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-sx-ink-soft block">
                  Squad / Deal Title <span className="text-sx-amber-text">*</span>
                </label>
                <input
                  type="text"
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  placeholder="e.g. 3120 OVR Epic Neymar + Rummenigge Account"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pitch-card border border-pitch-border text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-sx-ink-soft block">
                  Agreed Price (KES) <span className="text-sx-amber-text">*</span>
                </label>
                <input
                  type="number"
                  value={genAmount}
                  onChange={(e) => setGenAmount(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pitch-card border border-pitch-border text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-sx-ink-soft block">
                    Seller Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={genSellerPhone}
                    onChange={(e) => setGenSellerPhone(e.target.value)}
                    placeholder="0712345678"
                    className="w-full px-3.5 py-2 rounded-xl bg-pitch-card border border-pitch-border text-xs text-sx-ink font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-sx-ink-soft block">
                    Buyer Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={genBuyerPhone}
                    onChange={(e) => setGenBuyerPhone(e.target.value)}
                    placeholder="0798765432"
                    className="w-full px-3.5 py-2 rounded-xl bg-pitch-card border border-pitch-border text-xs text-sx-ink font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(generatedWhatsAppGroupMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Share Directly to WhatsApp</span>
                </a>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedInviteUrl);
                    setCopiedInviteUrl(true);
                    setTimeout(() => setCopiedInviteUrl(false), 3000);
                  }}
                  className="w-full sm:w-auto text-xs"
                >
                  {copiedInviteUrl ? <Check className="w-3.5 h-3.5 mr-1 text-sx-green-text" /> : <Link2 className="w-3.5 h-3.5 mr-1" />}
                  {copiedInviteUrl ? "Copied Link!" : "Copy Link"}
                </Button>
              </div>
            </div>

            {/* Live Message Preview Card */}
            <div className="p-5 rounded-2xl bg-pitch-card border border-pitch-border space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-sx-green-text uppercase tracking-wider block">
                  WhatsApp Preview (Formatted for Kenyan Gaming Groups)
                </span>
                <div className="p-3.5 rounded-xl bg-sx-canvas border border-pitch-border text-xs text-sx-ink-soft font-mono whitespace-pre-wrap leading-relaxed select-all">
                  {generatedWhatsAppGroupMessage}
                </div>
              </div>

              <Button
                type="button"
                variant="gold"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(generatedWhatsAppGroupMessage);
                  setCopiedInviteText(true);
                  setTimeout(() => setCopiedInviteText(false), 3000);
                }}
                className="w-full font-bold text-xs mt-2"
              >
                {copiedInviteText ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5 text-slate-950" />
                    Copied WhatsApp Message!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copy Formatted Group Message
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Track Existing Deal */}
      {activeTab === "track" && (
        <div className="bg-pitch-surface border border-pitch-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <form onSubmit={handleTrackDeal} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Enter Deal Code (e.g. EFM-78241) or Phone Number..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="gold" size="md" isLoading={trackingLoading}>
              <Search className="w-4 h-4 mr-1.5" />
              Search Deal
            </Button>
          </form>

          {trackError && (
            <div className="p-4 rounded-xl bg-sx-subtle border border-sx-border text-sx-muted text-xs text-center">
              {trackError}
            </div>
          )}

          {trackedDeals && trackedDeals.length > 0 && (
            <div className="space-y-4 pt-2">
              {trackedDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="p-5 rounded-2xl bg-pitch-card border border-pitch-border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-sm font-bold text-sx-amber-text">{deal.deal_code}</span>
                      <h4 className="text-base font-bold text-sx-ink mt-0.5">{deal.deal_title}</h4>
                    </div>
                    <Badge variant={deal.status === "completed" ? "success" : "brand"} size="sm">
                      {deal.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-sx-ink-soft">
                    <div>
                      <span className="text-sx-muted block">Buyer</span>
                      <strong>{deal.buyer_name}</strong>
                    </div>
                    <div>
                      <span className="text-sx-muted block">Seller</span>
                      <strong>{deal.seller_name}</strong>
                    </div>
                    <div>
                      <span className="text-sx-muted block">Escrow Amount</span>
                      <strong className="text-sx-green-text">KES {deal.item_amount_kes}</strong>
                    </div>
                    <div>
                      <span className="text-sx-muted block">Till Number</span>
                      <strong>{deal.till_number}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Utility/contract screen — ads disabled per publisher content policy */}
      <AdBanner slot="middleman_deal_bottom" format="horizontal" hasContent={false} />
    </div>
  );
}

export default function MiddlemanPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand-400 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-sx-muted">Loading escrow contract room...</p>
        </div>
      }
    >
      <MiddlemanContent />
    </Suspense>
  );
}
