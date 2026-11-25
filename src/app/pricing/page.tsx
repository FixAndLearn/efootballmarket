import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Wallet, Percent, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import { StandaloneDocLayout } from "@/components/legal/StandaloneDocLayout";
import { calculateEscrowCommission } from "@/lib/utils/commission";

export const metadata: Metadata = {
  title: "Price Transparency — Exactly What You Pay and What the Seller Receives",
  description:
    "Every number on an eFootballMarket order: the price you see, the 5% seller fee (minimum KES 50, capped at KES 500), the 80/20 payout split and the 7-day recovery hold. Nothing hidden, nothing added at checkout.",
  keywords: [
    "efootball account price",
    "efootballmarket fees",
    "escrow fee kenya",
    "efootball account seller payout",
  ],
};

const SAMPLE_PRICES = [1500, 3000, 5000, 10000, 20000];

export default function PriceTransparencyPage() {
  const rows = SAMPLE_PRICES.map((price) => {
    const fee = calculateEscrowCommission(price);
    const net = price - fee;
    return {
      price,
      fee,
      net,
      upfront: Math.round(net * 0.8),
      held: net - Math.round(net * 0.8),
    };
  });

  const kes = (n: number) => `KES ${n.toLocaleString("en-KE")}`;

  return (
    <StandaloneDocLayout
      badge="Pricing"
      effectiveDate="November 18, 2026"
      title="Price Transparency"
      subtitle="One price. One seller fee. Everything that happens to the money, in order."
      keyFacts={[
        { label: "Seller fee", value: "5% of order value" },
        { label: "Fee floor / cap", value: "KES 50 / KES 500" },
        { label: "Buyer fee", value: "KES 0" },
        { label: "Held after confirm", value: "20% for 7 days" },
      ]}
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          1. What the buyer pays
        </h2>
        <p>
          The price on a listing is the price you pay. There is no booking fee, no
          checkout surcharge, and no markup applied when the M-Pesa prompt appears.
          If a listing says {kes(5000)}, your phone asks you to approve {kes(5000)}.
          You are shown the total on the checkout screen before the STK prompt is
          sent, and that number is what the order records.
        </p>
        <div className="p-4 rounded-2xl bg-sx-green-tint/50 border border-sx-green-border flex items-start gap-2.5">
          <BadgeCheck className="w-4 h-4 text-sx-green-text shrink-0 mt-0.5" />
          <p className="text-xs sm:text-[13px] text-sx-ink-soft">
            <strong>Buyer fee: KES 0.</strong> The 5% service fee below is deducted
            from the seller&apos;s side of the payment, not added to yours.
          </p>
        </div>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          2. What the seller pays
        </h2>
        <p>
          A single service fee of <strong>5%</strong> of the order price, with a{" "}
          <strong>minimum of {kes(50)}</strong> and a <strong>maximum of {kes(500)}</strong>.
          The cap matters at the top end: a {kes(20000)} sale is charged{" "}
          {kes(500)}, not {kes(1000)}. There is no separate listing fee, no
          subscription, and no charge for relisting.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-sx-border">
          <table className="w-full text-xs sm:text-[13px]">
            <thead className="bg-sx-stone text-sx-ink-soft">
              <tr>
                <th className="text-left font-bold px-3 py-2.5">Sale price</th>
                <th className="text-left font-bold px-3 py-2.5">Service fee (5%)</th>
                <th className="text-left font-bold px-3 py-2.5">Seller receives</th>
                <th className="text-left font-bold px-3 py-2.5">On confirm (80%)</th>
                <th className="text-left font-bold px-3 py-2.5">Held 7 days (20%)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.price} className="border-t border-sx-border">
                  <td className="px-3 py-2.5 font-semibold text-sx-ink">{kes(r.price)}</td>
                  <td className="px-3 py-2.5 text-sx-ink-soft">{kes(r.fee)}</td>
                  <td className="px-3 py-2.5 font-semibold text-sx-ink">{kes(r.net)}</td>
                  <td className="px-3 py-2.5 text-sx-green-text font-semibold">{kes(r.upfront)}</td>
                  <td className="px-3 py-2.5 text-sx-amber-text font-semibold">{kes(r.held)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-sx-muted">
          Rounded to the nearest shilling. The fee is calculated on the agreed order
          price, so an accepted offer is charged on the offer amount, not the
          original asking price.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          3. Where the money physically sits, and when
        </h2>
        <ul className="list-disc pl-5 space-y-2.5">
          <li>
            <strong>You pay.</strong> The money lands in the eFootballMarket Buy
            Goods Till <strong>1572931</strong>. It is not sent to the seller&apos;s
            phone number and the seller cannot withdraw it.
          </li>
          <li>
            <strong>Seller delivers (12 hours).</strong> Login details and the{" "}
            <code>my.konami.net</code> OTP arrive in the Order Room. Nothing has been
            paid out yet.
          </li>
          <li>
            <strong>You inspect (24 hours).</strong> You log in, check permanent
            players and coins, and confirm Google Play and Apple are unlinked. Still
            nothing paid out.
          </li>
          <li>
            <strong>You confirm.</strong> 80% of the seller&apos;s share is credited
            to their available balance. The remaining 20% moves into a held balance
            tied to that specific order, with a visible release date.
          </li>
          <li>
            <strong>Day 7.</strong> If you have not reported an account recovery, the
            held 20% releases to the seller automatically. If you did report one, the
            held amount stays frozen until an admin resolves the claim.
          </li>
        </ul>
        <div className="p-4 rounded-2xl bg-sx-amber-tint/60 border border-sx-amber-border flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-sx-amber-text shrink-0 mt-0.5" />
          <p className="text-xs sm:text-[13px] text-sx-ink-soft">
            <strong>Withdrawals are separate.</strong> A seller balance is not a
            payment. Sellers request an M-Pesa withdrawal, and staff review and
            process it manually. Request timing varies, and the seller dashboard
            shows the request status rather than confirming that funds were sent.
          </p>
        </div>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          4. What is not charged, ever
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>No fee to create, edit, or relist a listing.</li>
          <li>No fee to send or receive an offer, or to counter one.</li>
          <li>No fee to use the order chat or report a problem.</li>
          <li>No fee to open a dispute or an account-recovery claim.</li>
          <li>No buyer-side surcharge of any kind.</li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          5. Refunds and the fee
        </h2>
        <p>
          If an order is refunded, the service fee goes back with the order — you are
          not charged 5% for a sale that did not happen. Approved M-Pesa refunds are
          arranged manually by staff after a moderator reviews the evidence, so the
          order status records the decision, not proof that funds were sent.
        </p>
        <p className="text-xs text-sx-muted">
          Nothing on this page promises a transfer time. Where the platform says a
          refund is approved, a human still has to send it.
        </p>
      </section>

      <section className="pt-6 border-t border-sx-border">
        <div className="p-4 rounded-2xl bg-sx-subtle border border-sx-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-sx-green-text shrink-0 mt-0.5" />
            <p className="text-xs sm:text-[13px] text-sx-ink-soft">
              Want the rules behind the holds? The dispute policy lists what is and
              is not refundable.
            </p>
          </div>
          <Link
            href="/dispute-policy"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sx-amber-text shrink-0"
          >
            <span>Read the dispute policy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      <section className="space-y-2 pt-6 border-t border-sx-border">
        <h2 className="text-sm font-bold text-sx-ink font-display">Quick numbers</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { icon: <Percent className="w-3.5 h-3.5" />, label: "Seller fee", value: "5%" },
            { icon: <Wallet className="w-3.5 h-3.5" />, label: "Payable on confirm", value: "80%" },
            { icon: <Clock className="w-3.5 h-3.5" />, label: "Recovery hold", value: "7 days" },
            { icon: <BadgeCheck className="w-3.5 h-3.5" />, label: "Buyer fee", value: "KES 0" },
          ].map((item) => (
            <div
              key={item.label}
              className="p-3 rounded-xl bg-sx-elevated border border-sx-border space-y-1"
            >
              <span className="text-sx-muted">{item.icon}</span>
              <p className="text-sm font-bold text-sx-ink font-display">{item.value}</p>
              <p className="text-[10px] text-sx-muted leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
      </section>
    </StandaloneDocLayout>
  );
}
