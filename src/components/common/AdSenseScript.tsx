"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

interface AdSenseScriptProps {
  clientId: string;
}

/**
 * Strictly enforces Google AdSense Publisher Policies:
 * - Site ownership verification is always present in SSR <head> via <meta name="google-adsense-account">.
 * - The AdSense ad-serving script (`adsbygoogle.js`) loads ONLY on public pages containing
 *   substantial publisher/editorial content.
 * - Strictly blocked on authentication, checkout, escrow rooms, dashboards, tournaments,
 *   utility-only lookup/contract forms, and error/admin routes.
 */
const CONTENT_ELIGIBLE_PREFIXES = [
  "/news",
  "/about",
  "/escrow-guarantee",
  "/fraud-prevention",
  "/dispute-policy",
  "/seller/guidelines",
];

export function AdSenseScript({ clientId }: AdSenseScriptProps) {
  const pathname = usePathname() || "/";

  if (!clientId) return null;

  const isEligibleContentPage =
    pathname === "/" ||
    CONTENT_ELIGIBLE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

  if (!isEligibleContentPage) {
    return null;
  }

  return (
    <Script
      id="google-adsense"
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
    />
  );
}
