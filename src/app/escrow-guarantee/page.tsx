import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { PolicyPageShell } from "@/components/layout/PolicyPageShell";

export const metadata: Metadata = {
  title: "How M-Pesa Escrow & Clean ID Verification Works | eFootballMarket",
  description:
    "Step-by-step guide to Safaricom M-Pesa Till 1572931 escrow custody, the 7-point Clean Konami ID buyer verification checklist, OS coin rules, and Middleman deal protection.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/escrow-guarantee" },
};

export default function EscrowGuaranteePage() {
  return (
    <PolicyPageShell
      currentPath="/escrow-guarantee"
      badge="Escrow & Verification Guide"
      title="How M-Pesa Escrow & Verification Works"
      subtitle="Peer-to-peer gaming trades fail in WhatsApp, Telegram, and Facebook groups because one person is forced to go first. eFootballMarket eliminates that risk by holding M-Pesa funds in neutral custody while the buyer verifies Clean Konami ID ownership in-game."
      summaryPoints={[
        "Never send M-Pesa directly to a stranger's personal phone number — fund orders exclusively via Safaricom Buy Goods Till 1572931.",
        "Sellers never see your money until you confirm in-game squad accuracy or 24 uncontested inspection hours pass.",
        "Buyers never get squad credentials until our server verifies their real Safaricom M-Pesa payment receipt.",
        "Every buyer should run the 7-Point Clean Konami ID Checklist before clicking Confirm & Release.",
        "Off-platform deals negotiated on WhatsApp or TikTok can use the exact same escrow protection via /middleman.",
        "Full refund protection applies if Google Play or Apple ID is still linked or if permanent cards are missing.",
      ]}
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          1. Why Direct Group-Chat Transfers Lose Money
        </h2>
        <p>
          In unmoderated social-media groups, buyers lose money in two ways: (1) sending M-Pesa to a personal number only to get blocked immediately, or (2) receiving a Konami ID password while the seller secretly leaves their own <strong>Google Play Games</strong> or <strong>Apple Game Center</strong> linked—allowing the seller to log right back in a week later without needing your new password. Meanwhile, honest sellers get tricked by fake edited M-Pesa SMS text apps.
        </p>
        <p>
          Our platform solves both halves of the problem simultaneously: server-verified Till `1572931` custody protects the seller from fake SMS receipts, and our 24-hour Clean ID inspection window protects the buyer from hidden recovery links.
        </p>
      </section>

      <section className="space-y-4 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          2. The 5-Stage Escrow Lifecycle
        </h2>
        <div className="space-y-3">
          {[
            {
              stage: "Stage 1 · Lock Listing & Fund Till 1572931",
              detail:
                "Click Buy Now (or accept an Offer) on a listing, or generate a Middleman Deal Code. Pay via automated M-Pesa STK Push or Buy Goods Till 1572931. Once verified by our server callback, the listing locks so nobody else can buy it.",
            },
            {
              stage: "Stage 2 · Encrypted Seller Handover (Within 12 Hours)",
              detail:
                "We notify the seller that funds are secured in escrow—without releasing the cash. Within 12 hours, the seller submits the Konami ID email/password into our AES-256-GCM encrypted Order Vault and coordinates in Order Chat to share the 6-digit email-change OTP.",
            },
            {
              stage: "Stage 3 · Data Transfer & In-Game Verification",
              detail:
                "Start your screen recorder, launch eFootball, and tap Title Screen -> Data Transfer -> Transfer Data Linked to KONAMI ID (never overwrite from inside Settings -> Link Data!). Check Game Plan, Permanent OVR, Epics, Managers, and Link Data.",
            },
            {
              stage: "Stage 4 · Exclusive Rebinding at my.konami.net",
              detail:
                "Log in to my.konami.net, replace the seller's email address with a fresh Gmail address only you control, set a brand-new password, and enable Two-Factor Authentication (2FA) via Google Authenticator.",
            },
            {
              stage: "Stage 5 · Buyer Release or Moderator Arbitration",
              detail:
                "Once satisfied, click Confirm & Release so net proceeds disburse to the seller's M-Pesa number. If anything does not match the listing, click Open Dispute within the 24-hour window to freeze funds for moderator review.",
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
          3. Buyer&apos;s Mandatory 7-Point Verification Checklist
        </h2>
        <p>Before you click <strong>Confirm &amp; Release</strong> on any order, check all seven items below:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>Link Data Screen (`Extras &rarr; Support &rarr; Link Data`):</strong> Confirm <em>KONAMI ID: Linked</em> AND both <em>Google Play: Not Linked</em> and <em>Apple ID: Not Linked</em>.</li>
          <li><strong>Permanent Collective Strength:</strong> Open <em>Game Plan</em>, remove any temporary <em>My League</em> loan cards, and verify permanent Team Strength matches the listing.</li>
          <li><strong>Epic, Big Time &amp; Show Time Roster:</strong> Filter <em>My Team &rarr; Players</em> by card type to confirm every advertised legend/booster card is present and unlocked.</li>
          <li><strong>Booster Managers:</strong> Check <em>My Team &rarr; Managers</em> to confirm advertised 88-proficiency managers are permanently owned.</li>
          <li><strong>Remaining Monthly Data Transfers:</strong> Verify on the Data Transfer prompt that you were not handed an account on its `10/10` monthly transfer lockout.</li>
          <li><strong>Exclusive Email Ownership (`my.konami.net`):</strong> Confirm your own email address is now listed under Personal Information on `my.konami.net` and the seller&apos;s old email is completely removed.</li>
          <li><strong>Password + 2FA Enabled:</strong> Set a unique password and activate Konami 2-Step Verification so no previous session can authenticate.</li>
        </ol>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          4. Important Platform Mechanics Every Buyer Should Know
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Title Screen Data Transfer vs In-Menu Link Data:</strong> Always import a purchased Konami ID from the <strong>Title Screen</strong> (circle menu icon at bottom-right &rarr; <em>Data Transfer</em>). Tapping <em>Extras &rarr; Support &rarr; Link Data</em> while logged into a fresh Lv.1 guest squad can overwrite your Konami ID with the empty squad!
          </li>
          <li>
            <strong>Android vs iOS Coin Wallets:</strong> Konami keeps eFootball Coins separate between Google Play (Android) and App Store (iOS). If you buy an Android squad with 2,500 coins and log in on an iPhone, your iPhone will show `0` coins—while the 2,500 coins remain safely stored on Android whenever logged in from an Android device.
          </li>
          <li>
            <strong>10 Transfers Per Month Cap:</strong> Avoid reinstalling the game or switching between multiple accounts repeatedly; Konami resets the 10-transfer counter on the 1st of each calendar month (UTC).
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          5. Using Middleman Escrow for Off-Platform Deals
        </h2>
        <p>
          Found a squad on WhatsApp, Telegram, Discord, or TikTok? Either party can open our{" "}
          <Link href="/middleman" className="text-sx-green-text underline font-semibold">
            Middleman Escrow Room
          </Link>
          , enter the agreed KES price and squad summary, and share the generated Deal Code with the counterparty. You get the exact same Till `1572931` custody, encrypted credential handover, and 24-hour refund protection without having to wait for a full public marketplace listing.
        </p>
      </section>
    </PolicyPageShell>
  );
}
