"use client";

import React from "react";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/support/WhatsAppSupport";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Facebook, Instagram } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { isStandaloneDocPath } from "@/components/legal/StandaloneDocLayout";

export function Footer() {
  const pathname = usePathname();

  if (isStandaloneDocPath(pathname)) {
    return null;
  }

  return (
    <footer
      role="contentinfo"
      aria-label="Site Footer"
      className="w-full border-t border-sx-border bg-sx-stone text-sx-muted text-xs mt-auto pt-12 pb-24 md:pb-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 space-y-3">
            <Logo clickable={true} size="sm" />
            <p className="text-xs text-sx-muted leading-relaxed max-w-xs">
              Kenyan eFootball squad marketplace and tournaments hub. Marketplace checkout payments to Buy Goods Till <strong className="text-sx-ink">1572931</strong> are held during your 24-hour login check, then 20% of the seller&apos;s payout stays held for 7 days against account recovery.
            </p>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sx-ink">
              Marketplace
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/browse" className="hover:text-sx-ink transition-colors">
                  Browse Squad Listings
                </Link>
              </li>
              <li>
                <Link href="/browse?minStrength=3150" className="hover:text-sx-ink transition-colors">
                  Double-Booster Epics
                </Link>
              </li>
              <li>
                <Link href="/seller/create-listing" className="hover:text-sx-ink transition-colors">
                  Sell Your Squad
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-sx-ink transition-colors">
                  eFootball Guides &amp; Meta
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-sx-ink transition-colors">
                  Compare Squads
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sx-ink">
              Our Services
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/wanted" className="hover:text-sx-ink transition-colors">
                  Custom Squad Sourcing
                </Link>
              </li>
              <li>
                <Link href="/browse?swap=1" className="hover:text-sx-ink transition-colors">
                  Squads Open to Swaps
                </Link>
              </li>
              <li>
                <Link href="/tournaments" className="hover:text-sx-ink transition-colors">
                  1v1 &amp; Clan Cup Hosting
                </Link>
              </li>
              <li>
                <Link href="/scammer-check" className="hover:text-sx-ink transition-colors">
                  Trader Phone Check
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sx-ink">
              Support Desk
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="hover:text-sx-ink transition-colors">
                  Book Direct Services
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-sx-ink transition-colors">
                  About eFootballMarket
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/254105472373"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat with eFootballMarket support on WhatsApp"
                  title="Chat with eFootballMarket support on WhatsApp"
                  className="inline-flex items-center gap-1.5 hover:text-sx-ink transition-colors"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>WhatsApp Support</span>
                  <span className="sr-only">(opens a chat, number not shown)</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@efootballmarket.co.ke"
                  className="hover:text-sx-ink transition-colors"
                >
                  support@efootballmarket.co.ke
                </a>
              </li>
              <li>
                <a
                  href="https://whatsapp.com/channel/0029VbE0fut1yT2AtW2Fr50h"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-sx-ink transition-colors font-semibold text-sx-green-text"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>Join our WhatsApp Channel</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sx-ink">
              Standalone Policies
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 hover:text-sx-ink transition-colors"
                >
                  <span>Terms of Service</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 hover:text-sx-ink transition-colors"
                >
                  <span>Privacy &amp; Cookies</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 hover:text-sx-ink transition-colors"
                >
                  <span>Pricing &amp; Fees</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </Link>
              </li>
              <li>
                <Link
                  href="/dispute-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 hover:text-sx-ink transition-colors"
                >
                  <span>Refunds &amp; Disputes</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </Link>
              </li>
              <li>
                <Link
                  href="/escrow-guarantee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 hover:text-sx-ink transition-colors"
                >
                  <span>Escrow &amp; Fees</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </Link>
              </li>
              <li>
                <Link
                  href="/seller/guidelines"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 hover:text-sx-ink transition-colors"
                >
                  <span>Seller Standards</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </Link>
              </li>
              <li>
                <Link
                  href="/fraud-prevention"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 hover:text-sx-ink transition-colors"
                >
                  <span>Anti-Fraud Policy</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-sx-border flex justify-center sm:justify-end">
          <nav aria-label="Social media" className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/efootballmarket22/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Instagram"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-sx-border text-sx-ink hover:bg-sx-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sx-ink"
            >
              <Instagram aria-hidden="true" className="h-5 w-5" />
            </a>
            <a
              href="https://www.facebook.com/share/19TpFCMA3n/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              title="Facebook"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-sx-border text-sx-ink hover:bg-sx-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sx-ink"
            >
              <Facebook aria-hidden="true" className="h-5 w-5" />
            </a>
            <a
              href="https://x.com/efootballmarkt"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              title="X"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-sx-border text-sx-ink hover:bg-sx-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sx-ink"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.635 7.584H.478l8.6-9.831L.7 1.153h7.593l5.243 6.932zM17.61 20.655h2.039L7.486 3.208H5.298z" />
              </svg>
            </a>
          </nav>
        </div>

        <div className="pt-6 border-t border-sx-border flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-sx-muted text-center sm:text-left">
          <p>&copy; {new Date().getFullYear()} eFootballMarket Kenya (Nairobi, Kenya). All Rights Reserved.</p>
          <p className="max-w-xl">
            Independent marketplace operated by eFootballMarket Kenya. Not affiliated with Konami Digital Entertainment Co., Ltd. or Safaricom PLC.
          </p>
        </div>
      </div>
    </footer>
  );
}
