import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | eFootballMarket",
  description:
    "Terms of use, marketplace rules, M-Pesa escrow conditions, fees, and user responsibilities on eFootballMarket.",
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-8">
      <header className="space-y-2 border-b border-[#242A36] pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
          Terms of Service
        </h1>
        <p className="text-xs text-slate-400">
          Last updated: October 2026 &bull; Governing Law: Republic of Kenya
        </p>
      </header>

      <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-white">1. Overview &amp; Independent Platform Status</h2>
          <p>
            eFootballMarket (<code className="text-slate-200">efootballmarket.co.ke</code>), operated in Kenya by Brian Okibo, provides an online peer-to-peer listing directory and M-Pesa payment-hold workflow between independent buyers and sellers. By creating an account or placing an order, you agree to these Terms.
          </p>
          <p className="text-xs text-slate-400 p-4 rounded-xl bg-[#11141B] border border-[#242A36]">
            <strong className="text-slate-200 block mb-1">Third-Party Trademarks</strong>
            eFootball is a trademark of Konami Digital Entertainment Co., Ltd., and M-Pesa is a trademark of Safaricom PLC. eFootballMarket is an independent platform and is not affiliated with, endorsed by, or sponsored by Konami, Safaricom, Google, or Apple.
          </p>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-white">2. Eligibility &amp; Seller Obligations</h2>
          <ul className="list-disc list-inside space-y-1.5">
            <li>You must be at least 18 years old and legally able to use Safaricom M-Pesa in Kenya.</li>
            <li>Sellers must only list accounts they legitimately created or own, with accurate Collective Strength (OVR), player counts, coin balances, and unaltered screenshots.</li>
            <li>Every listed account must have Google Play Games and Apple Game Center unlinked so that access is controlled solely through a transferable Konami ID.</li>
            <li>Phished, stolen, shared, or misrepresented accounts are strictly prohibited and result in immediate account suspension.</li>
          </ul>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-white">3. Payment Hold, Inspection &amp; Settlement</h2>
          <ul className="list-disc list-inside space-y-1.5">
            <li>Buyer payments made via M-Pesa STK push (Till 1572931) are held pending seller delivery and buyer verification.</li>
            <li>Sellers must submit valid credentials through the order page within <strong>12 hours</strong> of payment confirmation.</li>
            <li>Once credentials are delivered, the buyer has <strong>24 hours</strong> to verify the squad in-game, confirm no third-party login is linked, and update the Konami ID email, password, and two-step verification.</li>
            <li>If the buyer clicks <em>Release Funds</em>—or if 24 hours pass after delivery without a dispute being opened—the order is marked complete and the seller&apos;s payout (net of the disclosed platform service fee) is queued for M-Pesa withdrawal.</li>
          </ul>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-white">4. Disputes &amp; Refunds</h2>
          <p>
            If credentials fail to sign in, Google Play or Game Center is still linked, or key advertised players are missing, the buyer must open a dispute inside the order page before the 24-hour inspection timer ends. Both parties agree to cooperate in the order chat and provide screenshots or screen recordings as outlined in our{" "}
            <Link href="/dispute-policy" className="text-emerald-400 hover:underline">
              Dispute Policy
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-white">5. Prohibited Conduct</h2>
          <p>
            Attempting to lure users off-platform to bypass payment protection, sending fabricated M-Pesa confirmation messages, or attempting to recover a transferred account after payout is strictly prohibited. Confirmed offenders are permanently banned, added to the community scammer lookup directory, and may have transaction records shared with law enforcement upon lawful request.
          </p>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-white">6. Limitation of Liability</h2>
          <p>
            eFootballMarket provides its software and mediation services on an &quot;as-is&quot; basis. Once a buyer confirms delivery (or the 24-hour inspection window closes without dispute) and funds are disbursed to the seller, the buyer assumes full responsibility for maintaining email and two-step security on the account. To the fullest extent permitted under Kenyan law, platform liability on any order is limited to the funds currently held by the platform for that specific order (or, where already disbursed, the platform service fee collected on that transaction).
          </p>
        </section>
      </div>
    </div>
  );
}
