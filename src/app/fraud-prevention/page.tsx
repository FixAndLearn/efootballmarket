import React from "react";
import { Metadata } from "next";
import { UnifiedLegalHub } from "@/components/legal/UnifiedLegalHub";

export const metadata: Metadata = {
  title: "Safety & Anti-Fraud Policy | eFootballMarket Kenya",
  description:
    "How eFootballMarket verifies real M-Pesa Till 1572931 receipts, encrypts Order Room logins with AES-256-GCM, blocks dual-link recovery scams, and handles Scammer Check appeals.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/fraud-prevention" },
};

export default function FraudPreventionPage() {
  return <UnifiedLegalHub initialSection="anti-fraud" />;
}
