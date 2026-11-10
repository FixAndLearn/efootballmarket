"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export interface TickerItem {
  id: string;
  badge: string;
  badgeColor: string;
  text: string;
  link?: string;
}

// Authentic marketplace announcements & safety rules (disciplined Emerald + Amber + Slate palette)
const PROMOTIONAL_TICKER_ITEMS: TickerItem[] = [
  {
    id: "promo-escrow",
    badge: "TILL 1572931",
    badgeColor: "bg-[#EBF5F0] text-[#006340] border-[#BFE0CE]",
    text: "Funds remain safely locked in Safaricom M-Pesa custody until you inspect and bind your Konami ID",
    link: "/escrow-guarantee",
  },
  {
    id: "promo-sell",
    badge: "SELL SQUAD",
    badgeColor: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
    text: "List your verified squad with low escrow fees (KES 50 – 500) & instant Safaricom M-Pesa payouts",
    link: "/seller/create-listing",
  },
  {
    id: "promo-safety",
    badge: "ZERO GOOGLE LINK",
    badgeColor: "bg-[#F4F3F1] text-[#3D3D3D] border-[#C8C8C4]",
    text: "Mandatory rule: Confirm Google Play & Game Center are unlinked before completing email handover",
    link: "/escrow-guarantee",
  },
  {
    id: "promo-middleman",
    badge: "P2P MIDDLEMAN",
    badgeColor: "bg-[#EBF5F0] text-[#006340] border-[#BFE0CE]",
    text: "Found a deal on WhatsApp or Facebook? Route it safely through automated Till 1572931 Middleman Escrow",
    link: "/middleman",
  },
  {
    id: "promo-friday",
    badge: "FRIDAY DROPS",
    badgeColor: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
    text: "Curated 3150+ OVR squad drops unlock every Friday (2:00 PM – 10:00 PM EAT)",
    link: "/friday-drops",
  },
  {
    id: "promo-scammer",
    badge: "TRADER CHECK",
    badgeColor: "bg-[#F4F3F1] text-[#3D3D3D] border-[#C8C8C4]",
    text: "Verify phone numbers and WhatsApp contacts against Kenya's community scammer blacklist",
    link: "/scammer-check",
  },
];

export function LiveActivityMarquee() {
  const [items, setItems] = useState<TickerItem[]>(PROMOTIONAL_TICKER_ITEMS);

  useEffect(() => {
    let isMounted = true;

    async function loadActivity() {
      try {
        const res = await fetch("/api/activity", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.items && Array.isArray(data.items) && data.items.length > 0) {
          setItems(data.items);
        }
      } catch {
        // Fall back gracefully to promotional items
      }
    }

    loadActivity();

    const supabase = createClient();
    const channel = supabase
      .channel("public-activity-ticker")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "listings",
        },
        (payload: any) => {
          if (!payload.new || payload.new.status !== "published") return;
          const newListing = payload.new;
          const newItem: TickerItem = {
            id: `real-${newListing.id}`,
            badge: "NEW LISTING",
            badgeColor: "bg-[#EBF5F0] text-[#006340] border-[#BFE0CE]",
            text: `${newListing.title} (${newListing.overall_team_strength} OVR) listed for KSh ${Number(newListing.price).toLocaleString()}`,
            link: `/listings/${newListing.id}`,
          };
          setItems((prev) => [newItem, ...prev.slice(0, 10)]);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const marqueeList = items.concat(items);

  return (
    <div className="hidden sm:block w-full bg-[#050911] border-b border-[#E2E2E0] overflow-hidden py-1.5 text-[11px] relative select-none">
      <div className="flex items-center">
        {/* Clean Static Prefix */}
        <div className="hidden md:flex items-center gap-2 pl-4 pr-3.5 py-0.5 border-r border-[#E2E2E0] bg-[#050911] shrink-0 z-10 font-mono font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.75)]" />
          <span className="text-[10px] uppercase tracking-wider text-[#006340]">
            ESCROW DESK
          </span>
        </div>

        {/* Marquee Scroller */}
        <div className="flex overflow-x-hidden whitespace-nowrap group">
          <div className="inline-flex items-center gap-8 animate-marquee group-hover:[animation-play-state:paused]">
            {marqueeList.map((item, idx) => (
              <Link
                key={`${item.id}-${idx}`}
                href={item.link || "/escrow-guarantee"}
                className="inline-flex items-center gap-2 text-[#5F5F5F] hover:text-[#0F0F0F] transition-colors"
              >
                <span
                  className={`px-2 py-0.5 rounded-md border text-[9px] font-mono font-bold uppercase tracking-wider ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
                <span className="text-[#3D3D3D] font-medium">{item.text}</span>
                <span className="text-slate-800 mx-1">&bull;</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
