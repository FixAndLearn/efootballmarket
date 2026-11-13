import { Metadata } from "next";
import { AppDownloadClient } from "@/components/app/AppDownloadClient";

export const metadata: Metadata = {
  title: "Download eFootball Market Pro v2.0 App (23 MB Android APK & iOS) | eFootballMarket",
  description:
    "Download eFootball Market Pro v2.0 (23 MB native Android APK & iOS Web App) with eFHUB Progression Lab, 11v11 Pitch Builder, 150-Box Pack Sim, Squad Swipe Deck & Till 1572931 Escrow.",
};

export default function AppDownloadPage() {
  return <AppDownloadClient />;
}
