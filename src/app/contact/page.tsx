import { Metadata } from "next";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/support/WhatsAppSupport";
import {
  Mail,
  MessageCircle,
  Phone,
  Clock,
  MapPin,
  Target,
  ArrowLeftRight,
  Trophy,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Marketplace Help & Support Kenya",
  description:
    "Get help with active marketplace orders, custom squad requests, marketplace swap proposals, tournaments, and buyer protection for eligible marketplace checkout orders from eFootballMarket Kenya.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/contact",
  },
};

export default function ContactPage() {
  const serviceLaunchers = [
    {
      icon: Target,
      title: "Custom Squad Sourcing (3150+ OVR)",
      desc: "Tell our desk the exact Epics, Boosters, platform, and KES budget you want to find in seller-listed Kenyan squads. Listing details are seller-provided; any protected purchase must be placed from a published listing and paid through marketplace checkout.",
      actionLabel: "Request on WhatsApp",
      href: `https://wa.me/254105472373?text=${encodeURIComponent(
        "Hello Brian / eFootballMarket Desk, I want help finding a seller-listed Clean Konami ID squad. My platform, target OVR/Epics, and KES budget are:"
      )}`,
      external: true,
    },
    {
      icon: ArrowLeftRight,
      title: "Marketplace Swap Offers",
      desc: "Browse squads marked open to swaps and send a proposal from a listing page. Proposals do not hold funds; buyer protection applies only to orders paid through marketplace checkout.",
      actionLabel: "Browse Swap-Open Squads",
      href: "/browse?swap=1",
      external: false,
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
          <span>Marketplace Support Desk</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-sx-ink font-display tracking-tight">
          Direct Services &amp; Support
        </h1>
        <p className="text-sm sm:text-base text-sx-muted leading-relaxed max-w-2xl">
          Reach <strong>eFootballMarket support</strong> for active marketplace orders, M-Pesa Till <strong>1572931</strong> verification, custom squad requests, swap proposals, or scammer reports.
        </p>
      </header>

      {/* Direct Concierge & Escrow Services Grid */}
      <section className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-sx-ink font-display">
          Marketplace &amp; Community Services
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
                className="group p-5 rounded-2xl bg-sx-subtle hover:bg-sx-stone border border-sx-border hover:border-sx-green-border transition flex flex-col justify-between"
              >
                {inner}
              </a>
            ) : (
              <Link
                key={item.title}
                href={item.href}
                className="group p-5 rounded-2xl bg-sx-subtle hover:bg-sx-stone border border-sx-border hover:border-sx-green-border transition flex flex-col justify-between"
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
                href="https://wa.me/254105472373"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full bg-sx-green hover:bg-sx-green-hover text-white text-xs font-bold transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4 shrink-0" />
                <span>Chat with support on WhatsApp</span>
              </a>
              <a
                href="https://whatsapp.com/channel/0029VbE0fut1yT2AtW2Fr50h"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 w-full inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full border border-sx-green-border bg-sx-green-tint text-sx-green-text hover:brightness-[0.98] text-xs font-bold transition-all"
              >
                <WhatsAppIcon className="w-4 h-4 shrink-0" />
                <span>Join our WhatsApp Channel</span>
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
              Helpline available on WhatsApp <strong className="text-sx-ink">(tap to chat)</strong> · Official M-Pesa Buy Goods Till: <strong className="text-sx-green-text font-mono">1572931</strong>
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
            first to pause seller-balance release while the order is still in the pre-release inspection window. A post-release dispute does not automatically hold funds or reverse an M-Pesa transfer already sent. Staff never ask for your M-Pesa PIN or ask you to pay a personal phone number outside Till <strong>1572931</strong>.
          </p>
        </div>
        <Link
          href="/escrow-guarantee"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-sx-contrast hover:bg-sx-contrast-hover text-sx-contrast-fg font-semibold shrink-0 transition-colors"
        >
          Escrow &amp; Fee Rules ↗
        </Link>
      </section>
    </div>
  );
}
