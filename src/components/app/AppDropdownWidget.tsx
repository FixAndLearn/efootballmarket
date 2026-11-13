"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Smartphone,
  X,
  Download,
  Flame,
  Sparkles,
  Radio,
  ShieldAlert,
  ChevronDown,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { isStandaloneDocPath } from "@/components/legal/StandaloneDocLayout";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const APP_REQUEST_SNOOZE_KEY = "efm_app_dropdown_snooze_until_v1";

export function AppDropdownWidget({
  viewportMode = "desktop",
}: {
  viewportMode?: "desktop" | "mobile";
}) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  const isSuppressedAutoOpenRoute =
    isStandaloneDocPath(pathname) ||
    pathname.startsWith("/mobile") ||
    pathname.startsWith("/app") ||
    pathname.startsWith("/orders/") ||
    pathname.startsWith("/pay/") ||
    pathname.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      window.location.search.includes("source=android_app") ||
      window.location.search.includes("source=app");

    setIsInstalled(standalone);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Polite auto-dropdown request on website visit (only on the active viewport instance)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isInstalled || isSuppressedAutoOpenRoute) return;

    const isDesktopNow = window.matchMedia("(min-width: 768px)").matches;
    if (viewportMode === "desktop" && !isDesktopNow) return;
    if (viewportMode === "mobile" && isDesktopNow) return;

    try {
      const snoozedUntil = Number(
        localStorage.getItem(APP_REQUEST_SNOOZE_KEY) || 0
      );
      if (snoozedUntil > Date.now()) return;
    } catch {
      // ignore
    }

    const timer = setTimeout(() => {
      setOpen(true);
    }, 2400);

    return () => clearTimeout(timer);
  }, [isInstalled, isSuppressedAutoOpenRoute, viewportMode]);

  // Close on route navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const dismissWithSnooze = () => {
    setOpen(false);
    try {
      // Snooze auto-request for 3 days once closed; button remains available anytime
      localStorage.setItem(
        APP_REQUEST_SNOOZE_KEY,
        String(Date.now() + 3 * 24 * 60 * 60 * 1000)
      );
    } catch {
      // ignore
    }
  };

  const handleInstantInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const res = await deferredPrompt.userChoice;
      if (res.outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setOpen(false);
      }
    } catch {
      // ignore
    } finally {
      setInstalling(false);
    }
  };

  if (pathname.startsWith("/mobile") || isStandaloneDocPath(pathname)) {
    return null;
  }

  return (
    <div className="relative">
      {/* Header Pill Trigger — mirrors the clean SupportHubWidget button aesthetic */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close eFootball Market App menu" : "Get eFootball Market App"}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-sx-green-tint hover:bg-sx-elevated border border-sx-green-border text-sx-green-text text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Get App</span>
        <span className="sm:hidden">App</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Request Card — styled in the exact SupportHubWidget card format */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={dismissWithSnooze}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Download eFootball Market App"
            className="fixed sm:absolute right-3 left-3 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2.5 sm:w-[340px] z-40 rounded-2xl bg-sx-canvas border border-sx-border shadow-2xl overflow-hidden"
          >
            {/* Header Strip (matches SupportHubWidget) */}
            <div className="flex items-center justify-between px-4 py-3.5 bg-sx-stone border-b border-sx-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0B1120] border border-sx-border flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-sx-ink leading-tight">
                      eFootball Market App
                    </p>
                    <span className="px-1.5 py-0.5 rounded bg-sx-green-tint text-sx-green-text text-[10px] font-bold">
                      NEW
                    </span>
                  </div>
                  <p className="text-[11px] text-sx-muted">
                    Built for Faster Trading · 1.6 MB APK
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={dismissWithSnooze}
                aria-label="Close app download request"
                className="p-1.5 rounded-md text-sx-muted hover:text-sx-ink hover:bg-sx-elevated transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* App-Exclusive Upgrades List (matches SupportHubWidget rows) */}
            <div className="p-3 space-y-1">
              <Link
                href="/mobile"
                onClick={dismissWithSnooze}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-sx-stone transition-colors group"
              >
                <span className="flex items-center gap-2.5 text-xs font-semibold text-sx-ink">
                  <Flame className="w-4 h-4 text-sx-green-text shrink-0" />
                  <span>
                    Squad Swipe Deck
                    <span className="block text-[10px] font-normal text-sx-muted">
                      Swipe rosters &amp; ping sellers in 1 tap
                    </span>
                  </span>
                </span>
                <span className="text-[11px] text-sx-muted group-hover:text-sx-ink shrink-0">
                  Try &rarr;
                </span>
              </Link>

              <Link
                href="/mobile"
                onClick={dismissWithSnooze}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-sx-stone transition-colors group"
              >
                <span className="flex items-center gap-2.5 text-xs font-semibold text-sx-ink">
                  <Sparkles className="w-4 h-4 text-sx-amber-text shrink-0" />
                  <span>
                    Instant KES Squad Valuator
                    <span className="block text-[10px] font-normal text-sx-muted">
                      Live OVR, Epics &amp; M-Pesa payout calculator
                    </span>
                  </span>
                </span>
                <span className="text-[11px] text-sx-muted group-hover:text-sx-ink shrink-0">
                  Open &rarr;
                </span>
              </Link>

              <Link
                href="/mobile"
                onClick={dismissWithSnooze}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-sx-stone transition-colors group"
              >
                <span className="flex items-center gap-2.5 text-xs font-semibold text-sx-ink">
                  <Radio className="w-4 h-4 text-sx-green-text shrink-0" />
                  <span>
                    Live Deal Radar &amp; Lite Mode
                    <span className="block text-[10px] font-normal text-sx-muted">
                      Instant offer replies + Safaricom data saver
                    </span>
                  </span>
                </span>
                <span className="text-[11px] text-sx-muted group-hover:text-sx-ink shrink-0">
                  Live &rarr;
                </span>
              </Link>

              <Link
                href="/mobile"
                onClick={dismissWithSnooze}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-sx-stone transition-colors group"
              >
                <span className="flex items-center gap-2.5 text-xs font-semibold text-sx-ink">
                  <ShieldAlert className="w-4 h-4 text-sx-amber-text shrink-0" />
                  <span>
                    1-Tap Trader Phone Scanner
                    <span className="block text-[10px] font-normal text-sx-muted">
                      Verify any 07/01 number before trading
                    </span>
                  </span>
                </span>
                <span className="text-[11px] text-sx-muted group-hover:text-sx-ink shrink-0">
                  Scan &rarr;
                </span>
              </Link>
            </div>

            {/* Footer Action Block (matches SupportHubWidget bottom block) */}
            <div className="p-3 pt-2.5 border-t border-sx-border bg-sx-subtle space-y-2">
              <a
                href="/download/efootball-market.apk"
                download="eFootball-Market.apk"
                onClick={dismissWithSnooze}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sx-green hover:bg-sx-green-hover text-white text-xs font-bold transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Android APK (1.6 MB)</span>
              </a>

              <div className="flex items-center justify-between gap-2">
                {deferredPrompt ? (
                  <button
                    type="button"
                    onClick={handleInstantInstall}
                    disabled={installing}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sx-contrast text-sx-contrast-fg text-[11px] font-bold cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{installing ? "Installing..." : "1-Tap Web Install"}</span>
                  </button>
                ) : (
                  <Link
                    href="/mobile"
                    onClick={dismissWithSnooze}
                    className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-sx-canvas border border-sx-border text-[11px] font-bold text-sx-ink hover:bg-sx-stone transition-colors"
                  >
                    <span>Launch App View</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={dismissWithSnooze}
                  className="py-2 px-3 rounded-xl text-[11px] font-semibold text-sx-muted hover:text-sx-ink cursor-pointer"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
