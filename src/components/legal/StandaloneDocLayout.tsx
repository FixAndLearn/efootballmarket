"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ArrowLeft, ShieldCheck, X } from "lucide-react";

export const STANDALONE_DOC_PATHS = [
  "/terms",
  "/privacy",
  "/dispute-policy",
  "/escrow-guarantee",
  "/fraud-prevention",
  "/seller/guidelines",
  "/policies",
];

export function isStandaloneDocPath(pathname?: string | null): boolean {
  if (!pathname) return false;
  return STANDALONE_DOC_PATHS.includes(pathname);
}

interface StandaloneDocLayoutProps {
  badge: string;
  title: string;
  subtitle: string;
  effectiveDate?: string;
  keyFacts?: Array<{ label: string; value: string }>;
  children: React.ReactNode;
}

export function StandaloneDocLayout({
  badge,
  title,
  subtitle,
  effectiveDate = "November 10, 2026",
  keyFacts,
  children,
}: StandaloneDocLayoutProps) {
  const [canCloseTab, setCanCloseTab] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window.opener || window.history.length <= 1)) {
      setCanCloseTab(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-sx-canvas text-sx-ink flex flex-col">
      {/* Minimalist Standalone Document Header */}
      <header className="sticky top-0 z-40 bg-sx-canvas/95 backdrop-blur-md border-b border-sx-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Logo size="sm" clickable={true} href="/" />

          {canCloseTab ? (
            <button
              type="button"
              onClick={() => {
                window.close();
                setTimeout(() => {
                  window.location.href = "/";
                }, 150);
              }}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border text-xs font-bold text-sx-ink transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-sx-muted" />
              <span>Close Tab</span>
            </button>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border text-xs font-bold text-sx-ink transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-sx-muted" />
              <span>Marketplace</span>
            </Link>
          )}
        </div>
      </header>

      {/* Open Single-Document Body (Strictly This Document Only) */}
      <article className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 pt-10 pb-16 sm:pt-14 sm:pb-20 space-y-10">
        {/* Document Title Block */}
        <header className="space-y-4 border-b border-sx-border pb-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sx-green-tint border border-sx-green-border text-xs font-bold text-sx-green-text">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{badge}</span>
            </span>
            <span className="text-xs text-sx-muted font-mono">
              Effective: {effectiveDate}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-sx-ink leading-[1.12]">
            {title}
          </h1>

          <p className="text-sm sm:text-base text-sx-muted leading-relaxed">
            {subtitle}
          </p>

          {keyFacts && keyFacts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              {keyFacts.map((fact) => (
                <div
                  key={fact.label}
                  className="p-3 rounded-xl bg-sx-subtle border border-sx-border space-y-0.5"
                >
                  <div className="text-sm font-extrabold font-display text-sx-green-text">
                    {fact.value}
                  </div>
                  <div className="text-[11px] font-medium text-sx-muted leading-snug">
                    {fact.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </header>

        {/* Clean Open Document Content */}
        <div className="space-y-9 text-sm sm:text-[15px] text-sx-ink-soft leading-relaxed">
          {children}
        </div>

        {/* Minimal Single-Line Document Footer */}
        <footer className="pt-8 border-t border-sx-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-sx-muted">
          <p>
            <strong className="text-sx-ink">eFootballMarket Kenya</strong> · Nairobi, Kenya · M-Pesa Buy Goods Till{" "}
            <strong className="text-sx-ink font-mono">1572931</strong>
          </p>
          <p>
            <a href="mailto:support@efootballmarket.co.ke" className="underline hover:text-sx-ink">
              support@efootballmarket.co.ke
            </a>{" "}
            ·{" "}
            <a
              href="https://wa.me/254794400365"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-sx-ink"
            >
              WhatsApp 0794 400 365
            </a>
          </p>
        </footer>
      </article>
    </div>
  );
}
