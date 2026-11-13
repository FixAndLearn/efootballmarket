import React from "react";
import { Metadata } from "next";
import { StandaloneDocLayout } from "@/components/legal/StandaloneDocLayout";
import { KonamiIdExplainerVideo } from "@/components/common/KonamiIdExplainerVideo";
import { DetailTabLink } from "@/components/ui/DetailTabLink";

export const metadata: Metadata = {
  title: "How Payment Protection & Fees Work",
  description:
    "Standalone Payment Protection & Fee Schedule for eFootballMarket Kenya: M-Pesa Buy Goods Till 1572931 custody, 12h delivery, 24h buyer inspection, and complete fee table.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/escrow-guarantee" },
};

export default function EscrowGuaranteePage() {
  return (
    <StandaloneDocLayout
      badge="Payment Protection & Fees"
      title="How Payment Protection & Fees Work"
      subtitle="Clear breakdown of who holds your M-Pesa payment on Buy Goods Till 1572931, what runs automatically vs what our Nairobi desk reviews, and every fee across Marketplace, Middleman, Swaps, and Tournaments."
      keyFacts={[
        { value: "Till 1572931", label: "Official M-Pesa Hold" },
        { value: "KES 0", label: "Extra Buyer Fee" },
        { value: "24 Hours", label: "In-Game Login Check" },
        { value: "5% (50–500)", label: "Seller Fee Cap (KES)" },
      ]}
    >
      <section>
        <KonamiIdExplainerVideo />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          1. Who Holds Your Money During an Order
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Payment Account (Till 1572931):</strong> Buyers pay via Safaricom Lipa Na M-Pesa into <strong>Buy Goods Till 1572931</strong>, the business till of <strong>eFootballMarket Kenya</strong> (operated in Nairobi by Brian Okibo).
          </li>
          <li>
            <strong>Safaricom PLC vs eFootballMarket Kenya:</strong> Safaricom is the licensed payment processor transferring your KES payment to Till 1572931; Safaricom does not manage orders or arbitrate disputes. eFootballMarket holds received funds in its platform settlement account while your order is open and sends seller payout or buyer refund under our{" "}
            <DetailTabLink href="/dispute-policy">Refund &amp; Dispute Policy</DetailTabLink>.
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          2. The 4 Stages on Every Order
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-[13px]">
          {[
            {
              stage: "Stage 1 · Pay Till 1572931",
              detail: "Complete STK Push or Buy Goods Till 1572931 payment (KES 0 buyer fee). Once server-verified, the squad locks immediately.",
            },
            {
              stage: "Stage 2 · 12h Seller Delivery",
              detail: "Seller has up to 12 hours to submit Konami ID / console credentials in the encrypted Order Room and share the email-change OTP.",
            },
            {
              stage: "Stage 3 · 24h Buyer Login Check",
              detail: "Your 24h clock starts when credentials arrive. Verify permanent cards & Link Data = Not Linked in-game, then rebind my.konami.net.",
            },
            {
              stage: "Stage 4 · Release or Dispute",
              detail: "Tap Confirm & Release to pay the seller (within 1–12h, 8 AM – 10 PM EAT), or tap Open Dispute within 24h to freeze funds for review.",
            },
          ].map((s) => (
            <div key={s.stage} className="p-4 rounded-xl bg-sx-subtle border border-sx-border space-y-1">
              <h3 className="font-bold text-sx-ink font-display">{s.stage}</h3>
              <p className="text-sx-muted leading-relaxed">{s.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="fees" className="scroll-mt-24 space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          3. Complete Platform Fee Schedule
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-sx-border">
          <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
            <thead className="bg-sx-stone text-sx-ink border-b border-sx-border">
              <tr>
                <th className="p-3.5 font-bold">Service</th>
                <th className="p-3.5 font-bold">Buyer / Player Pays</th>
                <th className="p-3.5 font-bold">Platform Fee</th>
                <th className="p-3.5 font-bold">Refund Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sx-border bg-sx-canvas">
              <tr>
                <td className="p-3.5 font-semibold text-sx-ink">Marketplace Squads</td>
                <td className="p-3.5">Listed price (<strong>KES 0</strong> extra fee)</td>
                <td className="p-3.5"><strong>5%</strong> from seller payout (min <strong>KES 50</strong>, max <strong>KES 500</strong>)</td>
                <td className="p-3.5">100% refund if undelivered in 12h or dispute upheld</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-sx-ink">Middleman &amp; Swaps</td>
                <td className="p-3.5">Agreed amount (<strong>KES 0</strong> extra fee)</td>
                <td className="p-3.5"><strong>5%</strong> from seller payout (min <strong>KES 50</strong>, max <strong>KES 500</strong>)</td>
                <td className="p-3.5">100% refund if cancelled pre-delivery or dispute upheld</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-sx-ink">Tournaments &amp; 1v1s</td>
                <td className="p-3.5">Posted entry (Free: <strong>KES 0</strong>)</td>
                <td className="p-3.5">
                  Pot fee: Free = <strong>KES 0</strong>; &le;100 = <strong>15%</strong>; &le;250 = <strong>KES 20</strong>; &le;500 = <strong>KES 35</strong>; &le;1,000 = <strong>KES 60</strong>; &gt;1,000 = <strong>5%</strong>
                </td>
                <td className="p-3.5">100% entry refund if cancelled before bracket start</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-sx-muted pt-1">
          <strong>Publisher Notice:</strong> Konami&apos;s Terms of Use restrict account transfers and Konami can modify game features or restrict accounts under its own policies. eFootballMarket holds M-Pesa payment during your 24-hour Clean ID check, after which account care rests with you.
        </p>
      </section>
    </StandaloneDocLayout>
  );
}
