"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

interface AdSenseScriptProps {
  clientId: string;
}

/**
 * Strictly enforces Google AdSense Publisher Policies:
 * Only loads AdSense on public pages containing substantial editorial/informational content.
 * Never loads on authentication, checkout, escrow rooms, dashboards, forms, or utility-only screens.
 */
const CONTENT_ELIGIBLE_PREFIXES = [
  "/news",
  "/escrow-guarantee",
  "/fraud-prevention",
  "/dispute-policy",
  "/seller/guidelines",
  "/scammer-check",
  "/about",
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
      strategy="lazyOnload"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
    />
  );
}
