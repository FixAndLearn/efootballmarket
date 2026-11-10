import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { PolicyPageShell } from "@/components/layout/PolicyPageShell";

export const metadata: Metadata = {
  title: "Buyer Refund & Dispute Resolution Policy | eFootballMarket Kenya",
  description:
    "Detailed refund eligibility rules, 24-hour escrow freeze mechanics, required continuous video evidence standards, moderator timelines, and post-sale reclamation protections on eFootballMarket.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/dispute-policy" },
};

export default function DisputePolicyPage() {
  return (
    <PolicyPageShell
      currentPath="/dispute-policy"
      badge="Buyer & Seller Arbitration"
      title="Buyer Refund & Dispute Resolution Policy"
      subtitle="This policy sets out exact, transparent rules for when a buyer receives a 100% M-Pesa escrow refund, when funds are released to a seller, what forensic proof our moderators require, and how quickly disputes are resolved."
      summaryPoints={[
        "Opening a dispute inside the 24-hour inspection window immediately freezes payout from Safaricom Till 1572931 until a human moderator rules.",
        "100% refunds apply when sellers miss the 12h delivery SLA, deliver invalid logins, leave Google Play/Apple ID linked, or misstate permanent OVR/Epics.",
        "Buyer's remorse, OS coin-visibility misunderstandings (Android vs iOS), or altering/releasing cards on the squad are NOT refundable grounds.",
        "Buyers should record a continuous screen video from the first login through Extras -> Support -> Link Data and Game Plan inspection.",
        "Moderators review Order Chat logs, encrypted credential timestamps, and video proof within 24 to 48 hours.",
        "Submitting doctored screenshots or releasing squad players before claiming a refund results in dispute dismissal and account ban.",
      ]}
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          1. How the Escrow Freeze Protects Both Sides
        </h2>
        <p>
          When you pay for a marketplace listing or a Middleman contract via Safaricom M-Pesa Till <strong>1572931</strong>, the seller receives <strong>zero shillings upfront</strong>. Funds sit in neutral escrow custody through two distinct checkpoints:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Pre-Delivery Stage (Up to 12 Hours):</strong> Waiting for the seller to submit login credentials and complete `my.konami.net` OTP verification.</li>
          <li><strong>In-Inspection Stage (24 Hours After Delivery):</strong> Giving the buyer a full 24-hour window to verify the squad in-game and secure exclusive ownership.</li>
        </ul>
        <p>
          Clicking <strong>Open Dispute</strong> on your Order Page at any point before the 24-hour timer expires locks the escrow ledger so automatic payout cannot occur.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          2. Valid Grounds for a 100% Buyer Refund
        </h2>
        <p>A buyer is entitled to order cancellation and a full refund of the escrowed purchase amount if any of the following conditions are verified:</p>
        <ol className="list-decimal pl-5 space-y-2.5">
          <li>
            <strong>Seller Non-Delivery (12-Hour Timeout):</strong> More than 12 hours have elapsed since payment confirmation and the seller has neither delivered login credentials nor responded inside Order Chat to provide the required `my.konami.net` email-change verification code.
          </li>
          <li>
            <strong>Invalid or Locked Credentials:</strong> The delivered Konami ID / platform credentials fail to authenticate, require an undisclosed 2FA code the seller refuses to supply, or have zero remaining monthly Data Transfers (`0/10` transfers left in the current calendar month).
          </li>
          <li>
            <strong>Undisclosed Google Play or Apple ID Link (&ldquo;Dirty Link&rdquo;):</strong> Navigating to <em>Extras &rarr; Support &rarr; Link Data</em> reveals that <strong>Google Play</strong> or <strong>Apple ID / Game Center</strong> is still linked to another account, creating a dual-login recovery backdoor.
          </li>
          <li>
            <strong>Material Squad Misrepresentation:</strong> Key advertised Epic, Big Time, or Show Time cards are missing; Permanent Collective Strength (`OVR`) was artificially inflated using temporary <em>My League</em> loan cards; or the advertised Coin/GP balance on the stated native platform differs materially from the listing description.
          </li>
          <li>
            <strong>Restricted or Negative-Balance Account:</strong> The account is under publisher suspension, matchmaking restriction, or carries a negative eFootball Coin balance from prior chargebacks.
          </li>
        </ol>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          3. Non-Refundable Situations (When Seller Payout Proceeds)
        </h2>
        <p>To protect honest sellers from unfair reversals after exposing their account credentials, refunds are <strong>not</strong> granted for:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Buyer&apos;s Remorse or Gameplay Preference:</strong> Changing your mind after receiving a squad that matches every stated stat, player card, and Clean Konami ID requirement.
          </li>
          <li>
            <strong>Cross-OS Coin Visibility (Konami Platform Rule):</strong> Logging into an advertised <strong>Android</strong> squad from an <strong>iPhone/iPad</strong> (or vice versa) and seeing `0` coins on the opposite OS—because Konami stores Android and iOS coin wallets separately. (The coins remain intact on the native OS stated on the listing.)
          </li>
          <li>
            <strong>Post-Handover Account Tampering by Buyer:</strong> Spending eFootball Coins or GP, releasing players, executing Legacy Transfers, resetting player builds without reason, or consuming monthly Data Transfers before asking to return the squad. <strong>An account must be returned in 100% unaltered condition for a material-mismatch refund to process.</strong>
          </li>
          <li>
            <strong>Missed 24-Hour Window Without Rebinding:</strong> Failing to inspect or change the `my.konami.net` email/password within 24 hours of valid delivery, or clicking <em>Confirm &amp; Release</em> prematurely before checking `Link Data`.
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          4. Required Forensic Evidence Standards
        </h2>
        <p>
          Because static screenshots can be cropped or edited, our moderation team relies on verifiable audit trails:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Continuous Screen Recording (Recommended for Every Buyer):</strong> Before entering delivered credentials for the first time, start your phone&apos;s built-in screen recorder and capture one continuous, uncut clip showing: (1) entering the credentials via <em>Title Screen &rarr; Data Transfer</em>, (2) opening <em>Extras &rarr; Support &rarr; Link Data</em> to show Google Play / Apple ID status, and (3) opening <em>Game Plan</em> and <em>My Team &rarr; Players</em>.
          </li>
          <li>
            <strong>In-Platform Order Chat Only:</strong> Moderators review timestamps from the official Order Room chat and encrypted credential vault reveal logs. Cropped screenshots of private WhatsApp or Telegram chats that contradict in-order records carry low evidentiary weight unless corroborated by both parties.
          </li>
          <li>
            <strong>Konami Security Emails:</strong> Sellers defending a successful handover should retain the automated `my.konami.net` email-change confirmation timestamp showing when control transferred to the buyer&apos;s email address.
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          5. Step-by-Step Dispute Review Timeline &amp; Outcomes
        </h2>
        <ol className="list-decimal pl-5 space-y-2.5">
          <li>
            <strong>Step 1 — Dispute Opened (0 Hours):</strong> Either party clicks <em>Open Dispute</em> on the Order Page, selects the reason category, and describes the issue. Escrow payout is immediately frozen.
          </li>
          <li>
            <strong>Step 2 — Evidence Submission Window (12 Hours):</strong> Both buyer and seller have up to <strong>12 hours</strong> to post supporting screen recordings, `Link Data` screenshots, or propose a mutual partial discount inside the Order Dispute thread.
          </li>
          <li>
            <strong>Step 3 — Moderator Arbitration (24 to 48 Hours):</strong> A human dispute specialist audits the listing snapshot, credential vault logs, Order Chat history, and video evidence, then issues one of three binding resolutions:
            <ul className="list-disc pl-5 mt-2 space-y-1 text-xs sm:text-[13px]">
              <li><strong>Full Refund to Buyer:</strong> Account control returns to seller (where applicable) and 100% of escrowed KES is refunded to the buyer&apos;s verified M-Pesa number within 2–12 hours.</li>
              <li><strong>Mutual Partial Price Adjustment:</strong> Where a minor discrepancy exists (e.g., fewer GP/trainers than listed) and both parties agree to a discount in chat, the agreed difference refunds to the buyer and the balance settles to the seller.</li>
              <li><strong>Escrow Release to Seller:</strong> Where evidence confirms the squad was delivered cleanly as advertised, net proceeds release to the seller&apos;s payout wallet.</li>
            </ul>
          </li>
        </ol>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          6. Post-Release Account Reclamation &amp; Bad-Faith Penalties
        </h2>
        <p>
          If a seller attempts to reclaim an account through publisher support forms days or weeks after escrow has released, the buyer may submit the Konami security alert email and original Order ID to <strong>support@efootballmarket.co.ke</strong>. Verified reclamation triggers immediate freezing of any pending seller balances, permanent platform ban, public listing of the seller&apos;s verified phone/handle in our{" "}
          <Link href="/scammer-check" className="text-sx-green-text underline font-semibold">
            Scammer Check Registry
          </Link>
          , and cooperation with law-enforcement cybercrime investigations. Conversely, buyers caught fabricating evidence or stripping an account&apos;s cards before claiming a refund forfeit their claim and are permanently banned.
        </p>
      </section>
    </PolicyPageShell>
  );
}
