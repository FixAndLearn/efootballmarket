"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, CheckCircle2, Loader2, XCircle, Smartphone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { sanitizePublicUsername } from "@/lib/security/publicSanitizer";
import {
  getBrowserNotificationPermission,
  rememberWatchedPing,
  requestBrowserNotificationPermission,
} from "@/lib/notifications/browserPush";

export interface ChatSellerWhatsAppButtonProps {
  sellerPhone?: string | null;
  sellerUsername?: string | null;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingCurrency?: string;
  overallTeamStrength?: number | null;
  variant?: "primary" | "secondary" | "compact" | "icon";
  className?: string;
  label?: string;
}

/**
 * 1-Tap Direct Phone Availability Check Button
 * Replaces off-platform WhatsApp redirects under listed squads:
 * - Buyer taps -> Seller immediately receives direct phone notifications (SMS + Phone Push + Email).
 * - Seller taps "Yes, Available" in Seller Hub -> Buyer receives an instant phone/browser/SMS alert.
 */
export function ChatSellerWhatsAppButton({
  sellerUsername,
  listingId,
  listingTitle,
  variant = "primary",
  className = "",
  label,
}: ChatSellerWhatsAppButtonProps) {
  const { user, profile } = useAuth();

  const [recentConfirmedAt, setRecentConfirmedAt] = useState<string | null>(null);
  const [showGuestInput, setShowGuestInput] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pingId, setPingId] = useState<string | null>(null);
  const [pingState, setPingState] = useState<"idle" | "sent" | "available" | "unavailable">("idle");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const safeHandle = sellerUsername
    ? `@${sanitizePublicUsername(sellerUsername)}`
    : "Seller";

  // Check if seller already confirmed availability within the last 6 hours
  useEffect(() => {
    let mounted = true;
    fetch(`/api/listings/availability?listingId=${encodeURIComponent(listingId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (mounted && data?.recentAvailableAt) {
          setRecentConfirmedAt(data.recentAvailableAt);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [listingId]);

  // Live-poll active ping while buyer is viewing the page
  useEffect(() => {
    if (!pingId || pingState !== "sent") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/listings/availability?pingId=${encodeURIComponent(pingId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.ping?.status === "available") {
          setPingState("available");
          clearInterval(interval);
        } else if (data?.ping?.status === "unavailable") {
          setPingState("unavailable");
          clearInterval(interval);
        }
      } catch {
        // non-blocking
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [pingId, pingState]);

  const sendPing = async (explicitPhone?: string) => {
    setSending(true);
    setFeedbackMsg("");
    try {
      // Request phone/browser push permission silently on user gesture if still default
      if (getBrowserNotificationPermission() === "default") {
        requestBrowserNotificationPermission().catch(() => {});
      }

      const res = await fetch("/api/listings/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          buyerPhone: explicitPhone ?? profile?.phone_number ?? undefined,
          buyerName: profile?.username || user?.email?.split("@")[0] || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedbackMsg(data.error || "Could not notify seller right now.");
        return;
      }

      if (data.ping?.id) {
        setPingId(data.ping.id);
        rememberWatchedPing(data.ping.id, listingId, listingTitle);
      }
      setShowGuestInput(false);
      setPingState("sent");
      setFeedbackMsg(
        data.message ||
          `${safeHandle} has been notified on their phone! We'll alert you as soon as they confirm.`
      );
    } catch {
      setFeedbackMsg("Network error. Please tap again.");
    } finally {
      setSending(false);
    }
  };

  const handleTap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (sending || pingState === "sent") return;

    // Signed-in user with phone on profile -> true 1-tap instant seller phone alert!
    if (user && profile?.phone_number) {
      sendPing(profile.phone_number);
      return;
    }

    // Guest or user without saved phone -> show compact 1-line phone box (or 1-tap browser-only ping)
    setShowGuestInput((prev) => !prev);
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleTap}
        disabled={sending || pingState === "sent"}
        title={
          pingState === "sent"
            ? "Seller notified on phone"
            : `Ping ${safeHandle} to check availability`
        }
        className={`w-8 h-8 rounded-full bg-sx-green-tint border border-sx-green-border text-sx-green-text flex items-center justify-center transition-all shrink-0 cursor-pointer ${className}`}
      >
        {sending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : pingState === "sent" || pingState === "available" ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <BellRing className="w-4 h-4" />
        )}
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleTap}
        disabled={sending || pingState === "sent"}
        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-sx-subtle border border-sx-border-strong text-sx-ink font-bold text-xs transition-colors shrink-0 whitespace-nowrap cursor-pointer ${className}`}
      >
        {sending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-sx-green-text shrink-0" />
        ) : pingState === "sent" ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-sx-green-text shrink-0" />
        ) : (
          <BellRing className="w-3.5 h-3.5 text-sx-green-text shrink-0" />
        )}
        <span>{pingState === "sent" ? "Seller Pinged" : label || "Is It Available?"}</span>
      </button>
    );
  }

  if (pingState === "available") {
    return (
      <div className="p-3.5 rounded-xl bg-sx-green-tint border border-sx-green-border space-y-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-sx-green-text">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{safeHandle} Confirmed: Squad is Available Now!</span>
        </div>
        <Link
          href={`/pay/${listingId}`}
          className="w-full py-2 px-3 rounded-lg bg-sx-green text-white font-bold text-xs inline-flex items-center justify-center"
        >
          Lock via M-Pesa Till 1572931 Escrow &rarr;
        </Link>
      </div>
    );
  }

  if (pingState === "unavailable") {
    return (
      <div className="p-3 rounded-xl bg-sx-red-tint border border-sx-red-border flex items-center gap-2 text-xs font-semibold text-sx-red-text">
        <XCircle className="w-4 h-4 shrink-0" />
        <span>Seller marked this squad as no longer available.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
      {recentConfirmedAt && pingState === "idle" && (
        <div className="px-3 py-1.5 rounded-lg bg-sx-green-tint border border-sx-green-border text-[11px] font-semibold text-sx-green-text flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Seller confirmed this account available recently</span>
        </div>
      )}

      {pingState === "sent" ? (
        <div className="p-3 rounded-xl bg-sx-green-tint border border-sx-green-border text-xs text-sx-ink space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-sx-green-text">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{safeHandle} Notified on Phone!</span>
          </div>
          <p className="text-[11px] text-sx-ink-soft leading-relaxed">
            {feedbackMsg ||
              "We sent a direct alert to the seller's phone. You'll get an instant notification the moment they tap Available."}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleTap}
          disabled={sending}
          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sx-subtle hover:bg-sx-stone border border-sx-border-strong text-sx-ink font-semibold text-xs transition-colors cursor-pointer ${className}`}
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-sx-green-text shrink-0" />
              <span>Alerting {safeHandle}&apos;s Phone...</span>
            </>
          ) : (
            <>
              <BellRing className="w-4 h-4 text-sx-green-text shrink-0" />
              <span>{label || `Check if Account is Available (Ping ${safeHandle})`}</span>
            </>
          )}
        </button>
      )}

      {showGuestInput && pingState === "idle" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendPing(phoneInput.trim() || undefined);
          }}
          className="p-3 rounded-xl bg-sx-canvas border border-sx-border space-y-2"
        >
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-sx-ink">
            <Smartphone className="w-3.5 h-3.5 text-sx-green-text shrink-0" />
            <span>Your phone for instant SMS reply (optional):</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="0712 345 678"
              className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-sx-stone border border-sx-border text-xs font-mono text-sx-ink focus:outline-none focus:border-sx-green"
            />
            <button
              type="submit"
              disabled={sending}
              className="px-3.5 py-2 rounded-lg bg-sx-green text-white font-bold text-xs shrink-0 cursor-pointer hover:opacity-95 disabled:opacity-60"
            >
              {sending ? "Sending..." : "Notify Seller"}
            </button>
          </div>
          {feedbackMsg && (
            <p className="text-[11px] text-sx-red-text font-medium">{feedbackMsg}</p>
          )}
        </form>
      )}
    </div>
  );
}
