import React, { Suspense } from "react";
import { Metadata } from "next";
import { ScammerLookupTool } from "@/components/scammer/ScammerLookupTool";
import { ShieldCheck, MessageCircle, Handshake } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DetailTabLink } from "@/components/ui/DetailTabLink";

export const metadata: Metadata = {
  title: "Scammer Phone & Handle Check Kenya",
  description:
    "Check Kenyan 07... and 01... phone numbers, WhatsApp contacts, and trader handles against reported fraud incidents before trading an eFootball account.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/scammer-check",
  },
  openGraph: {
    title: "Scammer Phone & Handle Check | eFootballMarket Kenya",
    description:
      "Search any Kenyan 07/01 phone number or trader handle against verified fraud reports before paying for an eFootball squad.",
    url: "https://www.efootballmarket.co.ke/scammer-check",
    type: "website",
  },
};

export default function ScammerCheckPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 w-full space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sx-border pb-6">
        <div className="space-y-2">
          <span className="inline-block text-[11px] font-mono uppercase tracking-wider text-sx-red-text font-bold">
            Fraud Incident Lookup
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold text-sx-ink font-display tracking-tight">
            Check a Phone Number or Handle Before You Pay
          </h1>
          <p className="text-xs sm:text-sm text-sx-muted max-w-2xl leading-relaxed">
            Search any Kenyan <span className="font-mono font-semibold text-sx-ink">07...</span> or <span className="font-mono font-semibold text-sx-ink">01...</span> phone number or handle against verified fraud reports.
          </p>
        </div>

        <DetailTabLink href="/fraud-prevention" variant="pill">
          Anti-Fraud &amp; Free Appeals
        </DetailTabLink>
      </div>

      {/* Lookup Panel */}
      <div className="store-panel rounded-2xl p-6 sm:p-8 space-y-5">
        <Suspense fallback={<div className="h-14 rounded-xl bg-sx-stone animate-pulse" />}>
          <ScammerLookupTool />
        </Suspense>
      </div>

      {/* 3 Most Common Scams */}
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          Common Social Media Scams in Kenya
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              num: "01",
              title: "Direct M-Pesa Prepayment",
              desc: "Seller asks for full or 50% deposit directly to their personal M-Pesa number, then blocks you on WhatsApp.",
              fix: "Pay only via Till 1572931",
            },
            {
              num: "02",
              title: "Cloned Group Admin Profiles",
              desc: "Impersonators copy a group admin's display photo and create a fake 3-way escrow group chat to steal logins.",
              fix: "Start contract at /middleman",
            },
            {
              num: "03",
              title: "Hidden Google / Apple Link",
              desc: "Seller transfers Konami ID email but keeps Google Play or Game Center attached to log back in days later.",
              fix: "Verify Link Data in 24h window",
            },
          ].map((item) => (
            <div key={item.num} className="store-panel rounded-xl p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="inline-block px-2 py-0.5 rounded bg-sx-stone border border-sx-border font-mono text-[11px] font-bold text-sx-red-text">
                  {item.num}
                </span>
                <h3 className="text-sm font-bold text-sx-ink font-display">{item.title}</h3>
                <p className="text-xs text-sx-muted leading-relaxed">{item.desc}</p>
              </div>
              <div className="pt-3 border-t border-sx-border text-xs text-sx-green-text font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{item.fix}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report / Middleman Split */}
      <div className="store-panel rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-sx-ink font-display">
            Report a Scammer or Open a Safe Middleman Contract
          </h3>
          <p className="text-xs text-sx-muted max-w-xl leading-relaxed">
            Note: Even if a number has 0 prior reports, scammers switch SIM cards regularly. Always lock off-platform deals through Till 1572931 Middleman.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link href="/middleman">
            <Button variant="primary" size="sm">
              <Handshake className="w-3.5 h-3.5" />
              <span>Open Middleman</span>
            </Button>
          </Link>
          <a
            href="https://wa.me/254794400365?text=Hello%2C%20I%20want%20to%20report%20a%20scam%20incident%20with%20evidence"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" size="sm">
              <MessageCircle className="w-3.5 h-3.5 text-sx-green-text" />
              <span>Report Incident</span>
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
