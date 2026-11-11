import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { PolicyPageShell } from "@/components/layout/PolicyPageShell";

export const metadata: Metadata = {
  title: "Privacy & Cookie Policy | eFootballMarket Kenya",
  description:
    "How eFootballMarket Kenya collects, encrypts, retains, and protects personal data, M-Pesa escrow records, Konami ID handover credentials, and Google AdSense / Consent Mode v2 cookies under the Kenya Data Protection Act, 2019.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/privacy" },
};

export default function PrivacyPage() {
  return (
    <PolicyPageShell
      currentPath="/privacy"
      badge="Data Protection · Kenya DPA 2019"
      title="Privacy & Cookie Policy"
      subtitle="This Privacy & Cookie Policy explains what personal data eFootballMarket Kenya collects, why we process it, how temporary game handover credentials are encrypted, how Google AdSense and analytics cookies operate, and how you can exercise your legal rights under the Kenya Data Protection Act, 2019."
      summaryPoints={[
        "We never know or store your M-Pesa PIN — STK Push PIN prompts happen solely on Safaricom's encrypted SIM toolkit.",
        "Temporary Konami ID handover credentials inside active orders are encrypted at rest with AES-256-GCM and restricted to the order buyer, seller, and dispute moderators.",
        "Google Consent Mode v2 defaults non-essential analytics and advertising storage to 'denied' until you make a choice on our Cookie Banner.",
        "We never sell or rent user phone numbers, email addresses, or transaction histories to third-party data brokers.",
        "Financial escrow ledgers are retained only as required for dispute defense and Kenyan statutory tax/accounting compliance.",
        "You can request data access, correction, cookie withdrawal, or account deletion at any time via support@efootballmarket.co.ke.",
      ]}
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          1. Data Controller Identity &amp; Contact Details
        </h2>
        <p>
          For purposes of the <strong>Kenya Data Protection Act, 2019 (Act No. 24 of 2019)</strong> and the Data Protection (General) Regulations, the data controller responsible for personal information processed through <strong>efootballmarket.co.ke</strong> is <strong>eFootballMarket Kenya</strong> (a sole proprietorship operated in Nairobi, Republic of Kenya by Brian Okibo, trading as eFootballMarket Kenya).
        </p>
        <p>
          All privacy inquiries, data subject access requests, or security reports may be directed to our Data &amp; Support Desk at <strong>support@efootballmarket.co.ke</strong> or via WhatsApp at <strong>+254 794 400 365</strong>.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          2. Categories of Information We Collect
        </h2>
        <p>We collect only the minimum data needed to run verified account trades, settle M-Pesa payments, moderate fraud, and serve editorial pages:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Account &amp; Profile Data:</strong> Username, email address, hashed authentication credentials, role (`buyer` / `seller`), optional WhatsApp contact phone number, and profile timestamps.
          </li>
          <li>
            <strong>Seller KYC &amp; Payout Verification Data:</strong> Where Seller Verification or withdrawal checks apply, legal name matching your M-Pesa registration, Kenyan mobile payout number, and verification status records.
          </li>
          <li>
            <strong>M-Pesa Escrow &amp; Ledger Records:</strong> Order ID, KES amount, Safaricom M-Pesa transaction receipt code (e.g., `SJK...`), masked/payer phone number returned by the payment callback, Till `1572931` settlement timestamps, commission fee records, and seller payout logs. <strong>We never collect or see your M-Pesa PIN.</strong>
          </li>
          <li>
            <strong>Encrypted Order Handover Data:</strong> Temporary Konami ID or console handover credentials submitted by sellers inside an active escrow order, order chat messages, and dispute evidence uploads (screenshots or screen-recording links).
          </li>
          <li>
            <strong>Technical, Security &amp; Cookie Data:</strong> IP address, browser/OS user agent, device color-scheme rendering (`prefers-color-scheme` stays client-side in your browser CSS engine), security rate-limit counters, and cookie consent preferences stored in `localStorage` (`efootball_cookie_consent`).
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          3. Lawful Bases &amp; Purposes of Processing
        </h2>
        <p>Under Section 30 of the Kenya Data Protection Act, 2019, we process personal data only where one or more of the following lawful bases apply:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            <strong>Performance of a Contract:</strong> Creating your account, displaying squad listings, locking funds in escrow, delivering handover credentials, arbitrating disputes, and disbursing seller M-Pesa payouts.
          </li>
          <li>
            <strong>Legal &amp; Regulatory Obligation:</strong> Maintaining accurate financial payment ledgers, responding to lawful orders from Kenyan authorities, and complying with anti-fraud and tax record-keeping laws.
          </li>
          <li>
            <strong>Legitimate Interests in Platform Security:</strong> Detecting spoofed M-Pesa receipts, blocking phishing links in order chat, preventing duplicate scammer accounts, and maintaining our public Scammer Phone/Handle Lookup registry based on verified fraud reports.
          </li>
          <li>
            <strong>Explicit Consent:</strong> Activating optional analytics and personalized advertising cookies (`analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`) only when you click <strong>Accept All</strong> on our Cookie Banner.
          </li>
        </ol>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          4. Encryption &amp; Handling of Game Handover Credentials
        </h2>
        <p>
          Game login credentials submitted inside an Order Room are never displayed publicly and are never sent in plain-text emails. Credentials are encrypted at the application layer using <strong>AES-256-GCM authenticated encryption</strong> with unique initialization vectors (`IV`) prior to database storage.
        </p>
        <p>
          Every credential reveal event by a buyer or authorized dispute moderator is recorded in an immutable audit log (`viewer_id`, `role`, `timestamp`). Once the buyer completes email/password/2FA rebinding at <code>my.konami.net</code> during the 24-hour inspection window, the temporary handover password becomes obsolete immediately.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          5. Cookies, Google AdSense &amp; Google Consent Mode v2
        </h2>
        <p>
          We use strictly necessary first-party storage alongside optional measurement and advertising technologies governed by <strong>Google Consent Mode v2</strong>:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Strictly Necessary Cookies &amp; Storage:</strong> Supabase authentication session cookies (`sb-*`) keep you signed in securely across pages, and `efootball_cookie_consent` in `localStorage` remembers your privacy choice. These cannot be switched off without breaking core login functionality.
          </li>
          <li>
            <strong>Google AdSense &amp; DoubleClick Cookies (`ca-pub-5924764989915276`):</strong> Third-party vendors, including <strong>Google</strong>, use cookies (such as the DoubleClick/AdSense cookie) to serve ads based on a user&apos;s prior visits to this website or other websites on the internet. Google&apos;s use of advertising cookies enables it and its partners to serve ads to users based on their visit to eFootballMarket and/or other sites on the internet.
          </li>
          <li>
            <strong>Default Denied Until Consent:</strong> Before any Google tag runs, our Consent Mode bootstrap sets `ad_storage`, `ad_user_data`, `ad_personalization`, and `analytics_storage` to `denied` unless you have clicked <strong>Accept All</strong>. Selecting <strong>Essential Only</strong> keeps personalized ad and analytics cookies disabled.
          </li>
          <li>
            <strong>How to Opt Out of Personalized Advertising:</strong> You may opt out of personalized advertising at any time by visiting{" "}
            <a
              href="https://myadcenter.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sx-green-text underline font-semibold"
            >
              Google Ads Settings (myadcenter.google.com)
            </a>{" "}
            or{" "}
            <a
              href="https://www.aboutads.info/choices/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sx-green-text underline font-semibold"
            >
              www.aboutads.info/choices
            </a>
            , or by clearing `efootball_cookie_consent` in your browser storage to re-open our Cookie Banner.
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          6. Third-Party Service Providers &amp; Cross-Border Transfers
        </h2>
        <p>
          We do <strong>not</strong> sell personal data. We share strictly scoped operational data only with vetted infrastructure sub-processors required to deliver the platform:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Supabase:</strong> Managed PostgreSQL database, row-level security authentication, and squad screenshot object storage.</li>
          <li><strong>Safaricom M-Pesa / UnifiedPay Gateway:</strong> Processing STK Push requests and verifying Till `1572931` payment callbacks.</li>
          <li><strong>Resend:</strong> Transactional order status, password reset, and dispute notification emails.</li>
          <li><strong>Google LLC:</strong> Google AdSense ad delivery and aggregate Google Analytics 4 traffic measurement (subject to your Consent Mode v2 state).</li>
        </ul>
        <p>
          Where cloud hosting servers reside outside Kenya (such as European Union or United States data centers), transfers are protected by TLS 1.2+/1.3 encryption in transit, encryption at rest, and contractual data-protection commitments consistent with Part VI of the Kenya Data Protection Act, 2019.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          7. Data Retention Schedule
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Active User Profiles:</strong> Retained while your account remains active and deleted or anonymized within <strong>30 days</strong> of a verified account deletion request (provided no active escrow order or unresolved fraud claim is open).</li>
          <li><strong>Encrypted Order Handover Payloads:</strong> Retained only during the active order and post-order dispute window, after which historical credentials are purged or rotated out by the buyer&apos;s `my.konami.net` rebind.</li>
          <li><strong>Financial Escrow &amp; M-Pesa Ledgers:</strong> Retained for up to <strong>7 years</strong> where required under Kenyan tax and financial record-keeping statutes.</li>
          <li><strong>Scammer Registry Entries:</strong> Verified fraud phone numbers and handles submitted with corroborated evidence remain searchable to protect Kenyan players unless overturned via formal appeal.</li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          8. Your Rights Under the Kenya Data Protection Act, 2019
        </h2>
        <p>Under Sections 26 and 40 of the Kenya Data Protection Act, 2019, you have the right to:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Be informed of the use to which your personal data is being put;</li>
          <li>Access a copy of the personal data we hold about you;</li>
          <li>Request rectification of inaccurate, outdated, or incomplete personal data;</li>
          <li>Request deletion/erasure of personal data that is no longer required for contractual or statutory retention purposes;</li>
          <li>Object to or restrict certain processing, and withdraw optional cookie consent at any time;</li>
          <li>Lodge a complaint with the <strong>Office of the Data Protection Commissioner (ODPC)</strong> in Kenya (`www.odpc.go.ke`) if you believe a privacy concern has not been resolved satisfactorily by our team.</li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          9. Children&apos;s Privacy &amp; Policy Updates
        </h2>
        <p>
          Marketplace trading and M-Pesa escrow features are strictly intended for individuals aged <strong>18 years and older</strong>. We do not knowingly collect KYC or financial data from minors. If a parent or guardian believes a minor has registered an account, contact <strong>support@efootballmarket.co.ke</strong> for prompt account closure. Material updates to this Privacy Policy will be posted on this page with an updated effective date.
        </p>
      </section>
    </PolicyPageShell>
  );
}
