import React from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer
      role="contentinfo"
      aria-label="Site Footer"
      className="w-full border-t border-[#242A36] bg-[#090B0E] text-slate-400 text-xs mt-auto pt-12 pb-24 md:pb-10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 space-y-3">
            <Logo clickable={true} size="sm" />
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              Peer-to-peer eFootball account marketplace in Kenya with M-Pesa payment hold protection (Till 1572931).
            </p>
          </div>

          {/* Marketplace */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-white">Marketplace</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/browse" className="hover:text-white transition-colors">
                  Browse Listings
                </Link>
              </li>
              <li>
                <Link href="/seller/create-listing" className="hover:text-white transition-colors">
                  Sell an Account
                </Link>
              </li>
              <li>
                <Link href="/middleman" className="hover:text-white transition-colors">
                  WhatsApp Middleman
                </Link>
              </li>
              <li>
                <Link href="/wanted" className="hover:text-white transition-colors">
                  Wanted Board
                </Link>
              </li>
              <li>
                <Link href="/tournaments" className="hover:text-white transition-colors">
                  Tournaments
                </Link>
              </li>
            </ul>
          </div>

          {/* Safety & Guides */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-white">Safety &amp; Guides</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/escrow-guarantee" className="hover:text-white transition-colors">
                  How Protection Works
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-white transition-colors">
                  Trading Guides &amp; Alerts
                </Link>
              </li>
              <li>
                <Link href="/scammer-check" className="hover:text-white transition-colors">
                  Scammer Check
                </Link>
              </li>
              <li>
                <Link href="/seller/guidelines" className="hover:text-white transition-colors">
                  Seller Guidelines
                </Link>
              </li>
              <li>
                <Link href="/fraud-prevention" className="hover:text-white transition-colors">
                  Anti-Fraud Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-white">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/254794400365"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp: 0794 400 365
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@efootballmarket.co.ke"
                  className="hover:text-white transition-colors"
                >
                  support@efootballmarket.co.ke
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-white">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/dispute-policy" className="hover:text-white transition-colors">
                  Dispute Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-[#242A36] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 text-center sm:text-left">
          <p>&copy; {new Date().getFullYear()} eFootballMarket. Operated in Kenya.</p>
          <p className="max-w-xl">
            Independent peer-to-peer platform. Not affiliated with Konami Digital Entertainment or Safaricom PLC.
          </p>
        </div>
      </div>
    </footer>
  );
}
