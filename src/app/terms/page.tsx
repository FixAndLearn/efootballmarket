import React from "react";
import { Metadata } from "next";
import { StandaloneDocLayout } from "@/components/legal/StandaloneDocLayout";
import { DetailTabLink } from "@/components/ui/DetailTabLink";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Standalone Terms of Service for eFootballMarket Kenya: marketplace checkout payments, M-Pesa Till 1572931 payment hold, 12-hour delivery, 24-hour buyer inspection, tournaments, and Kenyan governing law.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/terms" },
};

export default function TermsPage() {
  return (
    <StandaloneDocLayout
      badge="Terms of Service"
      title="Terms of Service"
      subtitle="Plain-language agreement governing marketplace listings and checkout, M-Pesa Till 1572931 payment holding, 24-hour buyer inspections, and tournaments on eFootballMarket.co.ke."
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
          <strong>eFootballMarket Kenya</strong> (&ldquo;eFootballMarket,&rdquo; &ldquo;we,&rdquo; or &ldquo;us&rdquo;) is a sole proprietorship operated in Nairobi, Republic of Kenya by <strong>Brian Okibo</strong> at <strong>efootballmarket.co.ke</strong>. We provide a squad-listing marketplace, payment-hold Order Room for eligible marketplace purchases, and community tournament services.
        </p>
        <p>
          <strong>Who Controls Payment Funds:</strong> Buyers pay via Safaricom Lipa Na M-Pesa into eFootballMarket Kenya&apos;s business Buy Goods Till <strong>1572931</strong>. Safaricom PLC acts solely as the mobile-money payment processor and does not manage orders or decide disputes. eFootballMarket Kenya holds received funds in its platform settlement account while an order is open, credits seller balances on release, and reviews refund requests under our{" "}
          <DetailTabLink href="/dispute-policy">Refund &amp; Dispute Policy</DetailTabLink>. Approved M-Pesa refunds are arranged manually; this system does not confirm that funds were sent.
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
            <strong>Seller Badges:</strong> A <em>New Seller</em> has a registered account email and Kenyan phone number (0 completed sales). A <em>Proven Seller</em> has one or more completed checkout sales confirmed by buyers. An <em>ID-Verified Seller</em> badge indicates that Kenyan identification and a matching M-Pesa number were checked by our desk. No seller badge certifies the game account or its listing contents; eligible marketplace checkout orders rely on the buyer inspection period.
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
            <strong>Step 1 — Marketplace Checkout Payment Hold (Till 1572931):</strong> For an order created from a published listing, buyers pay through the marketplace checkout using the official Safaricom Till or STK prompt (KES 0 added buyer fee). Payments sent directly to personal phone numbers or for external deals are outside our control and are not covered.
          </li>
          <li>
            <strong>Step 2 — Seller Delivery (12 Hours):</strong> Sellers have up to <strong>12 hours</strong> after payment confirmation to submit logins inside the Order Room and share the email-change OTP. If delivery is missed, the buyer may open a dispute or contact support for review. A full refund may be approved; any approved M-Pesa refund is arranged manually, and this system does not confirm that funds were sent.
          </li>
          <li>
            <strong>Step 3 — Buyer Inspection (24 Hours):</strong> Buyers have <strong>24 hours</strong> from credential delivery to check permanent cards and <em>Link Data = Not Linked</em>, and rebind the Konami ID email, password, and 2FA at <code>my.konami.net</code>.
          </li>
          <li>
            <strong>Step 4 — Balance Credit, Withdrawal or Dispute:</strong> When the buyer taps <strong>Confirm &amp; Release</strong> or 24 hours pass without a dispute, the seller’s available balance is credited with the agreed price minus our <strong>5% seller fee, min KES 50, max KES 500</strong>. The seller must submit a separate M-Pesa withdrawal request. Requests are reviewed and processed manually; processing times vary, so follow the request status or contact support. Tapping <strong>Open Dispute</strong> within 24 hours pauses release for moderator review; review time varies.
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          5. External Transactions, Prohibited Conduct &amp; Governing Law
        </h2>
        <p>
          <strong>External Deals Are Not Covered:</strong> Transactions arranged or settled on WhatsApp, Facebook, TikTok, Discord, or another external service are not escrowed or protected by eFootballMarket. We no longer provide an off-platform contract or deal-code service. Buyer protection applies only when a buyer places an order from a published marketplace listing and pays through eFootballMarket checkout. Never send money or credentials outside an active order; fake receipts, listing fraud, or post-sale account recovery may result in account suspension and other action under our policies.
        </p>
        <p>
          <strong>Publisher Rules, Liability Cap &amp; Kenyan Law:</strong> Game publishers such as Konami maintain their own terms restricting account transfers and may modify features or restrict accounts under their own rules. Once you verify a Clean Konami ID and release escrow, ongoing care of the account rests with you. To the extent permitted by Kenyan law, eFootballMarket&apos;s maximum liability on any order is capped at the <strong>total KES escrow amount actually received by Till 1572931 for that order</strong>. Governed by the laws of the <strong>Republic of Kenya</strong>.
        </p>
      </section>
    </StandaloneDocLayout>
  );
}
