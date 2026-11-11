import { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, Phone, Clock, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact & Support | eFootballMarket Kenya",
  description:
    "Get help with an active eFootballMarket order, M-Pesa Till 1572931 payment verification, Konami ID transfer, or scammer report.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-10">
      <header className="space-y-2 border-b border-sx-border pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-sx-ink font-display tracking-tight">
          Contact &amp; Support
        </h1>
        <p className="text-sm text-sx-muted leading-relaxed">
          Reach our support desk for order assistance, M-Pesa payment queries, or scammer reports.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-sx-canvas border border-sx-border space-y-3">
          <div className="flex items-center gap-2.5 text-sx-ink font-semibold text-sm">
            <MessageCircle className="w-4 h-4 text-sx-green-text" />
            <span>WhatsApp Support (Fastest)</span>
          </div>
          <p className="text-xs text-sx-muted leading-relaxed">
            For active order questions, M-Pesa STK push checks, or reporting suspicious traders. Include your Order ID if inquiring about a purchase.
          </p>
          <a
            href="https://wa.me/254794400365"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sx-green-text hover:text-sx-green-text"
          >
            <span>Message +254 794 400 365 &rarr;</span>
          </a>
        </div>

        <div className="p-5 rounded-xl bg-sx-canvas border border-sx-border space-y-3">
          <div className="flex items-center gap-2.5 text-sx-ink font-semibold text-sm">
            <Mail className="w-4 h-4 text-sx-green-text" />
            <span>Email Inquiries</span>
          </div>
          <p className="text-xs text-sx-muted leading-relaxed">
            For account verification, privacy requests under the Kenya Data Protection Act, or formal dispute documentation.
          </p>
          <a
            href="mailto:support@efootballmarket.co.ke"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sx-green-text hover:text-sx-green-text"
          >
            <span>support@efootballmarket.co.ke</span>
          </a>
        </div>

        <div className="p-5 rounded-xl bg-sx-canvas border border-sx-border space-y-2">
          <div className="flex items-center gap-2.5 text-sx-ink font-semibold text-sm">
            <Phone className="w-4 h-4 text-sx-muted" />
            <span>Direct Helpline</span>
          </div>
          <p className="text-xs text-sx-muted">
            0794 400 365 (+254 794 400 365)
          </p>
        </div>

        <div className="p-5 rounded-xl bg-sx-canvas border border-sx-border space-y-2">
          <div className="flex items-center gap-2.5 text-sx-ink font-semibold text-sm">
            <Clock className="w-4 h-4 text-sx-muted" />
            <span>Support Hours &amp; Location</span>
          </div>
          <p className="text-xs text-sx-muted">
            Monday – Sunday, 8:00 AM – 10:00 PM EAT (Kenya)
          </p>
        </div>
      </div>

      <section className="p-5 rounded-xl bg-sx-stone border border-sx-border space-y-2 text-xs text-sx-ink-soft leading-relaxed">
        <h2 className="text-sm font-semibold text-sx-ink">
          Operator &amp; Official Payment Channel
        </h2>
        <p className="text-sx-muted">
          <strong>eFootballMarket Kenya</strong> (sole proprietorship operated in Nairobi, Kenya by Brian Okibo). Official payments are accepted only via Safaricom Lipa Na M-Pesa Buy Goods Till <strong>1572931</strong>—our staff will never ask for your Konami password or ask you to send money to a personal number.
        </p>
      </section>

      <section className="p-5 rounded-xl bg-sx-canvas border border-sx-border space-y-2 text-xs text-sx-ink-soft leading-relaxed">
        <h2 className="text-sm font-semibold text-sx-ink flex items-center gap-2">
          <MapPin className="w-4 h-4 text-sx-muted" />
          <span>Active Order Disputes</span>
        </h2>
        <p className="text-sx-muted">
          If you have an active order in its 24-hour inspection window, click <strong>Open Dispute</strong> directly inside your{" "}
          <Link href="/dashboard/buyer" className="text-sx-green-text hover:underline font-semibold">
            Order Room / Buyer Hub
          </Link>{" "}
          first so seller payout pauses immediately before messaging support on WhatsApp.
        </p>
      </section>
    </div>
  );
}
