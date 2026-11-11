import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { PolicyPageShell } from "@/components/layout/PolicyPageShell";

export const metadata: Metadata = {
  title: "Seller Standards, Fees & M-Pesa Payout Rules | eFootballMarket",
  description:
    "Complete handbook for selling eFootball accounts in Kenya: preparing a Clean Konami ID, honest OVR screenshot standards, commission fees, 12-hour OTP handover rules, and M-Pesa payouts.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/seller/guidelines" },
};

export default function SellerGuidelinesPage() {
  return (
    <PolicyPageShell
      currentPath="/seller/guidelines"
      badge="Seller Handbook & Payout Rules"
      title="Seller Standards, Fees & Payout Rules"
      subtitle="Following these seller standards ensures your squad listing passes moderation quickly, attracts confident buyers, avoids inspection disputes, and settles cleanly to your M-Pesa number."
      summaryPoints={[
        "Listing a squad on eFootballMarket is free — commission applies only when your squad sells and completes escrow.",
        "Before listing, bind the squad to a clean email at my.konami.net and unlink Google Play Games and Apple ID.",
        "Remove temporary My League loan cards before taking your Game Plan screenshot so Permanent OVR is 100% accurate.",
        "Never hand over credentials in WhatsApp DMs before checking your dashboard to confirm the order says Escrow Funded.",
        "Deliver credentials and stay reachable for the my.konami.net email-change OTP within 12 hours of buyer payment.",
        "Completed payouts disburse in Kenyan Shillings (KES) to your verified M-Pesa phone number.",
      ]}
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          1. Pre-Listing Preparation (Do This Before Publishing)
        </h2>
        <p>Preparing your Konami ID before a buyer pays makes handover take less than 5 minutes instead of failing under the 12-hour clock:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            <strong>Dedicated Handover Email Recommended:</strong> Log in to <code>my.konami.net</code> and make sure you have instant access to the currently bound email inbox so you can read the 6-digit OTP when the buyer rebinds the account to their own email.
          </li>
          <li>
            <strong>Unlink Google Play &amp; Apple ID:</strong> Open eFootball &rarr; <em>Extras &rarr; Support &rarr; Link Data</em> and confirm both <strong>Google Play</strong> and <strong>Apple ID / Game Center</strong> show <em>Not Linked</em>. If either is linked, unlink it first; dual-linked mobile accounts are automatically rejected during buyer inspection.
          </li>
          <li>
            <strong>Check Monthly Data Transfer Count:</strong> Ensure the account has at least <strong>2 remaining Data Transfers</strong> out of Konami&apos;s 10-per-month limit so the buyer is not locked out on login.
          </li>
          <li>
            <strong>Console Accounts (PS4 / PS5 / Xbox / Steam):</strong> Ensure you are transferring full ownership of the underlying PSN/Xbox/Steam account (including original email rebind access) with no family-management locks or secondary passkeys attached.
          </li>
        </ol>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          2. Screenshot &amp; Squad Accuracy Standards
        </h2>
        <p>Clear, honest listings sell significantly faster and have near-zero dispute rates. Every listing should include:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Permanent Starting XI Screenshot:</strong> Capture your <em>Game Plan</em> with your highest-proficiency permanent manager active and <strong>zero My League loan players</strong> in the lineup or bench.
          </li>
          <li>
            <strong>Reserves &amp; Key Epics/Boosters:</strong> Include screenshots of <em>My Team &rarr; Players</em> sorted by Overall Rating or Card Type so buyers can verify Epic, Big Time, and Show Time cards directly.
          </li>
          <li>
            <strong>Link Data Proof Screenshot:</strong> Upload a screenshot of <em>Extras &rarr; Support &rarr; Link Data</em> showing Clean Konami ID status (mask or crop out your personal email address or Konami ID string if visible—never expose login credentials in public images).
          </li>
          <li>
            <strong>Accurate Native OS Coin Count:</strong> State the exact platform (<strong>Android</strong> or <strong>iOS</strong>) where your eFootball Coins were earned/purchased, since coins do not carry across Android &harr; iOS.
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          3. Pricing, Buyer Offers &amp; Platform Fee Structure
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Free Listing Creation:</strong> Creating, editing, or delisting an unsold squad costs <strong>KES 0</strong>.
          </li>
          <li>
            <strong>Ask Price &amp; Live Offers:</strong> Set your Ask Price in Kenyan Shillings (<strong>KES</strong>). Buyers can either purchase immediately at your Ask Price or submit a binding KES Offer on your listing page. Accepting an offer notifies the buyer to fund Till <strong>1572931</strong>.
          </li>
          <li>
            <strong>Commission Transparency:</strong> Buyers pay zero extra escrow fees at checkout. When an order completes, eFootballMarket deducts a <strong>5% seller commission (minimum KES 50, capped at maximum KES 500)</strong> to cover Till 1572931 payment verification, AES-256-GCM credential vaulting, and human arbitration. Your exact net KES payout is calculated live as you type your price.
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          4. The 12-Hour Safe Handover Protocol
        </h2>
        <ol className="list-decimal pl-5 space-y-2.5">
          <li>
            <strong>Verify Order Status on the Site First:</strong> Never trust a screenshot sent to you on WhatsApp claiming someone paid. Log in to <strong>efootballmarket.co.ke/dashboard/seller</strong> and confirm the order status badge officially reads <strong>Escrow Funded</strong>.
          </li>
          <li>
            <strong>Submit Credentials in the Encrypted Order Vault:</strong> Enter the Konami ID email and password inside the Order Room&apos;s encrypted handover form within <strong>12 hours</strong> of funding.
          </li>
          <li>
            <strong>Assist Promptly With the Email-Change OTP:</strong> Coordinate with the buyer inside Order Chat so that when they request an email change at <code>my.konami.net</code>, you forward the 6-digit Konami verification code promptly before it expires.
          </li>
          <li>
            <strong>Keep Your Confirmation Email:</strong> Do not delete the automated Konami notification confirming that the registered email address was changed—that timestamp is your proof of completed handover if a buyer goes silent.
          </li>
        </ol>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          5. Seller Verification Badges &amp; M-Pesa Payouts
        </h2>
        <p>
          Completing{" "}
          <Link href="/seller/verification" className="text-sx-green-text underline font-semibold">
            Seller Identity Verification
          </Link>{" "}
          adds the <strong>Verified Seller</strong> check badge to all your squad cards, unlocks higher listing limits, and speeds up withdrawal reviews.
        </p>
        <p>
          Once the buyer clicks <em>Confirm &amp; Release</em> (or after 24 uncontested hours following verified delivery), net funds move into your Available Earnings balance on{" "}
          <Link href="/seller/earnings" className="text-sx-green-text underline font-semibold">
            Seller Earnings
          </Link>
          . M-Pesa payouts are sent directly to your registered Kenyan mobile number (<strong>07...</strong> or <strong>01...</strong>) within <strong>1 to 12 hours</strong> during daily settlement windows.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          6. Prohibited Seller Practices (Immediate Delisting / Ban)
        </h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Embedding personal phone numbers, WhatsApp links, or &ldquo;DM me to pay direct&rdquo; notes in listing titles, descriptions, or squad screenshots;</li>
          <li>Listing accounts you do not own, shared clan accounts, or accounts purchased with reversible payment methods;</li>
          <li>Logging back into a sold squad or attempting publisher recovery after handover;</li>
          <li>Uploading stolen screenshots belonging to another seller or YouTuber.</li>
        </ul>
      </section>
    </PolicyPageShell>
  );
}
