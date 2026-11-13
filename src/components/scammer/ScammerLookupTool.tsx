"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Search, ShieldAlert, AlertTriangle, Flag, Mail } from "lucide-react";

interface ScammerReport {
  id: string;
  phone_number?: string;
  username_alias?: string;
  platform_source?: string;
  incident_summary: string;
  amount_scammed_kes?: number;
  verified_status: string;
  created_at: string;
}

export function ScammerLookupTool() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<ScammerReport[]>([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportPhone, setReportPhone] = useState("");
  const [reportAlias, setReportAlias] = useState("");
  const [reportPlatform, setReportPlatform] = useState("WhatsApp Group / DM");
  const [reportAmount, setReportAmount] = useState("");
  const [reportSummary, setReportSummary] = useState("");
  const [reporterContact, setReporterContact] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportNotice, setReportNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportNotice(null);
    setSubmittingReport(true);
    try {
      const res = await fetch("/api/scammers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: reportPhone,
          usernameAlias: reportAlias,
          platformSource: reportPlatform,
          amountScammedKes: reportAmount,
          incidentSummary: reportSummary,
          reporterContact,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit report.");
      setReportNotice({
        ok: true,
        text: data.message || "Submitted for moderator verification.",
      });
      setReportPhone("");
      setReportAlias("");
      setReportAmount("");
      setReportSummary("");
    } catch (err: any) {
      setReportNotice({ ok: false, text: err.message || "Submission failed." });
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/scammers?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setMatches(data.scammers || []);
      setSearched(true);
    } catch {
      setMatches([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-pitch-surface border border-pitch-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sx-border pb-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Moderator-Reviewed Incident Lookup</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-sx-ink font-display pt-1">
            Check a Phone Number or Handle Before Trading
          </h2>
          <p className="text-xs sm:text-sm text-sx-muted">
            Search verified reports of off-platform M-Pesa fraud or post-sale Konami ID recovery.
          </p>
        </div>
        <span className="text-[11px] font-mono text-sx-muted shrink-0">
          Index Reviewed: Nov 2026
        </span>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Enter phone number (e.g. 0712...) or @username"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearched(false);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Button type="submit" variant="primary" size="md" isLoading={loading} className="shrink-0 font-bold">
          Run Lookup
        </Button>
      </form>

      {searched && (
        <div className="pt-2 space-y-3">
          {matches.length > 0 ? (
            <div className="p-5 rounded-xl bg-red-950/40 border-2 border-red-500/60 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-sx-red-text shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-sx-red-text">
                    High Risk: {matches.length} Verified Incident {matches.length === 1 ? "Report" : "Reports"} Found
                  </h3>
                  <p className="text-xs text-red-200/80 mt-0.5">
                    Do NOT send direct M-Pesa transfers to this number or handle.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-sx-red-border">
                {matches.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-sx-canvas border border-sx-red-border text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-sx-red-text flex-wrap gap-1">
                      <span>
                        {item.phone_number || "Phone Masked"} &bull; {item.username_alias || "Unknown Alias"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-sx-red-tint text-[10px] uppercase">
                        {item.platform_source || "Off-Platform Fraud Report"}
                      </span>
                    </div>
                    <p className="text-sx-ink-soft leading-relaxed">{item.incident_summary}</p>
                    <div className="flex items-center justify-between text-[11px] text-sx-muted pt-0.5">
                      <span>
                        Logged:{" "}
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString("en-KE", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Verified Log"}
                      </span>
                      {item.amount_scammed_kes ? (
                        <span className="text-sx-amber-text font-semibold">
                          Reported Loss: KES {item.amount_scammed_kes.toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-sx-amber-tint border border-sx-amber-border space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-sx-amber-text shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-sx-ink">
                    No Reports on File for &ldquo;{query}&rdquo; — Not a Safety Guarantee
                  </h3>
                  <p className="text-xs text-sx-ink-soft leading-relaxed">
                    Scammers change SIM cards and handles frequently. Even with zero prior reports, <strong>never pay a personal M-Pesa number</strong>—settle the trade via{" "}
                    <Link href="/middleman" className="text-sx-green-text underline font-semibold">
                      Middleman Escrow (Till 1572931)
                    </Link>{" "}
                    so funds stay held during your 24-hour login check.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Report Incident & Appeal Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-sx-border text-xs text-sx-muted">
            <a
              href={`https://wa.me/254794400365?text=${encodeURIComponent(
                "Hello eFootballMarket Moderation, I want to submit evidence for a new scam incident report."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-sx-ink hover:text-sx-green-text"
            >
              <Flag className="w-3.5 h-3.5 text-sx-red-text" />
              <span>Report a New Incident (Include Screenshots &amp; M-Pesa Code)</span>
            </a>

            <a
              href="mailto:support@efootballmarket.co.ke?subject=Scammer%20Check%20Appeal%20or%20Correction"
              className="inline-flex items-center gap-1.5 font-semibold text-sx-muted hover:text-sx-ink"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Appeal or Correct a Listed Entry</span>
            </a>
          </div>
        </div>
      )}

      {/* Always-accessible Online Report Bar & Expandable Form */}
      <div className="pt-2 border-t border-sx-border space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              if (query && !reportPhone) setReportPhone(query);
              setShowReportForm((v) => !v);
            }}
            className="inline-flex items-center gap-1.5 font-bold text-sx-red-text hover:underline"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{showReportForm ? "Hide Incident Report Form" : "Submit a Scam Report Online"}</span>
          </button>
          <a
            href="mailto:support@efootballmarket.co.ke?subject=Scammer%20Check%20Appeal%20or%20Correction"
            className="inline-flex items-center gap-1.5 font-semibold text-sx-muted hover:text-sx-ink"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Appeal or Correct a Listed Entry</span>
          </a>
        </div>

        {showReportForm && (
          <form
            onSubmit={handleReportSubmit}
            className="p-4 sm:p-5 rounded-xl bg-sx-canvas border border-sx-border space-y-3"
          >
            <p className="text-xs text-sx-muted">
              Reports stay private in our moderation queue until an administrator verifies M-Pesa/chat evidence.
            </p>
            {reportNotice && (
              <div
                className={`p-3 rounded-lg text-xs font-semibold ${
                  reportNotice.ok
                    ? "bg-sx-green-tint border border-sx-green-border text-sx-green-text"
                    : "bg-sx-red-tint border border-sx-red-border text-sx-red-text"
                }`}
              >
                {reportNotice.text}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                placeholder="Scammer phone (0712...)"
                value={reportPhone}
                onChange={(e) => setReportPhone(e.target.value)}
              />
              <Input
                placeholder="Username / Handle (@...)"
                value={reportAlias}
                onChange={(e) => setReportAlias(e.target.value)}
              />
              <Input
                placeholder="Platform (WhatsApp, TikTok, TG)"
                value={reportPlatform}
                onChange={(e) => setReportPlatform(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Amount lost in KES (optional)"
                value={reportAmount}
                onChange={(e) => setReportAmount(e.target.value)}
              />
              <Input
                placeholder="Your WhatsApp / Email (for moderator follow-up)"
                value={reporterContact}
                onChange={(e) => setReporterContact(e.target.value)}
              />
            </div>
            <textarea
              required
              rows={3}
              value={reportSummary}
              onChange={(e) => setReportSummary(e.target.value)}
              placeholder="Factual summary: what squad was promised, M-Pesa code/time, and what happened..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-sx-stone border border-sx-border text-xs sm:text-sm text-sx-ink focus:outline-none focus:border-sx-ink"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <a
                href={`https://wa.me/254794400365?text=${encodeURIComponent(
                  "Hello eFootballMarket Moderation, I submitted an online scam report and want to attach screenshot proof:"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-sx-green-text underline"
              >
                Attach Screenshots via WhatsApp &rarr;
              </a>
              <Button type="submit" variant="primary" size="sm" isLoading={submittingReport}>
                Submit for Moderator Review
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
