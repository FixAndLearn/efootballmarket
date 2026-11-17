import React from "react";
import { Metadata } from "next";
import { StandaloneDocLayout } from "@/components/legal/StandaloneDocLayout";
import { KonamiIdExplainerVideo } from "@/components/common/KonamiIdExplainerVideo";
import { DetailTabLink } from "@/components/ui/DetailTabLink";

export const metadata: Metadata = {
  title: "How Payment Protection & Fees Work",
  description:
    "Payment protection and fee rules for orders created from published listings and paid through eFootballMarket checkout, including M-Pesa custody, delivery, and inspection timelines.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/escrow-guarantee" },
};

export default function EscrowGuaranteePage() {
  return (
    <StandaloneDocLayout
      badge="Payment Protection & Fees"
      title="How Payment Protection & Fees Work"
      subtitle="Clear breakdown of how marketplace checkout payments are held on Buy Goods Till 1572931, what runs automatically vs what our Nairobi desk reviews, and the published marketplace and tournament fees."
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
            <strong>Safaricom PLC vs eFootballMarket Kenya:</strong> Safaricom is the licensed payment processor transferring your KES payment to Till 1572931; Safaricom does not manage orders or arbitrate disputes. eFootballMarket holds received funds in its platform settlement account while your order is open. Seller proceeds are credited to an account balance on release; refund requests are reviewed under our{" "}
            <DetailTabLink href="/dispute-policy">Refund &amp; Dispute Policy</DetailTabLink>. Approved M-Pesa refunds are arranged manually, and this page does not confirm that funds have been sent.
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
              detail: "Tap Confirm & Release to credit the seller’s available balance, or tap Open Dispute within 24h to pause release for review. The seller must request an M-Pesa withdrawal; requests are reviewed and processed manually, and timing varies.",
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
                <td className="p-3.5">A full refund may be approved after review for non-delivery or an upheld dispute; approved M-Pesa refunds are arranged manually</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-sx-ink">Tournaments &amp; 1v1s</td>
                <td className="p-3.5">Posted entry (Free: <strong>KES 0</strong>)</td>
                <td className="p-3.5">
                  On the total pot: Free = <strong>KES 0</strong>; &le;100 = <strong>15% rounded to whole shillings (min KES 10, max KES 15; capped at the pot)</strong>; &gt;100–250 = <strong>KES 20</strong>; &gt;250–500 = <strong>KES 35</strong>; &gt;500–1,000 = <strong>KES 60</strong>; &gt;1,000 = <strong>5%, rounded to whole shillings (min KES 60)</strong>
                </td>
                <td className="p-3.5">No automatic cancellation refund; contact support for manual review</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-sx-muted pt-1">
          Tournament fees are calculated on the total entry pot (entry fee multiplied by the tournament&apos;s slot count). The displayed prize is projected until all slots are filled and entries are confirmed; brackets cannot be formed sooner. Tournament prizes are arranged manually after the final result, and the result page is not a payout receipt. Cancelling a tournament does not issue an automatic refund; contact support for review.
        </p>
        <p className="text-xs text-sx-muted">
          Buyer protection applies only to orders created from published marketplace listings and paid through eFootballMarket checkout. Deals arranged and paid directly through WhatsApp, Facebook, or another external service are not covered.
        </p>
        <p className="text-xs text-sx-muted">
          <strong>Publisher Notice:</strong> Konami&apos;s Terms of Use restrict account transfers and Konami can modify game features or restrict accounts under its own policies. eFootballMarket holds M-Pesa payment during your 24-hour Clean ID check, after which account care rests with you.
        </p>
      </section>
    </StandaloneDocLayout>
  );
}
