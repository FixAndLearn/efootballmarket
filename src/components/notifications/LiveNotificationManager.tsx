"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BellRing, CheckCircle2, ChevronRight, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import {
  BrowserNotifPermission,
  ensureNotificationServiceWorker,
  getBrowserNotificationPermission,
  getWatchedOffers,
  getWatchedPings,
  isBrowserNotificationSupported,
  requestBrowserNotificationPermission,
  showNativeBrowserNotification,
  updateWatchedOfferStatus,
  updateWatchedPingStatus,
} from "@/lib/notifications/browserPush";

interface PopupToastItem {
  id: string;
  title: string;
  message: string;
  actionUrl: string;
}

const SEEN_IDS_KEY = "efm_seen_notif_ids_v1";
const PROMPT_SNOOZE_KEY = "efm_notif_prompt_snooze_until";

function loadSeenIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_IDS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function persistSeenIds(set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    const arr = Array.from(set).slice(-80);
    localStorage.setItem(SEEN_IDS_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

export function LiveNotificationManager() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const { user } = useAuth();

  const [permission, setPermission] = useState<BrowserNotifPermission>("default");
  const [showOptInPrompt, setShowOptInPrompt] = useState(false);
  const [activeToast, setActiveToast] = useState<PopupToastItem | null>(null);
  const initializedBaselineRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerPopup = useCallback((item: PopupToastItem) => {
    const safeUrl =
      typeof item.actionUrl === "string" &&
      item.actionUrl.startsWith("/") &&
      !item.actionUrl.startsWith("//") &&
      !item.actionUrl.includes("\\")
        ? item.actionUrl
        : "/notifications";
    const safeItem: PopupToastItem = { ...item, actionUrl: safeUrl };
    setActiveToast(safeItem);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setActiveToast(null);
    }, 9000);

    showNativeBrowserNotification({
      title: safeItem.title,
      body: safeItem.message,
      url: safeItem.actionUrl,
      tag: `efm-notif-${safeItem.id}`,
    }).catch(() => {});
  }, []);

  // Register PWA Service Worker + route standalone installed app launches at "/" straight into "/mobile"
  useEffect(() => {
    ensureNotificationServiceWorker().catch(() => {});

    if (typeof window !== "undefined" && window.location.pathname === "/") {
      const isStandaloneApp =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      if (isStandaloneApp) {
        router.replace("/mobile");
      }
    }

    if (!isBrowserNotificationSupported()) {
      setPermission("unsupported");
      return;
    }

    const syncPerm = () => {
      const p = getBrowserNotificationPermission();
      setPermission(p);
      if (p === "granted") {
        setShowOptInPrompt(false);
      }
    };

    syncPerm();
    window.addEventListener("efm-notif-permission-changed", syncPerm);
    return () =>
      window.removeEventListener("efm-notif-permission-changed", syncPerm);
  }, [router]);

  // Decide when to show the polite opt-in banner (seller/buyer hubs, orders, create-listing, or watched bargain)
  useEffect(() => {
    if (!isBrowserNotificationSupported()) return;
    if (getBrowserNotificationPermission() !== "default") {
      setShowOptInPrompt(false);
      return;
    }

    const snoozedUntil = Number(localStorage.getItem(PROMPT_SNOOZE_KEY) || 0);
    if (snoozedUntil > Date.now()) {
      setShowOptInPrompt(false);
      return;
    }

    const isRelevantPage =
      pathname.startsWith("/dashboard/") ||
      pathname.startsWith("/orders/") ||
      pathname.startsWith("/seller/create-listing") ||
      pathname === "/notifications";

    const hasWatchedBargain = getWatchedOffers().some(
      (o) => o.lastStatus === "pending"
    );

    if ((user && isRelevantPage) || hasWatchedBargain) {
      setShowOptInPrompt(true);
    } else {
      setShowOptInPrompt(false);
    }
  }, [pathname, user, permission]);

  // Poll + Realtime listener for authenticated user notifications
  const checkNewNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      const items: any[] = data.notifications || [];
      if (items.length === 0) {
        initializedBaselineRef.current = true;
        return;
      }

      const seen = loadSeenIds();

      // First load in a fresh browser: seed existing IDs so old history doesn't spam pop-ups
      if (!initializedBaselineRef.current && seen.size === 0) {
        items.forEach((n) => seen.add(String(n.id)));
        persistSeenIds(seen);
        initializedBaselineRef.current = true;
        return;
      }

      initializedBaselineRef.current = true;

      const freshUnread = items.filter(
        (n) => !n.is_read && !seen.has(String(n.id))
      );

      if (freshUnread.length > 0) {
        freshUnread.forEach((n) => seen.add(String(n.id)));
        persistSeenIds(seen);

        const newest = freshUnread[0];
        triggerPopup({
          id: String(newest.id),
          title: newest.title || "New eFootballMarket Alert",
          message: newest.message || "Tap to view your updated order or offer.",
          actionUrl: newest.action_url || "/notifications",
        });
      }
    } catch {
      // non-blocking
    }
  }, [user, triggerPopup]);

  // Also watch any guest buyer bargain offers stored locally
  const checkWatchedGuestOffers = useCallback(async () => {
    const watched = getWatchedOffers().filter((o) => o.lastStatus === "pending");
    if (watched.length === 0) return;

    for (const entry of watched.slice(0, 4)) {
      try {
        const res = await fetch(`/api/offers?offerId=${encodeURIComponent(entry.id)}`);
        if (!res.ok) continue;
        const data = await res.json();
        const offer = data.offer;
        if (!offer || !offer.status || offer.status === "pending") continue;

        updateWatchedOfferStatus(entry.id, offer.status);

        if (offer.status === "accepted") {
          triggerPopup({
            id: `offer-acc-${entry.id}`,
            title: "Seller Accepted Your Bargain!",
            message: `Your offer of KES ${Number(offer.offered_price || 0).toLocaleString()} was accepted. Tap to lock via Till 1572931.`,
            actionUrl: `/pay/${entry.listingId}?offer=${entry.id}`,
          });
        } else if (offer.status === "countered") {
          triggerPopup({
            id: `offer-cnt-${entry.id}`,
            title: `Seller Counter-Offered KES ${Number(offer.counter_price || 0).toLocaleString()}`,
            message: "Tap to review the seller's counter-offer on this squad.",
            actionUrl: `/listings/${entry.listingId}`,
          });
        } else if (offer.status === "declined") {
          triggerPopup({
            id: `offer-dec-${entry.id}`,
            title: "Update on Your Squad Offer",
            message: "The seller declined that price. Tap to submit a revised offer.",
            actionUrl: `/listings/${entry.listingId}`,
          });
        }
      } catch {
        // non-blocking
      }
    }
  }, [triggerPopup]);

  // Also watch any buyer availability pings so buyer's phone pops up the instant seller confirms
  const checkWatchedAvailabilityPings = useCallback(async () => {
    const watched = getWatchedPings().filter((p) => p.lastStatus === "pending");
    if (watched.length === 0) return;

    for (const entry of watched.slice(0, 4)) {
      try {
        const res = await fetch(`/api/listings/availability?pingId=${encodeURIComponent(entry.id)}`);
        if (!res.ok) continue;
        const data = await res.json();
        const ping = data.ping;
        if (!ping || !ping.status || ping.status === "pending") continue;

        updateWatchedPingStatus(entry.id, ping.status);

        if (ping.status === "available") {
          triggerPopup({
            id: `ping-avail-${entry.id}`,
            title: "Seller Confirmed: Squad is Available!",
            message: `${entry.listingTitle} is ready for handover. Tap to pay securely via M-Pesa Till 1572931 Escrow.`,
            actionUrl: `/pay/${entry.listingId}`,
          });
        } else if (ping.status === "unavailable") {
          triggerPopup({
            id: `ping-unavail-${entry.id}`,
            title: "Squad No Longer Available",
            message: `${entry.listingTitle} was marked unavailable by the seller. Tap to browse other verified squads.`,
            actionUrl: `/browse`,
          });
        }
      } catch {
        // non-blocking
      }
    }
  }, [triggerPopup]);

  useEffect(() => {
    checkNewNotifications();
    checkWatchedGuestOffers();
    checkWatchedAvailabilityPings();

    let channel: any = null;
    let supabase: any = null;

    if (user) {
      try {
        supabase = createClient();
        channel = supabase
          .channel(`live-popup-${user.id.slice(0, 8)}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
            },
            () => {
              checkNewNotifications();
            }
          )
          .subscribe();
      } catch {
        // fallback to interval below
      }
    }

    const interval = setInterval(() => {
      checkNewNotifications();
      checkWatchedGuestOffers();
      checkWatchedAvailabilityPings();
    }, 10000);

    return () => {
      clearInterval(interval);
      if (channel && supabase) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [user, checkNewNotifications, checkWatchedGuestOffers, checkWatchedAvailabilityPings]);

  const handleEnableAlerts = async () => {
    const res = await requestBrowserNotificationPermission();
    setPermission(res);
    setShowOptInPrompt(false);
  };

  const handleSnoozePrompt = () => {
    // Snooze for 3 days if user taps "Later"
    localStorage.setItem(
      PROMPT_SNOOZE_KEY,
      String(Date.now() + 3 * 24 * 60 * 60 * 1000)
    );
    setShowOptInPrompt(false);
  };

  return (
    <>
      {/* 1. Live Pop-Up Toast (slides down top-right on any new bargain / payment / delivery) */}
      {activeToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-3 left-3 sm:left-auto sm:right-5 sm:w-[360px] z-50 rounded-2xl bg-sx-canvas border-2 border-sx-green shadow-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-3"
        >
          <div className="w-9 h-9 rounded-xl bg-sx-green-tint border border-sx-green-border text-sx-green-text flex items-center justify-center shrink-0 mt-0.5">
            <BellRing className="w-4 h-4 animate-bounce" />
          </div>

          <div
            onClick={() => {
              const url = activeToast.actionUrl;
              setActiveToast(null);
              router.push(url);
            }}
            className="flex-1 min-w-0 cursor-pointer space-y-1"
          >
            <p className="text-xs font-extrabold text-sx-ink leading-snug">
              {activeToast.title}
            </p>
            <p className="text-[11px] text-sx-muted line-clamp-2 leading-relaxed">
              {activeToast.message}
            </p>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-sx-green-text pt-0.5">
              <span>Open now</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveToast(null)}
            className="p-1 text-sx-muted hover:text-sx-ink shrink-0 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Polite Browser/Phone Notification Opt-In Prompt */}
      {showOptInPrompt && !activeToast && (
        <div className="fixed bottom-20 md:bottom-5 left-3 right-3 sm:right-auto sm:left-5 sm:w-[360px] z-40 rounded-2xl bg-sx-canvas border border-sx-border-strong shadow-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sx-green-tint border border-sx-green-border text-sx-green-text flex items-center justify-center shrink-0 mt-0.5">
                <BellRing className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-sx-ink">
                  Allow Instant Bargain &amp; Payment Alerts?
                </p>
                <p className="text-[11px] text-sx-muted leading-relaxed">
                  Get a phone or browser pop-up the moment a buyer pays Till 1572931, sends a bargain offer, or delivers logins.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSnoozePrompt}
              className="p-1 text-sx-muted hover:text-sx-ink shrink-0 cursor-pointer"
              aria-label="Close alert prompt"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEnableAlerts}
              className="flex-1 py-2 px-3 rounded-xl bg-sx-green hover:bg-sx-green-hover text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Allow Pop-Up Alerts</span>
            </button>
            <button
              type="button"
              onClick={handleSnoozePrompt}
              className="py-2 px-3 rounded-xl bg-sx-stone border border-sx-border text-xs font-semibold text-sx-muted hover:text-sx-ink transition-colors cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>
      )}
    </>
  );
}
