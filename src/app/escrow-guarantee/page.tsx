import { Button } from "@/components/ui/Button";
import { CheckCircle2, Clock, Lock, ShieldCheck, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "How Buyer Protection Works | eFootballMarket Kenya",
  description:
    "See how eFootballMarket holds M-Pesa payments on Till 1572931 during a 24-hour inspection window so buyers can verify squads and secure their Konami ID safely.",
};

export default function EscrowGuaranteePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-10">
      <header className="space-y-2 border-b border-[#E2E2E0] pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F0F0F] font-display tracking-tight">
          How M-Pesa Buyer Protection Works
        </h1>
        <p className="text-sm text-[#5F5F5F] max-w-2xl leading-relaxed">
          We hold the buyer&apos;s payment in the middle until the squad is verified in-game and the Konami ID is moved to the buyer&apos;s own email.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-white border border-[#E2E2E0] space-y-2.5">
          <div className="flex items-center gap-2 text-[#0F0F0F] font-semibold text-sm">
            <Lock className="w-4 h-4 text-[#006340]" />
            <span>1. Payment Held on Till 1572931</span>
          </div>
          <p className="text-xs text-[#5F5F5F] leading-relaxed">
            When you pay via M-Pesa STK push, the money does not go directly to the seller&apos;s phone. It stays held on platform Till 1572931 while the handover takes place.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E2E0] space-y-2.5">
          <div className="flex items-center gap-2 text-[#0F0F0F] font-semibold text-sm">
            <Clock className="w-4 h-4 text-[#006340]" />
            <span>2. 24-Hour Inspection Window</span>
          </div>
          <p className="text-xs text-[#5F5F5F] leading-relaxed">
            From the moment the seller submits login details, you have a full 24 hours to sign in on your phone, confirm all players and coin balances match, and update the Konami ID email.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E2E0] space-y-2.5">
          <div className="flex items-center gap-2 text-[#0F0F0F] font-semibold text-sm">
            <ShieldCheck className="w-4 h-4 text-[#006340]" />
            <span>3. Clean Konami ID Rule</span>
          </div>
          <p className="text-xs text-[#5F5F5F] leading-relaxed">
            Accounts with Google Play or Apple Game Center still linked are rejected. If you see a linked platform account under Extras &rarr; Support &rarr; Link Data, open a dispute for a full refund.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E2E0] space-y-2.5">
          <div className="flex items-center gap-2 text-[#0F0F0F] font-semibold text-sm">
            <AlertTriangle className="w-4 h-4 text-[#B45309]" />
            <span>4. Instant Dispute Freeze</span>
          </div>
          <p className="text-xs text-[#5F5F5F] leading-relaxed">
            Clicking <em>Raise Dispute</em> inside your order page pauses automatic payout immediately so support can review the order chat and screenshots.
          </p>
        </div>
      </div>

      <section className="p-6 rounded-xl bg-white border border-[#E2E2E0] space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-[#0F0F0F] font-display">
            Order Timeline (Start to Finish)
          </h2>
          <p className="text-xs text-[#5F5F5F] mt-0.5">
            Clear deadlines protect both the buyer&apos;s money and the seller&apos;s time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-lg bg-[#F4F3F1] border border-[#DCDCD8] space-y-1">
            <span className="font-mono font-semibold text-[#006340]">Step 1</span>
            <strong className="text-[#0F0F0F] block">M-Pesa Deposit</strong>
            <p className="text-[#5F5F5F] leading-relaxed">
              Buyer completes STK push to Till 1572931. Listing locks immediately.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#F4F3F1] border border-[#DCDCD8] space-y-1">
            <span className="font-mono font-semibold text-[#006340]">Step 2 (&#8804; 12h)</span>
            <strong className="text-[#0F0F0F] block">Seller Delivers</strong>
            <p className="text-[#5F5F5F] leading-relaxed">
              Seller submits encrypted Konami ID login details and helps with email OTP in chat.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#F4F3F1] border border-[#DCDCD8] space-y-1">
            <span className="font-mono font-semibold text-[#006340]">Step 3 (24h)</span>
            <strong className="text-[#0F0F0F] block">Buyer Inspects</strong>
            <p className="text-[#5F5F5F] leading-relaxed">
              Buyer checks squad specs in-game, changes Konami email &amp; password, and sets 2FA.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#F4F3F1] border border-[#DCDCD8] space-y-1">
            <span className="font-mono font-semibold text-[#006340]">Step 4</span>
            <strong className="text-[#0F0F0F] block">Seller Paid</strong>
            <p className="text-[#5F5F5F] leading-relaxed">
              Buyer confirms delivery (or 24h passes without dispute) and seller receives M-Pesa payout.
            </p>
          </div>
        </div>
      </section>

      <section className="p-6 rounded-xl bg-white border border-[#E2E2E0] space-y-4">
        <h2 className="text-base font-semibold text-[#0F0F0F]">Buyer Checklist Before Releasing Funds</h2>
        <ul className="space-y-2 text-xs sm:text-sm text-[#3D3D3D]">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#006340] shrink-0 mt-0.5" />
            <span>Sign into eFootball from the <strong>Title Screen &rarr; Data Transfer</strong> menu (never overwrite from inside Extras).</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#006340] shrink-0 mt-0.5" />
            <span>Open <strong>Extras &rarr; Support &rarr; Link Data</strong> and confirm Google Play and Game Center both say <em>Not Linked</em>.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#006340] shrink-0 mt-0.5" />
            <span>Change the Konami ID email address, password, and two-step verification at <code className="text-[#1F1F1F]">my.konami.net</code>.</span>
          </li>
        </ul>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link href="/browse">
            <Button variant="primary" size="md">
              Browse Available Squads
            </Button>
          </Link>
          <Link href="/middleman">
            <Button variant="secondary" size="md">
              Use WhatsApp Middleman
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
