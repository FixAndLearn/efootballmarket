import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const POLICY_LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy & Cookies" },
  { href: "/dispute-policy", label: "Refunds & Disputes" },
  { href: "/escrow-guarantee", label: "Escrow Rules" },
  { href: "/fraud-prevention", label: "Anti-Fraud" },
  { href: "/seller/guidelines", label: "Seller Standards" },
];

interface PolicyPageShellProps {
  currentPath: string;
  badge: string;
  title: string;
  subtitle: string;
  effectiveDate?: string;
  summaryPoints?: string[];
  children: React.ReactNode;
}

export function PolicyPageShell({
  currentPath,
  badge,
  title,
  subtitle,
  effectiveDate = "November 10, 2026",
  summaryPoints,
  children,
}: PolicyPageShellProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 w-full space-y-8">
      {/* Cross-Policy Navigation Pills */}
      <nav
        aria-label="Platform Policies"
        className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
      >
        {POLICY_LINKS.map((item) => {
          const active = item.href === currentPath;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                active
                  ? "bg-sx-contrast text-sx-contrast-fg border-sx-contrast"
                  : "bg-sx-stone text-sx-ink border-sx-border hover:border-sx-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Header */}
      <header className="space-y-3 border-b border-sx-border pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sx-green-text">
            <ShieldCheck className="w-4 h-4" />
            <span>{badge}</span>
          </span>
          <span className="text-xs text-sx-muted font-mono">
            Effective &amp; Last Updated: {effectiveDate}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-sx-ink font-display tracking-tight">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-sx-muted leading-relaxed max-w-3xl">
          {subtitle}
        </p>
      </header>

      {/* Plain-Language Key Takeaways Box */}
      {summaryPoints && summaryPoints.length > 0 && (
        <section
          aria-label="Key Policy Highlights"
          className="rounded-lg bg-sx-stone border border-sx-border p-5 sm:p-6 space-y-3"
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-sx-ink">
            Plain-Language Summary
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs sm:text-[13px] text-sx-ink-soft leading-relaxed">
            {summaryPoints.map((pt, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sx-green-text mt-1.5 shrink-0" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Detailed Legal / Operational Clauses */}
      <div className="rounded-lg bg-sx-canvas border border-sx-border p-6 sm:p-10 space-y-8 text-sm sm:text-[15px] text-sx-ink-soft leading-relaxed">
        {children}
      </div>

      {/* Direct Support Footer */}
      <footer className="rounded-lg bg-sx-subtle border border-sx-border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-sx-muted">
        <div className="space-y-1">
          <p className="font-bold text-sx-ink">
            Questions about how these rules apply to an order or listing?
          </p>
          <p>
            Email <strong className="text-sx-ink">support@efootballmarket.co.ke</strong> or message our Nairobi desk on WhatsApp at <strong className="text-sx-ink">+254 794 400 365</strong>.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-sx-contrast text-sx-contrast-fg font-semibold shrink-0 hover:bg-sx-contrast-hover transition-colors"
        >
          Contact Support
        </Link>
      </footer>
    </div>
  );
}
