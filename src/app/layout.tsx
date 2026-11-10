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
import { LanguageProvider } from "@/context/LanguageContext";

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

export const viewport: Viewport = {
  themeColor: "#07090D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "eFootballMarket — Buy & Sell Verified eFootball Squads in Kenya",
    template: "%s | eFootballMarket",
  },
  description:
    "Kenyan marketplace for unlinked Konami ID eFootball accounts. Automated Safaricom M-Pesa Till 1572931 escrow hold and 24-hour buyer inspection.",
  keywords: [
    "buy eFootball account Kenya",
    "sell eFootball account M-Pesa",
    "eFootball marketplace Kenya",
    "Konami ID accounts Kenya",
    "eFootball middleman Kenya",
    "eFootballMarket",
  ],
  authors: [{ name: "eFootballMarket", url: APP_URL }],
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
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    shortcut: "/favicon.svg",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: APP_URL,
    siteName: "eFootballMarket",
    title: "eFootballMarket — Buy & Sell Verified eFootball Squads in Kenya",
    description:
      "Kenyan marketplace for unlinked Konami ID eFootball accounts with Safaricom M-Pesa Till 1572931 buyer protection.",
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
    title: "eFootballMarket — Buy & Sell Verified eFootball Squads in Kenya",
    description:
      "Trade unlinked Konami ID eFootball squads in Kenya with M-Pesa Till 1572931 buyer protection.",
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
  other: {
    "google-adsense-account": "ca-pub-2263419283400001",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-2263419283400001";
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "eFootballMarket",
    url: APP_URL,
    logo: `${APP_URL}/favicon.svg`,
    description:
      "Kenyan marketplace and M-Pesa escrow service for trading unlinked Konami ID eFootball accounts.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Nairobi",
      addressCountry: "KE",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+254-794-400-365",
      contactType: "customer support",
      areaServed: "KE",
      availableLanguage: ["English", "Swahili"],
    },
  };

  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
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
      <body className="font-sans antialiased flex flex-col min-h-screen bg-[#07090D] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
        <LanguageProvider>
          <Header />
          <main className="flex-1 flex flex-col pb-20 md:pb-0">{children}</main>
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
