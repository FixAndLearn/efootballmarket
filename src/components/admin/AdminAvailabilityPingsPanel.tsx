"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, CheckCircle2, MessageCircle, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { formatDisplayPhone, formatWhatsAppPhone } from "@/lib/utils/phone";

export function AdminAvailabilityPingsPanel() {
  const [pings, setPings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadPings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/listings/availability?admin=1");
      if (!res.ok) return;
      const data = await res.json();
      setPings(data.pings || []);
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPings();
  }, [loadPings]);

  const handleMarkStatus = async (pingId: string, status: "available" | "unavailable") => {
    setBusyId(pingId);
    try {
      const res = await fetch("/api/listings/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pingId, status }),
      });
      if (res.ok) {
        await loadPings();
      }
    } catch {
      // ignore
    } finally {
      setBusyId(null);
    }
  };

  if (!loading && pings.length === 0) {
    return null;
  }

  return (
    <div className="bg-pitch-surface border border-sx-green-border rounded-2xl overflow-hidden shadow-xl">
      <div className="p-4 sm:p-5 border-b border-pitch-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-sx-green-text text-xs font-bold uppercase tracking-wider mb-0.5">
            <BellRing className="w-3.5 h-3.5" />
            <span>Live Buyer Availability Pings ({pings.length})</span>
          </div>
          <p className="text-xs text-sx-muted">
            Buyers who tapped to check if a listed squad is available — reach either Seller or Buyer directly on WhatsApp.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={loadPings} isLoading={loading}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="divide-y divide-pitch-border/60">
        {pings.slice(0, 12).map((p) => {
          const sellerPhone = p.seller?.phone_number || "";
          const buyerPhone = p.buyer_phone || p.buyer?.phone_number || "";
          const title = p.listing?.title || "Listed Squad";
          const priceText = formatCurrency(p.listing?.price || 0, p.listing?.currency || "KES");

          return (
            <div
              key={p.id}
              className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-pitch-card/40 transition-colors text-xs"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      p.status === "available"
                        ? "bg-sx-green-tint text-sx-green-text border border-sx-green-border"
                        : p.status === "unavailable"
                        ? "bg-sx-red-tint text-sx-red-text border border-sx-red-border"
                        : "bg-sx-amber-tint text-sx-amber-text border border-sx-amber-border"
                    }`}
                  >
                    {p.status === "pending" ? "Waiting for Seller" : p.status}
                  </span>
                  <Link
                    href={`/listings/${p.listing_id}`}
                    target="_blank"
                    className="font-bold text-sx-ink hover:underline truncate"
                  >
                    {title}
                  </Link>
                  <span className="font-mono font-bold text-sx-green-text">{priceText}</span>
                </div>

                <p className="text-sx-muted">
                  Seller: <strong className="text-sx-ink">@{p.seller?.username || "seller"}</strong>
                  {sellerPhone ? ` (${formatDisplayPhone(sellerPhone)})` : ""} · Buyer:{" "}
                  <strong className="text-sx-ink">
                    {p.buyer_name || p.buyer?.username || "Buyer"}
                  </strong>
                  {buyerPhone ? ` (${formatDisplayPhone(buyerPhone)})` : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {sellerPhone && (
                  <a
                    href={`https://wa.me/${formatWhatsAppPhone(
                      sellerPhone
                    )}?text=${encodeURIComponent(
                      `Hello @${
                        p.seller?.username || "Trader"
                      }, this is eFootballMarket Admin. A buyer just tapped to check if your squad "${title}" (${priceText}) is still available for escrow handover. Is it ready?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#25D366]/15 border border-[#25D366]/40 text-sx-green-text hover:bg-[#25D366]/25 font-bold text-[11px] transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Seller</span>
                  </a>
                )}

                {buyerPhone && (
                  <a
                    href={`https://wa.me/${formatWhatsAppPhone(
                      buyerPhone
                    )}?text=${encodeURIComponent(
                      `Hello ${
                        p.buyer_name || "Trader"
                      }, this is eFootballMarket Admin regarding "${title}" (${priceText}). Let us know if you need help completing M-Pesa Till 1572931 Escrow checkout: https://www.efootballmarket.co.ke/pay/${p.listing_id}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sx-subtle border border-sx-border-strong text-sx-ink hover:bg-sx-stone font-bold text-[11px] transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>WhatsApp Buyer</span>
                  </a>
                )}

                {p.status === "pending" && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busyId === p.id}
                      onClick={() => handleMarkStatus(p.id, "available")}
                      className="text-[11px] py-1 px-2 text-sx-green-text"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Confirm Available
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={busyId === p.id}
                      onClick={() => handleMarkStatus(p.id, "unavailable")}
                      className="text-[11px] py-1 px-2"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Unavailable
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
