"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ListingOffer } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  Handshake,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  Loader2,
  Copy,
  Check,
  Edit3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface SellerListingOffersPanelProps {
  listingId?: string;
  sellerId?: string;
  initialOffers?: ListingOffer[];
}

export function SellerListingOffersPanel({
  listingId,
  sellerId,
  initialOffers,
}: SellerListingOffersPanelProps) {
  const [offers, setOffers] = useState<ListingOffer[]>(initialOffers || []);
  const [loading, setLoading] = useState(!initialOffers);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{
    [offerId: string]: { checkoutUrl: string; buyerWhatsAppUrl?: string; message: string };
  }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Counter offer state
  const [activeCounterOfferId, setActiveCounterOfferId] = useState<string | null>(null);
  const [counterPriceInput, setCounterPriceInput] = useState<string>("");
  const [sellerNoteInput, setSellerNoteInput] = useState<string>("");

  // Decline state
  const [activeDeclineOfferId, setActiveDeclineOfferId] = useState<string | null>(null);
  const [declineReasonInput, setDeclineReasonInput] = useState<string>("Offer is lower than expected");

  const fetchOffers = async () => {
    try {
      const param = listingId
        ? `listingId=${encodeURIComponent(listingId)}`
        : sellerId
        ? `sellerId=${encodeURIComponent(sellerId)}`
        : "";

      if (!param) return;

      const res = await fetch(`/api/offers?${param}`);
      const data = await res.json();
      if (data.offers) {
        setOffers(data.offers);
      }
    } catch (err) {
      console.warn("Failed to fetch offers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();

    let channel: any = null;
    let supabase: any = null;

    try {
      supabase = createClient();
      const filter = listingId ? `listing_id=eq.${listingId}` : undefined;
      channel = supabase
        .channel(`offers-live-${listingId || sellerId || "all"}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "listing_offers",
            filter,
          },
          () => {
            fetchOffers();
          }
        )
        .subscribe();
    } catch (e) {
      console.warn("Realtime offers subscription note:", e);
    }

    // Auto-sync polling every 6 seconds as resilient fallback
    const interval = setInterval(fetchOffers, 6000);

    return () => {
      clearInterval(interval);
      if (channel && supabase) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [listingId, sellerId]);

  const handleAction = async (
    offerId: string,
    action: "accept" | "counter" | "decline",
    counterPrice?: number,
    note?: string
  ) => {
    setActionLoading(offerId);
    try {
      const res = await fetch("/api/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_id: offerId,
          action,
          counter_price: counterPrice,
          seller_note: note,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionResult((prev) => ({
          ...prev,
          [offerId]: {
            checkoutUrl: data.checkoutUrl,
            buyerWhatsAppUrl: data.buyerWhatsAppUrl,
            message: data.message || `Offer ${action}ed successfully`,
          },
        }));
        setActiveCounterOfferId(null);
        setActiveDeclineOfferId(null);
        fetchOffers();
      }
    } catch (err) {
      console.error("Action error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyCheckout = (url: string, offerId: string) => {
    const full = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;
    navigator.clipboard.writeText(full);
    setCopiedId(offerId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (loading) return null;
  if (offers.length === 0) return null;

  return (
    <div className="p-5 rounded-2xl bg-[#FEF3C7] border border-amber-600/40 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Handshake className="w-5 h-5 text-[#B45309]" />
          <h3 className="text-sm font-bold text-[#92400E] uppercase tracking-wider font-display">
            Incoming Buyer Offers ({offers.length})
          </h3>
        </div>
        <span className="text-[11px] text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded-full font-semibold">
          Negotiation Active
        </span>
      </div>

      <div className="space-y-3">
        {offers.map((offer) => {
          const result = actionResult[offer.id];
          const isCountering = activeCounterOfferId === offer.id;
          const isDeclining = activeDeclineOfferId === offer.id;

          return (
            <div
              key={offer.id}
              className="p-4 rounded-xl bg-pitch-surface border border-pitch-border space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#0F0F0F]">
                      {offer.buyer_name}
                    </span>
                    <span className="text-xs font-mono text-[#5F5F5F]">
                      ({offer.buyer_phone})
                    </span>
                  </div>
                  {offer.listing && (
                    <p className="text-xs text-[#5F5F5F] mt-0.5">
                      Squad: <strong className="text-[#1F1F1F]">{(offer.listing as any).title}</strong>
                    </p>
                  )}
                  {offer.note && (
                    <p className="text-xs text-[#3D3D3D] italic mt-1 bg-pitch-card p-2 rounded-lg border border-pitch-border/60">
                      "{offer.note}"
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-[#006340] font-mono block">
                    {formatCurrency(offer.offered_price)}
                  </span>
                  <span className="text-[10px] text-[#B45309] font-bold">
                    -{offer.discount_percentage}% OFF
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="text-[#5F5F5F]">Status:</span>
                <span
                  className={`font-semibold capitalize px-2 py-0.5 rounded-md text-[11px] ${
                    offer.status === "accepted"
                      ? "bg-[#EBF5F0] text-[#006340] border border-[#BFE0CE]"
                      : offer.status === "declined"
                      ? "bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]"
                      : offer.status === "countered"
                      ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                      : "bg-[#F4F3F1] text-[#1F1F1F] border border-[#C8C8C4]"
                  }`}
                >
                  {offer.status}
                </span>

                {offer.status === "countered" && offer.counter_price && (
                  <span className="text-xs text-[#92400E] font-bold font-mono">
                    Counter: KES {Number(offer.counter_price).toLocaleString()}
                  </span>
                )}

                {offer.status === "accepted" && offer.expires_at && (
                  <span className="text-[10px] text-[#5F5F5F] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#B45309]" />
                    <span>Checkout expires in 12 hours</span>
                  </span>
                )}
              </div>

              {/* Action Result / Link sharing */}
              {result && (
                <div className="p-3 rounded-xl bg-[#EBF5F0] border border-[#BFE0CE] space-y-2 text-xs animate-in fade-in">
                  <span className="font-bold text-[#006340] block">
                    {result.message}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleCopyCheckout(result.checkoutUrl, offer.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-pitch-card border border-pitch-border text-[#1F1F1F] hover:text-[#0F0F0F] font-mono text-[11px]"
                    >
                      {copiedId === offer.id ? <Check className="w-3 h-3 text-[#006340]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === offer.id ? "Copied!" : "Copy Checkout Link"}</span>
                    </button>

                    {result.buyerWhatsAppUrl && (
                      <a
                        href={result.buyerWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px]"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>Send on WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Actions for Pending Offer */}
              {offer.status === "pending" && !result && (
                <div className="space-y-3 pt-1">
                  {!isCountering && !isDeclining && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Accept Button */}
                      <Button
                        variant="gold"
                        size="sm"
                        className="flex-1 font-bold text-xs py-2"
                        disabled={actionLoading === offer.id}
                        onClick={() => handleAction(offer.id, "accept")}
                      >
                        {actionLoading === offer.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        )}
                        <span>Accept (KES {offer.offered_price.toLocaleString()})</span>
                      </Button>

                      {/* Counter Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-[#92400E] border-amber-600/60 hover:bg-[#FEF3C7] py-2"
                        disabled={actionLoading === offer.id}
                        onClick={() => {
                          setActiveCounterOfferId(offer.id);
                          setCounterPriceInput(String(Math.round((offer.original_price + offer.offered_price) / 2)));
                        }}
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1 text-[#B45309]" />
                        <span>Counter</span>
                      </Button>

                      {/* Decline Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-[#C92A2A] border-[#FECACA] hover:bg-[#FEE2E2] py-2"
                        disabled={actionLoading === offer.id}
                        onClick={() => setActiveDeclineOfferId(offer.id)}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        <span>Decline</span>
                      </Button>
                    </div>
                  )}

                  {/* Inline Counter-Offer Drawer */}
                  {isCountering && (
                    <div className="p-3.5 rounded-xl bg-pitch-card border border-[#FDE68A] space-y-2.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#92400E] flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Propose Counter Price</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveCounterOfferId(null)}
                          className="text-xs text-[#5F5F5F] hover:text-[#1F1F1F]"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-[#3D3D3D] block mb-1">
                            Counter Price (KES)
                          </label>
                          <input
                            type="number"
                            min={offer.offered_price + 1}
                            max={offer.original_price}
                            step="1"
                            value={counterPriceInput}
                            onChange={(e) => setCounterPriceInput(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-pitch-surface border border-pitch-border text-xs text-[#0F0F0F] font-mono font-bold focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-[#3D3D3D] block mb-1">
                            Note to Buyer (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Can do this for fast deal"
                            value={sellerNoteInput}
                            onChange={(e) => setSellerNoteInput(e.target.value)}
                            maxLength={100}
                            className="w-full px-3 py-1.5 rounded-lg bg-pitch-surface border border-pitch-border text-xs text-[#0F0F0F] focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <Button
                        variant="gold"
                        size="sm"
                        className="w-full text-xs font-bold py-2"
                        disabled={actionLoading === offer.id || !Number(counterPriceInput)}
                        onClick={() =>
                          handleAction(offer.id, "counter", Number(counterPriceInput), sellerNoteInput)
                        }
                      >
                        {actionLoading === offer.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Handshake className="w-3.5 h-3.5 mr-1" />
                        )}
                        <span>Send Counter Offer of KES {Number(counterPriceInput || 0).toLocaleString()}</span>
                      </Button>
                    </div>
                  )}

                  {/* Inline Decline Drawer */}
                  {isDeclining && (
                    <div className="p-3.5 rounded-xl bg-pitch-card border border-[#FECACA] space-y-2.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#B91C1C] flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Decline Reason (Sent to Buyer)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveDeclineOfferId(null)}
                          className="text-xs text-[#5F5F5F] hover:text-[#1F1F1F]"
                        >
                          Cancel
                        </button>
                      </div>

                      <div>
                        <select
                          value={declineReasonInput}
                          onChange={(e) => setDeclineReasonInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-pitch-surface border border-pitch-border text-xs text-[#0F0F0F] focus:outline-none focus:border-rose-400"
                        >
                          <option value="Offer is lower than expected">Offer is lower than expected</option>
                          <option value="Squad has high-value epic/booster players">Squad has high-value epic/booster players</option>
                          <option value="Account already has another active pending deal">Account already has another active pending deal</option>
                          <option value="Price is fixed for this listing">Price is fixed for this listing</option>
                        </select>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-bold text-[#B91C1C] border-rose-700 hover:bg-[#FEE2E2] py-2"
                        disabled={actionLoading === offer.id}
                        onClick={() => handleAction(offer.id, "decline", undefined, declineReasonInput)}
                      >
                        {actionLoading === offer.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                        )}
                        <span>Confirm Decline</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
