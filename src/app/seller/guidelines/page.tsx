import React from "react";
import { Metadata } from "next";
import { StandaloneDocLayout } from "@/components/legal/StandaloneDocLayout";

export const metadata: Metadata = {
  title: "Seller Standards & M-Pesa Payout Rules",
  description:
    "Standalone Seller Handbook for eFootballMarket Kenya: Clean Konami ID preparation, permanent OVR screenshot rules, 5% commission cap (KES 50–500), 12h OTP handover, and M-Pesa payouts.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/seller/guidelines" },
};

export default function SellerGuidelinesPage() {
  return (
    <StandaloneDocLayout
      badge="Seller Handbook"
      title="Seller Standards & M-Pesa Payout Rules"
      subtitle="Follow these four rules so your squad listing approves fast, passes buyer inspection with zero disputes, and pays out smoothly to your M-Pesa number."
      keyFacts={[
        { value: "KES 0", label: "Free Squad Listing" },
        { value: "5% (50–500)", label: "Seller Fee Cap (KES)" },
        { value: "12 Hours", label: "Login & OTP Delivery" },
        { value: "1–12 Hours", label: "M-Pesa Withdrawal" },
      ]}
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          1. Prepare a Clean Konami ID Before Publishing
        </h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Confirm instant inbox access to the email bound at <code>my.konami.net</code> so you can share the 6-digit email-change OTP quickly.</li>
          <li>Open <em>Extras &rarr; Support &rarr; Link Data</em> and verify both <strong>Google Play</strong> and <strong>Apple ID / Game Center</strong> show <em>Not Linked</em>.</li>
          <li>Confirm at least <strong>2 remaining monthly Data Transfers</strong> (out of Konami&apos;s 10/month limit).</li>
        </ol>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          2. Screenshot &amp; Accuracy Standards
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Remove temporary <em>My League</em> loan cards before capturing your Starting XI OVR.</li>
          <li>Crop or mask personal email strings, phone numbers, and passwords on all uploaded screenshots.</li>
          <li>State the exact native OS (<strong>Android</strong> vs <strong>iOS</strong>) where listed eFootball Coins were earned.</li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          3. 12-Hour Handover &amp; Net M-Pesa Payouts
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Always Check Your Dashboard First:</strong> Never hand over logins from a WhatsApp screenshot—confirm your Seller Dashboard badge reads <strong>Escrow Funded</strong>.
          </li>
          <li>
            <strong>Deliver in Encrypted Vault Within 12h:</strong> Submit credentials inside the Order Room and forward the <code>my.konami.net</code> email-change OTP in Order Chat.
          </li>
          <li>
            <strong>Net M-Pesa Payout:</strong> Once the buyer clicks <em>Confirm &amp; Release</em> (or 24h passes uncontested), your net payout (sale price minus <strong>5% fee, min KES 50 / max KES 500</strong>) is sent to your M-Pesa number within <strong>1–12 hours</strong> (8 AM – 10 PM EAT).
          </li>
        </ul>
      </section>
    </StandaloneDocLayout>
  );
}
