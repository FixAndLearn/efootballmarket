import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { SquadValuatorCalculator } from "@/components/exchange/SquadValuatorCalculator";
import { DetailTabLink } from "@/components/ui/DetailTabLink";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Lock, Scale, ShieldCheck, Store } from "lucide-react";

export const metadata: Metadata = {
  title: "eFootball Squad KES Valuator & Seller Payout Calculator Kenya",
  description:
    "Calculate how much your eFootball account is worth in Kenyan Shillings (KES) based on Collective OVR, Epic & Double-Booster cards, Coins, Division, and see your exact M-Pesa payout.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/valuator",
  },
  openGraph: {
    title: "eFootball Squad KES Valuator & M-Pesa Payout Calculator | eFootballMarket",
    description:
      "Instant KES market price range & net M-Pesa seller payout calculator calibrated against verified Till 1572931 squad sales in Kenya.",
    url: "https://www.efootballmarket.co.ke/valuator",
    type: "website",
  },
};

export default function SquadValuatorPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sx-border pb-6">
        <div className="space-y-2 max-w-2xl">
          <span className="inline-block text-[11px] font-mono uppercase tracking-wider font-bold text-sx-green-text">
            Transparent Market Pricing &amp; Fee Calculator
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-sx-ink font-display tracking-tight">
            How Much Is Your eFootball Squad Worth in Kenya?
          </h1>
          <p className="text-xs sm:text-sm text-sx-muted leading-relaxed">
            Move the sliders to match your permanent Collective Strength (OVR), Epic / Big Time roster, and Coins. See both a <strong>24-hour fast-sale ask</strong> and your exact <strong>net M-Pesa payout</strong> after our capped 5% seller fee.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/compare">
            <Button variant="outline" size="sm">
              <Scale className="w-3.5 h-3.5" />
              <span>Compare Live Squads</span>
            </Button>
          </Link>
          <DetailTabLink href="/escrow-guarantee" variant="pill">
            Full Fee Table
          </DetailTabLink>
        </div>
      </header>

      <SquadValuatorCalculator />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: CheckCircle2,
            title: "What Raises KES Value Fastest",
            desc: "Double-Booster meta Epics (Gullit, Vieira, Rummenigge, Maldini, Van der Sar), 88+ Booster Managers, unspent Coins, and permanent 3200+ OVR without Live Update inflation.",
          },
          {
            icon: Lock,
            title: "Why Clean Konami ID Matters",
            desc: "Accounts with Google Play or Apple Game Center unlinked sell up to 2x faster because buyers can verify full sole ownership during their 24-hour inspection window.",
          },
          {
            icon: ShieldCheck,
            title: "Capped 5% Seller Fee (KES 50–500)",
            desc: "Buyers pay KES 0 extra on Till 1572931. Sellers keep 95% of the sale price, and our escrow fee never exceeds KES 500 even on KES 15,000+ collector squads.",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="p-5 rounded-2xl bg-sx-subtle border border-sx-border space-y-2"
            >
              <div className="w-8 h-8 rounded-lg bg-sx-canvas border border-sx-border flex items-center justify-center text-sx-green-text">
                <Icon className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-sx-ink font-display">{card.title}</h2>
              <p className="text-xs text-sx-muted leading-relaxed">{card.desc}</p>
            </div>
          );
        })}
      </section>

      <div className="rounded-2xl bg-sx-subtle border border-sx-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-sx-ink font-display">
            Ready to list your squad for free?
          </h2>
          <p className="text-xs text-sx-muted">
            Upload up to 5 screenshots and receive instant WhatsApp &amp; browser alerts when buyers ping or bid.
          </p>
        </div>
        <Link href="/seller/create-listing" className="shrink-0">
          <Button variant="primary" size="md">
            <Store className="w-4 h-4" />
            <span>Create Free Listing</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
