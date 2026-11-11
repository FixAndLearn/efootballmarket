import React from "react";
import { Metadata } from "next";
import { UnifiedLegalHub } from "@/components/legal/UnifiedLegalHub";

export const metadata: Metadata = {
  title: "Privacy & Cookie Policy | eFootballMarket Kenya",
  description:
    "How eFootballMarket Kenya collects, encrypts, retains, and protects personal data, M-Pesa escrow records, Konami ID handover logins, and Google AdSense / Consent Mode v2 cookies under the Kenya Data Protection Act, 2019.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/privacy" },
};

export default function PrivacyPage() {
  return <UnifiedLegalHub initialSection="privacy" />;
}
