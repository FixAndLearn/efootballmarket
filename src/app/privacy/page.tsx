import React from "react";
import { Metadata } from "next";
import { StandaloneDocLayout } from "@/components/legal/StandaloneDocLayout";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy & Cookie Policy | eFootballMarket Kenya",
  description:
    "Standalone Privacy & Cookie Policy for eFootballMarket Kenya under the Kenya Data Protection Act, 2019: M-Pesa escrow records, AES-256-GCM handover encryption, Google Tag Manager (GTM-KSSS83QZ), and Google AdSense Consent Mode v2.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/privacy" },
};

export default function PrivacyPage() {
  return (
    <StandaloneDocLayout
      badge="Privacy & Cookies · Kenya DPA 2019"
      title="Privacy & Cookie Policy"
      subtitle="How eFootballMarket Kenya collects, encrypts, retains, and protects personal data, M-Pesa records, temporary game handover logins, and cookies under the Kenya Data Protection Act, 2019."
      keyFacts={[
        { value: "AES-256-GCM", label: "Order Vault Encryption" },
        { value: "Zero PINs", label: "Never See M-Pesa PIN" },
        { value: "Consent v2", label: "Ads Denied by Default" },
        { value: "Kenya DPA", label: "Act No. 24 of 2019" },
      ]}
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          1. Data Controller Identity
        </h2>
        <p>
          Under the <strong>Kenya Data Protection Act, 2019 (Act No. 24 of 2019)</strong>, the data controller for <strong>efootballmarket.co.ke</strong> is <strong>eFootballMarket Kenya</strong> (sole proprietorship operated in Nairobi, Kenya by <strong>Brian Okibo</strong>). Contact our Data &amp; Support Desk at <strong>support@efootballmarket.co.ke</strong> or WhatsApp <strong>+254 794 400 365</strong>.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          2. Data We Collect &amp; Lawful Bases (Section 30)
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Account &amp; Seller KYC Data (Contract Performance):</strong> Username, email, hashed credentials, role, optional WhatsApp contact, and verified M-Pesa payout details.
          </li>
          <li>
            <strong>M-Pesa Escrow Ledgers (Contract &amp; Legal Obligation):</strong> Order ID, KES amount, Safaricom receipt code, Till <strong>1572931</strong> timestamps, and payout logs. <strong>We never know or store your M-Pesa PIN.</strong>
          </li>
          <li>
            <strong>Encrypted Handover Credentials:</strong> Temporary Konami ID or console logins inside an active Order Room are encrypted at rest with <strong>AES-256-GCM</strong> and unique IVs, with access timestamps audited.
          </li>
          <li>
            <strong>Security &amp; Consent Logs (Legitimate Interest &amp; Consent):</strong> Rate-limit protections, verified Scammer Check records, and your <code>efootball_cookie_consent</code> choice in <code>localStorage</code>. We <strong>never sell or rent</strong> personal data.
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          3. Cookies, Google Tag Manager / Analytics &amp; AdSense
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Strictly Necessary Storage:</strong> Supabase session cookies (<code>sb-*</code>) keep you signed in, and <code>efootball_cookie_consent</code> remembers your cookie choice.
          </li>
          <li>
            <strong>Google Tag Manager / Analytics (<code>GTM-KSSS83QZ</code>) &amp; AdSense (<code>ca-pub-5924764989915276</code>):</strong> Third-party vendors, including <strong>Google</strong>, use cookies to measure traffic and serve ads based on prior visits to this or other websites.
          </li>
          <li>
            <strong>Default Denied Until Consent (Consent Mode v2):</strong> <code>analytics_storage</code>, <code>ad_storage</code>, <code>ad_user_data</code>, and <code>ad_personalization</code> default to <strong>denied</strong> until you click <strong>Accept All</strong> (clicking <strong>Essential Only</strong> keeps them disabled). Opt out anytime at{" "}
            <a
              href="https://myadcenter.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sx-green-text font-semibold underline inline-flex items-center gap-0.5"
            >
              myadcenter.google.com
              <ArrowUpRight className="w-3 h-3" />
            </a>{" "}
            or{" "}
            <a
              href="https://www.aboutads.info/choices/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sx-green-text font-semibold underline inline-flex items-center gap-0.5"
            >
              aboutads.info/choices
              <ArrowUpRight className="w-3 h-3" />
            </a>
            .
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          4. Sub-Processors, Retention &amp; Your ODPC Rights
        </h2>
        <p>
          Scoped infrastructure sub-processors (Supabase database/auth, Safaricom M-Pesa / UnifiedPay gateway, Resend transactional email, and Google LLC subject to Consent Mode) transmit data over TLS 1.2+/1.3 encryption. Active user profiles are deleted or anonymized within <strong>30 days</strong> of a verified deletion request (provided no open escrow order or fraud claim is active), while statutory financial ledgers are retained up to <strong>7 years</strong> under Kenyan accounting law.
        </p>
        <p>
          Under Sections 26 and 40 of the Kenya DPA 2019, you have the right to access, correct, delete, or restrict your personal data and withdraw optional cookie consent via <strong>support@efootballmarket.co.ke</strong>, or lodge a complaint with the <strong>Office of the Data Protection Commissioner (www.odpc.go.ke)</strong>. Strictly for users aged <strong>18+</strong>.
        </p>
      </section>
    </StandaloneDocLayout>
  );
}
