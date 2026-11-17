"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  XCircle,
  RefreshCw,
  ExternalLink,
  Smartphone,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { formatWhatsAppPhone } from "@/lib/utils/phone";

interface AdminPaymentsTabProps {
  onFeedback: (fb: { type: "success" | "error"; message: string } | null) => void;
}

export function AdminPaymentsTab({
  onFeedback,
}: AdminPaymentsTabProps) {
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/payments");
      const data = await res.json();
      if (res.ok) {
        setPendingOrders(data.pendingOrders || []);
      }
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleRejectReceipt = async (orderId: string) => {
    setBusyId(orderId);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject_manual_payment",
          orderId,
          reason:
            "Submitted M-Pesa receipt code could not be matched on Safaricom Till 1572931 statement.",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reject receipt");
      }
      onFeedback({ type: "success", message: data.message });
      await loadQueue();
    } catch (err: any) {
      onFeedback({ type: "error", message: err.message });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Section 1: Manual Till 1572931 Receipt Reconciliation */}
      <div className="rounded-2xl bg-sx-canvas border border-sx-border overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-sx-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sx-green-tint border border-sx-green-border text-sx-green-text text-[11px] font-bold mb-1">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Safaricom Buy Goods Till 1572931</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
              Manual Receipt Claims &amp; Pending Deposits ({pendingOrders.length})
            </h2>
            <p className="text-xs text-sx-muted mt-0.5">
              Receipt claims remain pending until the provider confirms the matching transaction, receipt, and amount. This console cannot unlock escrow from a typed receipt.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={loadQueue}
            isLoading={loading}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Queue</span>
          </Button>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="p-10 text-center text-xs text-sx-muted">
            No pending orders or manual Till 1572931 receipt claims awaiting verification.
          </div>
        ) : (
          <div className="divide-y divide-sx-border">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-sx-subtle transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sx-ink">
                      #{order.order_number}
                    </span>
                    <span className="font-mono text-sm font-extrabold text-sx-green-text">
                      {formatCurrency(order.total_amount, order.currency)}
                    </span>
                    {order.submittedReceipt ? (
                      <span className="px-2 py-0.5 rounded-full bg-sx-amber-tint border border-sx-amber-border text-sx-amber-text text-[11px] font-bold font-mono">
                        Claimed Receipt: {order.submittedReceipt}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-sx-stone border border-sx-border text-sx-muted text-[11px] font-medium">
                        Awaiting Deposit
                      </span>
                    )}
                    <Link
                      href={`/orders/${order.id}`}
                      target="_blank"
                      className="text-xs text-sx-green-text hover:underline inline-flex items-center gap-1"
                    >
                      <span>Order Room</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  <p className="text-sm font-bold text-sx-ink line-clamp-1">
                    {order.listing?.title || "Squad Order"}
                  </p>
                  <p className="text-xs text-sx-muted">
                    Buyer: <strong>{order.buyer?.username || "Buyer"}</strong> (
                    {order.buyer?.phone_number || "N/A"}) · Seller:{" "}
                    <strong>{order.seller?.username || "Seller"}</strong> (
                    {order.seller?.phone_number || "N/A"})
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {order.buyer?.phone_number && (
                      <a
                        href={`https://wa.me/${formatWhatsAppPhone(
                          order.buyer.phone_number
                        )}?text=${encodeURIComponent(
                          `Hello @${
                            order.buyer.username || "Buyer"
                          }, this is eFootballMarket Admin regarding Order #${order.order_number} (${
                            order.listing?.title || "Squad"
                          }).`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-sx-subtle border border-sx-border text-[11px] font-bold text-sx-ink hover:bg-sx-stone"
                      >
                        <MessageCircle className="w-3 h-3 text-[#25D366]" />
                        <span>WhatsApp Buyer</span>
                      </a>
                    )}
                    {order.seller?.phone_number && (
                      <a
                        href={`https://wa.me/${formatWhatsAppPhone(
                          order.seller.phone_number
                        )}?text=${encodeURIComponent(
                          `Hello @${
                            order.seller.username || "Seller"
                          }, this is eFootballMarket Admin regarding Order #${order.order_number} (${
                            order.listing?.title || "Squad"
                          }).`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-sx-subtle border border-sx-border text-[11px] font-bold text-sx-ink hover:bg-sx-stone"
                      >
                        <MessageCircle className="w-3 h-3 text-[#25D366]" />
                        <span>WhatsApp Seller</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span className="max-w-56 text-[11px] text-sx-muted">
                    Provider confirmation required before escrow can be locked.
                  </span>
                  {order.submittedReceipt && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={busyId === order.id}
                      onClick={() => handleRejectReceipt(order.id)}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject claim</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


    </div>
  );
}
