import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Anti-Fraud & Trading Safety Policy | eFootballMarket",
  description:
    "How eFootballMarket verifies M-Pesa callbacks, blocks Google-linked accounts, and handles impersonation or account recovery attempts.",
};

export default function FraudPreventionPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-8">
      <header className="space-y-2 border-b border-[#E2E2E0] pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F0F0F] font-display tracking-tight">
          Anti-Fraud &amp; Trading Safety Policy
        </h1>
        <p className="text-sm text-[#5F5F5F] leading-relaxed">
          Practical safeguards we enforce against fake M-Pesa SMS receipts, linked-account traps, and social media impersonators.
        </p>
      </header>

      <div className="space-y-8 text-sm text-[#3D3D3D] leading-relaxed">
        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-[#0F0F0F]">1. Server-to-Server M-Pesa Verification</h2>
          <p>
            In informal trading groups, scammers routinely send edited M-Pesa confirmation messages or altered receipt screenshots. eFootballMarket never marks an order as paid based on a screenshot—payments are verified strictly via automated server callbacks from our payment gateway on Till 1572931.
          </p>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-[#0F0F0F]">2. Zero-Link Account Verification</h2>
          <p>
            Accounts that remain linked to Google Play Games or Apple Game Center allow a seller to sign back in even after the Konami ID email has been changed. Sellers are required to unlink all platform accounts before listing, and buyers receive a full refund if any third-party link is present during inspection.
          </p>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-[#0F0F0F]">3. Post-Sale Recovery &amp; Blacklist Enforcement</h2>
          <p>
            Attempting to reclaim a sold gaming account after receiving payout is treated as fraud. Confirmed offenders have their accounts permanently terminated, any pending seller balance frozen toward buyer restitution, and their phone numbers recorded on the{" "}
            <Link href="/scammer-check" className="text-[#006340] hover:underline">
              Scammer Check directory
            </Link>
            . Where appropriate, transaction records are preserved for lawful police or mobile-money fraud inquiries.
          </p>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-[#0F0F0F]">4. In-Order Chat Protection</h2>
          <p>
            All credential handovers and Konami OTP exchanges must take place inside the order chat on eFootballMarket. Automated filters warn users against phishing links or requests to cancel escrow and pay directly off-platform.
          </p>
        </section>

        <section className="p-5 rounded-xl bg-white border border-[#E2E2E0] space-y-2 text-xs text-[#5F5F5F]">
          <strong className="text-[#0F0F0F] block text-sm">Report a Suspicious Trader</strong>
          <p>
            If someone impersonates eFootballMarket staff on WhatsApp or sends a suspicious link, verify their number on{" "}
            <Link href="/scammer-check" className="text-[#006340] hover:underline">
              Scammer Check
            </Link>{" "}
            or contact our support desk via{" "}
            <Link href="/contact" className="text-[#006340] hover:underline">
              Contact &amp; Support
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
