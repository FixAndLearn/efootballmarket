import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AnalyticsService } from "@/services/analyticsService";
import { ListingService } from "@/services/listingService";
import { NewsService } from "@/services/newsService";
import { TournamentService } from "@/services/tournamentService";
import { Listing, NewsArticle, Tournament } from "@/types/database";
import { ListingCard3D } from "@/components/marketplace/ListingCard3D";
import { EscrowStepsVisualizer } from "@/components/home/EscrowStepsVisualizer";
import { HomeFaqAccordion } from "@/components/home/HomeFaqAccordion";
import {
  ArrowRight,
  Handshake,
  MessageCircle,
  Search,
  ShieldCheck,
  Plus,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  const listingService = new ListingService(supabase);
  const analyticsService = new AnalyticsService(supabase);
  const newsService = new NewsService(supabase);

  let listings: Listing[] = [];
  let metrics = {
    totalListingsCount: 0,
    activeListingsCount: 0,
    completedOrdersCount: 0,
    totalVolumeKes: 0,
    verifiedSellersCount: 0,
  };
  let tournaments: Tournament[] = [];
  let articles: NewsArticle[] = [];

  try {
    const [listingsResult, metricsResult, tourneysResult, articlesResult] = await Promise.all([
      listingService.getListings({ limit: 8, sortBy: "newest" }).catch(() => ({ listings: [], total: 0 })),
      analyticsService.getPlatformOverview().catch(() => ({
        totalListingsCount: 0,
        activeListingsCount: 0,
        completedOrdersCount: 0,
        totalVolumeKes: 0,
        verifiedSellersCount: 0,
      })),
      TournamentService.getAllTournaments().catch(() => []),
      newsService.getPublishedArticles().catch(() => []),
    ]);

    listings = listingsResult.listings || [];
    metrics = metricsResult;
    tournaments = tourneysResult || [];
    articles = (articlesResult || []).slice(0, 3);
  } catch (err) {
    console.error("HomePage query error:", err);
  }

  return (
    <div className="min-h-screen text-slate-100">
      {/* 1. HERO: Direct, Grounded Marketplace Header */}
      <section className="py-12 md:py-20 border-b border-[#242A36]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-12 items-start">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display tracking-tight text-white leading-[1.12]">
                  Buy and sell eFootball accounts in Kenya.
                </h1>
                <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
                  Payments are held on M-Pesa Till 1572931 while you log in, verify the squad on your phone, and move the Konami ID to your own email. Sellers get paid automatically once confirmed.
                </p>
              </div>

              {/* Search Bar */}
              <div className="max-w-xl space-y-3">
                <form action="/browse" method="GET" className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    name="search"
                    placeholder="Search player or manager (e.g. Gullit, Vieira, Son)..."
                    className="w-full pl-10 pr-24 py-3 rounded-lg bg-[#11141B] border border-[#262D3B] text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
                  />
                  <div className="absolute inset-y-1.5 right-1.5 flex items-center">
                    <Button type="submit" variant="primary" size="sm" className="px-4 h-8">
                      Search
                    </Button>
                  </div>
                </form>

                {/* Quick Filter Links */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-500 mr-1">Filters:</span>
                  <Link
                    href="/browse?minStrength=3150"
                    className="px-2.5 py-1 rounded-md bg-[#11141B] hover:bg-[#171B24] border border-[#242A36] text-slate-300 hover:text-white transition-colors"
                  >
                    3150+ Strength
                  </Link>
                  <Link
                    href="/browse?search=Epic"
                    className="px-2.5 py-1 rounded-md bg-[#11141B] hover:bg-[#171B24] border border-[#242A36] text-slate-300 hover:text-white transition-colors"
                  >
                    Epic Players
                  </Link>
                  <Link
                    href="/browse?platform=android"
                    className="px-2.5 py-1 rounded-md bg-[#11141B] hover:bg-[#171B24] border border-[#242A36] text-slate-300 hover:text-white transition-colors"
                  >
                    Android
                  </Link>
                  <Link
                    href="/browse?platform=ios"
                    className="px-2.5 py-1 rounded-md bg-[#11141B] hover:bg-[#171B24] border border-[#242A36] text-slate-300 hover:text-white transition-colors"
                  >
                    iOS
                  </Link>
                  <Link
                    href="/browse?maxPrice=5000"
                    className="px-2.5 py-1 rounded-md bg-[#11141B] hover:bg-[#171B24] border border-[#242A36] text-slate-300 hover:text-white transition-colors"
                  >
                    Under KES 5,000
                  </Link>
                </div>
              </div>

              {/* Primary CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href="/browse">
                  <Button variant="primary" size="lg">
                    <span>Browse Listings</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/seller/create-listing">
                  <Button variant="secondary" size="lg">
                    <Plus className="w-4 h-4 text-slate-300" />
                    <span>Sell an Account</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Clear, Architectural Order Summary */}
            <div className="lg:col-span-5">
              <div className="rounded-xl bg-[#11141B] border border-[#242A36] p-6 space-y-5">
                <div className="flex items-center justify-between pb-3.5 border-b border-[#242A36]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-sm font-semibold text-white">
                      How Buyer Protection Works
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Till 1572931
                  </span>
                </div>

                <ol className="space-y-3.5 text-xs">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded bg-[#171B24] border border-[#283040] text-slate-300 font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-100 block font-medium">Pay into M-Pesa Hold</strong>
                      <p className="text-slate-400 mt-0.5 leading-relaxed">
                        Complete the STK push prompt. Funds stay held by the platform—not sent to the seller&apos;s phone.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded bg-[#171B24] border border-[#283040] text-slate-300 font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-100 block font-medium">Receive Konami ID Details (&#8804; 12h)</strong>
                      <p className="text-slate-400 mt-0.5 leading-relaxed">
                        Seller delivers encrypted login details and shares the email change code inside the order chat.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded bg-[#171B24] border border-[#283040] text-slate-300 font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-100 block font-medium">24-Hour Squad &amp; Link Check</strong>
                      <p className="text-slate-400 mt-0.5 leading-relaxed">
                        Verify players in-game, check that Google Play / Game Center say <em>Not Linked</em>, and bind your email.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded bg-[#171B24] border border-[#283040] text-slate-300 font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      <strong className="text-slate-100 block font-medium">Confirm or Refund</strong>
                      <p className="text-slate-400 mt-0.5 leading-relaxed">
                        Release payout once satisfied, or open a dispute if anything doesn&apos;t match for a full M-Pesa refund.
                      </p>
                    </div>
                  </li>
                </ol>

                {(metrics.activeListingsCount > 0 || metrics.completedOrdersCount > 0) && (
                  <div className="pt-3.5 border-t border-[#242A36] flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Live listings: <strong className="text-white">{metrics.activeListingsCount}</strong>
                    </span>
                    {metrics.completedOrdersCount > 0 && (
                      <span>
                        Completed orders: <strong className="text-white">{metrics.completedOrdersCount}</strong>
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-[#242A36] flex items-center justify-between text-xs">
                  <span className="text-slate-400">Support: 0794 400 365</span>
                  <Link href="/escrow-guarantee" className="text-emerald-400 hover:text-emerald-300 font-medium">
                    Full protection rules &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LATEST LISTINGS */}
      <section className="py-14 border-b border-[#242A36]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                Latest Squad Listings
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Unlinked Konami ID accounts listed by sellers in Kenya.
              </p>
            </div>
            <Link
              href="/browse"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 shrink-0"
            >
              <span>
                View all{metrics.activeListingsCount > 0 ? ` (${metrics.activeListingsCount})` : ""}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="rounded-xl bg-[#11141B] border border-[#242A36] p-8 sm:p-10 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-10 h-10 rounded-lg bg-[#171B24] border border-[#283040] text-slate-400 flex items-center justify-center mx-auto">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm sm:text-base font-semibold text-white">
                  No open listings right now
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Listed squads are either sold or currently inside a buyer&apos;s 24-hour inspection window. You can list a squad for sale or post what you&apos;re looking for on the Wanted Board.
                </p>
              </div>
              <div className="pt-1 flex flex-wrap items-center justify-center gap-2.5">
                <Link href="/seller/create-listing">
                  <Button variant="primary" size="sm">
                    Sell an Account
                  </Button>
                </Link>
                <Link href="/wanted">
                  <Button variant="secondary" size="sm">
                    Wanted Board
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {listings.map((item) => (
                <ListingCard3D key={item.id} listing={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. STEP-BY-STEP HANDOVER BREAKDOWN */}
      <EscrowStepsVisualizer />

      {/* 4. OFF-PLATFORM MIDDLEMAN SERVICE */}
      <section className="py-14 border-b border-[#242A36]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl bg-[#11141B] border border-[#242A36] p-6 sm:p-9">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                  Agreed on a trade on WhatsApp or Facebook?
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                  Don&apos;t send M-Pesa directly to a stranger&apos;s personal number. Open a Middleman contract instead—the buyer deposits into Till 1572931, the seller submits login details on the platform, and payout is sent once the buyer confirms the squad.
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2.5">
                <Link href="/middleman" className="w-full">
                  <Button variant="primary" size="md" className="w-full">
                    <Handshake className="w-4 h-4" />
                    <span>Open Middleman Contract</span>
                  </Button>
                </Link>
                <Link href="/scammer-check" className="w-full">
                  <Button variant="secondary" size="md" className="w-full">
                    <span>Check a Phone Number First</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TOURNAMENTS (When Active) */}
      {tournaments.length > 0 && (
        <section className="py-14 border-b border-[#242A36]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                  Community Tournaments
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  1v1 knockout brackets with M-Pesa prize payouts.
                </p>
              </div>
              <Link
                href="/tournaments"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 shrink-0"
              >
                <span>All Tournaments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl bg-[#11141B] border border-[#242A36] p-5 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded bg-[#171B24] border border-[#283040] text-slate-300 capitalize">
                        {t.status?.replace("_", " ")}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {t.registered_count || 0}/{t.max_players} players
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">{t.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{t.subtitle}</p>
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Prize pool</span>
                      <strong className="text-emerald-400 font-mono">
                        {formatCurrency(t.prize_pool_kes, "KES")}
                      </strong>
                    </div>
                  </div>
                  <div className="pt-4 mt-4 border-t border-[#242A36]">
                    <Link href="/tournaments">
                      <Button variant="secondary" size="sm" className="w-full">
                        View Bracket
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. TRADING GUIDES & ADVISORIES */}
      {articles.length > 0 && (
        <section className="py-14 border-b border-[#242A36]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                  Trading Guides &amp; Safety Advisories
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Practical walkthroughs on Konami ID handovers, checking Link Data, and avoiding M-Pesa scams.
                </p>
              </div>
              <Link
                href="/news"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 shrink-0"
              >
                <span>All Guides</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {articles.map((article) => {
                const isAlert = article.category === "scammer_alert";
                return (
                  <Link
                    key={article.id}
                    href={`/news/${article.slug}`}
                    className="rounded-xl bg-[#11141B] border border-[#242A36] hover:border-slate-600 p-5 flex flex-col justify-between transition-colors group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span
                          className={`px-2 py-0.5 rounded font-medium ${
                            isAlert
                              ? "bg-rose-950/60 text-rose-300 border border-rose-800/60"
                              : "bg-[#171B24] text-slate-300 border border-[#283040]"
                          }`}
                        >
                          {isAlert ? "Safety Advisory" : article.category === "escrow_guide" ? "Guide" : "Article"}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {article.summary}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#242A36] flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-slate-200">
                      <span>Read guide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 7. FAQ */}
      <section className="py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Common questions about M-Pesa Till 1572931 payments, 24-hour inspection, and seller payouts.
            </p>
          </div>
          <HomeFaqAccordion />
        </div>
      </section>
    </div>
  );
}
