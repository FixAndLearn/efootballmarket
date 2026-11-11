"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { KonamiIdExplainerVideo } from "@/components/common/KonamiIdExplainerVideo";
import {
  ShieldCheck,
  Scale,
  RefreshCcw,
  Store,
  ShieldAlert,
  Lock,
  MessageCircle,
  Mail,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowLeft,
  X,
  Search,
} from "lucide-react";

export type PolicySectionId =
  | "escrow"
  | "terms"
  | "disputes"
  | "seller-standards"
  | "anti-fraud"
  | "privacy";

interface ChapterMeta {
  id: PolicySectionId;
  num: string;
  shortLabel: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const LEGAL_CHAPTERS: ChapterMeta[] = [
  {
    id: "escrow",
    num: "01",
    shortLabel: "Escrow & Fees",
    title: "Payment Protection, Timers & Fee Schedule",
    subtitle:
      "Who holds your M-Pesa payment on Till 1572931, automated vs Nairobi desk steps, the 4 order stages, and every platform fee.",
    icon: ShieldCheck,
  },
  {
    id: "terms",
    num: "02",
    shortLabel: "Terms of Service",
    title: "Terms of Service",
    subtitle:
      "Plain-language marketplace contract covering Clean Konami ID rules, off-platform Middleman deals, tournaments, and Kenyan law.",
    icon: Scale,
  },
  {
    id: "disputes",
    num: "03",
    shortLabel: "Refunds & Disputes",
    title: "Buyer Refund & Dispute Policy",
    subtitle:
      "Exact rules on when buyers receive a 100% M-Pesa refund, when sellers get paid, screen-recording proof, and 24–48h review.",
    icon: RefreshCcw,
  },
  {
    id: "seller-standards",
    num: "04",
    shortLabel: "Seller Standards",
    title: "Seller Standards & M-Pesa Payout Rules",
    subtitle:
      "Preparing a Clean Konami ID, permanent OVR screenshot standards, 12-hour OTP handover protocol, and 1–12h M-Pesa payouts.",
    icon: Store,
  },
  {
    id: "anti-fraud",
    num: "05",
    shortLabel: "Anti-Fraud",
    title: "Safety & Anti-Fraud Protections",
    subtitle:
      "Blocking fake M-Pesa SMS screenshots, AES-256-GCM Order Room login protection, dual-link recovery checks, and Scammer Check appeals.",
    icon: ShieldAlert,
  },
  {
    id: "privacy",
    num: "06",
    shortLabel: "Privacy & Cookies",
    title: "Privacy & Cookie Policy (Kenya DPA 2019)",
    subtitle:
      "How personal data, M-Pesa ledgers, encrypted handover logins, and Google AdSense / Consent Mode v2 cookies are handled.",
    icon: Lock,
  },
];

interface UnifiedLegalHubProps {
  initialSection?: PolicySectionId;
}

export function UnifiedLegalHub({ initialSection = "escrow" }: UnifiedLegalHubProps) {
  const [activeId, setActiveId] = useState<PolicySectionId>(initialSection);
  const [filterQuery, setFilterQuery] = useState("");
  const [canCloseTab, setCanCloseTab] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window.opener || window.history.length <= 1)) {
      setCanCloseTab(true);
    }
  }, []);

  // Smooth jump on initial route / hash load (skip scroll when opening default top chapter without hash)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const rawHash = window.location.hash.replace("#", "");

    if (rawHash === "fees") {
      setActiveId("escrow");
      const feeEl = document.getElementById("fees");
      if (feeEl) {
        setTimeout(() => feeEl.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      }
      return;
    }

    const validIds = LEGAL_CHAPTERS.map((c) => c.id);
    const target = (validIds.includes(rawHash as PolicySectionId)
      ? (rawHash as PolicySectionId)
      : initialSection);

    setActiveId(target);

    if (rawHash || initialSection !== "escrow") {
      const el = document.getElementById(target);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
      }
    }
  }, [initialSection]);

  // Live Scroll-Spy across all 6 chapters on the open single page
  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;

    const elements = LEGAL_CHAPTERS.map((c) => document.getElementById(c.id)).filter(
      Boolean
    ) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id as PolicySectionId);
        }
      },
      {
        rootMargin: "-120px 0px -60% 0px",
        threshold: [0, 0.15],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const jumpToChapter = (id: PolicySectionId) => {
    setActiveId(id);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const normalizedQuery = filterQuery.trim().toLowerCase();

  return (
    <div className="min-h-screen bg-sx-canvas text-sx-ink pb-24 md:pb-16">
      {/* OPEN EDITORIAL HERO BAND */}
      <section className="border-b border-sx-border bg-gradient-to-b from-sx-subtle to-sx-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 sm:pt-12 sm:pb-10 space-y-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {canCloseTab ? (
                <button
                  type="button"
                  onClick={() => {
                    window.close();
                    setTimeout(() => {
                      window.location.href = "/browse";
                    }, 150);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sx-canvas hover:bg-sx-stone border border-sx-border text-xs font-semibold text-sx-ink transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 text-sx-muted" />
                  <span>Close Reference Tab</span>
                </button>
              ) : (
                <Link
                  href="/browse"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sx-canvas hover:bg-sx-stone border border-sx-border text-xs font-semibold text-sx-ink transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-sx-muted" />
                  <span>Back to Squads</span>
                </Link>
              )}

              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sx-green-tint border border-sx-green-border text-xs font-bold text-sx-green-text">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Unified Trust, Legal &amp; Policy Center</span>
              </span>
            </div>
            <span className="text-xs text-sx-muted font-mono">
              Effective &amp; Last Updated: November 10, 2026
            </span>
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold font-display tracking-tight text-sx-ink leading-[1.1]">
              Every Platform Rule, Fee &amp; Policy on One Open Page.
            </h1>
            <p className="text-sm sm:text-base text-sx-muted leading-relaxed">
              Plain-language rules for buying, selling, swapping, and hosting cups on{" "}
              <strong className="text-sx-ink">eFootballMarket Kenya</strong> — no hidden pages or fine print. Scroll freely through all six chapters below or tap any section to jump right there.
            </p>
          </div>

          {/* 4-Metric At-a-Glance Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
            {[
              {
                metric: "Till 1572931",
                label: "Official M-Pesa Hold",
                note: "Funds held by eFootballMarket until buyer inspection finishes",
              },
              {
                metric: "KES 0",
                label: "Added Buyer Fee",
                note: "Buyers pay only the listed or agreed KES squad price",
              },
              {
                metric: "12h → 24h",
                label: "Delivery & Login Check",
                note: "12h seller delivery deadline + 24h buyer rebinding window",
              },
              {
                metric: "5% Fee",
                label: "Seller Commission Cap",
                note: "Min KES 50, capped at max KES 500 from completed payout",
              },
            ].map((item) => (
              <div
                key={item.metric}
                className="p-4 rounded-2xl bg-sx-canvas border border-sx-border space-y-1"
              >
                <div className="text-lg sm:text-xl font-extrabold font-display text-sx-green-text">
                  {item.metric}
                </div>
                <div className="text-xs font-bold text-sx-ink">{item.label}</div>
                <p className="text-[11px] text-sx-muted leading-snug">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STICKY MOBILE CHAPTER BAR */}
      <div className="lg:hidden sticky top-16 z-30 bg-sx-canvas/95 backdrop-blur-md border-b border-sx-border">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {LEGAL_CHAPTERS.map((ch) => {
            const active = activeId === ch.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => jumpToChapter(ch.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                  active
                    ? "bg-sx-green text-white font-bold shadow-sm"
                    : "bg-sx-stone text-sx-ink border border-sx-border"
                }`}
              >
                <span className="opacity-75 font-mono mr-1">{ch.num}</span>
                {ch.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN OPEN TWO-COLUMN DOCUMENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* STICKY DESKTOP SIDEBAR */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-28 space-y-6">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-sx-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Quick jump (e.g. refund, coins)..."
                aria-label="Filter policy sections"
                className="w-full h-9 pl-8 pr-3 rounded-xl bg-sx-stone border border-sx-border text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-green"
              />
            </div>

            <nav aria-label="Legal Chapters" className="space-y-1">
              <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-sx-muted">
                On This Page
              </p>
              {LEGAL_CHAPTERS.filter((ch) =>
                !normalizedQuery
                  ? true
                  : `${ch.title} ${ch.subtitle} ${ch.shortLabel}`
                      .toLowerCase()
                      .includes(normalizedQuery)
              ).map((ch) => {
                const Icon = ch.icon;
                const active = activeId === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => jumpToChapter(ch.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                      active
                        ? "bg-sx-green-tint text-sx-green-text font-bold border border-sx-green-border"
                        : "text-sx-muted hover:text-sx-ink hover:bg-sx-stone border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{ch.shortLabel}</span>
                    </span>
                    <span className="font-mono text-[10px] opacity-75">{ch.num}</span>
                  </button>
                );
              })}
            </nav>

            {/* Quick Keyword Shortcuts when searching */}
            {normalizedQuery && (
              <div className="p-3 rounded-xl bg-sx-subtle border border-sx-border text-[11px] text-sx-muted space-y-1.5">
                <p className="font-bold text-sx-ink">Quick Section Jumps:</p>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => jumpToChapter("escrow")} className="px-2 py-0.5 rounded bg-sx-stone text-sx-ink hover:text-sx-green-text">Fees &amp; Till</button>
                  <button type="button" onClick={() => jumpToChapter("disputes")} className="px-2 py-0.5 rounded bg-sx-stone text-sx-ink hover:text-sx-green-text">Refunds</button>
                  <button type="button" onClick={() => jumpToChapter("seller-standards")} className="px-2 py-0.5 rounded bg-sx-stone text-sx-ink hover:text-sx-green-text">Coins &amp; OVR</button>
                  <button type="button" onClick={() => jumpToChapter("privacy")} className="px-2 py-0.5 rounded bg-sx-stone text-sx-ink hover:text-sx-green-text">Cookies &amp; DPA</button>
                </div>
              </div>
            )}

            {/* Direct Nairobi Escrow Desk Card */}
            <div className="p-4 rounded-2xl bg-sx-subtle border border-sx-border space-y-3 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-sx-ink">Nairobi Support &amp; Escrow Desk</p>
                <p className="text-sx-muted leading-relaxed">
                  Operated by <strong>Brian Okibo</strong> (eFootballMarket Kenya). Mon–Sun, 8:00 AM – 10:00 PM EAT.
                </p>
              </div>
              <div className="space-y-1.5 pt-1">
                <a
                  href="https://wa.me/254794400365"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-sx-green hover:bg-sx-green-hover text-white font-bold text-xs transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp: 0794 400 365</span>
                </a>
                <a
                  href="mailto:support@efootballmarket.co.ke"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-sx-canvas border border-sx-border hover:border-sx-ink text-sx-ink font-semibold text-xs transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-sx-muted" />
                  <span>support@efootballmarket.co.ke</span>
                </a>
              </div>
            </div>
          </aside>

          {/* OPEN SINGLE-PAGE CONTENT STREAM (ALL 6 CHAPTERS) */}
          <div className="lg:col-span-9 space-y-16 sm:space-y-20 text-sm sm:text-[15px] text-sx-ink-soft leading-relaxed">
            {/* =========================================================
                CHAPTER 01: PAYMENT PROTECTION, TIMERS & FEE SCHEDULE
               ========================================================= */}
            <article id="escrow" className="scroll-mt-32 space-y-8">
              <header className="space-y-2 border-b border-sx-border pb-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sx-green-text font-mono">
                  <span>Chapter 01</span>
                  <span>·</span>
                  <span>Payment Protection &amp; Fees</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-sx-ink tracking-tight">
                  How Payment Protection, Timers &amp; Fees Work
                </h2>
                <p className="text-sm text-sx-muted max-w-3xl">
                  Who receives and holds your M-Pesa payment, what runs automatically vs what our Nairobi desk reviews, when your 24-hour inspection clock starts, and every fee across the platform.
                </p>
              </header>

              <div>
                <KonamiIdExplainerVideo />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <h3 className="text-base font-bold text-sx-ink font-display">
                    1.1 Who Controls the Money During an Order
                  </h3>
                  <p className="text-xs sm:text-sm">
                    Buyers pay via Safaricom Lipa Na M-Pesa into <strong>Buy Goods Till 1572931</strong>, the registered business till of <strong>eFootballMarket Kenya</strong> (sole proprietorship operated in Nairobi by Brian Okibo).
                  </p>
                  <p className="text-xs sm:text-sm">
                    <strong>Safaricom PLC&apos;s role:</strong> Licensed mobile-money payment processor transferring your KES payment to Till 1572931. Safaricom does not manage marketplace orders, hold a bank trust, or arbitrate game disputes.
                  </p>
                  <p className="text-xs sm:text-sm">
                    <strong>eFootballMarket&apos;s role:</strong> Holds received funds in its platform settlement account while your order is open and sends seller payout or buyer refund under Chapter 03. Payments sent directly to personal phone numbers are never covered.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-sx-subtle border border-sx-border space-y-3 text-xs sm:text-[13px]">
                  <h3 className="text-sm font-bold text-sx-ink font-display">
                    1.2 Automated Software vs Nairobi Desk (8 AM – 10 PM EAT)
                  </h3>
                  <div className="space-y-1.5">
                    <p className="font-bold text-sx-green-text">Automated Instantly:</p>
                    <ul className="list-disc pl-4 space-y-1 text-sx-ink-soft">
                      <li>M-Pesa STK Push prompt &amp; Daraja callback matching.</li>
                      <li>Locking the squad &amp; starting the <strong>12-hour seller delivery clock</strong>.</li>
                      <li>Starting the <strong>24-hour buyer inspection clock</strong> the moment logins are submitted.</li>
                      <li>Wallet release when buyer clicks <em>Confirm &amp; Release</em> (or after 24 uncontested hours).</li>
                    </ul>
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-sx-border">
                    <p className="font-bold text-sx-ink">Administrator-Reviewed:</p>
                    <ul className="list-disc pl-4 space-y-1 text-sx-ink-soft">
                      <li>Delayed Till 1572931 callback checks &amp; Middleman/Swap coordination.</li>
                      <li>Order Room log &amp; video review when <em>Open Dispute</em> is tapped (resolved in 24–48h).</li>
                      <li>Outgoing M-Pesa seller withdrawals &amp; buyer refunds (sent within <strong>1–12 hours</strong>).</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 4 Order Stages */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-sx-ink font-display">
                  1.3 The 4 Stages on Every Order &amp; Middleman Deal
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {[
                    {
                      step: "Stage 1 · Till 1572931",
                      desc: "Pay the squad price via STK Push or Buy Goods Till 1572931. Once server-verified, the squad locks so nobody else can buy it.",
                    },
                    {
                      step: "Stage 2 · 12h Delivery",
                      desc: "Seller has up to 12 hours to submit Konami ID / console credentials in the encrypted Order Room and forward the email-change OTP.",
                    },
                    {
                      step: "Stage 3 · 24h Check",
                      desc: "Your 24h clock starts on credential delivery. Record your first login, verify permanent cards & Link Data = Not Linked, and rebind my.konami.net.",
                    },
                    {
                      step: "Stage 4 · Release / Dispute",
                      desc: "Tap Confirm & Release to pay the seller (minus 5% fee, KES 50–500), or tap Open Dispute within 24h to freeze funds for human review.",
                    },
                  ].map((s) => (
                    <div key={s.step} className="p-4 rounded-xl bg-sx-subtle border border-sx-border space-y-1.5">
                      <h4 className="text-xs font-bold text-sx-ink font-display">{s.step}</h4>
                      <p className="text-xs text-sx-muted leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Published Fee Schedule */}
              <div id="fees" className="scroll-mt-32 space-y-3">
                <h3 className="text-base font-bold text-sx-ink font-display">
                  1.4 Complete Fee Schedule (Marketplace, Middleman, Swaps &amp; Cups)
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-sx-border">
                  <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
                    <thead className="bg-sx-stone text-sx-ink border-b border-sx-border">
                      <tr>
                        <th className="p-3.5 font-bold">Service</th>
                        <th className="p-3.5 font-bold">Buyer / Player Pays</th>
                        <th className="p-3.5 font-bold">Platform Fee</th>
                        <th className="p-3.5 font-bold">Refund Protection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sx-border bg-sx-canvas">
                      <tr>
                        <td className="p-3.5 font-semibold text-sx-ink">Marketplace Squad Listing</td>
                        <td className="p-3.5">Listed price (<strong>KES 0</strong> extra buyer fee)</td>
                        <td className="p-3.5"><strong>5%</strong> from seller payout (min <strong>KES 50</strong>, max <strong>KES 500</strong>)</td>
                        <td className="p-3.5">100% refund if seller misses 12h delivery or buyer dispute is upheld</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-semibold text-sx-ink">Middleman Escrow &amp; Swaps</td>
                        <td className="p-3.5">Agreed KES amount (<strong>KES 0</strong> extra buyer fee)</td>
                        <td className="p-3.5"><strong>5%</strong> from seller cash payout (min <strong>KES 50</strong>, max <strong>KES 500</strong>)</td>
                        <td className="p-3.5">100% refund if cancelled pre-delivery or inspection dispute is upheld</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-semibold text-sx-ink">Community Tournaments</td>
                        <td className="p-3.5">Posted entry (Free cups: <strong>KES 0</strong>)</td>
                        <td className="p-3.5">
                          Pot fee: Free = <strong>KES 0</strong>; &le;100 = <strong>15%</strong>; &le;250 = <strong>KES 20</strong>; &le;500 = <strong>KES 35</strong>; &le;1,000 = <strong>KES 60</strong>; &gt;1,000 = <strong>5%</strong>
                        </td>
                        <td className="p-3.5">100% entry refund if cup cancels before bracket generation</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </article>

            {/* =========================================================
                CHAPTER 02: TERMS OF SERVICE
               ========================================================= */}
            <article id="terms" className="scroll-mt-32 pt-14 border-t border-sx-border space-y-6">
              <header className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sx-green-text font-mono">
                  <span>Chapter 02</span>
                  <span>·</span>
                  <span>Terms of Service</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-sx-ink tracking-tight">
                  Terms of Service
                </h2>
                <p className="text-sm text-sx-muted max-w-3xl">
                  Binding agreement governing accounts, Clean Konami ID listings, off-platform Middleman deals, tournaments, and liability under Kenyan law.
                </p>
              </header>

              <div className="space-y-5">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-sx-ink font-display">
                    2.1 Independent Marketplace &amp; Eligibility
                  </h3>
                  <p>
                    <strong>eFootballMarket Kenya</strong> (operated in Nairobi, Republic of Kenya by Brian Okibo at <strong>efootballmarket.co.ke</strong>) is an independent peer-to-peer marketplace, Middleman escrow desk, and tournament hub. We are <strong>not affiliated with, endorsed by, or sponsored by Konami Digital Entertainment Co., Ltd., Safaricom PLC, Sony, Microsoft, Valve, Google, or Apple</strong>. You must be at least <strong>18 years old</strong> with an active Kenyan M-Pesa number to buy, sell, or enter paid cups.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-sx-ink font-display">
                    2.2 Clean Konami ID &amp; Listing Accuracy Rules
                  </h3>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Lawful Ownership:</strong> Sellers may only list accounts they lawfully own and control, including full access to the bound email inbox for OTP rebinding.</li>
                    <li><strong>Google Play &amp; Apple Unlinked:</strong> Mobile eFootball accounts must show <em>Konami ID: Linked</em> and both <strong>Google Play</strong> and <strong>Apple ID / Game Center: Not Linked</strong> under <em>Extras &rarr; Support &rarr; Link Data</em>.</li>
                    <li><strong>Permanent Roster Only:</strong> Listed OVR, Epic/Big Time/Show Time cards, Managers, GP, and Coins must be permanent items (never temporary <em>My League</em> loan players) and must state the native OS (Android vs iOS) where coins reside, with at least <strong>2 remaining monthly Data Transfers</strong>.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-sx-ink font-display">
                    2.3 Off-Platform Discovery vs Bypassing Escrow
                  </h3>
                  <p>
                    <strong>Permitted:</strong> Agreeing on a squad price or swap on WhatsApp, Facebook, TikTok, Discord, or Instagram and settling it safely on eFootballMarket via a Marketplace Listing or{" "}
                    <Link href="/middleman" className="text-sx-green-text font-semibold underline">
                      Middleman Deal Code
                    </Link>{" "}
                    (Till <strong>1572931</strong>) is encouraged and fully covered.
                  </p>
                  <p>
                    <strong>Prohibited:</strong> Asking users inside listing descriptions, squad images, or Order Chat to send money to a personal phone number outside Till 1572931, uploading fake M-Pesa SMS screenshots, or attempting post-sale publisher account recovery results in immediate ban, wallet freeze to cover affected orders, and verified Scammer Check listing.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-sx-ink font-display">
                    2.4 Publisher Terms, Liability Cap &amp; Kenyan Law
                  </h3>
                  <p>
                    Game publishers such as Konami maintain their own Terms of Use restricting account transfers and may update game mechanics or restrict accounts under their own policies. Buyers and sellers trade at their own discretion regarding publisher rules; once you verify Clean Konami ID status, rebind your email/2FA, and release escrow, ongoing account stewardship rests with you. To the fullest extent permitted by Kenyan law, eFootballMarket Kenya&apos;s maximum liability on any order is capped at the <strong>total KES escrow amount actually received by Till 1572931 for that specific order</strong>. Governed by the laws of the <strong>Republic of Kenya</strong>.
                  </p>
                </div>
              </div>
            </article>

            {/* =========================================================
                CHAPTER 03: BUYER REFUND & DISPUTE POLICY
               ========================================================= */}
            <article id="disputes" className="scroll-mt-32 pt-14 border-t border-sx-border space-y-6">
              <header className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sx-green-text font-mono">
                  <span>Chapter 03</span>
                  <span>·</span>
                  <span>Refunds &amp; Disputes</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-sx-ink tracking-tight">
                  Buyer Refund &amp; Dispute Policy
                </h2>
                <p className="text-sm text-sx-muted max-w-3xl">
                  Tapping <strong>Open Dispute</strong> inside your Order Room within the 24-hour inspection window immediately pauses automatic payout until a moderator reviews evidence within 24–48 hours.
                </p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 100% Refundable */}
                <div className="p-5 rounded-2xl bg-sx-green-tint/50 border border-sx-green-border space-y-3">
                  <div className="flex items-center gap-2 text-sx-green-text font-bold text-sm font-display">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>100% M-Pesa Refund Applies When:</span>
                  </div>
                  <ul className="space-y-2 text-xs sm:text-[13px] text-sx-ink-soft">
                    <li>• <strong>Missed 12-Hour Delivery:</strong> Seller fails to submit working logins or share the <code>my.konami.net</code> OTP within 12 hours of payment.</li>
                    <li>• <strong>Invalid or Transfer-Locked Login:</strong> Credentials fail, 2FA blocks entry, or <strong>0</strong> monthly Data Transfers remain.</li>
                    <li>• <strong>Google Play or Apple Still Linked:</strong> <em>Link Data</em> shows Google Play or Apple ID / Game Center is still linked.</li>
                    <li>• <strong>Material Squad Mismatch:</strong> Listed permanent Epics/Boosters are missing, OVR used loan cards, or native-OS coins are materially lower.</li>
                    <li>• <strong>Banned or Negative Coins:</strong> Active Konami suspension or negative coin balance.</li>
                  </ul>
                </div>

                {/* Not Refundable */}
                <div className="p-5 rounded-2xl bg-sx-subtle border border-sx-border space-y-3">
                  <div className="flex items-center gap-2 text-sx-ink font-bold text-sm font-display">
                    <XCircle className="w-4 h-4 text-sx-amber-text shrink-0" />
                    <span>Seller Payout Proceeds (Non-Refundable):</span>
                  </div>
                  <ul className="space-y-2 text-xs sm:text-[13px] text-sx-ink-soft">
                    <li>• <strong>Buyer&apos;s Remorse:</strong> Changing your mind on a squad that matches all listed stats and Clean Konami ID rules.</li>
                    <li>• <strong>Android vs iOS Coin Wallet Rule:</strong> Logging into an Android squad on an iPhone (or vice versa) where Konami separates OS coin wallets.</li>
                    <li>• <strong>Altered Squad:</strong> Spending coins/GP, releasing players, or running Legacy Transfers before requesting a refund.</li>
                    <li>• <strong>Expired 24h Window:</strong> Waiting past 24 hours after valid delivery without inspecting or tapping <em>Confirm &amp; Release</em> early.</li>
                  </ul>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-sx-muted">
                <strong className="text-sx-ink">Best Dispute Proof:</strong> Turn on your phone&apos;s screen recorder before your very first login and record one uncut clip showing <em>Title Screen &rarr; Data Transfer</em>, <em>Extras &rarr; Support &rarr; Link Data</em>, and <em>Game Plan</em>. Approved refunds return to your M-Pesa number within 2–12 hours.
              </p>
            </article>

            {/* =========================================================
                CHAPTER 04: SELLER STANDARDS & PAYOUT RULES
               ========================================================= */}
            <article id="seller-standards" className="scroll-mt-32 pt-14 border-t border-sx-border space-y-6">
              <header className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sx-green-text font-mono">
                  <span>Chapter 04</span>
                  <span>·</span>
                  <span>Seller Handbook</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-sx-ink tracking-tight">
                  Seller Standards, Fees &amp; M-Pesa Payouts
                </h2>
                <p className="text-sm text-sx-muted max-w-3xl">
                  Listing is <strong>KES 0</strong>. Following these 4 steps guarantees smooth buyer inspection and fast M-Pesa payouts.
                </p>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: "1. Prep Clean Konami ID First",
                    body: "Keep access to the bound my.konami.net email inbox, confirm Google Play & Apple ID say Not Linked, and verify at least 2 monthly Data Transfers remain.",
                  },
                  {
                    title: "2. Honest Permanent Screenshots",
                    body: "Remove My League loan players before capturing Game Plan OVR. Mask personal email strings on Link Data screenshots and state the exact OS for coins.",
                  },
                  {
                    title: "3. Verify 'Escrow Funded' on Site",
                    body: "Never hand over logins based on WhatsApp SMS screenshots. Check your Seller Dashboard to confirm the order badge reads Escrow Funded, then deliver in the encrypted vault within 12h.",
                  },
                  {
                    title: "4. Net M-Pesa Payouts (1–12h)",
                    body: "Once the buyer clicks Confirm & Release (or 24h passes uncontested), your net payout (price minus 5% fee, min KES 50 / max KES 500) is sent to your M-Pesa line.",
                  },
                ].map((card) => (
                  <div key={card.title} className="p-4 rounded-xl bg-sx-subtle border border-sx-border space-y-1.5">
                    <h3 className="text-sm font-bold text-sx-ink font-display">{card.title}</h3>
                    <p className="text-xs sm:text-[13px] text-sx-muted leading-relaxed">{card.body}</p>
                  </div>
                ))}
              </div>
            </article>

            {/* =========================================================
                CHAPTER 05: SAFETY & ANTI-FRAUD PROTECTIONS
               ========================================================= */}
            <article id="anti-fraud" className="scroll-mt-32 pt-14 border-t border-sx-border space-y-6">
              <header className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sx-green-text font-mono">
                  <span>Chapter 05</span>
                  <span>·</span>
                  <span>Safety &amp; Anti-Fraud</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-sx-ink tracking-tight">
                  Safety &amp; Anti-Fraud Policy
                </h2>
              </header>

              <ul className="space-y-3 list-disc pl-5">
                <li>
                  <strong>Server-Verified M-Pesa Receipts Only:</strong> Fake SMS generator screenshots never unlock orders. Every payment receipt is verified against Buy Goods Till <strong>1572931</strong> and locked against replay.
                </li>
                <li>
                  <strong>AES-256-GCM Encrypted Credential Vault:</strong> Handover logins are encrypted at rest with unique IVs and audited on reveal—never posted in public chat or plain-text email.
                </li>
                <li>
                  <strong>Chat Phishing &amp; Off-Platform Filters:</strong> Order Chat blocks external phishing links and personal payment numbers prior to escrow funding. Staff will <strong>never</strong> ask for your M-Pesa PIN or account password.
                </li>
                <li>
                  <strong>Moderated Scammer Check &amp; Free 48h Appeals:</strong> Reports on our{" "}
                  <Link href="/scammer-check" className="text-sx-green-text font-semibold underline">
                    Trader Phone Check
                  </Link>{" "}
                  require supporting proof before going live. Anyone assigned a recycled Safaricom/Airtel line or who has resolved a dispute can appeal free of charge via <strong>support@efootballmarket.co.ke</strong> (reviewed within 48 hours).
                </li>
              </ul>
            </article>

            {/* =========================================================
                CHAPTER 06: PRIVACY & COOKIE POLICY (KENYA DPA 2019)
               ========================================================= */}
            <article id="privacy" className="scroll-mt-32 pt-14 border-t border-sx-border space-y-6">
              <header className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sx-green-text font-mono">
                  <span>Chapter 06</span>
                  <span>·</span>
                  <span>Kenya Data Protection Act, 2019</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-sx-ink tracking-tight">
                  Privacy &amp; Cookie Policy
                </h2>
                <p className="text-sm text-sx-muted max-w-3xl">
                  Data Controller: <strong>eFootballMarket Kenya</strong> (sole proprietorship operated in Nairobi, Kenya by Brian Okibo · <strong>support@efootballmarket.co.ke</strong> · <strong>+254 794 400 365</strong>).
                </p>
              </header>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-sx-ink font-display">
                    6.1 Data We Collect &amp; Why (Section 30, Kenya DPA 2019)
                  </h3>
                  <p>
                    We collect only the minimum data required to fulfill contracts, settle M-Pesa escrow, prevent fraud, and comply with Kenyan law: account profile details (username, email, hashed credentials, role, optional WhatsApp contact), Seller KYC/payout M-Pesa records, Till <strong>1572931</strong> transaction ledgers (<strong>we never see or store your M-Pesa PIN</strong>), AES-256-GCM encrypted Order Room handover logins, and security/cookie consent state (<code>efootball_cookie_consent</code>). We <strong>never sell or rent</strong> personal data to third-party brokers.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-sx-ink font-display">
                    6.2 Cookies, Google Analytics / Tag Manager &amp; AdSense (Consent Mode v2)
                  </h3>
                  <p>
                    Strictly necessary Supabase session cookies (<code>sb-*</code>) keep you signed in. We use <strong>Google Tag Manager / Google Analytics</strong> (<code>GTM-KSSS83QZ</code>) for aggregate traffic measurement, and third-party vendors including <strong>Google</strong> (AdSense publisher <code>ca-pub-5924764989915276</code>) use cookies to serve ads based on prior visits to this or other websites. Under <strong>Google Consent Mode v2</strong>, <code>ad_storage</code>, <code>ad_user_data</code>, <code>ad_personalization</code>, and <code>analytics_storage</code> default to <strong>denied</strong> until you click <em>Accept All</em> on our Cookie Banner (choosing <em>Essential Only</em> keeps them off). You can opt out anytime at{" "}
                    <a
                      href="https://myadcenter.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sx-green-text font-semibold underline inline-flex items-center gap-0.5"
                    >
                      myadcenter.google.com
                      <ArrowUpRight className="w-3 h-3" />
                    </a>{" "}
                    or{" "}
                    <a
                      href="https://www.aboutads.info/choices/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sx-green-text font-semibold underline inline-flex items-center gap-0.5"
                    >
                      aboutads.info/choices
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                    .
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-sx-ink font-display">
                    6.3 Sub-Processors, Retention &amp; Your ODPC Rights
                  </h3>
                  <p>
                    Infrastructure sub-processors (Supabase database/auth, Safaricom M-Pesa / UnifiedPay gateway, Resend transactional email, and Google LLC subject to Consent Mode) process data over TLS 1.2+/1.3 encryption. Active profiles are deleted or anonymized within <strong>30 days</strong> of a verified deletion request (when no open escrow order or fraud claim exists), while statutory financial escrow ledgers are retained up to <strong>7 years</strong> under Kenyan accounting law. Under Sections 26 and 40 of the Kenya DPA 2019, you may request data access, correction, erasure, or consent withdrawal via <strong>support@efootballmarket.co.ke</strong>, or contact the <strong>Office of the Data Protection Commissioner (www.odpc.go.ke)</strong>. Platform services are strictly for users aged <strong>18+</strong>.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
