import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsentBanner } from "@/components/common/CookieConsentBanner";
import { AdSenseScript } from "@/components/common/AdSenseScript";
import { SupportHubWidget } from "@/components/support/SupportHubWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { LanguageProvider } from "@/context/LanguageContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://www.efootballmarket.co.ke";

export const viewport: Viewport = {
  themeColor: "#090B0E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "eFootballMarket | Buy & Sell eFootball Accounts in Kenya",
    template: "%s | eFootballMarket",
  },
  description:
    "Buy and sell verified eFootball accounts in Kenya with M-Pesa buyer protection (Till 1572931), 24-hour squad inspection, and clean Konami ID transfers.",
  applicationName: "eFootballMarket",
  authors: [{ name: "Brian Okibo" }],
  generator: "Next.js",
  keywords: [
    "buy eFootball account Kenya",
    "sell eFootball squad M-Pesa",
    "eFootball escrow Kenya",
    "Konami ID accounts Kenya",
    "eFootball market Kenya",
    "eFootball mobile accounts",
  ],
  creator: "Brian Okibo",
  publisher: "eFootballMarket",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: siteUrl,
    siteName: "eFootballMarket",
    title: "eFootballMarket | Buy & Sell eFootball Accounts in Kenya",
    description:
      "Peer-to-peer eFootball marketplace in Kenya with M-Pesa payment holds (Till 1572931) and a 24-hour buyer inspection window.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "eFootballMarket Kenya",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "eFootballMarket | Buy & Sell eFootball Accounts in Kenya",
    description:
      "Peer-to-peer eFootball marketplace in Kenya with M-Pesa payment holds and 24-hour buyer verification.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  verification: {
    google: [
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "jArU_x-bgCj3AzwB_o8h7757C6udJVplNQuhkAiYPvQ",
      "googlee8e97a3f5a54db68",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-5924764989915276";

  return (
    <html lang="en" className={`dark ${inter.variable} ${outfit.variable}`}>
      <head>
        <Script
          id="google-consent-mode"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'wait_for_update': 500
              });
            `,
          }}
        />

        {gaId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="bg-[#090B0E] text-[#F1F5F9] min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-zinc-950 relative font-sans pb-16 md:pb-0">
        <LanguageProvider>
          <Header />
          <main className="flex-1 flex flex-col relative z-10">{children}</main>
          <Footer />
          <MobileBottomNav />
          <CookieConsentBanner />
          <SupportHubWidget />
          <AdSenseScript clientId={adsenseId} />
        </LanguageProvider>
      </body>
    </html>
  );
}
