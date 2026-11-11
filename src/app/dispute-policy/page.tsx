import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { PolicyPageShell } from "@/components/layout/PolicyPageShell";

export const metadata: Metadata = {
  title: "Refund & Dispute Policy | eFootballMarket Kenya",
  description:
    "Clear rules on when buyers receive a full M-Pesa refund, when sellers are paid, what screenshots or screen recordings help resolve a dispute, and review timelines.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/dispute-policy" },
};

export default function DisputePolicyPage() {
  return (
    <PolicyPageShell
      currentPath="/dispute-policy"
      badge="Refunds & Disputes"
      title="Refund & Dispute Policy"
      subtitle="Clear rules explaining when a buyer gets a full M-Pesa refund, when a seller gets paid, and how our team reviews disputes within 24 to 48 hours."
      summaryPoints={[
        "Tapping Open Dispute within the 24-hour inspection window pauses seller payout from M-Pesa Till 1572931 while we review the order.",
        "Full refunds apply if the seller misses the 12-hour delivery window, sends non-working logins, leaves Google Play/Apple ID linked, or misstates permanent cards/OVR.",
        "Changing your mind, logging into an Android squad on iOS (coin wallet rule), or spending coins/releasing players are not refundable.",
        "Record your phone screen during your first login so our team can verify any issue quickly.",
        "Moderators review Order Room logs and evidence within 24 to 48 hours.",
      ]}
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          1. How the Payment Pause Works
        </h2>
        <p>
          When you pay into Safaricom M-Pesa Buy Goods Till <strong>1572931</strong>, the seller is not paid upfront. Your payment stays on hold through the <strong>12-hour delivery window</strong> and your <strong>24-hour login inspection window</strong>. Tapping <strong>Open Dispute</strong> on your Order Page before the 24-hour timer ends pauses automatic payout until a moderator reviews both sides.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          2. When You Receive a Full M-Pesa Refund
        </h2>
        <p>You receive a 100% refund of the escrowed purchase price if any of the following apply:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            <strong>Missed 12-Hour Delivery:</strong> More than 12 hours pass after payment confirmation and the seller has not submitted working credentials or shared the required `my.konami.net` email-change code.
          </li>
          <li>
            <strong>Invalid or Locked Login:</strong> The login details do not work, require a 2FA code the seller does not provide, or have `0` remaining monthly Data Transfers.
          </li>
          <li>
            <strong>Google Play or Apple ID Still Linked:</strong> <em>Extras &rarr; Support &rarr; Link Data</em> shows Google Play or Apple ID / Game Center is still linked.
          </li>
          <li>
            <strong>Squad Does Not Match Listing:</strong> Advertised permanent Epic/Big Time cards are missing, permanent OVR was inflated using temporary loan players, or the native-platform coin balance is materially lower than listed.
          </li>
          <li>
            <strong>Suspended or Negative-Coin Account:</strong> The account has an active Konami restriction or a negative coin balance.
          </li>
        </ol>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          3. When Seller Payout Proceeds (Not Refundable)
        </h2>
        <p>To be fair to honest sellers who have handed over their login details, refunds are not issued for:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Change of Mind:</strong> Deciding you no longer want a squad that matches all listed cards, stats, and Clean Konami ID rules.
          </li>
          <li>
            <strong>Android vs iOS Coin Separation:</strong> Logging into an Android listing on an iPhone (or vice versa) and seeing `0` coins on the other OS—because Konami stores Android and iOS coins separately.
          </li>
          <li>
            <strong>Altering the Squad Before Requesting a Refund:</strong> Spending coins or GP, releasing players, or running Legacy Transfers during inspection. A returned squad must be unaltered.
          </li>
          <li>
            <strong>Missing the 24-Hour Window:</strong> Waiting more than 24 hours after valid delivery without inspecting or rebinding your email, or tapping <em>Confirm &amp; Release</em> before checking <em>Link Data</em>.
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          4. Helpful Proof &amp; Review Timeline
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Screen Recording (Recommended):</strong> Turn on your phone&apos;s screen recorder before your first login and capture one uncut clip showing <em>Title Screen &rarr; Data Transfer</em>, <em>Extras &rarr; Support &rarr; Link Data</em>, and <em>Game Plan</em>.
          </li>
          <li>
            <strong>Keep Messages in Order Chat:</strong> Our moderators check Order Room timestamps and chat history first. Private off-platform chat screenshots carry less weight unless both sides confirm them.
          </li>
          <li>
            <strong>Resolution Time (24–48 Hours):</strong> Both sides have up to 12 hours to upload screenshots or agree on a partial discount. A moderator then reviews the evidence within <strong>24 to 48 hours</strong> and either refunds the buyer&apos;s M-Pesa number (sent within 2–12 hours), applies a mutually agreed partial adjustment, or releases net payout to the seller.
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          5. Post-Sale Recovery Reports
        </h2>
        <p>
          If a seller tries to recover an account through publisher forms after escrow has completed, send the Konami security email and your Order ID to <strong>support@efootballmarket.co.ke</strong>. Where verified, we freeze any remaining funds in the seller&apos;s wallet, ban the account, and add the verified phone/handle to our{" "}
          <Link href="/scammer-check" className="text-sx-green-text underline font-semibold">
            Scammer Check
          </Link>{" "}
          lookup.
        </p>
      </section>
    </PolicyPageShell>
  );
}
