"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
  Smartphone,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

interface AdminPaymentsAndMiddlemanTabProps {
  onFeedback: (fb: { type: "success" | "error"; message: string } | null) => void;
}

export function AdminPaymentsAndMiddlemanTab({
  onFeedback,
}: AdminPaymentsAndMiddlemanTabProps) {
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [middlemanDeals, setMiddlemanDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [receiptInputs, setReceiptInputs] = useState<Record<string, string>>({});

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/payments");
      const data = await res.json();
      if (res.ok) {
        setPendingOrders(data.pendingOrders || []);
        setMiddlemanDeals(data.middlemanDeals || []);
        const prefill: Record<string, string> = {};
        for (const o of data.pendingOrders || []) {
          if (o.submittedReceipt) {
            prefill[o.id] = o.submittedReceipt;
          }
        }
        setReceiptInputs((prev) => ({ ...prefill, ...prev }));
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

  const handleApproveReceipt = async (orderId: string) => {
    const receipt = (receiptInputs[orderId] || "").trim().toUpperCase();
    if (!/^[A-Z0-9]{8,12}$/.test(receipt)) {
      onFeedback({
        type: "error",
        message: "Enter a valid 8–12 character Safaricom M-Pesa receipt code before approving.",
      });
      return;
    }

    setBusyId(orderId);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve_manual_payment",
          orderId,
          receiptNumber: receipt,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to approve receipt");
      }
      onFeedback({ type: "success", message: data.message });
      await loadQueue();
    } catch (err: any) {
      onFeedback({ type: "error", message: err.message });
    } finally {
      setBusyId(null);
    }
  };

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

  const handleMiddlemanStatus = async (dealId: string, status: string) => {
    setBusyId(dealId);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_middleman_status",
          dealId,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update middleman status");
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
              Confirm the receipt code on your real M-Pesa statement before clicking{" "}
              <strong>Approve &amp; Lock Escrow</strong>. Approving automatically alerts the seller to deliver credentials.
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
                    <strong>{order.seller?.username || "Seller"}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="M-Pesa Code (e.g. SJK82...)"
                    value={receiptInputs[order.id] || ""}
                    onChange={(e) =>
                      setReceiptInputs((prev) => ({
                        ...prev,
                        [order.id]: e.target.value.toUpperCase(),
                      }))
                    }
                    className="h-9 w-44 px-3 rounded-lg bg-sx-stone border border-sx-border text-xs font-mono uppercase text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-green"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    isLoading={busyId === order.id}
                    onClick={() => handleApproveReceipt(order.id)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve &amp; Lock Escrow</span>
                  </Button>
                  {order.submittedReceipt && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={busyId === order.id}
                      onClick={() => handleRejectReceipt(order.id)}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Off-Platform Middleman Contracts */}
      <div className="rounded-2xl bg-sx-canvas border border-sx-border overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-sx-border">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sx-info-tint border border-sx-info-border text-sx-info-text text-[11px] font-bold mb-1">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Off-Platform Middleman Desk</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
            Middleman Escrow Contracts ({middlemanDeals.length})
          </h2>
          <p className="text-xs text-sx-muted mt-0.5">
            Track WhatsApp / Facebook middleman contracts and advance deal states as milestones complete.
          </p>
        </div>

        {middlemanDeals.length === 0 ? (
          <div className="p-10 text-center text-xs text-sx-muted">
            No off-platform middleman contracts recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-sx-border">
            {middlemanDeals.map((deal) => (
              <div
                key={deal.id}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-sx-subtle transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-sx-stone border border-sx-border font-mono text-xs font-bold text-sx-ink">
                      {deal.deal_code}
                    </span>
                    <span className="font-mono text-sm font-extrabold text-sx-green-text">
                      {formatCurrency(deal.total_amount_kes || deal.item_amount_kes, "KES")}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-sx-amber-tint border border-sx-amber-border text-sx-amber-text text-[11px] font-bold uppercase">
                      {String(deal.status || "awaiting_payment").replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-sx-ink">{deal.deal_title}</p>
                  <p className="text-xs text-sx-muted">
                    Buyer: <strong>{deal.buyer_name}</strong> ({deal.buyer_phone}) · Seller:{" "}
                    <strong>{deal.seller_name || "Seller"}</strong> ({deal.seller_phone})
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <select
                    value={deal.status || "awaiting_payment"}
                    disabled={busyId === deal.id}
                    onChange={(e) => handleMiddlemanStatus(deal.id, e.target.value)}
                    className="h-9 px-3 rounded-lg bg-sx-stone border border-sx-border text-xs font-semibold text-sx-ink focus:outline-none focus:border-sx-green"
                  >
                    <option value="awaiting_payment">Awaiting Payment</option>
                    <option value="escrow_locked">Escrow Locked</option>
                    <option value="seller_delivering">Seller Delivering</option>
                    <option value="buyer_verifying">Buyer Verifying (24h)</option>
                    <option value="completed">Completed &amp; Paid Out</option>
                    <option value="disputed">Disputed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
