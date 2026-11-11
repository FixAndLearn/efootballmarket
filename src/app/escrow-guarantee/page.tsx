import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { PolicyPageShell } from "@/components/layout/PolicyPageShell";
import { KonamiIdExplainerVideo } from "@/components/common/KonamiIdExplainerVideo";

export const metadata: Metadata = {
  title: "How Payment Protection & Fees Work | eFootballMarket Kenya",
  description:
    "Who holds your money during an eFootballMarket trade (M-Pesa Till 1572931 vs Safaricom payment rail), automated vs admin steps, 24-hour inspection rules, and full fee schedule.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/escrow-guarantee" },
};

export default function EscrowGuaranteePage() {
  return (
    <PolicyPageShell
      currentPath="/escrow-guarantee"
      badge="Payment Protection & Fees"
      title="How Payment Protection & Fees Work"
      subtitle="Clear, plain-language explanation of who receives your M-Pesa payment, what is automated vs administrator-reviewed, when the 24-hour inspection clock starts, and every fee across Marketplace, Middleman, and Tournaments."
      summaryPoints={[
        "Who holds funds: Safaricom M-Pesa processes your transfer into eFootballMarket Kenya's business Buy Goods Till 1572931. eFootballMarket holds the funds while your order is open.",
        "12h Delivery -> 24h Inspection: Seller has 12 hours after payment confirmation to submit logins. Your 24-hour inspection clock starts only when credentials are submitted.",
        "Automated vs Admin: Payment matching, timer starts, and uncontested 24h completion run automatically; disputes, refunds, and M-Pesa payouts (1–12h) are admin-reviewed.",
        "Transparent Fees: Buyers pay KES 0 added fee on Marketplace & Middleman orders; sellers pay 5% (min KES 50, max KES 500) deducted from net payout.",
      ]}
    >
      <section className="pb-2">
        <KonamiIdExplainerVideo />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          1. Who Controls the Money During an Order
        </h2>
        <p>
          We want every buyer and seller to understand exactly how money moves on <strong>eFootballMarket Kenya</strong> (operated in Nairobi by Brian Okibo):
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Payment Account (`Till 1572931`):</strong> Buyers pay via Safaricom Lipa Na M-Pesa into <strong>Buy Goods Till 1572931</strong>, the registered business till of eFootballMarket Kenya.
          </li>
          <li>
            <strong>Safaricom PLC&apos;s Role:</strong> Safaricom is the licensed mobile-money payment processor that moves your payment from your M-Pesa wallet to Till 1572931. Safaricom does <strong>not</strong> act as an escrow agent, hold a separate bank trust, or review game-account disputes.
          </li>
          <li>
            <strong>eFootballMarket Kenya&apos;s Role:</strong> Once Till 1572931 receives your payment, eFootballMarket holds that balance in its platform settlement account while the order progresses and administers either seller payout or buyer refund under our{" "}
            <Link href="/dispute-policy" className="text-sx-green-text underline font-semibold">
              Refund &amp; Dispute Policy
            </Link>
            . Payments sent directly to a personal phone number never reach Till 1572931 and cannot be held or refunded by us.
          </li>
        </ul>
      </section>

      <section className="space-y-4 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          2. What Is Automated vs Reviewed by an Administrator
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-lg bg-sx-stone border border-sx-border space-y-2">
            <h3 className="text-sm font-bold text-sx-ink font-display">
              Automated by Platform Software
            </h3>
            <ul className="list-disc pl-4 space-y-1.5 text-xs sm:text-[13px] text-sx-ink-soft">
              <li>Sending the M-Pesa STK Push prompt and matching the Daraja callback receipt.</li>
              <li>Locking the squad listing and starting the <strong>12-hour seller delivery timer</strong>.</li>
              <li>Starting the <strong>24-hour buyer inspection timer</strong> at the exact moment the seller submits credentials in the Order Room.</li>
              <li>Crediting the seller&apos;s wallet when the buyer clicks <em>Confirm &amp; Release</em> (or after 24 uncontested hours).</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-sx-stone border border-sx-border space-y-2">
            <h3 className="text-sm font-bold text-sx-ink font-display">
              Reviewed by Our Nairobi Desk (8 AM – 10 PM EAT)
            </h3>
            <ul className="list-disc pl-4 space-y-1.5 text-xs sm:text-[13px] text-sx-ink-soft">
              <li>Manual Till 1572931 receipt verification if a mobile callback is delayed.</li>
              <li>Investigating Order Room logs and screen-recording clips when <em>Open Dispute</em> is clicked within 24 hours (resolved in 24–48 hours).</li>
              <li>Sending approved M-Pesa seller withdrawals and buyer refunds (processed within <strong>1 to 12 hours</strong> during business hours).</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          3. The 4 Stages &amp; Timers on Every Order
        </h2>
        <div className="space-y-3">
          {[
            {
              stage: "Stage 1 · Payment Confirmed on Till 1572931",
              detail:
                "Tap Buy Now (or open a Middleman Deal Code) and complete the M-Pesa payment to Till 1572931. Once matched, the listing locks so nobody else can buy it.",
            },
            {
              stage: "Stage 2 · Seller Credential Delivery (12-Hour Deadline)",
              detail:
                "The seller has up to 12 hours to submit the Konami ID / console login inside the encrypted Order Room and provide the 6-digit email-change OTP in Order Chat. If the seller misses 12 hours, you can request a 100% refund.",
            },
            {
              stage: "Stage 3 · Buyer Login & Rebinding Window (24-Hour Clock)",
              detail:
                "Your 24-hour inspection clock starts when credentials are delivered—not when you paid. Record your screen, sign in from the eFootball Title Screen -> Data Transfer, check permanent cards and Link Data = Not Linked, then change the email, password, and 2FA at my.konami.net.",
            },
            {
              stage: "Stage 4 · Release Payout or Open Dispute",
              detail:
                "When everything matches and your own email is bound, tap Confirm & Release. Seller net payout (agreed price minus 5% seller fee, KES 50–500) is sent via M-Pesa within 1–12 hours. If anything mismatches, tap Open Dispute before the 24-hour timer ends to pause payout.",
            },
          ].map((item) => (
            <div
              key={item.stage}
              className="p-4 rounded-lg bg-sx-stone border border-sx-border space-y-1"
            >
              <h3 className="text-sm font-bold text-sx-ink font-display">
                {item.stage}
              </h3>
              <p className="text-xs sm:text-[13px] text-sx-ink-soft leading-relaxed">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="fees" className="space-y-4 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          4. Published Fee Schedule (All Services)
        </h2>
        <p className="text-xs sm:text-sm text-sx-ink-soft">
          Every fee is shown before you confirm an order, listing, or tournament. Standard Safaricom M-Pesa transfer tariffs apply to mobile network transactions.
        </p>
        <div className="overflow-x-auto rounded-lg border border-sx-border">
          <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
            <thead className="bg-sx-stone text-sx-ink border-b border-sx-border">
              <tr>
                <th className="p-3 font-bold">Service</th>
                <th className="p-3 font-bold">Buyer / Player Pays</th>
                <th className="p-3 font-bold">Platform Service Fee</th>
                <th className="p-3 font-bold">Refund Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sx-border bg-sx-canvas">
              <tr>
                <td className="p-3 font-semibold text-sx-ink">Marketplace Squad Listing</td>
                <td className="p-3">Listed price (<strong>KES 0</strong> extra buyer fee)</td>
                <td className="p-3"><strong>5%</strong> deducted from seller payout (min <strong>KES 50</strong>, max <strong>KES 500</strong>)</td>
                <td className="p-3">100% of escrowed price refunded if seller misses 12h delivery or buyer dispute is upheld</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-sx-ink">Middleman Deal (`/middleman`)</td>
                <td className="p-3">Agreed price (<strong>KES 0</strong> extra buyer fee)</td>
                <td className="p-3"><strong>5%</strong> deducted from seller payout (min <strong>KES 50</strong>, max <strong>KES 500</strong>)</td>
                <td className="p-3">100% of escrowed price refunded if cancelled before delivery or buyer dispute is upheld</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-sx-ink">Community Tournaments</td>
                <td className="p-3">Posted entry fee (Free cups: <strong>KES 0</strong>)</td>
                <td className="p-3">
                  Deducted from collected pot: Free = <strong>KES 0</strong>; Pot &le;100 = <strong>15% (KES 10–15)</strong>; &le;250 = <strong>KES 20</strong>; &le;500 = <strong>KES 35</strong>; &le;1,000 = <strong>KES 60</strong>; &gt;1,000 = <strong>5%</strong>
                </td>
                <td className="p-3">100% entry refund if organizer cancels before bracket generation; no refund for match no-shows after bracket start</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          5. Publisher Rules &amp; Account Transfer Notice
        </h2>
        <p>
          Konami&apos;s Terms of Use restrict account transfers, and Konami can modify game features or restrict accounts under its own rules. eFootballMarket verifies M-Pesa payment and gives buyers 24 hours to check Clean Konami ID status and rebind credentials, but cannot prevent future publisher actions after an order completes.
        </p>
      </section>
    </PolicyPageShell>
  );
}
