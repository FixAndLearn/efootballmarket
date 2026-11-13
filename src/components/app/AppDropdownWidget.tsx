"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Smartphone,
  X,
  Download,
  Sliders,
  Gamepad2,
  Gift,
  Flame,
  ChevronDown,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { isStandaloneDocPath } from "@/components/legal/StandaloneDocLayout";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const APP_REQUEST_SNOOZE_KEY = "efm_app_pro_v2_snooze_until";

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
      window.location.search.includes("source=app") ||
      navigator.userAgent.includes("EFMProAndroid");

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

  // Polite auto-dropdown request on website visit (only on active viewport)
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
    }, 2200);

    return () => clearTimeout(timer);
  }, [isInstalled, isSuppressedAutoOpenRoute, viewportMode]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const dismissWithSnooze = () => {
    setOpen(false);
    try {
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
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close eFootball Market Pro App menu" : "Get eFootball Market Pro App"}
        aria-expanded={open}
        className="inline-flex items-center gap-1 sm:gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-full bg-sx-green-tint hover:bg-sx-elevated border border-sx-green-border text-sx-green-text text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Pro App</span>
        <span className="sm:hidden">App</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* SupportHub-styled Dropdown Request Card */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={dismissWithSnooze}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Download eFootball Market Pro v2.0 App"
            className="fixed sm:absolute right-3 left-3 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2.5 sm:w-[355px] z-40 rounded-2xl bg-sx-canvas border border-sx-border shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3.5 bg-sx-stone border-b border-sx-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0B1120] border border-sx-border flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-sx-ink leading-tight">
                      eFootball Market Pro
                    </p>
                    <span className="px-1.5 py-0.5 rounded bg-sx-green-tint text-sx-green-text text-[10px] font-bold">
                      v2.0 · 23 MB
                    </span>
                  </div>
                  <p className="text-[11px] text-sx-muted">
                    App-Only Pro Tools Not on the Website
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

            <div className="p-3 space-y-1">
              <Link
                href="/mobile?tab=efhub&tool=build"
                onClick={dismissWithSnooze}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-sx-stone transition-colors group"
              >
                <span className="flex items-center gap-2.5 text-xs font-semibold text-sx-ink">
                  <Sliders className="w-4 h-4 text-sx-green-text shrink-0" />
                  <span>
                    eFHUB Progression &amp; Booster Lab
                    <span className="block text-[10px] font-normal text-sx-muted">
                      Live 24-stat point allocator &amp; 88 Manager boost
                    </span>
                  </span>
                </span>
                <span className="text-[11px] text-sx-muted group-hover:text-sx-ink shrink-0">
                  Open &rarr;
                </span>
              </Link>

              <Link
                href="/mobile?tab=efhub&tool=pitch"
                onClick={dismissWithSnooze}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-sx-stone transition-colors group"
              >
                <span className="flex items-center gap-2.5 text-xs font-semibold text-sx-ink">
                  <Gamepad2 className="w-4 h-4 text-sx-amber-text shrink-0" />
                  <span>
                    11v11 Tactical Pitch &amp; OVR Builder
                    <span className="block text-[10px] font-normal text-sx-muted">
                      Test Meta formations, Epics &amp; Collective OVR
                    </span>
                  </span>
                </span>
                <span className="text-[11px] text-sx-muted group-hover:text-sx-ink shrink-0">
                  Build &rarr;
                </span>
              </Link>

              <Link
                href="/mobile?tab=efhub&tool=pack"
                onClick={dismissWithSnooze}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-sx-stone transition-colors group"
              >
                <span className="flex items-center gap-2.5 text-xs font-semibold text-sx-ink">
                  <Gift className="w-4 h-4 text-sx-green-text shrink-0" />
                  <span>
                    150-Box Epic Pack Sim &amp; VS Arena
                    <span className="block text-[10px] font-normal text-sx-muted">
                      Spin 150-boxes, compare cards &amp; offline mode
                    </span>
                  </span>
                </span>
                <span className="text-[11px] text-sx-muted group-hover:text-sx-ink shrink-0">
                  Spin &rarr;
                </span>
              </Link>

              <Link
                href="/mobile"
                onClick={dismissWithSnooze}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-sx-stone transition-colors group"
              >
                <span className="flex items-center gap-2.5 text-xs font-semibold text-sx-ink">
                  <Flame className="w-4 h-4 text-sx-amber-text shrink-0" />
                  <span>
                    Squad Swipe Deck + KES Valuator
                    <span className="block text-[10px] font-normal text-sx-muted">
                      AI Deal Scores, 1-tap seller ping &amp; haptics
                    </span>
                  </span>
                </span>
                <span className="text-[11px] text-sx-muted group-hover:text-sx-ink shrink-0">
                  Swipe &rarr;
                </span>
              </Link>
            </div>

            <div className="p-3 pt-2.5 border-t border-sx-border bg-sx-subtle space-y-2">
              <a
                href="/download/efootball-market.apk"
                download="eFootball-Market-Pro-v2.apk"
                onClick={dismissWithSnooze}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sx-green hover:bg-sx-green-hover text-white text-xs font-bold transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Pro Android APK (23 MB)</span>
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
                    <span>Open Pro App Hub</span>
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
