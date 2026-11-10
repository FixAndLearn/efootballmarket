import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | eFootballMarket",
  description:
    "How eFootballMarket collects, uses, and protects personal data, M-Pesa transaction records, cookies, and Google AdSense advertising data in Kenya.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/privacy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-8">
      <header className="space-y-2 border-b border-[#242A36] pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-400">
          Last updated: October 2026 &bull; Applicable under the Kenya Data Protection Act, 2019
        </p>
      </header>

      <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-white">1. Data Controller</h2>
          <p>
            eFootballMarket (<code className="text-slate-200">efootballmarket.co.ke</code>), operated in Kenya by Brian Okibo, processes personal information strictly to facilitate marketplace accounts, M-Pesa escrow orders, dispute reviews, and site security. For privacy inquiries, contact{" "}
            <a href="mailto:support@efootballmarket.co.ke" className="text-emerald-400 hover:underline">
              support@efootballmarket.co.ke
            </a>
            .
          </p>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-white">2. Information We Collect</h2>
          <ul className="list-disc list-inside space-y-1.5 text-slate-300">
            <li><strong>Account Details:</strong> Username, display name, and email address when you register.</li>
            <li><strong>Payment &amp; Payout Details:</strong> Safaricom M-Pesa phone numbers, checkout request IDs, and M-Pesa receipt references required to verify payments to Till 1572931 and process seller withdrawals.</li>
            <li><strong>Order &amp; Listing Content:</strong> Squad screenshots, listing descriptions, order chat messages, and temporary handover credentials submitted during an active order.</li>
            <li><strong>Technical Logs:</strong> IP address, browser user-agent, and timestamps used for rate limiting and fraud prevention.</li>
          </ul>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-white">3. How Handover Credentials Are Protected</h2>
          <p>
            Account login details submitted by a seller during an escrow order are encrypted on the server using authenticated AES-256-GCM before storage. Access to view those details is restricted to the verified buyer during the active handover window (and to platform support solely if a formal order dispute is opened). Buyers are required to change the Konami ID email and password during their 24-hour inspection period.
          </p>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-white">4. Cookies, Google Analytics &amp; Google AdSense</h2>
          <p>
            We use essential cookies to keep you signed in and remember your privacy preferences. With your consent via Google Consent Mode v2, we also use Google Analytics 4 and Google AdSense (operated by Google LLC) on public informational pages.
          </p>
          <div className="p-4 rounded-xl bg-[#11141B] border border-[#242A36] space-y-2 text-xs text-slate-300">
            <p>
              <strong>Third-Party Advertising Cookies:</strong> Third-party vendors, including Google, use cookies (such as the DoubleClick cookie) to serve ads based on a user&apos;s prior visits to this website or other websites on the internet.
            </p>
            <p>
              <strong>Personalized Ads &amp; Opt-Out Choices:</strong> Google&apos;s use of advertising cookies enables Google and its partners to serve ads based on your visit to this site and/or other sites on the internet. You may opt out of personalized advertising at any time by visiting{" "}
              <a
                href="https://myadcenter.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                Google Ads Settings
              </a>{" "}
              or{" "}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                www.aboutads.info/choices
              </a>
              . You can also choose <strong>Essential Only</strong> on our cookie banner.
            </p>
          </div>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-white">5. Service Providers &amp; Data Retention</h2>
          <p>
            We rely on Supabase (database and authentication hosting), Safaricom M-Pesa / UnifiedPay gateways (mobile money settlement), and Resend (transactional email notifications). Financial transaction records are retained as required for accounting reconciliation and dispute resolution under Kenyan law.
          </p>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-white">6. Your Rights Under Kenyan Law</h2>
          <p>
            Under the Kenya Data Protection Act, 2019, you have the right to request access to, correction of, or deletion of your personal profile data (subject to mandatory retention of completed financial transaction records). Submit requests via{" "}
            <Link href="/contact" className="text-emerald-400 hover:underline">
              our Contact page
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
