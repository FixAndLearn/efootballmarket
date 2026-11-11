import React from "react";
import { Metadata } from "next";
import { UnifiedLegalHub } from "@/components/legal/UnifiedLegalHub";

export const metadata: Metadata = {
  title: "Terms of Service & Platform Policies | eFootballMarket Kenya",
  description:
    "Plain-language Terms of Service and unified platform policies for buying, selling, swapping, and hosting eFootball cups via M-Pesa Till 1572931 on eFootballMarket Kenya.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/terms" },
};

export default function TermsPage() {
  return <UnifiedLegalHub initialSection="terms" />;
}
