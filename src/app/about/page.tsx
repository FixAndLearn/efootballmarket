import { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, Smartphone, Scale, Building2 } from "lucide-react";

export const metadata: Metadata = {
  title: "About eFootballMarket Kenya | Who Operates the Marketplace & How Funds Are Held",
  description:
    "Who operates eFootballMarket.co.ke in Nairobi, Kenya, how M-Pesa Till 1572931 payment holding works vs Safaricom's payment-processor role, and our published fee schedule.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/about",
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-10">
      <header className="space-y-3 border-b border-sx-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-sx-green-text">
          About &amp; Operator Disclosure
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-sx-ink font-display tracking-tight">
          A safer way for Kenyan eFootball players to trade squads
        </h1>
        <p className="text-sm sm:text-base text-sx-muted leading-relaxed">
          eFootballMarket Kenya replaces unverified WhatsApp, Telegram, and Facebook group-chat deals with structured M-Pesa payment holding (Till 1572931) and a 24-hour buyer login check.
        </p>
      </header>

      {/* Operator & Official Contact Identity Box */}
      <section className="p-5 rounded-xl bg-sx-stone border border-sx-border space-y-2.5 text-xs sm:text-sm text-sx-ink-soft">
        <div className="flex items-center gap-2 font-bold text-sx-ink">
          <Building2 className="w-4 h-4 text-sx-green-text" />
          <span>Who Operates eFootballMarket.co.ke</span>
        </div>
        <p className="leading-relaxed">
          <strong>eFootballMarket Kenya</strong> is operated as a sole proprietorship in Nairobi, Kenya by <strong>Brian Okibo</strong> (trading as <strong>eFootballMarket Kenya</strong>).
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
          <li>
            <span className="text-sx-muted">Official Support Email:</span>{" "}
            <a href="mailto:support@efootballmarket.co.ke" className="font-semibold text-sx-ink underline">
              support@efootballmarket.co.ke
            </a>
          </li>
          <li>
            <span className="text-sx-muted">Support &amp; Escrow WhatsApp:</span>{" "}
            <a href="https://wa.me/254794400365" className="font-semibold text-sx-ink underline">
              +254 794 400 365
            </a>
          </li>
          <li>
            <span className="text-sx-muted">Official Payment Channel:</span>{" "}
            <strong className="text-sx-ink font-mono">M-Pesa Buy Goods Till 1572931</strong>
          </li>
          <li>
            <span className="text-sx-muted">Operating Hours:</span>{" "}
            <strong className="text-sx-ink">Mon – Sun, 8:00 AM – 10:00 PM EAT</strong>
          </li>
        </ul>
      </section>

      <section className="space-y-4 text-sm text-sx-ink-soft leading-relaxed">
        <h2 className="text-lg font-bold text-sx-ink font-display">
          Who Controls Your Payment During an Order
        </h2>
        <p>
          When you buy a squad or open a Middleman deal, you pay via Safaricom Lipa Na M-Pesa into <strong>eFootballMarket Kenya&apos;s business Buy Goods Till 1572931</strong>:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Safaricom&apos;s Role:</strong> Safaricom PLC is the mobile-money payment processor that transfers your KES payment to Till 1572931. Safaricom does not manage marketplace orders, hold a third-party bank trust, or decide game-account disputes.
          </li>
          <li>
            <strong>eFootballMarket&apos;s Role:</strong> eFootballMarket Kenya holds the received funds in its platform settlement account while your order is open and administers seller payouts or buyer refunds according to our{" "}
            <Link
              href="/dispute-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sx-green-text underline font-semibold"
            >
              Refund &amp; Dispute Policy &nearr;
            </Link>
            .
          </li>
          <li>
            <strong>Automated vs Administrator Steps:</strong> STK Push matching, locking the squad, starting the <strong>12-hour seller delivery timer</strong>, and starting the <strong>24-hour buyer inspection timer</strong> (the moment credentials are submitted in the Order Room) run automatically. Manual Till receipt checks, dispute evidence reviews, and outgoing M-Pesa payouts/refunds (sent within 1–12 hours during 8:00 AM – 10:00 PM EAT) are reviewed by our Nairobi desk.
          </li>
        </ul>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            icon: Smartphone,
            title: "M-Pesa Till 1572931",
            desc: "Buyers pay KES 0 extra platform fees. Sellers pay a 5% service fee (min KES 50, max KES 500) deducted from net payout upon successful completion.",
          },
          {
            icon: Lock,
            title: "24-Hour Login Inspection",
            desc: "Your 24-hour countdown starts only after the seller submits login details in the Order Room—giving you time to verify permanent cards and Link Data = Not Linked.",
          },
          {
            icon: ShieldCheck,
            title: "Privacy by Default",
            desc: "Seller email addresses and personal phone numbers are never displayed on public squad cards. Order credentials stay inside your private Order Room.",
          },
          {
            icon: Scale,
            title: "24–48h Dispute Review",
            desc: "Tapping Open Dispute within the 24-hour window pauses seller payout while an administrator checks Order Room logs and screen-recording proof.",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="p-4 rounded-xl bg-sx-canvas border border-sx-border space-y-2"
            >
              <div className="w-8 h-8 rounded-lg bg-sx-stone flex items-center justify-center text-sx-green-text">
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-sx-ink">{item.title}</h3>
              <p className="text-xs text-sx-muted leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </section>

      <section className="p-5 rounded-xl bg-sx-stone border border-sx-border space-y-2 text-xs text-sx-muted leading-relaxed">
        <p className="font-semibold text-sx-ink">Independent Platform &amp; Publisher Rules Notice</p>
        <p>
          eFootballMarket Kenya is an independent marketplace and is not affiliated with, endorsed by, or sponsored by Konami Digital Entertainment Co., Ltd. or Safaricom PLC. Konami&apos;s Terms of Use restrict account transfers, and Konami can modify game features or restrict accounts under its own rules. Read our{" "}
          <Link
            href="/escrow-guarantee"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sx-green-text underline font-semibold"
          >
            Payment Protection &amp; Fee Guide &nearr;
          </Link>{" "}
          and{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sx-green-text underline font-semibold"
          >
            Terms of Service &nearr;
          </Link>{" "}
          before trading.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Link
          href="/browse"
          className="px-5 py-2.5 rounded-lg bg-sx-contrast hover:bg-sx-contrast-hover text-sx-contrast-fg text-sm font-semibold transition-colors"
        >
          Browse Squads
        </Link>
        <Link
          href="/contact"
          className="px-5 py-2.5 rounded-lg bg-sx-canvas border border-sx-border hover:border-sx-border-strong text-sx-ink text-sm font-semibold transition-colors"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
