import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { PolicyPageShell } from "@/components/layout/PolicyPageShell";

export const metadata: Metadata = {
  title: "Safety & Anti-Fraud Policy | eFootballMarket Kenya",
  description:
    "How eFootballMarket checks M-Pesa Till 1572931 receipts, protects Order Room login details, prevents dual-linked Google/Apple recovery scams, and manages Scammer Check appeals.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/fraud-prevention" },
};

export default function FraudPreventionPage() {
  return (
    <PolicyPageShell
      currentPath="/fraud-prevention"
      badge="Safety & Anti-Fraud"
      title="Safety & Anti-Fraud Policy"
      subtitle="Practical safeguards we use to block fake M-Pesa SMS screenshots, protect login details during handover, and help buyers spot still-linked accounts."
      summaryPoints={[
        "Orders only unlock when our server confirms a real Safaricom M-Pesa receipt on Buy Goods Till 1572931 — never from SMS screenshots.",
        "Login details are shared inside an encrypted Order Room vault rather than public chat, with access timestamps logged.",
        "Order Chat filters block external phishing links and attempts to move payment to personal phone numbers before escrow is funded.",
        "Undisclosed Google Play or Apple ID links found during the 24-hour buyer check qualify for a full refund.",
        "Public Scammer Check reports are reviewed for supporting proof before publication, and anyone can appeal an entry for free.",
      ]}
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          1. Real M-Pesa Receipt Checks (No Fake SMS)
        </h2>
        <p>
          A common scam in group chats uses fake SMS apps to imitate Safaricom confirmation messages so a seller hands over login details before checking their real M-Pesa balance.
        </p>
        <p>
          On eFootballMarket, pasted SMS messages or screenshots never unlock an order. An order moves to <em>Escrow Funded</em> only when our payment integration confirms the M-Pesa receipt code and exact KES amount against Buy Goods Till <strong>1572931</strong>, and each receipt code can only be used once.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          2. Protected Login Handover
        </h2>
        <p>
          Sellers submit Konami ID or console logins inside the Order Room credential box rather than open chat. Stored credentials are encrypted (AES-256-GCM) and can only be viewed by the buyer of that funded order (and a dispute moderator if a dispute is opened), with a timestamp recorded when viewed.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          3. Stopping Google Play &amp; Apple Dual-Link Recovery
        </h2>
        <p>
          Mobile eFootball lets an account connect to a Konami ID and Google Play / Apple Game Center at the same time. If Google Play or Apple ID stays linked, the previous owner can still sign back in without knowing your new Konami password.
        </p>
        <p>
          That is why every seller must confirm Clean Konami ID status when listing, and every buyer gets <strong>24 hours</strong> to check <em>Extras &rarr; Support &rarr; Link Data</em> before releasing payment. If Google Play or Apple ID is still linked, open a dispute within the 24-hour window for a full refund.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          4. Chat Safety Filters
        </h2>
        <p>
          To keep users away from fake &ldquo;free coins&rdquo; phishing links and off-platform payment traps, our Order Chat blocks external URLs and personal payment numbers before escrow is funded. <strong>eFootballMarket staff will never ask for your M-Pesa PIN or your eFootballMarket account password</strong> on WhatsApp, Discord, or email.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          5. Scammer Check Lookup &amp; Free Appeals
        </h2>
        <p>
          Our{" "}
          <Link href="/scammer-check" className="text-sx-green-text underline font-semibold">
            Scammer Check
          </Link>{" "}
          tool lets players check Kenyan <strong>07...</strong> and <strong>01...</strong> numbers and handles before trading off-platform:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Reviewed Before Publishing:</strong> Reports are checked by a moderator for supporting proof (such as M-Pesa transaction details or uncropped chat logs) before going live. Unverified revenge reports are declined.
          </li>
          <li>
            <strong>Corrections &amp; Appeals:</strong> If you were assigned a recycled mobile line or resolved a dispute and want an entry corrected or removed, email <strong>support@efootballmarket.co.ke</strong>. Verified appeals are updated within <strong>48 hours</strong>.
          </li>
        </ul>
      </section>
    </PolicyPageShell>
  );
}
