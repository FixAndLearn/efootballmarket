import { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ListingService } from "@/services/listingService";
import { FridayDropsSection } from "@/components/home/FridayDropsSection";
import { Listing } from "@/types/database";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck,
  Clock,
  ArrowLeft,
  ArrowRight,
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
    <div className="min-h-screen text-slate-100 flex flex-col">
      {/* Subbar */}
      <div className="border-b border-[#1E2636] bg-[#0A0D13]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <Link
            href="/browse"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Marketplace</span>
          </Link>

          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#131923] border border-[#242E42] text-amber-300 text-[11px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            FRIDAYS 14:00 – 22:00 EAT
          </span>
        </div>
      </div>

      <main className="flex-1">
        <FridayDropsSection listings={listings} />

        <section className="py-12 border-t border-[#181F2C]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                How Friday Drops Work
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                Fixed-price weekly drops for high-OVR squads with the same Safaricom Till 1572931 payment hold and 24-hour buyer check.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  icon: Clock,
                  title: "8-Hour Weekly Window",
                  desc: "Drops open every Friday at 2:00 PM (14:00 EAT) and close at 10:00 PM (22:00 EAT). Unsold drop slots return to standard marketplace rotation afterward.",
                },
                {
                  icon: Lock,
                  title: "Unlinked Konami ID Only",
                  desc: "Submitted drop accounts must have zero Google Play or Apple Game Center links and clear Starting XI + Reserve screenshots.",
                },
                {
                  icon: ShieldCheck,
                  title: "Till 1572931 Payment Hold",
                  desc: "Checkout triggers a standard M-Pesa STK prompt to Till 1572931. Funds stay locked while you test login and rebind your email.",
                },
                {
                  icon: CheckCircle2,
                  title: "Fixed Drop Pricing",
                  desc: "During the 8-hour window, custom offer bargaining is paused so the first buyer to complete STK checkout locks the squad.",
                },
              ].map((rule) => {
                const Icon = rule.icon;
                return (
                  <div key={rule.title} className="store-panel rounded-xl p-5 space-y-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#131923] border border-[#242E42] text-emerald-400 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white font-display">{rule.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{rule.desc}</p>
                  </div>
                );
              })}
            </div>

            <div>
              <Link href="/browse">
                <Button variant="secondary" size="md">
                  <span>Browse All Marketplace Squads</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
