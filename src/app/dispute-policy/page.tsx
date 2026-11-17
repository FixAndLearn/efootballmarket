import React from "react";
import { Metadata } from "next";
import { StandaloneDocLayout } from "@/components/legal/StandaloneDocLayout";
import { CheckCircle2, XCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Buyer Refund & Dispute Policy",
  description:
    "Refund and dispute rules for eFootballMarket orders created from published listings and paid through marketplace checkout, including delivery timelines, inspection evidence, and refund eligibility.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/dispute-policy" },
};

export default function DisputePolicyPage() {
  return (
    <StandaloneDocLayout
      badge="Refunds & Disputes"
      title="Buyer Refund & Dispute Policy"
      subtitle="These refund and review rules apply only to orders created from a published marketplace listing and paid through eFootballMarket checkout. External deals and direct swaps are not covered."
      keyFacts={[
        { value: "24 Hours", label: "Buyer Dispute Window" },
        { value: "Full refund review", label: "Non-delivery / policy breach" },
        { value: "Varies", label: "Moderator Review Time" },
        { value: "Manual", label: "M-Pesa Refund Review" },
      ]}
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          1. How the Payment Pause Works
        </h2>
        <p>
          For an order created from a published marketplace listing and paid through eFootballMarket checkout, the payment received through Safaricom M-Pesa Buy Goods Till <strong>1572931</strong> is not paid to the seller upfront. It remains on hold through the <strong>12-hour seller delivery window</strong> and your <strong>24-hour login inspection window</strong>. Tapping <strong>Open Dispute</strong> inside your Order Room before the 24-hour timer ends immediately pauses automatic payout until a moderator reviews both sides. Direct social-media deals and swaps that do not proceed through checkout are not covered.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
        <div className="p-5 rounded-2xl bg-sx-green-tint/50 border border-sx-green-border space-y-3">
          <div className="flex items-center gap-2 text-sx-green-text font-bold text-sm font-display">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>A Full Refund May Be Approved After Review When:</span>
          </div>
          <ul className="space-y-2 text-xs sm:text-[13px] text-sx-ink-soft">
            <li>• <strong>Missed 12h Delivery:</strong> Seller does not deliver working logins or share the <code>my.konami.net</code> OTP within 12 hours of payment.</li>
            <li>• <strong>Invalid or Locked Login:</strong> Logins fail, 2FA blocks entry, or <strong>0</strong> monthly Data Transfers remain.</li>
            <li>• <strong>Google Play or Apple Still Linked:</strong> <em>Extras &rarr; Support &rarr; Link Data</em> shows Google Play or Apple ID / Game Center is still linked.</li>
            <li>• <strong>Squad Mismatch:</strong> Advertised permanent Epics/Boosters are missing, OVR used temporary loan cards, or native-OS coins are materially lower.</li>
            <li>• <strong>Suspended / Negative Coins:</strong> Active Konami restriction or negative coin balance.</li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-sx-subtle border border-sx-border space-y-3">
          <div className="flex items-center gap-2 text-sx-ink font-bold text-sm font-display">
            <XCircle className="w-4 h-4 text-sx-amber-text shrink-0" />
            <span>Seller Payout Proceeds (Not Refundable):</span>
          </div>
          <ul className="space-y-2 text-xs sm:text-[13px] text-sx-ink-soft">
            <li>• <strong>Change of Mind:</strong> Deciding you no longer want a squad that matches all listed stats and Clean Konami ID rules.</li>
            <li>• <strong>Android vs iOS Coin Separation:</strong> Logging into an Android squad on an iPhone (or vice versa) where Konami separates OS coin wallets.</li>
            <li>• <strong>Altered Squad:</strong> Spending coins/GP, releasing players, or running Legacy Transfers before requesting a refund.</li>
            <li>• <strong>Missed 24h Window:</strong> Waiting past 24 hours after valid delivery without inspecting, or tapping <em>Confirm &amp; Release</em> early.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          2. Helpful Proof, Review Timeline &amp; Post-Release Reports
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Screen Recording (Recommended):</strong> Turn on your phone&apos;s screen recorder before your first login and capture one uncut clip showing <em>Title Screen &rarr; Data Transfer</em>, <em>Extras &rarr; Support &rarr; Link Data</em>, and <em>Game Plan</em>.
          </li>
          <li>
            <strong>Resolution Review (Timing Varies):</strong> Both sides have up to 12 hours to upload evidence or agree on a partial adjustment. A moderator reviews the available evidence; review time may vary. A full refund may be approved when the evidence and policy support it. Approved M-Pesa refunds are arranged manually; order status on this site records the decision, not proof that funds were sent. Transfer timing varies.
          </li>
          <li>
            <strong>Post-Release Reports:</strong> If you suspect seller account recovery after order completion, email the Konami security notice and Order ID to <strong>support@efootballmarket.co.ke</strong>. Moderators review reports; opening a post-release dispute does not automatically hold seller funds or reverse an M-Pesa transfer already sent. Any reimbursement is a separate manual decision, and any transfer is arranged manually.
          </li>
        </ul>
      </section>
    </StandaloneDocLayout>
  );
}
