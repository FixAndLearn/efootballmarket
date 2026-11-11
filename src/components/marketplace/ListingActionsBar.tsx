"use client";

import React, { useState } from "react";
import { Share2, Flag, Check, X, AlertTriangle } from "lucide-react";

interface ListingActionsBarProps {
  listingId: string;
  listingTitle: string;
}

const REPORT_REASONS = [
  "Screenshot shows personal email, phone number, or login",
  "Asking buyers to pay outside M-Pesa Till 1572931",
  "Edited screenshot or misleading permanent OVR / cards",
  "Duplicate or unavailable squad",
];

export function ListingActionsBar({
  listingId,
  listingTitle,
}: ListingActionsBarProps) {
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [extraNote, setExtraNote] = useState("");
  const [reportSent, setReportSent] = useState(false);

  const getUrl = () => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://www.efootballmarket.co.ke";
    return `${origin}/listings/${listingId}`;
  };

  const handleShare = async () => {
    const url = getUrl();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${listingTitle} | eFootballMarket Kenya`,
          url,
        });
        return;
      } catch {
        // Fall through to clipboard copy if user dismisses share sheet
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    const url = getUrl();
    const subject = `Listing Report (#${listingId.slice(0, 8).toUpperCase()}): ${selectedReason}`;
    const body =
      `Listing: ${listingTitle}\n` +
      `URL: ${url}\n` +
      `Reason: ${selectedReason}\n` +
      (extraNote.trim() ? `Details: ${extraNote.trim()}\n` : "");

    if (typeof window !== "undefined") {
      window.open(
        `mailto:support@efootballmarket.co.ke?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(body)}`,
        "_blank"
      );
    }
    setReportSent(true);
  };

  return (
    <>
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sx-stone hover:bg-sx-subtle border border-sx-border text-xs font-semibold text-sx-ink transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-sx-green-text" />
              <span>Link Copied</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-sx-muted" />
              <span>Share Link</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setReportSent(false);
            setReportOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sx-stone hover:bg-sx-subtle border border-sx-border text-xs font-semibold text-sx-muted hover:text-sx-red-text transition-colors cursor-pointer"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Report</span>
        </button>
      </div>

      {reportOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setReportOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-sx-canvas border border-sx-border p-5 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-sx-border pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-sx-ink font-display">
                <AlertTriangle className="w-4 h-4 text-sx-amber-text" />
                <span>Report Listing #{listingId.slice(0, 8).toUpperCase()}</span>
              </div>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="p-1 text-sx-muted hover:text-sx-ink cursor-pointer"
                aria-label="Close report dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSent ? (
              <div className="space-y-3 text-xs text-sx-ink-soft">
                <p className="font-semibold text-sx-ink">
                  Report prepared for our moderation desk.
                </p>
                <p>
                  For urgent scams or exposed personal info, you can also forward Listing{" "}
                  <strong>#{listingId.slice(0, 8).toUpperCase()}</strong> on WhatsApp to{" "}
                  <a
                    href={`https://wa.me/254794400365?text=${encodeURIComponent(
                      `Moderation Report for Listing #${listingId.slice(0, 8).toUpperCase()} (${getUrl()}): ${selectedReason}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sx-green-text underline font-semibold"
                  >
                    +254 794 400 365
                  </a>
                  .
                </p>
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="w-full py-2 rounded-lg bg-sx-contrast text-sx-contrast-fg font-semibold text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-sx-ink">
                    What needs review?
                  </label>
                  {REPORT_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className="flex items-start gap-2 p-2.5 rounded-lg bg-sx-stone border border-sx-border text-xs text-sx-ink cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="report_reason"
                        checked={selectedReason === reason}
                        onChange={() => setSelectedReason(reason)}
                        className="mt-0.5 accent-emerald-600"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-sx-ink mb-1">
                    Extra details (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={extraNote}
                    onChange={(e) => setExtraNote(e.target.value)}
                    placeholder="Tell moderators what looked wrong..."
                    className="w-full rounded-lg bg-sx-stone border border-sx-border p-2.5 text-xs text-sx-ink"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="px-3.5 py-2 rounded-lg border border-sx-border text-xs font-semibold text-sx-muted hover:text-sx-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-sx-contrast text-sx-contrast-fg text-xs font-semibold cursor-pointer"
                  >
                    Send Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
