"use client";

import React, { useState } from "react";
import { ShieldAlert, X, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface RecallClaimModalProps {
  orderId: string;
  orderNumber: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Buyer-facing form for reporting that the seller recovered the account.
 *
 * Deliberately separate from DisputeModal: a dispute pauses an order that has
 * not settled, while this freezes the held remainder of a payment that has
 * already partly gone out. Mixing the two would make the outcome ambiguous, and
 * the buyer needs to know exactly what tapping the button does.
 */
export function RecallClaimModal({
  orderId,
  orderNumber,
  open,
  onClose,
}: RecallClaimModalProps) {
  const [description, setDescription] = useState("");
  const [konamiReference, setKonamiReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/recall-claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          konamiNoticeReference: konamiReference || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Could not file the report.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Try again, or email support@efootballmarket.co.ke.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-sx-canvas border border-sx-border-strong rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-sx-border">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-sx-red-text shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-sx-ink">Report a recovered account</h3>
              <p className="text-[11px] text-sx-muted mt-0.5">Order #{orderNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-sx-muted hover:text-sx-ink"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="p-5 space-y-3">
            <div className="p-3.5 rounded-xl bg-sx-green-tint border border-sx-green-border">
              <p className="text-xs font-semibold text-sx-green-text">Report received</p>
              <p className="text-[11px] text-sx-ink-soft mt-1 leading-relaxed">
                The held portion of this payment is frozen. An admin will review
                your evidence and respond in the order chat. Keep every email from
                Konami support — that is what decides the outcome.
              </p>
            </div>
            <Button variant="secondary" className="w-full" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-3.5">
            <div className="p-3 rounded-xl bg-sx-amber-tint border border-sx-amber-border flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-sx-amber-text shrink-0 mt-0.5" />
              <p className="text-[11px] text-sx-ink-soft leading-relaxed">
                Only use this if you genuinely lost access to the account after
                buying it. A false report costs the seller their payout while it is
                reviewed. Deliberate false reports can get your own account restricted.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-sx-ink">
                What happened?
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                maxLength={4000}
                placeholder="e.g. On 14 Nov I was logged out and could no longer sign in. Konami support told me the registered email had been changed back to the seller's address."
                className="w-full rounded-xl border border-sx-border bg-sx-elevated px-3 py-2 text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-border-strong"
              />
              <p className="text-[10px] text-sx-muted">
                {description.trim().length}/20 characters minimum
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-sx-ink">
                Konami support reference <span className="font-normal text-sx-muted">(optional)</span>
              </label>
              <input
                value={konamiReference}
                onChange={(e) => setKonamiReference(e.target.value)}
                maxLength={200}
                placeholder="Ticket or case number from Konami"
                className="w-full rounded-xl border border-sx-border bg-sx-elevated px-3 py-2 text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-border-strong"
              />
            </div>

            {error && (
              <p className="text-[11px] text-sx-red-text font-semibold">{error}</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="secondary" className="flex-1" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={submit}
                disabled={submitting || description.trim().length < 20}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Filing…</span>
                  </>
                ) : (
                  <span>Freeze held funds &amp; report</span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
