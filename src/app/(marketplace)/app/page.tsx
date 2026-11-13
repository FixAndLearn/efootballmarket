import { Metadata } from "next";
import { AppDownloadClient } from "@/components/app/AppDownloadClient";

export const metadata: Metadata = {
  title: "Download eFootball Market App (Android APK & iOS) | eFootballMarket Kenya",
  description:
    "Download the official eFootball Market mobile app (1.6 MB Android APK & 1-tap iOS/Android install). Get instant squad availability alerts and M-Pesa Till 1572931 escrow protection.",
};

export default function AppDownloadPage() {
  return <AppDownloadClient />;
}
