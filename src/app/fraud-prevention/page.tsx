import React from "react";
import { Metadata } from "next";
import { StandaloneDocLayout } from "@/components/legal/StandaloneDocLayout";

export const metadata: Metadata = {
  title: "Safety & Anti-Fraud Policy",
  description:
    "Standalone Safety & Anti-Fraud Policy for eFootballMarket Kenya: server-verified M-Pesa Till 1572931 receipts, AES-256-GCM vault, dual-link recovery checks, and free Scammer Check appeals.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/fraud-prevention" },
};

export default function FraudPreventionPage() {
  return (
    <StandaloneDocLayout
      badge="Safety & Anti-Fraud"
      title="Safety & Anti-Fraud Policy"
      subtitle="Technical and operational safeguards blocking fake M-Pesa SMS screenshots, protecting Order Room logins, and keeping Scammer Check reports fair and appealable."
      keyFacts={[
        { value: "Daraja / Till", label: "Real Receipt Verification" },
        { value: "AES-256-GCM", label: "Encrypted Login Vault" },
        { value: "Not Linked", label: "Google/Apple Link Check" },
        { value: "Free · 48h", label: "Scammer Check Appeals" },
      ]}
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          1. Server-Verified M-Pesa Receipts (No Fake SMS)
        </h2>
        <p>
          Pasted SMS messages or screenshots never unlock an order on eFootballMarket. Orders move to <em>Escrow Funded</em> only when our payment integration verifies the real Safaricom M-Pesa receipt and exact KES amount against Buy Goods Till <strong>1572931</strong>, and each receipt code can only be used once.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          2. Encrypted Login Handover &amp; Dual-Link Protection
        </h2>
        <p>
          Sellers submit Konami ID or console logins inside the encrypted Order Room vault (<strong>AES-256-GCM</strong>) rather than open chat, with every reveal timestamp logged. Buyers then have <strong>24 hours</strong> to verify <em>Extras &rarr; Support &rarr; Link Data</em> shows Google Play and Apple ID / Game Center are <strong>Not Linked</strong>—if either remains linked, open a dispute within 24 hours for a 100% refund.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          3. Chat Phishing Filters &amp; Scammer Check Appeals
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Chat Safety Filters:</strong> Order Chat blocks external phishing URLs and personal payment numbers before escrow is funded. Staff will <strong>never</strong> ask for your M-Pesa PIN or account password.
          </li>
          <li>
            <strong>Moderated Reports &amp; Free 48-Hour Appeals:</strong> Scammer Check entries require supporting transaction or chat proof before going live. Anyone assigned a recycled Safaricom/Airtel line or who has resolved a dispute can request free correction or removal via <strong>support@efootballmarket.co.ke</strong> (reviewed within <strong>48 hours</strong>).
          </li>
        </ul>
      </section>
    </StandaloneDocLayout>
  );
}
