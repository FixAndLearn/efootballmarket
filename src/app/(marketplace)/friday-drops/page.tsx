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
                Curated collector accounts sold at fixed ask prices with Safaricom Till 1572931 escrow custody and 24-hour login inspection.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: Clock,
                  title: "2:00 PM – 10:00 PM EAT",
                  desc: "Selected collector rosters group into one weekly Friday release window. Unsold accounts roll into standard catalog rotation.",
                },
                {
                  icon: Lock,
                  title: "Clean Konami ID Only",
                  desc: "Every featured roster is verified free of Google Play and Apple Game Center links before entering the lineup.",
                },
                {
                  icon: ShieldCheck,
                  title: "Till 1572931 Custody",
                  desc: "Checkout locks M-Pesa funds in escrow while you complete Data Transfer and rebind your personal email and 2FA.",
                },
                {
                  icon: CheckCircle2,
                  title: "Fixed Ask, Zero Bidding",
                  desc: "No DM haggling — the first buyer to lock escrow claims the squad immediately.",
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
