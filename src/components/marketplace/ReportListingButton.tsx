"use client";

import React, { useState } from "react";
import { Flag, X, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

const REASONS = [
  { value: "scam_or_fraud", label: "Scam or fraud attempt" },
  { value: "fake_screenshot", label: "Screenshot does not match the squad" },
  { value: "account_already_sold", label: "Account was already sold" },
  { value: "mismatched_details", label: "Details are wrong or misleading" },
  { value: "prohibited_content", label: "Prohibited or stolen content" },
  { value: "other", label: "Something else" },
] as const;

export function ReportListingButton({
  listingId,
  listingTitle,
  isSignedIn,
}: {
  listingId: string;
  listingTitle?: string | null;
  isSignedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("scam_or_fraud");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/listings/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, reason, details }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Could not submit your report.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sx-muted hover:text-sx-red-text transition-colors"
      >
        <Flag className="w-3.5 h-3.5" />
        <span>Report this listing</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Report listing"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-sx-canvas border border-sx-border shadow-overlay p-5 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-sx-ink font-display">
                  Report this listing
                </h3>
                <p className="text-[11px] text-sx-muted mt-0.5 line-clamp-2">
                  {listingTitle || "This squad"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !submitting && setOpen(false)}
                className="p-1 rounded-md text-sx-muted hover:text-sx-ink"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {done ? (
              <div className="space-y-3 py-2">
                <div className="flex items-start gap-2 p-3 rounded-xl bg-sx-green-tint border border-sx-green-border">
                  <CheckCircle2 className="w-4 h-4 text-sx-green-text shrink-0 mt-0.5" />
                  <p className="text-xs text-sx-ink-soft leading-relaxed">
                    Thank you. A moderator will review this listing. If you
                    already paid for it, open a dispute from your Order Room so
                    your funds stay held.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            ) : !isSignedIn ? (
              <div className="space-y-3 py-2">
                <p className="text-xs text-sx-ink-soft leading-relaxed">
                  Please sign in so we can follow up on your report and keep the
                  queue free of spam.
                </p>
                <a href={`/login?redirect=/listings/${listingId}`}>
                  <Button variant="primary" size="sm" className="w-full">
                    Sign in to report
                  </Button>
                </a>
              </div>
            ) : (
              <>
                <fieldset className="space-y-2">
                  <legend className="text-[11px] font-bold uppercase tracking-wider text-sx-muted mb-1">
                    What is wrong?
                  </legend>
                  {REASONS.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        reason === r.value
                          ? "border-sx-green-border bg-sx-green-tint"
                          : "border-sx-border bg-sx-subtle hover:border-sx-border-strong"
                      }`}
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="accent-[var(--sx-green)]"
                      />
                      <span className="text-xs font-medium text-sx-ink">{r.label}</span>
                    </label>
                  ))}
                </fieldset>

                <div>
                  <label
                    htmlFor="report-details"
                    className="block text-[11px] font-bold uppercase tracking-wider text-sx-muted mb-1"
                  >
                    Details (optional)
                  </label>
                  <textarea
                    id="report-details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value.slice(0, 2000))}
                    rows={3}
                    placeholder="What did you notice? Order number, what the seller promised, etc."
                    className="w-full rounded-lg border border-sx-border bg-sx-subtle p-2.5 text-xs text-sx-ink placeholder:text-sx-faint resize-none"
                  />
                </div>

                {error && (
                  <p className="text-[11px] text-sx-red-text bg-sx-red-tint border border-sx-red-border rounded-lg p-2">
                    {error}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={submit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending
                      </>
                    ) : (
                      "Submit report"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
