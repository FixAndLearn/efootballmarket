import React from "react";
import { Metadata } from "next";
import { UnifiedLegalHub } from "@/components/legal/UnifiedLegalHub";

export const metadata: Metadata = {
  title: "Policies, Payment Protection & Terms | eFootballMarket Kenya",
  description:
    "Unified open-page Legal & Policy Center for eFootballMarket Kenya: M-Pesa Till 1572931 payment protection, fees, Terms of Service, refunds, seller rules, anti-fraud, and Kenya DPA 2019 privacy policy.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/policies" },
};

export default function PoliciesPage() {
  return <UnifiedLegalHub initialSection="escrow" />;
}
