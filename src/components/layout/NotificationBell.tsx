"use client";

import { Notification } from "@/types/database";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  Coins,
  ExternalLink,
  Handshake,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Trophy,
  MessageSquare,
  AlertTriangle,
  Newspaper,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BrowserNotifPermission,
  getBrowserNotificationPermission,
  isBrowserNotificationSupported,
  requestBrowserNotificationPermission,
} from "@/lib/notifications/browserPush";

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  } catch {
    return "Recently";
  }
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "scammer_alert":
      return <AlertTriangle className="w-4 h-4 text-sx-red-text" />;
    case "news_broadcast":
    case "news_alert":
      return <Newspaper className="w-4 h-4 text-sx-amber-text" />;
    case "funds_released":
    case "escrow_welcome":
    case "escrow":
      return <ShieldCheck className="w-4 h-4 text-sx-green-text" />;
    case "order":
    case "order_status":
      return <ShoppingCart className="w-4 h-4 text-sx-info-text" />;
    case "seller_verification":
      return <Trophy className="w-4 h-4 text-sx-amber-text" />;
    case "mpesa_payment":
    case "payment_received":
      return <Coins className="w-4 h-4 text-sx-green-text" />;
    case "new_offer":
    case "offer_response":
      return <Handshake className="w-4 h-4 text-sx-amber-text" />;
    case "new_message":
    case "message":
      return <MessageSquare className="w-4 h-4 text-sky-400" />;
    default:
      return <Sparkles className="w-4 h-4 text-sx-green-text" />;
  }
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [browserPerm, setBrowserPerm] = useState<BrowserNotifPermission>("default");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isBrowserNotificationSupported()) {
      setBrowserPerm("unsupported");
      return;
    }
    const sync = () => setBrowserPerm(getBrowserNotificationPermission());
    sync();
    window.addEventListener("efm-notif-permission-changed", sync);
    return () => window.removeEventListener("efm-notif-permission-changed", sync);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    let channel: any = null;
    let supabase: any = null;

    try {
      supabase = createClient();
      channel = supabase
        .channel(`notifications-live-${Math.random().toString(36).slice(2, 7)}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();
    } catch (e) {
      console.warn("Realtime notifications note:", e);
    }

    // Auto-refresh fallback every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);

    return () => {
      clearInterval(interval);
      if (channel && supabase) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (item: Notification) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Persist read status in Supabase so it does NOT pop up as new again
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      }).catch(console.warn);

      setIsOpen(false);

      if (item.action_url) {
        let dest = item.action_url;
        if (dest.startsWith("/seller/orders/")) {
          dest = dest.replace("/seller/orders/", "/orders/");
        } else if (dest === "/seller/orders" || dest === "/seller") {
          dest = "/dashboard/seller";
        }
        router.push(dest);
      } else {
        router.push(`/notifications?id=${item.id}`);
      }
    } catch (err) {
      console.warn("Failed to process notification click:", err);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
    } catch (err) {
      console.warn("Failed to mark all as read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const previewList = notifications.slice(0, 5);

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-8 h-8 sm:w-9 sm:h-9 inline-flex items-center justify-center rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border hover:border-sx-border-strong text-sx-ink-soft hover:text-sx-ink transition-colors relative"
        aria-label="Notifications"
        title="View Notifications"
      >
        <Bell className="w-4 h-4" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-sx-green hover:bg-sx-green-hover text-white font-extrabold text-[9.5px] ring-2 ring-sx-canvas animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="fixed sm:absolute right-3 left-3 sm:left-auto sm:right-0 top-14 sm:top-auto sm:mt-2 sm:w-96 rounded-2xl bg-pitch-surface border border-pitch-border shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="p-3.5 border-b border-pitch-border/80 flex items-center justify-between bg-pitch-card/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sx-ink uppercase tracking-wider font-display">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-sx-amber-tint border border-sx-amber-border text-sx-amber-text text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="text-[11px] font-medium text-sx-amber-text hover:text-sx-amber-text flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* 1-Tap Browser / Phone Pop-Up Alert Opt-In Strip */}
          {browserPerm === "default" && (
            <div className="px-3.5 py-2.5 bg-sx-green-tint border-b border-sx-green-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <BellRing className="w-3.5 h-3.5 text-sx-green-text shrink-0" />
                <span className="text-[11px] font-medium text-sx-ink leading-snug">
                  Pop-up alerts when buyers pay or bargain?
                </span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const res = await requestBrowserNotificationPermission();
                  setBrowserPerm(res);
                }}
                className="px-2.5 py-1 rounded-lg bg-sx-green hover:bg-sx-green-hover text-white text-[11px] font-bold shrink-0 cursor-pointer"
              >
                Allow
              </button>
            </div>
          )}
          {browserPerm === "granted" && (
            <div className="px-3.5 py-1.5 bg-sx-stone/60 border-b border-pitch-border/50 flex items-center gap-1.5 text-[10px] text-sx-green-text font-semibold">
              <Check className="w-3 h-3" />
              <span>Instant phone &amp; browser pop-up alerts enabled</span>
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-pitch-border/40">
            {previewList.length > 0 ? (
              previewList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 hover:bg-pitch-card transition-colors cursor-pointer flex items-start gap-3 ${
                    !item.is_read ? "bg-amber-500/[0.04]" : ""
                  }`}
                >
                  {/* Category Icon */}
                  <div className="w-8 h-8 rounded-xl bg-pitch-surface border border-pitch-border flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-sx-ink truncate">
                        {item.title}
                      </p>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 ring-4 ring-amber-400/20" />
                      )}
                    </div>

                    <p className="text-[11px] text-sx-muted line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex items-center gap-1 text-[10px] text-sx-muted pt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-pitch-card border border-pitch-border flex items-center justify-center text-sx-muted mx-auto">
                  <Bell className="w-5 h-5 stroke-[1.5]" />
                </div>
                <p className="text-xs font-semibold text-sx-ink-soft">No notifications yet</p>
                <p className="text-[11px] text-sx-muted">
                  You&apos;ll be notified about escrow releases, order deliveries, and squad inquiries here.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-pitch-border/80 bg-pitch-card/60 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-sx-green-text hover:text-sx-green-text transition-colors w-full py-1"
            >
              <span>View All Notifications Center</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
