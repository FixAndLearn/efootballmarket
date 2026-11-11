"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HelpCircle,
  X,
  MessageCircle,
  ShieldCheck,
  Search,
  Scale,
  Handshake,
  Target,
  ExternalLink,
} from "lucide-react";
import { isStandaloneDocPath } from "@/components/legal/StandaloneDocLayout";

const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "254794400365";

export function SupportHubWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Hide floating help pill inside Order Rooms, Auth forms & Standalone Policy pages
  if (
    isStandaloneDocPath(pathname) ||
    pathname?.startsWith("/orders/") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/reset-password")
  ) {
    return null;
  }

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hello Brian / eFootballMarket Support, I need help with a squad listing, Middleman deal, or escrow order."
  )}`;

  const isListingDetail = pathname?.startsWith("/listings/");

  return (
    <div className={`fixed bottom-20 md:bottom-5 right-4 z-40 ${isListingDetail ? "hidden lg:block" : ""}`}>
      {open && (
        <div
          role="dialog"
          aria-label="Services and Support Desk"
          className="mb-3 w-[310px] sm:w-[340px] rounded-2xl bg-sx-canvas border border-sx-border shadow-xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3.5 bg-sx-stone border-b border-sx-border">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sx-green-text shrink-0" />
              <div>
                <p className="text-sm font-bold text-sx-ink leading-tight">
                  Services &amp; Escrow Desk
                </p>
                <p className="text-[11px] text-sx-muted">
                  Nairobi Team · M-Pesa Till 1572931
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close support menu"
              className="p-1.5 rounded-md text-sx-muted hover:text-sx-ink hover:bg-sx-elevated transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 space-y-1">
            <Link
              href="/middleman"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-sx-stone transition-colors group"
            >
              <span className="flex items-center gap-2.5 text-xs font-semibold text-sx-ink">
                <Handshake className="w-4 h-4 text-sx-green-text shrink-0" />
                WhatsApp / Social Middleman
              </span>
              <span className="text-[11px] text-sx-muted group-hover:text-sx-ink">
                Open &rarr;
              </span>
            </Link>

            <Link
              href="/wanted"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-sx-stone transition-colors group"
            >
              <span className="flex items-center gap-2.5 text-xs font-semibold text-sx-ink">
                <Target className="w-4 h-4 text-sx-green-text shrink-0" />
                Request Custom Squad Sourcing
              </span>
              <span className="text-[11px] text-sx-muted group-hover:text-sx-ink">
                Post &rarr;
              </span>
            </Link>

            <Link
              href="/scammer-check"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-sx-stone transition-colors group"
            >
              <span className="flex items-center gap-2.5 text-xs font-semibold text-sx-ink">
                <Search className="w-4 h-4 text-sx-amber-text shrink-0" />
                Check a Trader Phone Number
              </span>
              <span className="text-[11px] text-sx-muted group-hover:text-sx-ink">
                Search &rarr;
              </span>
            </Link>

            <Link
              href="/escrow-guarantee"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-sx-stone transition-colors group"
            >
              <span className="flex items-center gap-2.5 text-xs font-semibold text-sx-ink">
                <Scale className="w-4 h-4 text-sx-muted shrink-0" />
                Escrow &amp; Fee Rules
              </span>
              <span className="text-[11px] text-sx-muted group-hover:text-sx-ink">
                Read &nearr;
              </span>
            </Link>
          </div>

          <div className="p-3 pt-2 border-t border-sx-border bg-sx-subtle">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sx-green hover:bg-sx-green-hover text-white text-xs font-bold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Chat With Nairobi Desk (WhatsApp)
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
            <p className="mt-2 text-[11px] text-center text-sx-muted">
              Email: support@efootballmarket.co.ke
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close Services and Help Desk" : "Open Services and Help Desk"}
        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-sx-contrast hover:bg-sx-contrast-hover text-sx-contrast-fg text-xs font-bold shadow-lg border border-sx-border transition-colors"
      >
        {open ? (
          <>
            <X className="w-4 h-4" />
            <span>Close</span>
          </>
        ) : (
          <>
            <HelpCircle className="w-4 h-4" />
            <span>Services &amp; Help</span>
          </>
        )}
      </button>
    </div>
  );
}
