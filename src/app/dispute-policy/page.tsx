import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dispute Resolution Policy | eFootballMarket",
  description:
    "Valid grounds for opening an order dispute, required screenshot or video evidence, and refund timelines on eFootballMarket.",
};

export default function DisputePolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-8">
      <header className="space-y-2 border-b border-[#242A36] pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
          Dispute Resolution Policy
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          How order disputes are reviewed when delivered credentials do not work or a squad does not match its listing.
        </p>
      </header>

      <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">1. Valid Grounds for Opening a Dispute</h2>
          <p>
            Buyers may open a dispute during the <strong>24-hour inspection window</strong> (or cancel after 12 hours if no credentials have been sent) for any of the following reasons:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="p-4 rounded-xl bg-[#11141B] border border-[#242A36] space-y-1">
              <strong className="text-white block">Invalid Login Details</strong>
              <p className="text-slate-400">The Konami ID email or password fails to authenticate or the seller does not provide the required 2FA code.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#11141B] border border-[#242A36] space-y-1">
              <strong className="text-white block">Google Play or Game Center Linked</strong>
              <p className="text-slate-400">Extras &rarr; Support &rarr; Link Data shows a third-party Google or Apple account still attached.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#11141B] border border-[#242A36] space-y-1">
              <strong className="text-white block">Squad Mismatch</strong>
              <p className="text-slate-400">Collective Strength (OVR), advertised Epic/Big Time cards, or coin balances materially differ from the listing.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#11141B] border border-[#242A36] space-y-1">
              <strong className="text-white block">Missed 12-Hour Seller Window</strong>
              <p className="text-slate-400">The seller fails to deliver credentials within 12 hours after payment confirmation.</p>
            </div>
          </div>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-white">2. Evidence Required</h2>
          <p>
            To keep reviews fair to both buyers and sellers, support evaluates verifiable evidence attached directly inside the order room:
          </p>
          <ul className="list-disc list-inside space-y-1.5">
            <li>Uncropped screenshots or a continuous screen recording showing the login attempt or in-game squad/link status.</li>
            <li>Timestamped messages inside the official eFootballMarket Order Chat (unverified screenshots of external chats cannot override on-platform records).</li>
          </ul>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-white">3. Review Outcome &amp; Refund Timing</h2>
          <p>
            Once a dispute is opened, seller payout is frozen until review is completed (typically within 24 hours). If the claim is verified, 100% of the held order amount is refunded to the buyer&apos;s M-Pesa number. If the squad matches the listing and valid access was transferred, funds are released to the seller. Submitting doctored screenshots or bad-faith claims results in account suspension.
          </p>
        </section>

        <div className="pt-2">
          <Link href="/terms" className="text-xs font-medium text-emerald-400 hover:underline">
            Read Terms of Service &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
