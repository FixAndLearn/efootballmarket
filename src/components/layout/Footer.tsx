import React from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
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
              Kenyan eFootball squad marketplace, WhatsApp Middleman desk &amp; tournaments hub. Payments to Buy Goods Till <strong className="text-sx-ink">1572931</strong> are held during your 24-hour login check.
            </p>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sx-ink">
              Marketplace
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/browse" className="hover:text-sx-ink transition-colors">
                  All Verified Squads
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
                <Link href="/friday-drops" className="hover:text-sx-ink transition-colors">
                  Friday Drops
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
                <Link href="/middleman" className="hover:text-sx-ink transition-colors">
                  WhatsApp Middleman Escrow
                </Link>
              </li>
              <li>
                <Link href="/wanted" className="hover:text-sx-ink transition-colors">
                  Custom Squad Sourcing
                </Link>
              </li>
              <li>
                <Link href="/middleman?title=Account%20Swap%20%2B%20Cash%20Top-Up" className="hover:text-sx-ink transition-colors">
                  Account Swap + Top-Up
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
                  href="https://wa.me/254794400365"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sx-ink transition-colors"
                >
                  WhatsApp: 0794 400 365
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
            </ul>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sx-ink">
              Policies &amp; Terms
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/policies#escrow" className="hover:text-sx-ink transition-colors">
                  Escrow Rules &amp; Fees
                </Link>
              </li>
              <li>
                <Link href="/policies#terms" className="hover:text-sx-ink transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/policies#disputes" className="hover:text-sx-ink transition-colors">
                  Refunds &amp; Disputes
                </Link>
              </li>
              <li>
                <Link href="/policies#seller-standards" className="hover:text-sx-ink transition-colors">
                  Seller Standards
                </Link>
              </li>
              <li>
                <Link href="/policies#privacy" className="hover:text-sx-ink transition-colors">
                  Privacy &amp; Cookies
                </Link>
              </li>
            </ul>
          </div>
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
