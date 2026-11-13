import { Metadata } from "next";
import { AppDownloadClient } from "@/components/app/AppDownloadClient";

export const metadata: Metadata = {
  title: "Download eFootball Market Pro v2.0 App (23 MB Android APK & iOS)",
  description:
    "Download eFootball Market Pro v2.0 (23 MB native Android APK & iOS Web App) with eFHUB Progression Lab, 11v11 Pitch Builder, 150-Box Pack Sim, Squad Swipe Deck & Till 1572931 Escrow.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/app",
  },
  openGraph: {
    title: "Download eFootball Market Pro v2.0 App (23 MB Android APK & iOS)",
    description:
      "Get the 23 MB Android APK or 1-tap iOS Web App with eFHUB Progression Lab, 11v11 Squad Pitch Builder, 150-Box Pack Simulator & Squad Swipe Deck.",
    url: "https://www.efootballmarket.co.ke/app",
    type: "website",
  },
};

export default function AppDownloadPage() {
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "eFootball Market Pro",
    operatingSystem: "Android 7.0+, iOS 15+",
    applicationCategory: "GameApplication",
    softwareVersion: "2.0.0",
    fileSize: "23.7 MB",
    downloadUrl: "https://www.efootballmarket.co.ke/download/efootball-market.apk",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KES",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <AppDownloadClient />
    </>
  );
}
