import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About eFootballMarket | Kenyan eFootball Trading Platform",
  description:
    "Learn how eFootballMarket protects Kenyan buyers and sellers during peer-to-peer eFootball account transfers using M-Pesa payment holds and 24-hour buyer verification.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/about",
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-10">
      <header className="space-y-2 border-b border-[#E2E2E0] pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F0F0F] font-display tracking-tight">
          About eFootballMarket
        </h1>
        <p className="text-sm text-[#5F5F5F] leading-relaxed">
          Independent peer-to-peer marketplace and M-Pesa payment-hold service for eFootball players in Kenya.
        </p>
      </header>

      <div className="space-y-8 text-sm text-[#3D3D3D] leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#0F0F0F]">Why We Built This Platform</h2>
          <p>
            For years, Kenyan eFootball players buying or selling squads on WhatsApp, Telegram, and Facebook groups faced the same problem: direct M-Pesa transfers leave whoever goes first exposed. Buyers routinely lost money to disappearing sellers or accounts still linked to Google Play, while honest sellers risked handing over login details to buyers who sent edited M-Pesa SMS screenshots.
          </p>
          <p>
            eFootballMarket was built in Kenya to replace informal group-chat trades with a structured, trackable order process: automated Safaricom Lipa Na M-Pesa verification (Till 1572931), encrypted credential delivery, and a 24-hour buyer inspection window before seller payout.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#0F0F0F]">How Transactions Are Protected</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-white border border-[#E2E2E0] space-y-1.5">
              <h3 className="text-sm font-semibold text-[#0F0F0F]">Server-Verified M-Pesa Payments</h3>
              <p className="text-xs text-[#5F5F5F] leading-relaxed">
                Orders are funded via M-Pesa STK push to Till 1572931 and reconciled automatically against payment gateway callbacks—never through manual SMS screenshots.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#E2E2E0] space-y-1.5">
              <h3 className="text-sm font-semibold text-[#0F0F0F]">Clean Konami ID Requirement</h3>
              <p className="text-xs text-[#5F5F5F] leading-relaxed">
                Every listed squad must be linked exclusively to a Konami ID with Google Play and Apple Game Center unlinked so ownership transfers cleanly.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#E2E2E0] space-y-1.5">
              <h3 className="text-sm font-semibold text-[#0F0F0F]">24-Hour Inspection Window</h3>
              <p className="text-xs text-[#5F5F5F] leading-relaxed">
                Buyers get 24 hours after credentials are delivered to check the squad in-game and move the Konami ID to their own email before releasing payout.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#E2E2E0] space-y-1.5">
              <h3 className="text-sm font-semibold text-[#0F0F0F]">Community Safety Guides</h3>
              <p className="text-xs text-[#5F5F5F] leading-relaxed">
                We publish free practical guides on Konami ID security, scammer phone number checks, and safe trading practices for Kenyan mobile gamers.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#0F0F0F]">Platform Operator &amp; Transparency</h2>
          <p>
            eFootballMarket (<code className="text-[#1F1F1F]">efootballmarket.co.ke</code>) is independently operated in Kenya by Brian Okibo. We do not publish fabricated listings, fake sales counters, or synthetic user reviews—every listing and completed trade shown on the marketplace comes directly from real user activity.
          </p>
          <p className="text-xs text-[#5F5F5F] p-4 rounded-xl bg-white border border-[#E2E2E0]">
            <strong className="text-[#1F1F1F] block mb-1">Non-Affiliation Notice</strong>
            eFootballMarket is an independent peer-to-peer platform and is not affiliated with, endorsed by, or sponsored by Konami Digital Entertainment Co., Ltd. or Safaricom PLC. All product and company names are trademarks of their respective holders.
          </p>
        </section>

        <section className="pt-2 flex flex-wrap items-center gap-3 text-xs font-medium">
          <Link
            href="/contact"
            className="px-4 py-2 rounded-lg bg-[#006340] hover:bg-[#004D32] text-[#0F0F0F] font-semibold transition-colors"
          >
            Contact Support
          </Link>
          <Link
            href="/escrow-guarantee"
            className="px-4 py-2 rounded-lg bg-[#F4F3F1] hover:bg-[#EAE9E6] border border-[#C8C8C4] text-[#1F1F1F] transition-colors"
          >
            How Buyer Protection Works
          </Link>
          <Link
            href="/news"
            className="px-4 py-2 rounded-lg bg-[#F4F3F1] hover:bg-[#EAE9E6] border border-[#C8C8C4] text-[#1F1F1F] transition-colors"
          >
            Read Safety Guides
          </Link>
        </section>
      </div>
    </div>
  );
}
