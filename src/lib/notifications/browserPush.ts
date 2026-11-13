"use client";

export type BrowserNotifPermission =
  | "granted"
  | "denied"
  | "default"
  | "unsupported";

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationPermission(): BrowserNotifPermission {
  if (!isBrowserNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function ensureNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return reg;
  } catch {
    return null;
  }
}

export async function showNativeBrowserNotification(opts: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}): Promise<boolean> {
  if (!isBrowserNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }

  const targetUrl = opts.url || "/notifications";

  // Prefer ServiceWorkerRegistration.showNotification (required on Android Chrome)
  try {
    const reg =
      (await ensureNotificationServiceWorker()) ||
      (await navigator.serviceWorker?.ready);
    if (reg && typeof reg.showNotification === "function") {
      await reg.showNotification(opts.title, {
        body: opts.body,
        icon: "/icon-192.png",
        badge: "/icon-96.png",
        tag: opts.tag || `efm-${Date.now()}`,
        data: { url: targetUrl },
      });
      return true;
    }
  } catch {
    // Fall back to standard Notification constructor on desktop browsers
  }

  try {
    const n = new Notification(opts.title, {
      body: opts.body,
      icon: "/icon-192.png",
      tag: opts.tag || `efm-${Date.now()}`,
    });
    n.onclick = () => {
      window.focus();
      window.location.href = targetUrl;
      n.close();
    };
    return true;
  } catch {
    return false;
  }
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotifPermission> {
  if (!isBrowserNotificationSupported()) return "unsupported";

  await ensureNotificationServiceWorker();

  try {
    const result = await Notification.requestPermission();
    if (result === "granted") {
      await showNativeBrowserNotification({
        title: "eFootballMarket Alerts Active",
        body: "We'll pop an alert as soon as a buyer pays, bargains, or replies to your order.",
        url: "/notifications",
        tag: "efm-welcome-optin",
      });
      window.dispatchEvent(new CustomEvent("efm-notif-permission-changed"));
    }
    return result;
  } catch {
    return getBrowserNotificationPermission();
  }
}

const WATCHED_OFFERS_KEY = "efm_watched_offers_v1";

export interface WatchedOfferEntry {
  id: string;
  listingId: string;
  lastStatus: string;
}

export function rememberWatchedOffer(offerId: string, listingId: string) {
  if (typeof window === "undefined" || !offerId) return;
  try {
    const raw = localStorage.getItem(WATCHED_OFFERS_KEY);
    const list: WatchedOfferEntry[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((x) => x.id !== offerId).slice(0, 14);
    filtered.unshift({ id: offerId, listingId, lastStatus: "pending" });
    localStorage.setItem(WATCHED_OFFERS_KEY, JSON.stringify(filtered));
  } catch {
    // ignore storage quota errors
  }
}

export function getWatchedOffers(): WatchedOfferEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHED_OFFERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function updateWatchedOfferStatus(offerId: string, status: string) {
  if (typeof window === "undefined") return;
  try {
    const list = getWatchedOffers().map((item) =>
      item.id === offerId ? { ...item, lastStatus: status } : item
    );
    localStorage.setItem(WATCHED_OFFERS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

const WATCHED_PINGS_KEY = "efm_watched_pings_v1";

export interface WatchedPingEntry {
  id: string;
  listingId: string;
  listingTitle: string;
  lastStatus: string;
}

export function rememberWatchedPing(pingId: string, listingId: string, listingTitle = "Squad") {
  if (typeof window === "undefined" || !pingId) return;
  try {
    const raw = localStorage.getItem(WATCHED_PINGS_KEY);
    const list: WatchedPingEntry[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((x) => x.id !== pingId).slice(0, 14);
    filtered.unshift({ id: pingId, listingId, listingTitle, lastStatus: "pending" });
    localStorage.setItem(WATCHED_PINGS_KEY, JSON.stringify(filtered));
  } catch {
    // ignore storage quota errors
  }
}

export function getWatchedPings(): WatchedPingEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHED_PINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function updateWatchedPingStatus(pingId: string, status: string) {
  if (typeof window === "undefined") return;
  try {
    const list = getWatchedPings().map((item) =>
      item.id === pingId ? { ...item, lastStatus: status } : item
    );
    localStorage.setItem(WATCHED_PINGS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}
