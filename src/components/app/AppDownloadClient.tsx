"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  Smartphone,
  ShieldCheck,
  BellRing,
  Zap,
  CheckCircle2,
  Share,
  PlusSquare,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  ensureNotificationServiceWorker,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
} from "@/lib/notifications/browserPush";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function AppDownloadClient() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | "desktop">("android");
  const [installingPwa, setInstallingPwa] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(false);

  useEffect(() => {
    ensureNotificationServiceWorker().catch(() => {});
    setAlertsEnabled(getBrowserNotificationPermission() === "granted");

    // Detect standalone installed mode
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      window.location.search.includes("source=android_app") ||
      window.location.search.includes("source=app");
    setIsInstalled(standalone);

    // Detect OS
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform("ios");
    } else if (/android/.test(ua)) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleInstantInstall = async () => {
    if (!deferredPrompt) return;
    setInstallingPwa(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } catch {
      // ignore
    } finally {
      setInstallingPwa(false);
    }
  };

  const handleTurnOnAlerts = async () => {
    const res = await requestBrowserNotificationPermission();
    setAlertsEnabled(res === "granted");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      {/* Hero Card */}
      <div className="rounded-3xl bg-sx-canvas border border-sx-border p-6 sm:p-10 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sx-green-tint border border-sx-green-border text-sx-green-text text-xs font-bold">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Official Mobile App · v1.0.0 (1.6 MB)</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#0B1120] border border-sx-border p-2.5 flex items-center justify-center shrink-0 shadow-md">
                <Image
                  src="/icon-512.png"
                  alt="eFootball Market App Icon"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-sx-ink font-display tracking-tight">
                  eFootball Market
                </h1>
                <p className="text-xs sm:text-sm text-sx-muted mt-0.5">
                  Verified Kenyan Squad Marketplace · Till 1572931 Escrow
                </p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-sx-ink-soft leading-relaxed">
              Built completely different from the website: swipe verified squads in a{" "}
              <strong>Full-Card Deck</strong>, price your roster with the{" "}
              <strong>Instant KES Squad Valuator</strong>, track replies in{" "}
              <strong>Live Deal Radar</strong>, and save bundles with{" "}
              <strong>Safaricom Lite Mode</strong>.
            </p>

            {isInstalled ? (
              <div className="p-4 rounded-2xl bg-sx-green-tint border border-sx-green-border space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-sx-green-text">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>eFootball Market App is Installed &amp; Active!</span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Link href="/mobile">
                    <Button variant="primary" size="md">
                      <span>Open Native App Shell</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  {!alertsEnabled && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={handleTurnOnAlerts}
                    >
                      <BellRing className="w-4 h-4" />
                      <span>Turn On Instant Phone Alerts</span>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  {/* Direct Signed Android APK Download */}
                  <a
                    href="/download/efootball-market.apk"
                    download="eFootball-Market.apk"
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-sx-green hover:bg-sx-green-hover text-white font-extrabold text-sm sm:text-base shadow-sm transition-all"
                  >
                    <Download className="w-5 h-5 shrink-0" />
                    <span>Download Android APK (1.6 MB)</span>
                  </a>

                  {/* 1-Tap Native Browser PWA Install (when supported by Chrome/Edge/Samsung) */}
                  {deferredPrompt ? (
                    <button
                      type="button"
                      onClick={handleInstantInstall}
                      disabled={installingPwa}
                      className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-sx-contrast hover:opacity-90 text-sx-contrast-fg font-bold text-sm transition-all cursor-pointer"
                    >
                      <Zap className="w-4 h-4 shrink-0" />
                      <span>{installingPwa ? "Installing..." : "1-Tap Instant Install"}</span>
                    </button>
                  ) : (
                    <Link
                      href="/mobile"
                      className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-sx-contrast hover:opacity-90 text-sx-contrast-fg font-bold text-sm transition-all"
                    >
                      <Zap className="w-4 h-4 shrink-0" />
                      <span>Preview App Experience &rarr;</span>
                    </Link>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-sx-muted">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-sx-green-text" />
                    SHA-256 Signed Release (`ke.co.efootballmarket.app`)
                  </span>
                  <span>• Android 5.0 to Android 15+</span>
                  <span>• Auto-updates with zero re-downloads</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Quick Install Steps for Android & iPhone */}
          <div className="lg:col-span-5 space-y-4">
            {/* Android Instructions */}
            <div
              className={`p-5 rounded-2xl border space-y-3 ${
                platform === "android"
                  ? "bg-sx-subtle border-sx-green-border"
                  : "bg-sx-canvas border-sx-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-sx-ink">
                  Android Install (Samsung, Tecno, Infinix, Redmi)
                </h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sx-green-tint text-sx-green-text">
                  30 Secs
                </span>
              </div>
              <ol className="space-y-2 text-xs text-sx-ink-soft">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sx-stone border border-sx-border font-mono font-bold text-[11px] flex items-center justify-center shrink-0 text-sx-ink">
                    1
                  </span>
                  <span>
                    Tap <strong>Download Android APK (1.6 MB)</strong> above (or{" "}
                    <strong>1-Tap Instant Install</strong> if shown).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sx-stone border border-sx-border font-mono font-bold text-[11px] flex items-center justify-center shrink-0 text-sx-ink">
                    2
                  </span>
                  <span>
                    Open the downloaded <strong>eFootball-Market.apk</strong> file and tap{" "}
                    <strong>Install</strong> (allow browser install if prompted once).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sx-stone border border-sx-border font-mono font-bold text-[11px] flex items-center justify-center shrink-0 text-sx-ink">
                    3
                  </span>
                  <span>
                    Open <strong>eFootball Market</strong> from your home screen and tap{" "}
                    <strong>Allow Notifications</strong> for instant buyer/seller alerts!
                  </span>
                </li>
              </ol>
            </div>

            {/* iPhone / iOS Instructions */}
            <div
              className={`p-5 rounded-2xl border space-y-3 ${
                platform === "ios"
                  ? "bg-sx-subtle border-sx-green-border"
                  : "bg-sx-canvas border-sx-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-sx-ink">
                  iPhone &amp; iPad Install (iOS Safari)
                </h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sx-stone text-sx-ink">
                  iOS Web App
                </span>
              </div>
              <ol className="space-y-2 text-xs text-sx-ink-soft">
                <li className="flex items-start gap-2">
                  <Share className="w-4 h-4 text-sx-green-text shrink-0 mt-0.5" />
                  <span>
                    Open this page in <strong>Safari</strong> and tap the{" "}
                    <strong>Share</strong> icon at the bottom of your screen.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <PlusSquare className="w-4 h-4 text-sx-green-text shrink-0 mt-0.5" />
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong> &rarr;{" "}
                    <strong>Add</strong> to install <strong>eFootball Market</strong> full-screen.
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* App Capabilities Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-sx-canvas border border-sx-border space-y-2">
          <div className="w-9 h-9 rounded-xl bg-sx-green-tint text-sx-green-text flex items-center justify-center">
            <BellRing className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-sx-ink">Instant Availability &amp; Offer Pings</h3>
          <p className="text-xs text-sx-muted leading-relaxed">
            Receive real-time phone notifications the moment a buyer checks squad availability,
            submits an offer, or funds escrow.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-sx-canvas border border-sx-border space-y-2">
          <div className="w-9 h-9 rounded-xl bg-sx-green-tint text-sx-green-text flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-sx-ink">Private Konami ID Escrow Vault</h3>
          <p className="text-xs text-sx-muted leading-relaxed">
            Pay via Safaricom M-Pesa Till 1572931, inspect your squad for 24 hours, and copy 2FA
            handover codes inside a distraction-free full-screen app.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-sx-canvas border border-sx-border space-y-2">
          <div className="w-9 h-9 rounded-xl bg-sx-green-tint text-sx-green-text flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-sx-ink">Data-Saver 1.6 MB Package</h3>
          <p className="text-xs text-sx-muted leading-relaxed">
            Uses 95% less storage than heavy store apps and updates automatically whenever new
            Friday Drops or tournaments go live.
          </p>
        </div>
      </div>
    </div>
  );
}
