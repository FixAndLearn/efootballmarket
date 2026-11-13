"use client";

import React, { useCallback, useEffect, useState } from "react";
import { BellRing, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

interface AvailabilityPingItem {
  id: string;
  listing_id: string;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  status: "pending" | "available" | "unavailable";
  created_at: string;
  listing?: {
    id: string;
    title: string;
    price: number;
    currency?: string;
    overall_team_strength?: number;
  } | null;
}

export function SellerAvailabilityPingsPanel({ sellerId }: { sellerId?: string }) {
  const [pings, setPings] = useState<AvailabilityPingItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadPings = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/listings/availability${sellerId ? `?sellerId=${encodeURIComponent(sellerId)}` : ""}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.pings)) {
        setPings(data.pings);
      }
    } catch {
      // non-blocking
    }
  }, [sellerId]);

  useEffect(() => {
    loadPings();

    let channel: any = null;
    let supabase: any = null;
    try {
      supabase = createClient();
      channel = supabase
        .channel(`avail-pings-${sellerId || "seller"}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "availability_pings",
          },
          () => {
            loadPings();
          }
        )
        .subscribe();
    } catch {
      // fallback polling below
    }

    const interval = setInterval(loadPings, 8000);
    return () => {
      clearInterval(interval);
      if (channel && supabase) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [sellerId, loadPings]);

  const handleRespond = async (pingId: string, status: "available" | "unavailable") => {
    setBusyId(pingId);
    setToastMsg(null);
    try {
      const res = await fetch("/api/listings/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pingId, status }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg(
          data.message ||
            (status === "available"
              ? "Buyer notified that your squad is available!"
              : "Listing archived & buyer notified.")
        );
        await loadPings();
      }
    } catch {
      // ignore
    } finally {
      setBusyId(null);
    }
  };

  const pendingPings = pings.filter((p) => p.status === "pending");

  if (pendingPings.length === 0 && !toastMsg) {
    return null;
  }

  return (
    <div className="rounded-xl bg-sx-canvas border-2 border-sx-green overflow-hidden">
      <div className="px-5 py-3.5 bg-sx-green-tint border-b border-sx-green-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-sx-green-text animate-bounce shrink-0" />
          <h2 className="text-sm sm:text-base font-bold text-sx-green-text font-display">
            Buyers Checking Squad Availability ({pendingPings.length})
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-sx-green-text hidden sm:inline">
          1 tap notifies the buyer&apos;s phone immediately
        </span>
      </div>

      {toastMsg && (
        <div className="px-5 py-2.5 bg-sx-subtle border-b border-sx-border text-xs font-semibold text-sx-green-text">
          {toastMsg}
        </div>
      )}

      {pendingPings.length > 0 && (
        <div className="divide-y divide-sx-border">
          {pendingPings.map((ping) => {
            const isBusy = busyId === ping.id;
            return (
              <div
                key={ping.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-sx-subtle transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-sx-ink">
                      {ping.buyer_name || "Interested Buyer"}
                    </span>
                    {ping.buyer_phone && (
                      <span className="font-mono text-[11px] text-sx-muted">
                        ({ping.buyer_phone})
                      </span>
                    )}
                    <span className="text-[11px] text-sx-muted">
                      • Ready to pay{" "}
                      <strong className="text-sx-green-text font-mono">
                        {formatCurrency(ping.listing?.price || 0, ping.listing?.currency || "KES")}
                      </strong>{" "}
                      via Escrow
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-sx-ink">
                    Is &ldquo;{ping.listing?.title || "Listed Squad"}&rdquo; still available?
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => handleRespond(ping.id, "available")}
                  >
                    {isBusy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Yes, Still Available</span>
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => handleRespond(ping.id, "unavailable")}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Unavailable / Sold</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
