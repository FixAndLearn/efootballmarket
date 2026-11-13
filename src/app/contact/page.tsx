import { Metadata } from "next";
import Link from "next/link";
import {
  Mail,
  MessageCircle,
  Phone,
  Clock,
  MapPin,
  Handshake,
  Target,
  ArrowLeftRight,
  Trophy,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Direct Services, Escrow Desk & Support Kenya",
  description:
    "Book WhatsApp Middleman Escrow, Custom Squad Sourcing, Account Swaps, or Paid Cup Hosting with Brian Okibo's Nairobi Desk (M-Pesa Till 1572931 · +254 794 400 365).",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/contact",
  },
};

export default function ContactPage() {
  const serviceLaunchers = [
    {
      icon: Handshake,
      title: "Book WhatsApp / Facebook Middleman",
      desc: "Agreed on a squad deal off-platform? Lock the buyer's KES payment in Till 1572931 with full 24h login check.",
      actionLabel: "Open Contract Room",
      href: "/middleman",
      external: false,
    },
    {
      icon: Target,
      title: "Custom Squad Sourcing (3150+ OVR)",
      desc: "Tell our desk the exact Epics, Boosters, platform, and KES budget you want sourced from verified Kenyan sellers.",
      actionLabel: "Request on WhatsApp",
      href: `https://wa.me/254794400365?text=${encodeURIComponent(
        "Hello Brian / eFootballMarket Desk, I want help sourcing a verified Clean Konami ID squad. My platform, target OVR/Epics, and KES budget are:"
      )}`,
      external: true,
    },
    {
      icon: ArrowLeftRight,
      title: "Account Swap + Cash Top-Up Desk",
      desc: "Upgrade your Clean Konami ID safely with neutral admin verification of both accounts + M-Pesa top-up.",
      actionLabel: "Book Swap Mediation",
      href: `https://wa.me/254794400365?text=${encodeURIComponent(
        "Hello Brian / eFootballMarket Desk, I would like to arrange a protected Account Swap + Cash Top-Up via Till 1572931."
      )}`,
      external: true,
    },
    {
      icon: Trophy,
      title: "Host a Paid Clan Cup or 1v1 Fixture",
      desc: "Run 4–16 player knockouts or 1v1 matches with automated brackets and M-Pesa prize pool custody.",
      actionLabel: "Set Up Tournament",
      href: "/tournaments/host",
      external: false,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full space-y-10">
      <header className="space-y-3 border-b border-sx-border pb-6">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sx-green-text">
          <ShieldCheck className="w-4 h-4" />
          <span>Nairobi Escrow &amp; Support Desk</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-sx-ink font-display tracking-tight">
          Direct Services &amp; Support
        </h1>
        <p className="text-sm sm:text-base text-sx-muted leading-relaxed max-w-2xl">
          Reach <strong>Brian Okibo&apos;s Nairobi Desk</strong> directly for active order help, M-Pesa Till <strong>1572931</strong> verification, custom squad sourcing, protected account swaps, or scammer reports.
        </p>
      </header>

      {/* Direct Concierge & Escrow Services Grid */}
      <section className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-sx-ink font-display">
          Book a Marketplace or Escrow Service
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {serviceLaunchers.map((item) => {
            const Icon = item.icon;
            const inner = (
              <>
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-sx-canvas border border-sx-border flex items-center justify-center text-sx-green-text">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-sx-ink font-display group-hover:text-sx-green-text transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-sx-muted leading-relaxed">{item.desc}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-sx-green-text pt-3">
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </>
            );

            return item.external ? (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 rounded-2xl bg-sx-subtle hover:bg-sx-stone border border-sx-border hover:border-sx-green-border transition-all flex flex-col justify-between"
              >
                {inner}
              </a>
            ) : (
              <Link
                key={item.title}
                href={item.href}
                className="group p-5 rounded-2xl bg-sx-subtle hover:bg-sx-stone border border-sx-border hover:border-sx-green-border transition-all flex flex-col justify-between"
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Contact Channels */}
      <section className="space-y-4 pt-2 border-t border-sx-border">
        <h2 className="text-base sm:text-lg font-bold text-sx-ink font-display pt-4">
          Direct Contact Channels
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-sx-canvas border border-sx-border flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-sx-ink font-bold text-sm">
                <MessageCircle className="w-4 h-4 text-sx-green-text shrink-0" />
                <span>WhatsApp Desk (Fastest Response)</span>
              </div>
              <p className="text-xs text-sx-muted leading-relaxed">
                For active order questions, M-Pesa STK Push / Till 1572931 checks, Konami ID rebinding guidance, or reporting suspicious numbers.
              </p>
            </div>
            <div>
              <a
                href="https://wa.me/254794400365"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full bg-sx-green hover:bg-sx-green-hover text-white text-xs font-bold transition-colors"
              >
                <span>Chat on WhatsApp: +254 794 400 365</span>
              </a>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-sx-canvas border border-sx-border flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-sx-ink font-bold text-sm">
                <Mail className="w-4 h-4 text-sx-green-text shrink-0" />
                <span>Official Email Desk</span>
              </div>
              <p className="text-xs text-sx-muted leading-relaxed">
                For Seller KYC verification, Scammer Check appeals, Kenya Data Protection Act requests, or formal dispute attachments.
              </p>
            </div>
            <div>
              <a
                href="mailto:support@efootballmarket.co.ke"
                className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border text-sx-ink text-xs font-bold transition-colors"
              >
                <span>support@efootballmarket.co.ke</span>
              </a>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-sx-canvas border border-sx-border space-y-1.5">
            <div className="flex items-center gap-2.5 text-sx-ink font-bold text-sm">
              <Phone className="w-4 h-4 text-sx-muted" />
              <span>Direct Helpline &amp; Official Till</span>
            </div>
            <p className="text-xs text-sx-muted">
              Helpline: <strong className="text-sx-ink">0794 400 365</strong> · Official M-Pesa Buy Goods Till: <strong className="text-sx-green-text font-mono">1572931</strong>
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-sx-canvas border border-sx-border space-y-1.5">
            <div className="flex items-center gap-2.5 text-sx-ink font-bold text-sm">
              <Clock className="w-4 h-4 text-sx-muted" />
              <span>Operating Hours &amp; Location</span>
            </div>
            <p className="text-xs text-sx-muted">
              Monday – Sunday, <strong className="text-sx-ink">8:00 AM – 10:00 PM EAT</strong> (Nairobi, Kenya)
            </p>
          </div>
        </div>
      </section>

      <section className="p-5 rounded-2xl bg-sx-stone border border-sx-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-1 max-w-2xl">
          <h2 className="text-sm font-bold text-sx-ink flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sx-green-text shrink-0" />
            <span>Active Order Disputes &amp; Official Payment Rule</span>
          </h2>
          <p className="text-sx-muted leading-relaxed">
            If an order is in its 24-hour inspection window, tap <strong>Open Dispute</strong> inside your{" "}
            <Link href="/dashboard/buyer" className="text-sx-green-text hover:underline font-semibold">
              Buyer Order Room
            </Link>{" "}
            first so payout pauses immediately. Staff never ask for your M-Pesa PIN or ask you to pay a personal phone number outside Till <strong>1572931</strong>.
          </p>
        </div>
        <Link
          href="/escrow-guarantee"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-sx-contrast hover:bg-sx-contrast-hover text-sx-contrast-fg font-semibold shrink-0 transition-colors"
        >
          Escrow &amp; Fee Rules &nearr;
        </Link>
      </section>
    </div>
  );
}
