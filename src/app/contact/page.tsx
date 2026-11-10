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
      <header className="space-y-2 border-b border-[#E2E2E0] pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F0F0F] font-display tracking-tight">
          Contact &amp; Support
        </h1>
        <p className="text-sm text-[#5F5F5F] leading-relaxed">
          Reach our support desk for order assistance, M-Pesa payment queries, or scammer reports.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-white border border-[#E2E2E0] space-y-3">
          <div className="flex items-center gap-2.5 text-[#0F0F0F] font-semibold text-sm">
            <MessageCircle className="w-4 h-4 text-[#006340]" />
            <span>WhatsApp Support (Fastest)</span>
          </div>
          <p className="text-xs text-[#5F5F5F] leading-relaxed">
            For active order questions, M-Pesa STK push checks, or reporting suspicious traders. Include your Order ID if inquiring about a purchase.
          </p>
          <a
            href="https://wa.me/254794400365"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006340] hover:text-[#006340]"
          >
            <span>Message +254 794 400 365 &rarr;</span>
          </a>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E2E0] space-y-3">
          <div className="flex items-center gap-2.5 text-[#0F0F0F] font-semibold text-sm">
            <Mail className="w-4 h-4 text-[#006340]" />
            <span>Email Inquiries</span>
          </div>
          <p className="text-xs text-[#5F5F5F] leading-relaxed">
            For account verification, privacy requests under the Kenya Data Protection Act, or formal dispute documentation.
          </p>
          <a
            href="mailto:support@efootballmarket.co.ke"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006340] hover:text-[#006340]"
          >
            <span>support@efootballmarket.co.ke</span>
          </a>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E2E0] space-y-2">
          <div className="flex items-center gap-2.5 text-[#0F0F0F] font-semibold text-sm">
            <Phone className="w-4 h-4 text-[#5F5F5F]" />
            <span>Direct Helpline</span>
          </div>
          <p className="text-xs text-[#5F5F5F]">
            0794 400 365 (+254 794 400 365)
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E2E0] space-y-2">
          <div className="flex items-center gap-2.5 text-[#0F0F0F] font-semibold text-sm">
            <Clock className="w-4 h-4 text-[#5F5F5F]" />
            <span>Support Hours &amp; Location</span>
          </div>
          <p className="text-xs text-[#5F5F5F]">
            Monday – Sunday, 8:00 AM – 10:00 PM EAT (Kenya)
          </p>
        </div>
      </div>

      <section className="p-5 rounded-xl bg-white border border-[#E2E2E0] space-y-2 text-xs text-[#3D3D3D] leading-relaxed">
        <h2 className="text-sm font-semibold text-[#0F0F0F] flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#5F5F5F]" />
          <span>Active Order Disputes</span>
        </h2>
        <p className="text-[#5F5F5F]">
          If you have an active order in its 24-hour inspection window, always click <strong>Raise Dispute</strong> directly inside your{" "}
          <Link href="/dashboard/buyer" className="text-[#006340] hover:underline">
            Buyer Hub
          </Link>{" "}
          first so the payout timer freezes automatically before contacting support on WhatsApp.
        </p>
      </section>
    </div>
  );
}
