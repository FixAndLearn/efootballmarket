import { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ListingService } from "@/services/listingService";
import { FridayDropsSection } from "@/components/home/FridayDropsSection";
import { Listing } from "@/types/database";
import {
  ShieldCheck,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Lock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Friday Squad Drops — 8-Hour Weekly Window",
  description:
    "Weekly 8-hour eFootball squad drop window every Friday from 2:00 PM to 10:00 PM EAT with Safaricom M-Pesa Till 1572931 buyer protection.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/friday-drops",
  },
};

export default async function FridayDropsPage() {
  const supabase = createServerSupabaseClient();
  const listingService = new ListingService(supabase);

  let listings: Listing[] = [];
  try {
    const result = await listingService.getListings({ limit: 12 });
    listings = result.listings || [];
  } catch (err) {
    console.error("FridayDropsPage listings error:", err);
  }

  return (
    <div className="min-h-screen text-sx-ink flex flex-col">
      {/* Subbar */}
      <div className="border-b border-sx-border bg-sx-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <Link
            href="/browse"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-sx-muted hover:text-sx-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Marketplace</span>
          </Link>

          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-sx-stone border border-sx-border text-sx-ink text-[11px] font-mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-sx-green" />
            WEEKLY RELEASE · FRIDAYS 2PM EAT
          </span>
        </div>
      </div>

      <main className="flex-1">
        <FridayDropsSection listings={listings} />

        <section className="py-12 border-t border-sx-border bg-sx-subtle">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-extrabold text-sx-ink font-display">
                How The Friday Release Works
              </h2>
              <p className="text-xs sm:text-sm text-sx-muted max-w-2xl">
                Featured squads offered at fixed ask prices during the Friday 2:00 PM – 10:00 PM EAT window, settled via eFootballMarket&apos;s Buy Goods Till 1572931 with a 24-hour buyer login check.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: Clock,
                  title: "2:00 PM – 10:00 PM EAT",
                  desc: "Featured squads run in a fixed-price Friday window. Outside that window, standard marketplace squads remain open as usual.",
                },
                {
                  icon: Lock,
                  title: "Clean Konami ID Rule",
                  desc: "Sellers confirm Google Play and Apple Game Center are Not Linked, and you get 24 hours after delivery to verify Link Data yourself.",
                },
                {
                  icon: ShieldCheck,
                  title: "Held on Till 1572931",
                  desc: "Safaricom M-Pesa transfers your payment to eFootballMarket's Till 1572931 (KES 0 added buyer fee), where we hold it during your 24h check.",
                },
                {
                  icon: CheckCircle2,
                  title: "Fixed Ask, Zero Bidding",
                  desc: "During active Friday Drops, custom offer bidding pauses so the first buyer to pay Till 1572931 locks the squad.",
                },
              ].map((rule) => {
                const Icon = rule.icon;
                return (
                  <div
                    key={rule.title}
                    className="rounded-xl bg-sx-canvas border border-sx-border p-5 space-y-2.5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sx-stone border border-sx-border text-sx-green-text flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-sx-ink font-display">
                      {rule.title}
                    </h3>
                    <p className="text-xs text-sx-muted leading-relaxed">
                      {rule.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
