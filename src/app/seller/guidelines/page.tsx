import React from "react";
import { Metadata } from "next";
import { UnifiedLegalHub } from "@/components/legal/UnifiedLegalHub";

export const metadata: Metadata = {
  title: "Seller Standards, Fees & M-Pesa Payout Rules | eFootballMarket",
  description:
    "Complete handbook for selling eFootball accounts in Kenya: preparing a Clean Konami ID, permanent OVR screenshots, 5% commission cap (KES 50–500), 12-hour OTP handover, and M-Pesa payouts.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/seller/guidelines" },
};

export default function SellerGuidelinesPage() {
  return <UnifiedLegalHub initialSection="seller-standards" />;
}
