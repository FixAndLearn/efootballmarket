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
  Sparkles,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Plus,
} from "lucide-react";
import Link from "next/link";

export const revalidate = 0; // Dynamic server-rendered for real database metrics and live marketplace listings

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  const listingService = new ListingService(supabase);
  const analyticsService = new AnalyticsService(supabase);
  const newsService = new NewsService(supabase);

  // Parallel database queries (strictly real data, zero demo data)
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
    <div className="relative min-h-screen text-[#F8FAFC]">
      {/* 1. HERO SECTION (Clean Institutional Fintech Hierarchy + Instant Action Paths) */}
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 border-b border-slate-800/80">
        {/* Restrained Ambient Glow */}
        <div className="absolute top-0 left-1/4 w-[560px] h-[320px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -translate-y-1/2" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-12 items-center">
            {/* Left Column: Authority Copy, Search & Direct CTAs */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B1424] border border-emerald-500/30 text-xs font-medium text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Safaricom Till 1572931 &bull; 24-Hour Buyer Inspection Escrow</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-[3.4rem] font-black font-display tracking-tight leading-[1.12]">
                <span className="text-white">Buy &amp; Sell Verified </span>
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  eFootball Squads
                </span>
                <span className="text-white"> Safely in Kenya</span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Every trade is protected by automated Safaricom M-Pesa escrow custody. Inspect the squad on your phone and bind your Konami ID before a single shilling is released to the seller.
              </p>

              {/* Instant Search Bar */}
              <div className="max-w-2xl mx-auto lg:mx-0 space-y-3 pt-1">
                <form action="/browse" method="GET" className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="search"
                    placeholder="Search players or managers (e.g. Gullit, Vieira, Blitz Curler Son)..."
                    className="w-full pl-11 pr-28 py-3.5 rounded-2xl bg-[#0B1424] border border-slate-700/90 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 text-sm min-h-[50px] transition-all"
                  />
                  <div className="absolute inset-y-1.5 right-1.5 flex items-center">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 rounded-xl min-h-[38px]"
                    >
                      Search
                    </Button>
                  </div>
                </form>

                {/* Quick Filter Pills */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Popular:</span>
                  <Link
                    href="/browse?minStrength=3150"
                    className="px-2.5 py-1 rounded-lg bg-[#0B1424] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    3150+ OVR Elite
                  </Link>
                  <Link
                    href="/browse?search=Epic"
                    className="px-2.5 py-1 rounded-lg bg-[#0B1424] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    Epic Boosters
                  </Link>
                  <Link
                    href="/browse?maxPrice=5000"
                    className="px-2.5 py-1 rounded-lg bg-[#0B1424] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    Under KES 5,000
                  </Link>
                  <Link
                    href="/middleman"
                    className="px-2.5 py-1 rounded-lg bg-[#0B1424] hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    WhatsApp Middleman
                  </Link>
                </div>
              </div>

              {/* Primary & Secondary Hero Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-1">
                <Link href="/browse" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm px-6 py-3.5 rounded-2xl min-h-[48px] shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2"
                  >
                    <span>Browse Verified Squads</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/seller/create-listing" className="w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto bg-[#0B1424] hover:bg-slate-800/80 border border-slate-700/90 hover:border-slate-600 text-white font-semibold text-sm px-6 py-3.5 rounded-2xl min-h-[48px] flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>List Squad for Sale</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Clean Institutional Escrow Panel (Disciplined Palette, Zero Fake Data) */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl bg-[#0B1424] border border-slate-800 p-6 sm:p-7 shadow-2xl shadow-black/50 space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.75)]" />
                    <span className="text-xs uppercase font-mono font-bold text-slate-200 tracking-wider">
                      Escrow Custody Desk
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    Safaricom Daraja v2
                  </span>
                </div>

                {/* Real DB Metrics when populated, Verified Platform Standards on cold start (100% Honest) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-[#070D18] border border-slate-800/90">
                    <span className="block text-xl sm:text-2xl font-black text-white font-display">
                      {metrics.activeListingsCount > 0 ? metrics.activeListingsCount : "Till 1572931"}
                    </span>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider mt-0.5 block">
                      {metrics.activeListingsCount > 0 ? "Active Squads" : "Escrow Custody"}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#070D18] border border-slate-800/90">
                    <span className="block text-xl sm:text-2xl font-black text-emerald-400 font-display">
                      {metrics.totalVolumeKes > 0 ? formatCurrency(metrics.totalVolumeKes) : "24 Hours"}
                    </span>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider mt-0.5 block">
                      {metrics.totalVolumeKes > 0 ? "Escrow Volume" : "Buyer Inspection"}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#070D18] border border-slate-800/90">
                    <span className="block text-xl sm:text-2xl font-black text-white font-display">
                      {metrics.completedOrdersCount > 0 ? metrics.completedOrdersCount : "AES-256"}
                    </span>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider mt-0.5 block">
                      {metrics.completedOrdersCount > 0 ? "Completed Trades" : "Credential Vault"}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#070D18] border border-slate-800/90">
                    <span className="block text-xl sm:text-2xl font-black text-amber-300 font-display">
                      {metrics.verifiedSellersCount > 0 ? metrics.verifiedSellersCount : "Zero Link"}
                    </span>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider mt-0.5 block">
                      {metrics.verifiedSellersCount > 0 ? "Vetted Sellers" : "Clean Konami IDs"}
                    </span>
                  </div>
                </div>

                {/* Verified Standards Checklist */}
                <div className="space-y-2.5 pt-1 text-xs text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Zero seller prepayment — funds stay locked until buyer approval</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Strict anti-Google Play &amp; Game Center link verification</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant full M-Pesa refund if squad specs fail inspection</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Direct mediation hotline: 0794400365</span>
                  </div>
                </div>

                {/* Reviewer signature badge */}
                <div className="pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>Desk Lead: <strong className="text-slate-200 font-semibold">Brian Okibo</strong></span>
                  </div>
                  <Link href="/escrow-guarantee" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                    Escrow Policy &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CURATED MARKETPLACE DIRECTORY (100% Real Supabase Data) */}
      <section className="py-14 md:py-20 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                Featured Verified Squads
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Clean Konami ID accounts ready for immediate M-Pesa escrow transfer.
              </p>
            </div>
            <Link
              href="/browse"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 shrink-0 transition-colors"
            >
              <span>
                View All{metrics.activeListingsCount > 0 ? ` (${metrics.activeListingsCount})` : ""}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="rounded-3xl bg-[#0B1424] border border-slate-800 p-10 text-center space-y-4 max-w-xl mx-auto shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">No active listings available right now</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Previous squads have been sold or are currently inside a 24-hour buyer inspection window. Have a verified squad to sell? List it now for instant M-Pesa payout.
              </p>
              <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
                <Link href="/seller/create-listing">
                  <Button variant="primary" size="md" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 rounded-xl">
                    + List Your Squad
                  </Button>
                </Link>
                <Link href="/wanted">
                  <Button variant="secondary" size="md" className="bg-[#060B14] border border-slate-700 text-slate-200 hover:text-white text-xs px-5 rounded-xl">
                    Post on Wanted Board
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings.map((item) => (
                <ListingCard3D key={item.id} listing={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. 5-STEP ESCROW VISUALIZER */}
      <EscrowStepsVisualizer />

      {/* 4. BRING-YOUR-OWN-DEAL MIDDLEMAN FEATURE */}
      <section className="py-14 md:py-20 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#0B1424] border border-slate-800 p-7 sm:p-11 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <span className="inline-block text-[11px] font-mono uppercase tracking-wider font-bold text-emerald-400">
                  Off-Platform P2P Protection
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                  Trading on WhatsApp, TikTok, or Facebook? Don&apos;t risk a direct send.
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                  Route external deals through our Lipa Na M-Pesa Middleman Escrow. The buyer locks funds into Till 1572931, the seller submits credentials into the encrypted vault, and payout is disbursed only after the squad is verified on the buyer&apos;s phone.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#070D18] border border-slate-800">
                    <span className="block font-bold text-white mb-0.5">1. Lock Funds</span>
                    <span className="text-[11px] text-slate-400">Buyer deposits to Till 1572931</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#070D18] border border-slate-800">
                    <span className="block font-bold text-white mb-0.5">2. Inspect Squad</span>
                    <span className="text-[11px] text-slate-400">24h login &amp; Konami ID bind</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#070D18] border border-slate-800">
                    <span className="block font-bold text-emerald-400 mb-0.5">3. Instant Payout</span>
                    <span className="text-[11px] text-slate-400">Automated M-Pesa disbursement</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-3 justify-center">
                <Link href="/middleman" className="w-full">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-3.5 rounded-2xl min-h-[48px] shadow-lg shadow-emerald-500/15"
                  >
                    <Handshake className="w-4 h-4 mr-2" />
                    Start Middleman Escrow
                  </Button>
                </Link>
                <a
                  href="https://wa.me/254794400365"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full bg-[#070D18] border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 text-xs py-3.5 rounded-2xl min-h-[48px] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 mr-2 text-emerald-400" />
                    WhatsApp Desk: 0794400365
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. COMPETITIVE TOURNAMENTS & KNOCKOUT CUPS (Rendered when active cups exist) */}
      {tournaments.length > 0 && (
        <section className="py-14 md:py-20 border-b border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                  Competitive Knockout Tournaments
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Compete 1v1 with real match bracket tracking and verified Safaricom M-Pesa prize payouts.
                </p>
              </div>
              <Link
                href="/tournaments"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 shrink-0 transition-colors"
              >
                <span>View All Tournaments &amp; Brackets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  className="rounded-3xl bg-[#0B1424] border border-slate-800 hover:border-amber-500/40 p-6 flex flex-col justify-between shadow-xl transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-300">
                        {t.status?.replace("_", " ")}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {t.registered_count || 0} / {t.max_players} Gamers
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{t.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{t.subtitle}</p>

                    <div className="p-3 rounded-2xl bg-[#070D18] border border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Prize Pool:</span>
                      <strong className="text-emerald-400 font-mono font-bold">
                        {formatCurrency(t.prize_pool_kes, "KES")}
                      </strong>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80">
                    <Link href="/tournaments">
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl min-h-[42px]"
                      >
                        Enter Tournament
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. EDITORIAL BULLETINS & SCAMMER ALERTS (Rendered when articles exist) */}
      {articles.length > 0 && (
        <section className="py-14 md:py-20 border-b border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                  News &amp; Scammer Warnings
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Official game updates, fraud advisories, and Kenyan community notices.
                </p>
              </div>
              <Link
                href="/news"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 shrink-0 transition-colors"
              >
                <span>Read All Bulletins</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.map((article) => {
                const isAlert = article.category === "scammer_alert";
                return (
                  <Link
                    key={article.id}
                    href={`/news/${article.slug}`}
                    className="rounded-3xl bg-[#0B1424] border border-slate-800 hover:border-slate-700 p-6 flex flex-col justify-between shadow-xl transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            isAlert
                              ? "bg-rose-950/70 text-rose-300 border border-rose-800/70"
                              : "bg-emerald-950/50 text-emerald-300 border border-emerald-800/60"
                          }`}
                        >
                          {isAlert ? "Scammer Alert" : article.category?.replace("_", " ") || "Update"}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(article.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 mb-2">
                        {article.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {article.summary}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400">
                      <span>Read bulletin</span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 7. FREQUENTLY ASKED QUESTIONS (Trust, Buyer Objections & SEO) */}
      <section className="py-14 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
              Everything you need to know about Safaricom Till 1572931 escrow, Konami ID transfers, and payouts.
            </p>
          </div>
          <HomeFaqAccordion />
        </div>
      </section>
    </div>
  );
}
