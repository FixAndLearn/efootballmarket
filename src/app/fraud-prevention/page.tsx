import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { PolicyPageShell } from "@/components/layout/PolicyPageShell";

export const metadata: Metadata = {
  title: "Anti-Fraud & Platform Security Policy | eFootballMarket Kenya",
  description:
    "How eFootballMarket prevents M-Pesa receipt spoofing, dual-link recovery scams, credential leaks, and chat phishing, plus how our Scammer Registry and appeals work.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/fraud-prevention" },
};

export default function FraudPreventionPage() {
  return (
    <PolicyPageShell
      currentPath="/fraud-prevention"
      badge="Trust & Security Engineering"
      title="Anti-Fraud & Platform Security Policy"
      subtitle="Digital account trading attracts payment spoofers, phishing links, and dual-link recovery scammers. Here is how eFootballMarket's technical and moderation controls neutralize each attack vector—and how our public Scammer Registry operates fairly."
      summaryPoints={[
        "Fake M-Pesa SMS generators fail completely because orders only unlock via cryptographic server callbacks on Till 1572931.",
        "Handover credentials are encrypted at rest with AES-256-GCM and every reveal action is logged with user ID and timestamp.",
        "Automated Order Chat filters block external phishing URLs and off-platform payment solicitation before escrow is funded.",
        "Sellers attempting to sell Google Play or Apple ID dual-linked accounts have payouts blocked and buyers refunded in full.",
        "Public Scammer Check entries require corroborated evidence (M-Pesa codes, uncropped logs) before approval.",
        "Any person who believes their phone number was reported in error can submit a free verification appeal to support.",
      ]}
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          1. Server-Verified M-Pesa Settlement (Zero SMS Spoofing)
        </h2>
        <p>
          One of the most common scams targeting Kenyan sellers in social-media groups involves fake SMS generator apps that mimic Safaricom&apos;s `MPESA` sender header, pressuring the seller to hand over Konami logins before checking their real M-Pesa statement.
        </p>
        <p>
          On eFootballMarket, screenshots or pasted SMS messages <strong>never</strong> unlock an order. An order transitions from <em>Pending Payment</em> to <em>Escrow Funded</em> only when our payment gateway validates the unique M-Pesa transaction receipt code, exact KES value, and settlement against Safaricom Buy Goods Till <strong>1572931</strong>, enforcing database-level uniqueness so a receipt code can never be replayed across two orders.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          2. AES-256-GCM Credential Vault &amp; Access Audit Trail
        </h2>
        <p>
          Sellers submit Konami ID or console handover details inside a dedicated Credential Vault on the Order Page rather than open chat. Payloads are encrypted server-side using <strong>AES-256-GCM</strong> with per-record initialization vectors and authentication tags.
        </p>
        <p>
          Only the verified buyer of that specific funded order (and an assigned dispute moderator if a formal dispute is opened) can decrypt the payload. Every reveal event writes an immutable audit entry recording who accessed the credentials and at what exact second—eliminating &ldquo;he said / she said&rdquo; claims during arbitration.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          3. Dual-Link (&ldquo;Ghost Recovery&rdquo;) Prevention
        </h2>
        <p>
          In mobile eFootball, an account can simultaneously bind to a Konami ID <em>and</em> Google Play Games / Apple Game Center. Dishonest sellers exploit this by handing over the Konami ID while keeping their Google or Apple account linked, allowing them to log back in silently weeks later.
        </p>
        <p>
          eFootballMarket enforces a strict <strong>Clean Konami ID Mandate</strong>: sellers must attest during listing creation that Google Play and Apple ID are unlinked, and buyers are prompted during the 24-hour inspection checklist to inspect <em>Extras &rarr; Support &rarr; Link Data</em>. Any undisclosed Google or Apple link discovered during inspection results in an immediate 100% refund to the buyer.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          4. Automated Anti-Phishing &amp; Off-Platform Solicitation Filters
        </h2>
        <p>
          Scammers routinely try to lure marketplace users onto WhatsApp or fake &ldquo;Konami reward&rdquo; phishing sites (`konami-free-coins...`) to steal credentials or persuade buyers to send money to personal phone numbers. Our listing parser and Order Chat security filter automatically block:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Unverified external URLs, shortened links, and spoofed login domains;</li>
          <li>Personal phone numbers, Pochi la Biashara prompts, or external Paybill numbers shared prior to escrow funding;</li>
          <li>Requests asking a user to share their eFootballMarket account password or M-Pesa PIN.</li>
        </ul>
        <p>
          Remember: <strong>eFootballMarket staff will never ask for your M-Pesa PIN or your eFootballMarket account password</strong> on WhatsApp, Telegram, or email.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          5. Public Scammer Phone &amp; Handle Registry — Verification &amp; Appeals
        </h2>
        <p>
          Our{" "}
          <Link href="/scammer-check" className="text-sx-green-text underline font-semibold">
            Scammer Check Registry
          </Link>{" "}
          helps Kenyan players screen phone numbers (`07...` / `01...`) and social handles before entering off-platform trades:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Moderator Review Before Publication:</strong> Community scam reports are <strong>not</strong> published blindly. Submissions sit in a moderation queue until our trust team verifies corroborating evidence (such as matching M-Pesa recipient names/codes, uncropped handover chat timelines, or confirmed on-platform fraud attempts). Defamatory or unsubstantiated revenge reports are rejected.
          </li>
          <li>
            <strong>Right of Correction &amp; Appeal:</strong> If you acquired a recycled mobile number or resolved a genuine misunderstanding and believe an entry in our lookup tool is inaccurate, email <strong>support@efootballmarket.co.ke</strong> with proof of resolution or number ownership. Verified appeals are updated or removed within <strong>48 hours</strong>.
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          6. Law Enforcement Cooperation (Kenya Cybercrimes Act)
        </h2>
        <p>
          Obtaining money by false pretenses, unauthorized computer access, and electronic payment fraud constitute criminal offenses under the <strong>Penal Code (Cap. 63)</strong> and the <strong>Computer Misuse and Cybercrimes Act, 2018 (No. 5 of 2018)</strong> of Kenya. Where confirmed account theft, chargeback fraud, or identity impersonation occurs, eFootballMarket preserves server logs and cooperates with lawful requests from the Directorate of Criminal Investigations (DCI) and Safaricom fraud investigators.
        </p>
      </section>
    </PolicyPageShell>
  );
}
