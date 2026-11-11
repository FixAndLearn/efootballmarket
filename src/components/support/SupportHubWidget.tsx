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
  FileText,
  ExternalLink,
} from "lucide-react";

const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "254794400365";

export function SupportHubWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Hide floating help pill inside Order Rooms & Dedicated Order Chat so it never blocks send buttons
  if (pathname?.startsWith("/orders/")) {
    return null;
  }

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hello eFootballMarket Support, I need help with an account listing or escrow order."
  )}`;

  return (
    <div className="fixed bottom-20 md:bottom-5 right-4 z-40">
      {open && (
        <div
          role="dialog"
          aria-label="Help and Support Desk"
          className="mb-3 w-[310px] sm:w-[340px] rounded-xl bg-sx-canvas border border-sx-border shadow-xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3.5 bg-sx-stone border-b border-sx-border">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sx-green-text shrink-0" />
              <div>
                <p className="text-sm font-bold text-sx-ink leading-tight">
                  Support &amp; Escrow Desk
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

          <div className="p-3 space-y-1.5">
            <Link
              href="/escrow-guarantee"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-sx-stone transition-colors group"
            >
              <span className="flex items-center gap-2.5 text-xs font-semibold text-sx-ink">
                <ShieldCheck className="w-4 h-4 text-sx-green-text shrink-0" />
                How M-Pesa Escrow Works
              </span>
              <span className="text-[11px] text-sx-muted group-hover:text-sx-ink">
                Read &rarr;
              </span>
            </Link>

            <Link
              href="/middleman"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-sx-stone transition-colors group"
            >
              <span className="flex items-center gap-2.5 text-xs font-semibold text-sx-ink">
                <FileText className="w-4 h-4 text-sx-green-text shrink-0" />
                Protect an Off-Platform Deal
              </span>
              <span className="text-[11px] text-sx-muted group-hover:text-sx-ink">
                Open &rarr;
              </span>
            </Link>

            <Link
              href="/scammer-check"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-sx-stone transition-colors group"
            >
              <span className="flex items-center gap-2.5 text-xs font-semibold text-sx-ink">
                <Search className="w-4 h-4 text-sx-amber-text shrink-0" />
                Check a Phone Number / Handle
              </span>
              <span className="text-[11px] text-sx-muted group-hover:text-sx-ink">
                Search &rarr;
              </span>
            </Link>

            <Link
              href="/dispute-policy"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-sx-stone transition-colors group"
            >
              <span className="flex items-center gap-2.5 text-xs font-semibold text-sx-ink">
                <Scale className="w-4 h-4 text-sx-muted shrink-0" />
                Refund &amp; Dispute Rules
              </span>
              <span className="text-[11px] text-sx-muted group-hover:text-sx-ink">
                Policy &rarr;
              </span>
            </Link>
          </div>

          <div className="p-3 pt-2 border-t border-sx-border bg-sx-subtle">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-sx-green hover:bg-sx-green-hover text-white text-xs font-bold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Message Human Support on WhatsApp
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
        aria-label={open ? "Close Help Desk" : "Open Help Desk"}
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
            <span>Help</span>
          </>
        )}
      </button>
    </div>
  );
}
