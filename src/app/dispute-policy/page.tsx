import React from "react";
import { Metadata } from "next";
import { UnifiedLegalHub } from "@/components/legal/UnifiedLegalHub";

export const metadata: Metadata = {
  title: "Buyer Refund & Dispute Policy | eFootballMarket Kenya",
  description:
    "Clear rules on when buyers receive a 100% M-Pesa refund, when sellers get paid, screen-recording proof, and 24–48 hour dispute review on eFootballMarket Kenya.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/dispute-policy" },
};

export default function DisputePolicyPage() {
  return <UnifiedLegalHub initialSection="disputes" />;
}
