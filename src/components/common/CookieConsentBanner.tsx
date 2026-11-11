"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CookieConsentState, updateGoogleConsent, trackEvent } from "@/lib/analytics";

export function CookieConsentBanner() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/reset-password");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("efootball_cookie_consent");
      if (saved) {
        const parsed: CookieConsentState = JSON.parse(saved);
        updateGoogleConsent(parsed);
      } else {
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // storage disabled
    }
  }, []);

  const saveConsent = (newConsent: CookieConsentState) => {
    updateGoogleConsent(newConsent);
    try {
      localStorage.setItem("efootball_cookie_consent", JSON.stringify(newConsent));
    } catch {
      // storage disabled
    }
    setIsVisible(false);
    trackEvent({
      action: "cookie_consent_saved",
      category: "privacy",
      label: `analytics:${newConsent.analytics}|ads:${newConsent.advertising}`,
    });
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      advertising: true,
      timestamp: new Date().toISOString(),
    });
  };

  const handleEssentialOnly = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      advertising: false,
      timestamp: new Date().toISOString(),
    });
  };

  if (!isVisible || isAuthPage) return null;

  return (
    <aside
      role="region"
      aria-label="Cookie preferences"
      className="fixed bottom-20 md:bottom-5 left-3 right-24 sm:left-5 sm:right-auto sm:max-w-md z-40 select-none"
    >
      <div className="p-4 rounded-lg bg-sx-canvas border border-sx-border-strong shadow-xl text-sx-ink space-y-3">
        <p className="text-xs text-sx-ink-soft leading-relaxed">
          We use cookies for login sessions, analytics, and Google AdSense advertising. Choose your preference below or review our{" "}
          <Link href="/privacy" className="text-sx-green-text underline font-semibold">
            Privacy &amp; Cookie Policy
          </Link>
          .
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAcceptAll}
            className="px-4 py-1.5 rounded-full bg-sx-green hover:bg-sx-green-hover text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Accept All
          </button>
          <button
            type="button"
            onClick={handleEssentialOnly}
            className="px-4 py-1.5 rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border-strong text-sx-ink font-semibold text-xs transition-colors cursor-pointer"
          >
            Essential Only
          </button>
        </div>
      </div>
    </aside>
  );
}
