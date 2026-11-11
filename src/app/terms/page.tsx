import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { PolicyPageShell } from "@/components/layout/PolicyPageShell";

export const metadata: Metadata = {
  title: "Terms of Service | eFootballMarket Kenya",
  description:
    "Clear Terms of Service for buying and selling eFootball squads on eFootballMarket Kenya: M-Pesa Till 1572931 payment hold, 12-hour delivery, 24-hour buyer inspection, disputes, seller payouts, and Kenyan legal terms.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/terms" },
};

export default function TermsPage() {
  return (
    <PolicyPageShell
      currentPath="/terms"
      badge="Terms of Service"
      title="Terms of Service"
      subtitle="Plain-language rules explaining how payments, account handovers, 24-hour inspections, disputes, and seller payouts work on eFootballMarket.co.ke."
      summaryPoints={[
        "eFootballMarket is an independent Kenyan marketplace — not affiliated with Konami Digital Entertainment or Safaricom PLC.",
        "Payment: Buyers pay into Safaricom M-Pesa Buy Goods Till 1572931 (KES 0 added buyer fee). Payments sent directly to personal phone numbers are not covered.",
        "Delivery (12 hours): Sellers have up to 12 hours after payment confirmation to submit login details and share the email-change code in the Order Room.",
        "Inspection (24 hours): Buyers have 24 hours after delivery to log in, check permanent squad items and Link Data = Not Linked, and move the Konami ID to their own email.",
        "Disputes & Payout: Sellers are paid (minus a 5% seller fee, min KES 50, max KES 500) when the buyer clicks Confirm & Release, or after 24 hours if no dispute is opened.",
      ]}
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          1. Who We Are &amp; Independent Marketplace Role
        </h2>
        <p>
          <strong>eFootballMarket Kenya</strong> (&ldquo;eFootballMarket,&rdquo; &ldquo;we,&rdquo; or &ldquo;us&rdquo;) is a sole proprietorship operated in Nairobi, Republic of Kenya by <strong>Brian Okibo</strong>, operating <strong>efootballmarket.co.ke</strong>. We provide an online listing board, payment-hold (escrow) workflow, Middleman order room, and community tournament organizer for players trading football gaming accounts.
        </p>
        <p>
          <strong>Who Controls Payment Funds:</strong> Buyers pay via Safaricom Lipa Na M-Pesa into eFootballMarket Kenya&apos;s business Buy Goods Till <strong>1572931</strong>. Safaricom PLC acts solely as the mobile-money payment processor and does not manage orders or decide disputes. eFootballMarket Kenya holds the received funds in its platform settlement account while an order is open and administers payouts or refunds under these Terms and our{" "}
          <Link href="/dispute-policy" className="text-sx-green-text underline font-semibold">
            Refund &amp; Dispute Policy
          </Link>
          .
        </p>
        <p>
          <strong>Independent Service:</strong> We are not affiliated with, endorsed by, or connected to <strong>Konami Digital Entertainment Co., Ltd.</strong>, <strong>Safaricom PLC</strong>, <strong>Sony</strong>, <strong>Microsoft</strong>, <strong>Valve</strong>, <strong>Google</strong>, or <strong>Apple</strong>. Game names and trademarks belong to their respective owners and are used only to describe user listings. We act as an intermediary platform and are not the seller of listed squads.
        </p>
        <p>
          By creating an account, listing a squad, paying for an order, or joining a tournament, you agree to these Terms along with our{" "}
          <Link href="/dispute-policy" className="text-sx-green-text underline font-semibold">
            Refund &amp; Dispute Policy
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-sx-green-text underline font-semibold">
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          2. Eligibility &amp; Seller Badges
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Age &amp; Account:</strong> You must be at least <strong>18 years old</strong> and able to enter a contract under Kenyan law, with an active Safaricom M-Pesa number for payments or payouts. Keep one account per person unless support approves otherwise in writing.
          </li>
          <li>
            <strong>What Seller Badges Mean:</strong> A <em>New Seller</em> has registered an email and Kenyan phone number with 0 completed sales so far. A <em>Proven Seller</em> has completed one or more escrow sales confirmed by buyers. An <em>ID-Verified Seller</em> has additionally submitted Kenyan identification and matched their M-Pesa payout number with our team. We do not log into seller game accounts before a sale; instead, every order relies on the 24-hour buyer inspection hold described below.
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          3. Squad Listing Rules (Clean Konami ID)
        </h2>
        <p>To list a squad or complete a Middleman order, the seller confirms that:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            <strong>Lawful Control:</strong> You legitimately own and control the account and its registered email address. Stolen, shared, or unauthorized accounts are not permitted.
          </li>
          <li>
            <strong>Google Play &amp; Apple Unlinked (Mobile):</strong> Under <em>Extras &rarr; Support &rarr; Link Data</em> in eFootball, the account must be linked only to a <strong>Konami ID</strong>, with both <strong>Google Play</strong> and <strong>Apple ID / Game Center</strong> showing <em>Not Linked</em>.
          </li>
          <li>
            <strong>Accurate Permanent Stats:</strong> Screenshots and entered stats (OVR, Epic/Big Time cards, Managers, GP, and Coins) must show permanent items owned by the squad—not temporary <em>My League</em> loan players or edited images.
          </li>
          <li>
            <strong>Correct Platform for Coins:</strong> Because Konami separates Android and iOS coin balances, sellers must list the platform (`Android`, `iOS`, `PlayStation`, `Xbox`, or `PC/Steam`) where the stated coin balance is usable.
          </li>
          <li>
            <strong>Available Data Transfers:</strong> Mobile accounts have a Konami limit of 10 Data Transfers per calendar month. Listed accounts must have at least 2 transfers remaining in the current month so the buyer can sign in.
          </li>
        </ol>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          4. Payment, Delivery, Inspection &amp; Payout
        </h2>
        <p>Every marketplace purchase and Middleman deal follows the same four steps:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Step 1 — Payment Hold (Till 1572931):</strong> Buyers pay through Safaricom M-Pesa Buy Goods Till <strong>1572931</strong> (via STK Push or verified Till receipt). Orders unlock only when our server confirms the M-Pesa receipt—never from pasted SMS screenshots. Payments sent directly to a seller&apos;s personal number are outside our control and are not covered.
          </li>
          <li>
            <strong>Step 2 — Seller Delivery (Within 12 Hours):</strong> After payment is confirmed, the seller has up to <strong>12 hours</strong> to submit the Konami ID / console login in the Order Room and share any one-time email-change code (`OTP`). If the seller does not deliver within 12 hours, the buyer can cancel for a full refund.
          </li>
          <li>
            <strong>Step 3 — Buyer Inspection (24 Hours):</strong> Once credentials are delivered, the buyer has <strong>24 hours</strong> to sign in from the eFootball Title Screen, confirm that permanent cards, OVR, Coins, and <em>Link Data = Not Linked</em> match the listing, and change the Konami ID email, password, and 2-Step Verification at <code>my.konami.net</code>.
          </li>
          <li>
            <strong>Step 4 — Payout or Dispute:</strong> Seller payout is triggered when the buyer taps <strong>Confirm &amp; Release</strong>, or automatically 24 hours after valid delivery if no dispute is opened. If the account does not match the listing, the buyer must tap <strong>Open Dispute</strong> within those 24 hours to pause payout while a moderator reviews order logs and screenshots within 24 to 48 hours.
          </li>
          <li>
            <strong>Fees:</strong> Listing is free and buyers pay <strong>KES 0</strong> in extra platform fees. On completed sales, we deduct a <strong>5% seller service fee (minimum KES 50, maximum KES 500)</strong> before crediting the seller&apos;s M-Pesa payout balance. Standard Safaricom M-Pesa network tariffs apply to mobile transfers. Seller withdrawals are normally sent within 1 to 12 hours during business settlement hours.
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          5. Off-Platform Price Discovery, Middleman Deals &amp; Tournaments
        </h2>
        <p>
          <strong>Allowed — Off-Platform Discovery Settled via Escrow:</strong> Finding a buyer or seller and agreeing on a squad price on WhatsApp, Facebook, Discord, Instagram, or TikTok <strong>is permitted</strong> when you bring the transaction onto eFootballMarket (either through a Marketplace Listing or a{" "}
          <Link href="/middleman" className="text-sx-green-text underline font-semibold">
            Middleman Deal Code
          </Link>
          ) so payment goes to Buy Goods Till <strong>1572931</strong> and credential handover happens inside the Order Room. Both Marketplace and Middleman orders charge <strong>KES 0</strong> extra buyer fee and deduct a <strong>5% seller fee (min KES 50, max KES 500)</strong> from seller payout.
        </p>
        <p>
          <strong>Not Allowed — Bypassing Escrow on Platform Listings:</strong> Using eFootballMarket listing descriptions, profile bios, or Order Chat to ask another user to pay a personal phone number outside Till 1572931 is prohibited and may result in listing removal or account suspension.
        </p>
        <p>
          <strong>Tournaments:</strong> Paid community tournaments deduct the published platform pot fee (KES 15 up to 5% depending on pot size; see{" "}
          <Link href="/escrow-guarantee#fees" className="text-sx-green-text underline font-semibold">
            Fee Schedule
          </Link>
          ) before distributing prizes. Entry fees are refunded 100% if an organizer cancels a cup before brackets start; players who miss scheduled check-ins after bracket generation forfeit their match slot under the posted cup rules.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          6. Prohibited Conduct &amp; Post-Sale Recovery Claims
        </h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Asking a buyer or seller in Order Chat to bypass escrow and pay a personal phone number;</li>
          <li>Uploading edited M-Pesa codes, altered squad images, or misleading dispute clips;</li>
          <li>Spending coins/GP or releasing players on a delivered squad before requesting a refund;</li>
          <li>Attempting to reclaim an account through publisher recovery forms after being paid.</li>
        </ul>
        <p>
          Where verified evidence shows a user attempted fraud or post-sale account recovery, we may suspend the account, hold pending wallet funds to cover an affected order, and record the verified phone/handle in our Scammer Check lookup (with an appeal process available via support).
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          7. Publisher Rules, Liability Cap &amp; Governing Law
        </h2>
        <p>
          <strong>Game Publisher Terms:</strong> Game publishers such as Konami maintain their own terms of use regarding account transfers and may restrict accounts or change in-game items during seasonal updates. Buyers and sellers trade at their own discretion regarding publisher rules. Once you verify a Clean Konami ID, rebind it to your own email and 2FA, and release escrow, ongoing care of that account rests with you.
        </p>
        <p>
          <strong>Limitation of Liability:</strong> To the extent permitted by Kenyan law, eFootballMarket&apos;s maximum liability for any order or Middleman contract is limited to the <strong>total KES escrow amount actually received by eFootballMarket for that specific order</strong>. We are not responsible for off-platform payments, Safaricom M-Pesa service downtime, or game server maintenance.
        </p>
        <p>
          <strong>Governing Law &amp; Data Protection:</strong> These Terms are governed by the laws of the <strong>Republic of Kenya</strong>, and personal data is handled in accordance with the <strong>Kenya Data Protection Act, 2019</strong> as set out in our Privacy Policy. Disputes between users and the platform that cannot be resolved through support at <strong>support@efootballmarket.co.ke</strong> are subject to the jurisdiction of the courts of Kenya.
        </p>
      </section>
    </PolicyPageShell>
  );
}
