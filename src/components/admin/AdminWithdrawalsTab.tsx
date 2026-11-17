"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  Banknote,
  Check,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { formatDisplayPhone, formatWhatsAppPhone } from "@/lib/utils/phone";

/**
 * Extracted from src/app/admin/page.tsx (was a 244-line inline block inside a
 * 1,865-line client component). Payout review is money handling, so it should
 * not live in the same file as every other admin surface.
 */
export interface AdminWithdrawalsTabProps {
  withdrawals: any[];
  pendingWithdrawalsCount: number;
  actionLoading: boolean;
  onWithdrawalAction: (
    withdrawalId: string,
    status: "completed" | "rejected",
    failureReason?: string
  ) => void;
  onReload?: () => void;
}

export function AdminWithdrawalsTab({
  withdrawals,
  pendingWithdrawalsCount,
  actionLoading,
  onWithdrawalAction,
  onReload,
}: AdminWithdrawalsTabProps) {
  // View-only state belongs with the view. These four pieces previously lived
  // in the page component, which is why the tab could not be extracted
  // cleanly.
  const [withdrawalFilter, setWithdrawalFilter] = useState<
    "all" | "pending" | "processing" | "completed" | "rejected"
  >("pending");
  const [withdrawalSearch, setWithdrawalSearch] = useState("");
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [rejectModalTarget, setRejectModalTarget] = useState<string | null>(null);
  const [rejectModalReason, setRejectModalReason] = useState("");

  const copyPhone = useCallback((phone: string) => {
    navigator.clipboard?.writeText(phone).catch(() => {});
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 1500);
  }, []);

  const reloadWithdrawals = useCallback(() => {
    onReload?.();
  }, [onReload]);

  const filteredWithdrawals = useMemo(() => {
    return (withdrawals || []).filter((w: any) => {
      if (withdrawalFilter !== "all" && w.status !== withdrawalFilter) {
        return false;
      }
      if (!withdrawalSearch.trim()) return true;
      const q = withdrawalSearch.toLowerCase();
      return (
        String(w.id || "").toLowerCase().includes(q) ||
        String(w.seller?.username || "").toLowerCase().includes(q) ||
        String(w.phone_number || w.seller?.phone_number || "").includes(q)
      );
    });
  }, [withdrawals, withdrawalFilter, withdrawalSearch]);

  return (
    <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pitch-border/80 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-sx-amber-text text-xs font-bold uppercase tracking-wider mb-1">
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Manual M-Pesa disbursements</span>
                  </div>
                  <h2 className="text-2xl font-bold text-sx-ink font-display flex items-center gap-2.5">
                    <span>M-Pesa Payouts</span>
                    {pendingWithdrawalsCount > 0 ? (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-sx-amber-tint text-sx-amber-text border border-sx-amber-border font-mono font-bold animate-pulse">
                        {pendingWithdrawalsCount} awaiting action
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-sx-stone text-sx-ink-soft font-mono font-bold">
                        All processed
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-sx-muted mt-0.5">
                    Review requests, arrange any M-Pesa transfer manually outside this system, and record the outcome. The status here does not verify a provider transaction.
                  </p>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-pitch-surface border border-pitch-border text-xs overflow-x-auto">
                  {(["all", "pending", "processing", "completed", "rejected"] as const).map((filter) => {
                    const count =
                      filter === "all"
                        ? withdrawals.length
                        : withdrawals.filter((w) => w.status === filter).length;
                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setWithdrawalFilter(filter)}
                        className={`px-3 py-1.5 rounded-lg font-medium transition capitalize flex items-center gap-1.5 shrink-0 ${
                          withdrawalFilter === filter
                            ? "bg-amber-500 text-zinc-950 font-bold shadow"
                            : "text-sx-muted hover:text-sx-ink"
                        }`}
                      >
                        <span>{filter}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            withdrawalFilter === filter
                              ? "bg-black/20 text-zinc-950 font-bold"
                              : "bg-pitch-card text-sx-muted"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sx-green-tint border border-sx-green-border text-[11px] font-medium text-sx-green-text">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Live Realtime Sync</span>
                  </div>
                  <button
                    type="button"
                    onClick={reloadWithdrawals}
                    className="p-2 rounded-xl bg-pitch-surface border border-pitch-border text-sx-muted hover:text-sx-ink hover:bg-pitch-card transition-colors"
                    title="Refresh withdrawals"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-sx-muted" />
                    <input
                      type="text"
                      placeholder="Search phone, seller, amount..."
                      value={withdrawalSearch}
                      onChange={(e) => setWithdrawalSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-pitch-surface border border-pitch-border text-xs text-sx-ink-soft placeholder:text-sx-muted focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Table / List */}
              {filteredWithdrawals.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-pitch-surface border border-pitch-border text-sx-muted space-y-2">
                  <Banknote className="w-8 h-8 mx-auto text-sx-muted" />
                  <p className="text-xs font-semibold text-sx-ink-soft">No withdrawal requests found</p>
                  <p className="text-[11px] text-sx-muted">
                    {withdrawalFilter !== "all"
                      ? `There are no withdrawals with status "${withdrawalFilter}".`
                      : "No sellers have requested withdrawals yet."}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl bg-pitch-surface border border-pitch-border shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-sx-ink-soft">
                      <thead className="bg-pitch-card/60 border-b border-pitch-border text-[11px] text-sx-muted uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="px-4 py-3">Seller</th>
                          <th className="px-4 py-3">M-Pesa Phone</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Requested Date</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-pitch-border/50">
                        {filteredWithdrawals.map((w) => {
                          const isPending = w.status === "pending" || w.status === "processing";
                          const isProcessing = w.status === "processing";
                          const isCompleted = w.status === "completed";
                          const isRejected = w.status === "rejected";

                          return (
                            <tr key={w.id} className="hover:bg-pitch-card/30 transition-colors">
                              <td className="px-4 py-3.5">
                                <div className="font-semibold text-sx-ink">
                                  {w.seller?.username || "Unknown Seller"}
                                </div>
                                <div className="text-[10px] text-sx-muted font-mono">
                                  {w.seller?.email || w.seller_id}
                                </div>
                              </td>

                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2 font-mono text-sx-ink-soft">
                                  <span>{formatDisplayPhone(w.phone_number)}</span>
                                  <button
                                    type="button"
                                    onClick={() => copyPhone(w.phone_number)}
                                    className="p-1 rounded hover:bg-pitch-card text-sx-muted hover:text-sx-ink transition-colors"
                                    title="Copy phone number"
                                  >
                                    {copiedPhone === w.phone_number ? (
                                      <Check className="w-3.5 h-3.5 text-sx-green-text" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <a
                                    href={`https://wa.me/${formatWhatsAppPhone(w.phone_number)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded hover:bg-sx-green-tint text-sx-green-text hover:text-sx-green-text transition-colors"
                                    title="Chat on WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </td>

                              <td className="px-4 py-3.5 font-mono font-bold text-sx-green-text text-sm">
                                {formatCurrency(w.amount)}
                              </td>

                              <td className="px-4 py-3.5">
                                {isPending && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sx-amber-tint border border-sx-amber-border text-sx-amber-text">
                                    <Clock className="w-3 h-3 animate-spin text-sx-amber-text" />
                                    {isProcessing ? "Processing · Manual Review" : "Pending Review"}
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sx-green-tint border border-sx-green-border text-sx-green-text">
                                    <CheckCircle2 className="w-3 h-3 text-sx-green-text" />
                                    Marked Paid · Manual Confirmation
                                  </span>
                                )}
                                {isRejected && (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sx-red-tint border border-sx-red-border text-sx-red-text">
                                    <XCircle className="w-3 h-3 text-sx-red-text" />
                                    Rejected
                                  </span>
                                    {w.failure_reason && (
                                      <p className="text-[10px] text-sx-muted italic max-w-xs truncate">
                                        Reason: {w.failure_reason}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </td>

                              <td className="px-4 py-3.5 text-[11px] text-sx-muted">
                                {new Date(w.created_at).toLocaleString()}
                              </td>

                              <td className="px-4 py-3.5 text-right">
                                {isPending ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => {
                                        setRejectModalTarget(w);
                                        setRejectModalReason("");
                                      }}
                                      disabled={actionLoading}
                                      className="text-xs"
                                    >
                                      Reject &amp; Restore Balance
                                    </Button>
                                    <Button
                                      variant="gold"
                                      size="sm"
                                      onClick={() => {
                                        if (
                                          confirm(
                                            `Confirm that you have sent ${formatCurrency(w.amount)} to M-Pesa line ${w.phone_number}?`
                                          )
                                        ) {
                                          onWithdrawalAction(w.id, "completed");
                                        }
                                      }}
                                      disabled={actionLoading}
                                      className="text-xs font-bold"
                                    >
                                      <Check className="w-3.5 h-3.5 mr-1" />
                                      Record Manual Payment
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-sx-muted italic">No action needed</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
  );
}
