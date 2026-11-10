"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

interface AdSenseScriptProps {
  clientId: string;
}

export function AdSenseScript({ clientId }: AdSenseScriptProps) {
  const pathname = usePathname() || "/";

  if (!clientId) return null;

  // Never load third-party ad scripts on authentication, escrow checkout, order rooms, KYC, or admin routes
  const isProtectedRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/pay/") ||
    pathname.startsWith("/orders/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname === "/seller/verification" ||
    pathname === "/seller/create-listing";

  if (isProtectedRoute) {
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
