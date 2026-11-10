"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CookieConsentState, updateGoogleConsent, trackEvent } from "@/lib/analytics";

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

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

  if (!isVisible) return null;

  return (
    <aside
      role="region"
      aria-label="Cookie preferences"
      className="fixed bottom-20 md:bottom-5 left-3 right-16 sm:left-5 sm:right-auto sm:max-w-md z-40 select-none"
    >
      <div className="p-4 rounded-lg bg-white border border-[#C8C8C4] shadow-xl text-[#0F0F0F] space-y-3">
        <p className="text-xs text-[#3D3D3D] leading-relaxed">
          We use cookies for login sessions, analytics, and Google AdSense advertising. Choose your preference below or review our{" "}
          <Link href="/privacy" className="text-[#006340] underline font-semibold">
            Privacy Policy
          </Link>
          .
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAcceptAll}
            className="px-4 py-1.5 rounded-full bg-[#006340] hover:bg-[#004D32] text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Accept All
          </button>
          <button
            type="button"
            onClick={handleEssentialOnly}
            className="px-4 py-1.5 rounded-full bg-[#F4F3F1] hover:bg-[#E5E4E0] border border-[#C8C8C4] text-[#0F0F0F] font-semibold text-xs transition-colors cursor-pointer"
          >
            Essential Only
          </button>
        </div>
      </div>
    </aside>
  );
}
