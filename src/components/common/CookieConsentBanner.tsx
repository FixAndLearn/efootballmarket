"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CookieConsentState, DEFAULT_CONSENT, updateGoogleConsent, trackEvent } from "@/lib/analytics";

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
      <div className="p-4 rounded-xl bg-[#11141B] border border-[#262D3B] shadow-2xl text-slate-200 space-y-3">
        <p className="text-xs text-slate-300 leading-relaxed">
          We use cookies for login sessions, analytics, and Google AdSense advertising. Choose your preference below or read our{" "}
          <Link href="/privacy" className="text-emerald-400 hover:underline font-medium">
            Privacy Policy
          </Link>
          .
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAcceptAll}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors"
          >
            Accept All
          </button>
          <button
            type="button"
            onClick={handleEssentialOnly}
            className="px-3.5 py-1.5 rounded-lg bg-[#171B24] hover:bg-[#1E2430] border border-[#283040] text-slate-300 hover:text-white font-medium text-xs transition-colors"
          >
            Essential Only
          </button>
        </div>
      </div>
    </aside>
  );
}
