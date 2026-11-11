import React from "react";
import { Metadata } from "next";
import { UnifiedLegalHub } from "@/components/legal/UnifiedLegalHub";

export const metadata: Metadata = {
  title: "How Payment Protection & Fees Work | eFootballMarket Kenya",
  description:
    "Who holds your M-Pesa payment on Buy Goods Till 1572931, automated vs Nairobi desk steps, 24-hour login inspection rules, and complete platform fee schedule.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/escrow-guarantee" },
};

export default function EscrowGuaranteePage() {
  return <UnifiedLegalHub initialSection="escrow" />;
}
