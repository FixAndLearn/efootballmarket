import React from "react";
import { Metadata } from "next";
import { StandaloneDocLayout } from "@/components/legal/StandaloneDocLayout";
import { DetailTabLink } from "@/components/ui/DetailTabLink";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Standalone Terms of Service for eFootballMarket Kenya: M-Pesa Till 1572931 payment hold, 12-hour delivery, 24-hour buyer inspection, Middleman contracts, tournaments, and Kenyan governing law.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/terms" },
};

export default function TermsPage() {
  return (
    <StandaloneDocLayout
      badge="Terms of Service"
      title="Terms of Service"
      subtitle="Plain-language agreement governing account trading, M-Pesa Till 1572931 payment holding, 24-hour buyer inspections, Middleman contracts, and tournaments on eFootballMarket.co.ke."
      keyFacts={[
        { value: "Till 1572931", label: "Official M-Pesa Hold" },
        { value: "KES 0", label: "Added Buyer Fee" },
        { value: "12h → 24h", label: "Delivery & Login Check" },
        { value: "5% (50–500)", label: "Seller Fee Cap (KES)" },
      ]}
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          1. Who We Are &amp; Independent Marketplace Role
        </h2>
        <p>
          <strong>eFootballMarket Kenya</strong> (&ldquo;eFootballMarket,&rdquo; &ldquo;we,&rdquo; or &ldquo;us&rdquo;) is a sole proprietorship operated in Nairobi, Republic of Kenya by <strong>Brian Okibo</strong> at <strong>efootballmarket.co.ke</strong>. We provide a listing board, payment-hold (escrow) Order Room, Middleman deal desk, and community tournament organizer.
        </p>
        <p>
          <strong>Who Controls Payment Funds:</strong> Buyers pay via Safaricom Lipa Na M-Pesa into eFootballMarket Kenya&apos;s business Buy Goods Till <strong>1572931</strong>. Safaricom PLC acts solely as the mobile-money payment processor and does not manage orders or decide disputes. eFootballMarket Kenya holds received funds in its platform settlement account while an order is open and administers payouts or refunds under our{" "}
          <DetailTabLink href="/dispute-policy">Refund &amp; Dispute Policy</DetailTabLink>.
        </p>
        <p>
          <strong>Independent Service:</strong> We are not affiliated with, endorsed by, or connected to <strong>Konami Digital Entertainment Co., Ltd.</strong>, <strong>Safaricom PLC</strong>, <strong>Sony</strong>, <strong>Microsoft</strong>, <strong>Valve</strong>, <strong>Google</strong>, or <strong>Apple</strong>.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          2. Eligibility &amp; Seller Badges
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Age &amp; Account:</strong> You must be at least <strong>18 years old</strong> and able to enter a contract under Kenyan law, with an active Kenyan M-Pesa number for payments or payouts.
          </li>
          <li>
            <strong>Seller Badges:</strong> A <em>New Seller</em> has verified an email and Kenyan phone number (0 completed sales). A <em>Proven Seller</em> has completed one or more buyer-confirmed escrow sales. An <em>ID-Verified Seller</em> has additionally verified Kenyan identification and a matching M-Pesa number with our desk. We do not log into seller game accounts before purchase; every order relies on your 24-hour buyer inspection hold.
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          3. Clean Konami ID &amp; Listing Accuracy Rules
        </h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            <strong>Lawful Control:</strong> You legitimately own and control the account and its registered email inbox. Stolen or shared accounts are strictly prohibited.
          </li>
          <li>
            <strong>Google Play &amp; Apple Unlinked (Mobile):</strong> Under <em>Extras &rarr; Support &rarr; Link Data</em>, the account must be linked only to a <strong>Konami ID</strong>, with both <strong>Google Play</strong> and <strong>Apple ID / Game Center</strong> showing <em>Not Linked</em>.
          </li>
          <li>
            <strong>Permanent Roster Stats:</strong> Screenshots and entered stats (OVR, Epic/Big Time cards, Managers, GP, and Coins) must reflect permanent items—never temporary <em>My League</em> loan players—and state the exact platform (Android, iOS, PlayStation, Xbox, or PC/Steam) where coins reside, with at least <strong>2 monthly Data Transfers</strong> remaining.
          </li>
        </ol>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          4. Payment, 12h Delivery, 24h Inspection &amp; Payout
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Step 1 — Payment Hold (Till 1572931):</strong> Buyers pay through Safaricom Buy Goods Till <strong>1572931</strong> (KES 0 added buyer fee). Payments sent directly to personal phone numbers are outside our control and are not covered.
          </li>
          <li>
            <strong>Step 2 — Seller Delivery (12 Hours):</strong> Sellers have up to <strong>12 hours</strong> after payment confirmation to submit logins inside the Order Room and share the email-change OTP, or the buyer may cancel for a 100% refund.
          </li>
          <li>
            <strong>Step 3 — Buyer Inspection (24 Hours):</strong> Buyers have <strong>24 hours</strong> from credential delivery to check permanent cards and <em>Link Data = Not Linked</em>, and rebind the Konami ID email, password, and 2FA at <code>my.konami.net</code>.
          </li>
          <li>
            <strong>Step 4 — Payout or Dispute:</strong> Seller net payout (agreed price minus our <strong>5% seller fee, min KES 50, max KES 500</strong>) is released when the buyer taps <strong>Confirm &amp; Release</strong> or after 24 uncontested hours. Tapping <strong>Open Dispute</strong> within 24 hours pauses payout for moderator review (24–48 hours).
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          5. Off-Platform Deals, Prohibited Conduct &amp; Governing Law
        </h2>
        <p>
          <strong>Off-Platform Deals Settled Here:</strong> Finding a buyer or seller on WhatsApp, Facebook, TikTok, or Discord is permitted when settled on eFootballMarket via a Listing or Middleman Deal Code on Till <strong>1572931</strong>. Asking a user in listings or Order Chat to bypass Till 1572931, submitting fake SMS receipts, altering a squad before requesting a refund, or attempting post-sale account recovery results in account suspension, wallet freeze to cover affected orders, and verified Scammer Check listing.
        </p>
        <p>
          <strong>Publisher Rules, Liability Cap &amp; Kenyan Law:</strong> Game publishers such as Konami maintain their own terms restricting account transfers and may modify features or restrict accounts under their own rules. Once you verify a Clean Konami ID and release escrow, ongoing care of the account rests with you. To the extent permitted by Kenyan law, eFootballMarket&apos;s maximum liability on any order is capped at the <strong>total KES escrow amount actually received by Till 1572931 for that order</strong>. Governed by the laws of the <strong>Republic of Kenya</strong>.
        </p>
      </section>
    </StandaloneDocLayout>
  );
}
