"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck, ShieldX, RefreshCw, Phone, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ScammerReport {
  id: string;
  phone_number: string | null;
  username_alias: string | null;
  platform_source: string | null;
  incident_summary: string;
  amount_scammed_kes: string | number | null;
  evidence_notes: string | null;
  reporter_contact: string | null;
  verified_status: string;
  reviewed_by: string | null;
  created_at: string;
}

type StatusFilter = "pending" | "verified" | "rejected" | "all";

/**
 * Scammer-report moderation queue.
 *
 * Without this tab, `scammer_reports` was write-only: the public form inserted
 * a row with verified_status = 'pending', the public lookup filtered to
 * 'verified', and no code path existed to move a row between those two states.
 * A report could never surface in a lookup and a moderator could never dismiss
 * a bad one. Both halves live here now.
 */
export function AdminScammerTab({
  onFeedback,
}: {
  onFeedback?: (fb: { type: "success" | "error"; message: string } | null) => void;
}) {
  const [reports, setReports] = useState<ScammerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("pending");

  const load = useCallback(async (filter: StatusFilter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/scammers?status=${filter}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not load reports.");
      setReports(data.reports || []);
    } catch (err: any) {
      onFeedback?.({ type: "error", message: err?.message || "Could not load scammer reports." });
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [onFeedback]);

  useEffect(() => {
    load(status);
  }, [status, load]);

  const review = async (reportId: string, action: "verify" | "reject") => {
    setBusyId(reportId);
    try {
      const res = await fetch("/api/admin/scammers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not update the report.");
      onFeedback?.({ type: "success", message: data.note || "Report updated." });
      // Drop it from the pending queue immediately so the list stays honest.
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err: any) {
      onFeedback?.({ type: "error", message: err?.message || "Could not update the report." });
    } finally {
      setBusyId(null);
    }
  };

  const filters: { id: StatusFilter; label: string }[] = [
    { id: "pending", label: "Pending" },
    { id: "verified", label: "Verified" },
    { id: "rejected", label: "Rejected" },
    { id: "all", label: "All" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-sx-ink flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-sx-red-text" />
            Scammer Report Queue
          </h2>
          <p className="text-xs text-sx-muted mt-0.5">
            Only <strong>verified</strong> reports appear in the public Scammer Check lookup.
            Unverified reports stay hidden.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => load(status)}
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatus(f.id)}
            className={`px-3 py-1 rounded-full border text-[11px] font-semibold transition-colors ${
              status === f.id
                ? "bg-sx-green-tint border-sx-green-border text-sx-green-text"
                : "bg-sx-canvas border-sx-border text-sx-muted hover:text-sx-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-sx-stone animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-sx-border bg-sx-canvas p-8 text-center">
          <ShieldCheck className="w-8 h-8 text-sx-green-text mx-auto mb-2" />
          <p className="text-sm font-semibold text-sx-ink">Queue is clear</p>
          <p className="text-xs text-sx-muted mt-1">
            {status === "pending"
              ? "No reports are waiting for review."
              : "Nothing in this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reports.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-sx-border bg-sx-canvas p-3.5 space-y-2"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  {r.phone_number && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sx-elevated border border-sx-border-strong text-[11px] font-bold text-sx-ink font-mono">
                      <Phone className="w-3 h-3" />
                      {r.phone_number}
                    </span>
                  )}
                  {r.username_alias && (
                    <span className="text-[11px] font-semibold text-sx-ink-soft">
                      {r.username_alias}
                    </span>
                  )}
                  {r.platform_source && (
                    <span className="text-[10px] text-sx-muted px-1.5 py-0.5 rounded bg-sx-elevated">
                      {r.platform_source}
                    </span>
                  )}
                  {r.amount_scammed_kes != null && Number(r.amount_scammed_kes) > 0 && (
                    <span className="text-[10px] font-bold text-sx-red-text">
                      KES {Number(r.amount_scammed_kes).toLocaleString()}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                    r.verified_status === "verified"
                      ? "bg-sx-green-tint border-sx-green-border text-sx-green-text"
                      : r.verified_status === "rejected"
                      ? "bg-sx-elevated border-sx-border-strong text-sx-muted"
                      : "bg-sx-amber-tint border-sx-amber-border text-sx-amber-text"
                  }`}
                >
                  {r.verified_status}
                </span>
              </div>

              <p className="text-[11.5px] text-sx-ink-soft leading-relaxed whitespace-pre-wrap">
                {r.incident_summary}
              </p>

              {r.reporter_contact && (
                <p className="text-[10.5px] text-sx-muted">
                  Reporter contact: <span className="font-mono">{r.reporter_contact}</span>
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-sx-border">
                <span className="text-[10px] text-sx-muted">
                  {new Date(r.created_at).toLocaleString()}
                </span>
                {r.verified_status === "pending" ? (
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={busyId === r.id}
                      onClick={() => review(r.id, "verify")}
                      className="text-[11px] py-1 px-2"
                      title="Publish this report to the public lookup"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      {busyId === r.id ? "Saving…" : "Verify"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busyId === r.id}
                      onClick={() => review(r.id, "reject")}
                      className="text-[11px] py-1 px-2 text-sx-red-text"
                      title="Keep this report hidden"
                    >
                      <ShieldX className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] text-sx-muted">
                    <AlertTriangle className="w-3 h-3" />
                    Already reviewed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminScammerTab;
