import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { CookieConsentBanner } from "@/components/common/CookieConsentBanner";
import { AdSenseScript } from "@/components/common/AdSenseScript";
import { SupportHubWidget } from "@/components/support/SupportHubWidget";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["500", "600", "700"],
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.efootballmarket.co.ke";
const DEFAULT_ADSENSE_CLIENT_ID = "ca-pub-5924764989915276";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1014" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "eFootballMarket — eFootball Guides, Tactics & Verified Marketplace Kenya",
    template: "%s | eFootballMarket",
  },
  description:
    "eFootball tactical guides, player progression builds, and verified Konami ID marketplace in Kenya with Safaricom M-Pesa Till 1572931 buyer protection.",
  keywords: [
    "eFootball guides Kenya",
    "eFootball player builds",
    "eFootball tactics Division 1",
    "buy eFootball account Kenya",
    "Konami ID transfer guide",
    "eFootballMarket",
  ],
  authors: [{ name: "eFootballMarket Editorial", url: APP_URL }],
  creator: "eFootballMarket",
  publisher: "eFootballMarket",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: APP_URL,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: APP_URL,
    siteName: "eFootballMarket",
    title: "eFootballMarket — eFootball Guides, Tactics & Verified Marketplace Kenya",
    description:
      "eFootball tactical guides, player progression builds, and M-Pesa protected Konami ID marketplace in Kenya.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "eFootballMarket Kenya",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "eFootballMarket — eFootball Guides, Tactics & Verified Marketplace Kenya",
    description:
      "eFootball tactical guides, player progression builds, and M-Pesa protected Konami ID marketplace in Kenya.",
    images: ["/opengraph-image"],
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
  verification: {
    google: [
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
        "jArU_x-bgCj3AzwB_o8h7757C6udJVplNQuhkAiYPvQ",
      "googlee8e97a3f5a54db68",
    ],
  },
  other: {
    "google-adsense-account":
      process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || DEFAULT_ADSENSE_CLIENT_ID,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adsenseId =
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || DEFAULT_ADSENSE_CLIENT_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Google Consent Mode v2 Bootstrap */}
        <script
          id="google-consent-mode"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              (function() {
                var analyticsGranted = 'denied';
                var adsGranted = 'denied';
                try {
                  var saved = localStorage.getItem('efootball_cookie_consent');
                  if (saved) {
                    var parsed = JSON.parse(saved);
                    if (parsed && parsed.analytics) analyticsGranted = 'granted';
                    if (parsed && parsed.advertising) adsGranted = 'granted';
                  }
                } catch (e) {}
                gtag('consent', 'default', {
                  'analytics_storage': analyticsGranted,
                  'ad_storage': adsGranted,
                  'ad_user_data': adsGranted,
                  'ad_personalization': adsGranted,
                  'wait_for_update': 500
                });
              })();
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
                  gtag('config', '${gaId}', { page_path: window.location.pathname });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="font-sans antialiased flex flex-col min-h-screen bg-sx-canvas text-sx-ink selection:bg-sx-green selection:text-white">
        <Header />
        <main className="flex-1 flex flex-col pb-20 md:pb-0">{children}</main>
        <Footer />
        <MobileBottomNav />
        <CookieConsentBanner />
        <SupportHubWidget />
        <AdSenseScript clientId={adsenseId} />
      </body>
    </html>
  );
}
