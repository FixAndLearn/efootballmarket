import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { PolicyPageShell } from "@/components/layout/PolicyPageShell";
import { KonamiIdExplainerVideo } from "@/components/common/KonamiIdExplainerVideo";

export const metadata: Metadata = {
  title: "How Payment Protection (Escrow) Works | eFootballMarket Kenya",
  description:
    "Clear guide to how M-Pesa Till 1572931 payment protection works on eFootballMarket: 12-hour seller delivery, 24-hour buyer inspection, disputes, and seller payouts.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/escrow-guarantee" },
};

export default function EscrowGuaranteePage() {
  return (
    <PolicyPageShell
      currentPath="/escrow-guarantee"
      badge="Payment Protection Guide"
      title="How Payment Protection Works"
      subtitle="When two strangers trade in a group chat, whoever goes first takes all the risk. On eFootballMarket, we hold the buyer's M-Pesa payment on Till 1572931 while the buyer logs in, checks the squad for 24 hours, and moves the Konami ID to their own email."
      summaryPoints={[
        "1. Pay into Escrow: Pay via Safaricom M-Pesa Buy Goods Till 1572931 (KES 0 added buyer fee). Never pay a personal phone number.",
        "2. Delivery in 12 Hours: The seller submits the Konami ID login and shares the email-change code in the Order Room within 12 hours.",
        "3. 24-Hour Buyer Check: Log in from the eFootball Title Screen, check permanent cards and Link Data = Not Linked, and move the Konami ID to your own email.",
        "4. Payout or Dispute: Tap Confirm & Release to pay the seller (minus our 5% seller fee, KES 50–500), or open a dispute within 24 hours to pause payout for review.",
      ]}
    >
      <section className="pb-2">
        <KonamiIdExplainerVideo />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          1. What Escrow Protects (And What It Doesn&apos;t)
        </h2>
        <p>
          In direct social-media trades, buyers risk paying a personal number and getting blocked—or receiving a Konami password while the seller&apos;s <strong>Google Play</strong> or <strong>Apple ID</strong> is still linked in the background. Sellers risk handing over logins after seeing a fake edited M-Pesa SMS.
        </p>
        <p>
          Our escrow process protects both sides during the handover: sellers only deliver after our server confirms a real M-Pesa receipt on Till <strong>1572931</strong>, and buyers have <strong>24 hours</strong> to check the squad and secure exclusive Konami ID ownership before the seller is paid. (Payments sent outside Till 1572931 cannot be held or refunded by us.)
        </p>
      </section>

      <section className="space-y-4 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          2. The 4 Steps on Every Order
        </h2>
        <div className="space-y-3">
          {[
            {
              stage: "Step 1 · Pay into M-Pesa Till 1572931",
              detail:
                "Tap Buy Now (or accept an Offer) on a listing, or open a Middleman contract. Pay via M-Pesa STK Push or Buy Goods Till 1572931. Once Safaricom confirms the receipt, the listing locks and your money is held in escrow.",
            },
            {
              stage: "Step 2 · Seller Delivers Within 12 Hours",
              detail:
                "We notify the seller that payment is held. Within 12 hours, the seller submits the Konami ID email and password inside the Order Room and replies in Order Chat with the 6-digit email-change code. If they miss 12 hours, you can cancel for a full refund.",
            },
            {
              stage: "Step 3 · 24-Hour Buyer Login & Rebinding",
              detail:
                "Turn on your phone's screen recorder, open eFootball, and tap Title Screen -> Data Transfer -> Transfer Data Linked to KONAMI ID. Check your squad, confirm Google Play and Apple ID both say Not Linked, then sign in to my.konami.net to change the email, password, and 2-Step Verification to your own.",
            },
            {
              stage: "Step 4 · Confirm & Release (or Open a Dispute)",
              detail:
                "When everything matches and your email is bound, tap Confirm & Release so we send the seller's M-Pesa payout (minus our 5% seller fee, min KES 50, max KES 500). If anything doesn't match, tap Open Dispute before 24 hours ends to pause payout while our team reviews the order within 24–48 hours.",
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

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          3. Quick Buyer Checklist Before Releasing Payment
        </h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>Link Data (`Extras &rarr; Support &rarr; Link Data`):</strong> Confirm <em>KONAMI ID: Linked</em>, <em>Google Play: Not Linked</em>, and <em>Apple ID: Not Linked</em>.</li>
          <li><strong>Permanent Squad &amp; OVR:</strong> Check <em>Game Plan</em> (without temporary loan players) and <em>My Team &rarr; Players / Managers</em> against the listing photos.</li>
          <li><strong>Remaining Monthly Transfers:</strong> Make sure the account isn&apos;t locked at `10/10` monthly transfers.</li>
          <li><strong>Your Own Email &amp; 2FA (`my.konami.net`):</strong> Replace the seller&apos;s email with your own email, set a new password, and turn on 2-Step Verification.</li>
        </ol>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          4. Good-to-Know eFootball Rules
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Import from the Title Screen Only:</strong> Always use the circle icon on the <strong>Title Screen &rarr; Data Transfer</strong>. Using <em>Extras &rarr; Support &rarr; Link Data</em> from inside a new Lv.1 account can overwrite your squad.
          </li>
          <li>
            <strong>Android vs iOS Coins:</strong> Konami keeps Android and iOS coin wallets separate. Coins on an Android listing only appear on Android devices (and vice versa).
          </li>
          <li>
            <strong>Off-Platform Deals:</strong> Agreed on a squad on WhatsApp, Discord, Instagram, or TikTok? Create a{" "}
            <Link href="/middleman" className="text-sx-green-text underline font-semibold">
              Middleman Escrow Order
            </Link>{" "}
            to use the same Till 1572931 hold and 24-hour check.
          </li>
        </ul>
      </section>
    </PolicyPageShell>
  );
}
