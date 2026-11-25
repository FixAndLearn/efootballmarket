"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCw, ShieldAlert, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface RecallClaim {
  id: string;
  order_id: string;
  claimant_id: string;
  claimed_amount: number | null;
  status: string;
  description: string;
  evidence_urls: string[] | null;
  konami_notice_reference: string | null;
  resolution_notes: string | null;
  created_at: string;
  order?: {
    id: string;
    order_number: string;
    buyer_id: string;
    seller_id: string;
    total_amount: number;
    status: string;
  } | null;
}

function money(value: number | null | undefined) {
  return `KES ${Number(value || 0).toLocaleString("en-KE", { maximumFractionDigits: 2 })}`;
}

export default function AdminRecallClaimsPage() {
  const [claims, setClaims] = useState<RecallClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<"open" | "all">("open");

  const loadClaims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/recall-claims", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load claims");
      setClaims(payload.claims || []);
    } catch (err: any) {
      setError(err?.message || "Could not load claims");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadClaims(); }, [loadClaims]);

  const resolve = async (claim: RecallClaim, outcome: "upheld" | "rejected") => {
    const notes = (notesById[claim.id] || "").trim();
    if (notes.length < 3) {
      setError("Add resolution notes (at least 3 characters) before deciding.");
      return;
    }
    const confirmText = outcome === "upheld"
      ? "Uphold this claim? Seller will be restricted and held funds parked for a manual buyer refund."
      : "Reject this claim? Held funds will be released to the seller and the order completed.";
    if (!window.confirm(confirmText)) return;

    setBusyId(claim.id);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/recall-claims", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId: claim.id, outcome, notes }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Resolution failed");
      setMessage(payload.message || "Claim resolved.");
      await loadClaims();
    } catch (err: any) {
      setError(err?.message || "Resolution failed");
    } finally {
      setBusyId(null);
    }
  };

  const visibleClaims = claims.filter((claim) => filter === "all" || ["open", "investigating"].includes(claim.status));
  const unresolvedCount = claims.filter((claim) => ["open", "investigating"].includes(claim.status)).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-sx-red-text">Trust &amp; Safety</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-sx-ink">Account-recovery claims</h1>
          <p className="text-sm text-sx-muted mt-1 max-w-2xl">Review reports that a sold eFootball account was recovered. An unresolved claim freezes the seller&apos;s held 20%; decide from evidence and record clear notes.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-2 rounded-lg border border-sx-red-border bg-sx-red-tint text-sx-red-text text-sm font-bold">{unresolvedCount} unresolved</span>
          <Button variant="secondary" size="sm" onClick={() => void loadClaims()} disabled={loading}><RefreshCw className="w-4 h-4" /> Refresh</Button>
        </div>
      </header>

      {error && <div role="alert" className="p-3 rounded-lg border border-sx-red-border bg-sx-red-tint text-sx-red-text text-sm">{error}</div>}
      {message && <div role="status" className="p-3 rounded-lg border border-sx-green-border bg-sx-green-tint text-sx-green-text text-sm">{message}</div>}

      <div className="flex items-center gap-2 border-b border-sx-border pb-3">
        <button type="button" onClick={() => setFilter("open")} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${filter === "open" ? "bg-sx-ink text-white" : "text-sx-muted hover:bg-sx-stone"}`}>Unresolved</button>
        <button type="button" onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${filter === "all" ? "bg-sx-ink text-white" : "text-sx-muted hover:bg-sx-stone"}`}>All claims</button>
      </div>

      {loading ? <p className="text-sm text-sx-muted py-8 text-center">Loading claim queue…</p> : visibleClaims.length === 0 ? (
        <div className="rounded-xl border border-sx-border bg-sx-canvas p-10 text-center">
          <CheckCircle2 className="w-8 h-8 text-sx-green-text mx-auto mb-3" />
          <h2 className="font-bold text-sx-ink">No {filter === "open" ? "unresolved " : ""}claims</h2>
          <p className="text-sm text-sx-muted mt-1">The queue is clear.</p>
        </div>
      ) : <div className="space-y-4">
        {visibleClaims.map((claim) => {
          const open = ["open", "investigating"].includes(claim.status);
          const evidence = claim.evidence_urls || [];
          return <article key={claim.id} className="rounded-xl border border-sx-border bg-sx-canvas overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-sx-border flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${open ? "bg-sx-red-tint text-sx-red-text" : "bg-sx-stone text-sx-muted"}`}><ShieldAlert className="w-5 h-5" /></span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-sx-ink">Order {claim.order?.order_number || claim.order_id.slice(0, 8)}</h2>
                    <span className={`text-[11px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full border ${open ? "bg-sx-amber-tint border-sx-amber-border text-sx-amber-text" : "bg-sx-stone border-sx-border text-sx-muted"}`}>{claim.status}</span>
                  </div>
                  <p className="text-xs text-sx-muted mt-1">Claimed {money(claim.claimed_amount)} · {new Date(claim.created_at).toLocaleString("en-KE")}</p>
                  <p className="text-[11px] text-sx-muted mt-1 break-all">Claim {claim.id} · buyer {claim.claimant_id} · seller {claim.order?.seller_id || "unknown"}</p>
                </div>
              </div>
              <Link href={`/orders/${claim.order_id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-sx-green-text hover:underline">Open order <ExternalLink className="w-3.5 h-3.5" /></Link>
            </div>

            <div className="p-4 sm:p-5 grid lg:grid-cols-[1fr_320px] gap-5">
              <div className="space-y-4">
                <section><h3 className="text-xs font-bold uppercase tracking-wide text-sx-muted mb-1">Buyer report</h3><p className="text-sm text-sx-ink whitespace-pre-wrap">{claim.description}</p></section>
                {claim.konami_notice_reference && <section><h3 className="text-xs font-bold uppercase tracking-wide text-sx-muted mb-1">Konami notice reference</h3><p className="text-sm text-sx-ink">{claim.konami_notice_reference}</p></section>}
                {evidence.length > 0 && <section><h3 className="text-xs font-bold uppercase tracking-wide text-sx-muted mb-2">Evidence ({evidence.length})</h3><div className="flex flex-wrap gap-2">{evidence.map((url, index) => <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg border border-sx-border text-xs text-sx-green-text hover:bg-sx-stone break-all">Evidence {index + 1} ↗</a>)}</div></section>}
                {claim.resolution_notes && <section><h3 className="text-xs font-bold uppercase tracking-wide text-sx-muted mb-1">Resolution notes</h3><p className="text-sm text-sx-ink">{claim.resolution_notes}</p></section>}
              </div>

              {open && <div className="rounded-xl bg-sx-subtle border border-sx-border p-4 space-y-3 self-start">
                <div className="flex gap-2 text-xs text-sx-muted"><AlertTriangle className="w-4 h-4 text-sx-amber-text shrink-0" /><p>Upholding restricts the seller and parks funds for a manual refund. Rejecting releases the held balance, then closes the order.</p></div>
                <label className="block text-xs font-semibold text-sx-ink" htmlFor={`notes-${claim.id}`}>Decision notes</label>
                <textarea id={`notes-${claim.id}`} value={notesById[claim.id] || ""} onChange={(event) => setNotesById((current) => ({ ...current, [claim.id]: event.target.value }))} minLength={3} maxLength={4000} rows={4} placeholder="Summarize evidence reviewed and why this outcome is fair…" className="w-full rounded-lg border border-sx-border bg-sx-canvas p-3 text-sm text-sx-ink outline-none focus:ring-2 focus:ring-sx-green" />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="danger" size="sm" disabled={busyId === claim.id} onClick={() => void resolve(claim, "upheld")}><ShieldAlert className="w-4 h-4" /> Uphold</Button>
                  <Button variant="secondary" size="sm" disabled={busyId === claim.id} onClick={() => void resolve(claim, "rejected")}><XCircle className="w-4 h-4" /> Reject</Button>
                </div>
                {busyId === claim.id && <p className="text-xs text-sx-muted text-center">Resolving claim safely…</p>}
              </div>}
            </div>
          </article>;
        })}
      </div>}
    </div>
  );
}
