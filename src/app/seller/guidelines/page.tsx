import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Seller Guidelines | eFootballMarket",
  description:
    "Listing accuracy rules, screenshot requirements, 12-hour delivery timeline, and M-Pesa payout standards for sellers on eFootballMarket.",
};

export default function SellerGuidelinesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-8">
      <header className="space-y-2 border-b border-[#242A36] pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
          Seller Guidelines
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Follow these listing and handover rules to avoid disputes and receive fast M-Pesa payouts.
        </p>
      </header>

      <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-white">1. Honest Squad Details &amp; Screenshots</h2>
          <ul className="list-disc list-inside space-y-1.5">
            <li><strong>Permanent OVR Only:</strong> Remove temporary My League loan players before recording your Collective Strength rating.</li>
            <li><strong>Current Balances:</strong> Enter the exact eFootball Coins and GP currently on the account—do not spend coins after publishing a listing.</li>
            <li><strong>Clear Screenshots:</strong> Upload uncropped screenshots of your Starting XI, Reserves, and the <em>Extras &rarr; Support &rarr; Link Data</em> screen.</li>
          </ul>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-white">2. Unlink Google Play &amp; Game Center Before Listing</h2>
          <p>
            Every account sold on eFootballMarket must be linked exclusively to a Konami ID. Accounts with Google Play Games or Apple Game Center attached are automatically eligible for a buyer refund during inspection.
          </p>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-white">3. 12-Hour Delivery &amp; OTP Cooperation</h2>
          <ul className="list-disc list-inside space-y-1.5">
            <li>Once a buyer completes M-Pesa payment to Till 1572931, submit the Konami ID email and password inside the order page within <strong>12 hours</strong>.</li>
            <li>Stay available in the Order Chat to share the one-time Konami verification code so the buyer can move the account to their own email address quickly.</li>
            <li>Never ask a buyer to pay directly to your personal M-Pesa number outside the order flow.</li>
          </ul>
        </section>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link href="/seller/create-listing">
            <Button variant="primary" size="md">
              Create Listing
            </Button>
          </Link>
          <Link href="/seller/verification">
            <Button variant="secondary" size="md">
              Seller Verification
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
