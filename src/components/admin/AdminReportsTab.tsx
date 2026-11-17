"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Flag, RefreshCw, ExternalLink, ShieldAlert, XCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

/**
 * Report triage queue.
 *
 * Buyers could already report a listing, but nothing read the `reports` table,
 * so every report dead-ended after the WhatsApp alert.
 */

const REASON_LABELS: Record<string, string> = {
  scam_or_fraud: "Scam or fraud attempt",
  fake_screenshot: "Screenshot does not match the squad",
  account_already_sold: "Account was already sold",
  mismatched_details: "Details wrong or misleading",
  prohibited_content: "Prohibited or stolen content",
  other: "Something else",
};

interface Props {
  onFeedback: (fb: { type: "success" | "error"; message: string } | null) => void;
}

export function AdminReportsTab({ onFeedback }: Props) {
  const [reports, setReports] = useState<any[]>([]);
  const [status, setStatus] = useState<"pending" | "resolved" | "dismissed" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?status=${status}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load reports");
      setReports(data.reports || []);
    } catch (err: any) {
      onFeedback({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }, [status, onFeedback]);

  useEffect(() => {
    load();
  }, [load]);

  const resolve = async (reportId: string, action: "dismiss" | "takedown" | "suspend_seller") => {
    setBusyId(reportId);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resolve report");
      onFeedback({ type: "success", message: data.message });
      await load();
    } catch (err: any) {
      onFeedback({ type: "error", message: err.message });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sx-border pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-sx-red-text text-xs font-bold uppercase tracking-wider mb-1">
            <Flag className="w-3.5 h-3.5" />
            <span>Buyer safety queue</span>
          </div>
          <h2 className="text-2xl font-bold text-sx-ink font-display flex items-center gap-2.5">
            <span>Listing Reports</span>
            {status === "pending" && reports.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-sx-red-tint text-sx-red-text border border-sx-red-border font-mono font-bold">
                {reports.length} pending
              </span>
            )}
          </h2>
          <p className="text-xs text-sx-muted mt-0.5">
            Reports filed by buyers from a listing page. Suspending a listing removes it
            from Browse immediately; suspending the seller blocks their whole account.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-sx-subtle border border-sx-border text-xs overflow-x-auto">
            {(["pending", "resolved", "dismissed", "all"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`px-2.5 py-1 rounded-lg font-semibold capitalize whitespace-nowrap transition-colors ${
                  status === s
                    ? "bg-sx-green text-white"
                    : "text-sx-muted hover:text-sx-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="ml-1.5">Refresh</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-sx-subtle border border-sx-border animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-sx-border bg-sx-subtle p-8 text-center space-y-1">
          <CheckCircle2 className="w-6 h-6 text-sx-green-text mx-auto" />
          <p className="text-sm font-bold text-sx-ink">
            {status === "pending" ? "No reports waiting" : "Nothing here"}
          </p>
          <p className="text-xs text-sx-muted">
            {status === "pending"
              ? "Every buyer report has been triaged."
              : "No reports with this status."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reports.map((r) => {
            const listing = r.listing;
            const listingGone = listing?.deleted_at;
            return (
              <div
                key={r.id}
                className="rounded-xl border border-sx-border bg-sx-subtle p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sx-red-tint text-sx-red-text border border-sx-red-border">
                        {REASON_LABELS[r.reason] || r.reason}
                      </span>
                      <span className="text-[10px] font-mono text-sx-muted">
                        {new Date(r.created_at).toLocaleString("en-KE")}
                      </span>
                      {r.status !== "pending" && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-sx-stone text-sx-ink-soft">
                          {r.status}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-bold text-sx-ink truncate">
                      {listing?.title || "(listing no longer available)"}
                    </p>

                    <p className="text-[11px] text-sx-muted">
                      Reported by{" "}
                      <span className="font-semibold text-sx-ink-soft">
                        {r.reporter?.username || "a buyer"}
                      </span>
                      {listing?.price != null && (
                        <> · listed at {formatCurrency(listing.price, "KES")}</>
                      )}
                      {listing?.status && (
                        <>
                          {" "}
                          · current status{" "}
                          <span className="font-mono font-semibold">{listing.status}</span>
                        </>
                      )}
                    </p>

                    {r.details ? (
                      <p className="text-xs text-sx-ink-soft bg-sx-canvas border border-sx-border rounded-lg p-2.5 mt-1.5 leading-relaxed">
                        {r.details}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {listing && !listingGone && (
                      <Link
                        href={`/listings/${r.target_id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-sx-border text-[11px] font-semibold text-sx-ink hover:border-sx-border-strong"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View
                      </Link>
                    )}
                  </div>
                </div>

                {r.status === "pending" && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-sx-border">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={busyId === r.id}
                      onClick={() => resolve(r.id, "takedown")}
                      className="text-[11px]"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                      Suspend listing
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={busyId === r.id}
                      onClick={() => resolve(r.id, "suspend_seller")}
                      className="text-[11px]"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Suspend seller
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === r.id}
                      onClick={() => resolve(r.id, "dismiss")}
                      className="text-[11px]"
                    >
                      Dismiss report
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
