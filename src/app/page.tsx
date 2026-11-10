import React from "react";
import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ListingService } from "@/services/listingService";
import { TournamentService } from "@/services/tournamentService";
import { NewsService } from "@/services/newsService";
import { Listing, NewsArticle, Tournament } from "@/types/database";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { HomeFaqAccordion } from "@/components/home/HomeFaqAccordion";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Handshake,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trophy,
  X,
} from "lucide-react";

export const revalidate = 0;

const STOCKX_CATEGORIES = [
  {
    title: "Epic & Booster (3150+)",
    subtitle: "Division 1 meta squads",
    image: "/images/sx-cat-epic.jpg",
    href: "/browse?minStrength=3150",
  },
  {
    title: "Mobile Squads",
    subtitle: "Clean Konami ID Android & iOS",
    image: "/images/sx-cat-mobile.jpg",
    href: "/browse?platform=android",
  },
  {
    title: "PlayStation & PC",
    subtitle: "PS5, PS4 & Steam rosters",
    image: "/images/sx-cat-console.jpg",
    href: "/browse?platform=playstation_5",
  },
  {
    title: "Under KES 5,000",
    subtitle: "Verified starter & budget squads",
    image: "/images/sx-cat-budget.jpg",
    href: "/browse?maxPrice=5000",
  },
  {
    title: "Middleman Escrow",
    subtitle: "Verify WhatsApp & FB deals",
    image: "/images/sx-cat-middleman.jpg",
    href: "/middleman",
  },
];

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  const listingService = new ListingService(supabase);
  const newsService = new NewsService(supabase);

  let listings: Listing[] = [];
  let tournaments: Tournament[] = [];
  let articles: NewsArticle[] = [];

  try {
    const [listingsResult, tourneysResult, articlesResult] = await Promise.all([
      listingService.getListings({ limit: 8, sortBy: "newest" }).catch(() => ({ listings: [], totalCount: 0 })),
      TournamentService.getAllTournaments().catch(() => []),
      newsService.getPublishedArticles().catch(() => []),
    ]);

    listings = listingsResult.listings || [];
    tournaments = tourneysResult || [];
    articles = (articlesResult || []).slice(0, 6);
  } catch (err) {
    console.error("HomePage query error:", err);
  }

  return (
    <div className="min-h-screen bg-white text-[#0F0F0F]">
      {/* 1. STOCKX SIGNATURE FRAMED SPLIT HERO BANNER */}
      <section className="pt-5 pb-8 sm:pt-7 sm:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-[#F4F3F1] border border-[#E2E2E0] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Left Editorial Pitch */}
            <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#006340] text-white text-[11px] font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>eFootballMarket Verified</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold font-display tracking-[-0.035em] text-[#0F0F0F] leading-[1.08]">
                  Buy &amp; Sell Verified eFootball Squads in Kenya.
                </h1>

                <p className="text-sm sm:text-base text-[#4A4A4A] max-w-lg leading-relaxed">
                  Every listed Mobile and Console squad is verified for Clean Konami ID ownership—no Google Play or Apple links—backed by 24-hour M-Pesa Till 1572931 escrow custody.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/browse">
                    <Button variant="primary" size="lg">
                      <span>Browse Market</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/seller/create-listing">
                    <Button variant="outline" size="lg">
                      <span>Sell Your Squad</span>
                    </Button>
                  </Link>
                </div>

                {/* Popular StockX Trending Pills */}
                <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                  <span className="text-[#5F5F5F] font-medium">Trending:</span>
                  {[
                    { label: "3150+ OVR", href: "/browse?minStrength=3150" },
                    { label: "Gullit", href: "/browse?search=Gullit" },
                    { label: "Vieira", href: "/browse?search=Vieira" },
                    { label: "Under KES 5K", href: "/browse?maxPrice=5000" },
                    { label: "Meta Guides", href: "/news" },
                  ].map((pill) => (
                    <Link
                      key={pill.label}
                      href={pill.href}
                      className="px-2.5 py-1 rounded-full bg-white border border-[#DCDCD8] hover:border-[#0F0F0F] text-[#0F0F0F] font-medium transition-colors"
                    >
                      {pill.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Studio Product Photograph */}
            <div className="lg:col-span-6 relative min-h-[250px] sm:min-h-[340px] bg-[#EAE8E3]">
              <Image
                src="/images/sx-hero-banner.jpg"
                alt="Verified eFootball Mobile and PlayStation squads"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. STOCKX BROWSE BY CATEGORY SHELF */}
      <section className="py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-[#0F0F0F] font-display tracking-tight">
              Browse by Category
            </h2>
            <Link
              href="/browse"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#006340] hover:underline"
            >
              <span>See All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {STOCKX_CATEGORIES.map((cat) => (
              <Link key={cat.title} href={cat.href} className="group block space-y-2.5">
                <div className="relative aspect-square w-full rounded-md bg-[#F4F3F1] border border-[#EAE9E6] group-hover:border-[#0F0F0F] overflow-hidden transition-colors">
                  <Image
                    src={cat.image}
                    alt={cat.title}
                    fill
                    sizes="(max-width: 640px) 50vw, 20vw"
                    className="object-cover group-hover:scale-[1.04] transition-transform duration-300"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F0F0F] group-hover:text-[#006340] transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-[#5F5F5F]">{cat.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. RECENTLY VERIFIED SQUADS SHELF (StockX Product Row) */}
      <section className="py-8 sm:py-10 border-t border-[#E2E2E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#0F0F0F] font-display tracking-tight">
                Recently Listed Squads
              </h2>
              <p className="text-xs text-[#5F5F5F] mt-0.5">
                Live Ask Prices in Kenyan Shillings (KES) · Verified Clean Konami ID Required
              </p>
            </div>
            <Link
              href="/browse"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#006340] hover:underline shrink-0"
            >
              <span>Browse All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-[#F4F3F1] border border-[#E2E2E0] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-xl">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006340] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Zero Synthetic Listings Policy</span>
                </span>
                <h3 className="text-lg font-bold text-[#0F0F0F] font-display">
                  Have a Clean Konami ID Squad Ready to Sell?
                </h3>
                <p className="text-xs sm:text-sm text-[#5F5F5F] leading-relaxed">
                  We never display fake stock—every card on our market is a real user-submitted squad. List your Android, iOS, or Console team for free and get paid via M-Pesa once the buyer verifies in-game.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Link href="/seller/create-listing">
                  <Button variant="primary" size="md">
                    Sell Your Squad
                  </Button>
                </Link>
                <Link href="/wanted">
                  <Button variant="outline" size="md">
                    View Buyer Requests
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. STOCKX VERIFICATION STANDARD & TRADER CHECK */}
      <section className="py-10 sm:py-12 border-t border-[#E2E2E0] bg-[#F9F9F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* 3-Step Verification Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                step: "01",
                title: "Deposit to Safaricom Till 1572931",
                desc: "Buyer funds are locked in platform escrow custody—never sent directly to a stranger's personal M-Pesa number.",
              },
              {
                step: "02",
                title: "Clean Konami ID Verification",
                desc: "Buyer performs Data Transfer and checks Extras -> Support -> Link Data to confirm Google Play & Apple ID are Not Linked.",
              },
              {
                step: "03",
                title: "24-Hour Check & Instant Payout",
                desc: "Once the buyer rebinds my.konami.net email & 2FA (or raises an evidence-backed dispute), settlement completes.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="p-6 rounded-lg bg-white border border-[#E2E2E0] space-y-2"
              >
                <span className="inline-block px-2 py-0.5 rounded bg-[#EBF5F0] text-[#006340] font-mono text-xs font-bold">
                  STEP {item.step}
                </span>
                <h3 className="text-base font-bold text-[#0F0F0F] font-display">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#5F5F5F] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Comparison Table + Instant Scammer Check Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left (7 cols): Comparison Table */}
            <div className="lg:col-span-7 rounded-lg bg-white border border-[#E2E2E0] p-6 sm:p-7 flex flex-col justify-between space-y-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#006340]">
                  Buyer &amp; Seller Protection
                </span>
                <h2 className="text-xl font-bold text-[#0F0F0F] font-display mt-1">
                  Why Kenyan Players Use Verified Escrow Instead of Group Chats
                </h2>
              </div>

              <div className="rounded-md border border-[#E2E2E0] overflow-hidden text-xs">
                <div className="grid grid-cols-12 bg-[#F4F3F1] px-4 py-2.5 font-bold uppercase tracking-wider text-[10px] text-[#5F5F5F] border-b border-[#E2E2E0]">
                  <div className="col-span-5">Verification Point</div>
                  <div className="col-span-3">Direct Chat</div>
                  <div className="col-span-4 text-[#006340]">eFootballMarket</div>
                </div>
                {[
                  {
                    feature: "Payment Custody",
                    bad: "Personal phone",
                    good: "Held via Till 1572931",
                  },
                  {
                    feature: "Google Play / Apple Link",
                    bad: "Still linked to seller",
                    good: "Unlinked or full refund",
                  },
                  {
                    feature: "M-Pesa Receipt Check",
                    bad: "Edited SMS risk",
                    good: "Server-verified receipt",
                  },
                  {
                    feature: "Squad Inspection",
                    bad: "Zero recourse",
                    good: "24-hour full check",
                  },
                ].map((row, idx) => (
                  <div
                    key={row.feature}
                    className={`grid grid-cols-12 items-center px-4 py-3 bg-white ${
                      idx !== 3 ? "border-b border-[#E2E2E0]" : ""
                    }`}
                  >
                    <div className="col-span-5 font-semibold text-[#0F0F0F] pr-2">
                      {row.feature}
                    </div>
                    <div className="col-span-3 text-[#5F5F5F] flex items-center gap-1.5 pr-2">
                      <X className="w-3.5 h-3.5 text-[#C92A2A] shrink-0" />
                      <span className="truncate">{row.bad}</span>
                    </div>
                    <div className="col-span-4 text-[#0F0F0F] font-semibold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#006340] shrink-0" />
                      <span className="truncate">{row.good}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right (5 cols): Trader Phone Check + Middleman */}
            <div className="lg:col-span-5 rounded-lg bg-white border border-[#E2E2E0] p-6 sm:p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FEE2E2] text-[#B91C1C] text-[11px] font-bold uppercase tracking-wider">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Trader Verification</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0F0F0F] font-display">
                  Trading Off-Platform? Check Their Number First.
                </h3>
                <p className="text-xs sm:text-sm text-[#5F5F5F] leading-relaxed">
                  Look up any Kenyan 07... or 01... phone number against community scam reports—or move your WhatsApp deal into a neutral Middleman contract.
                </p>

                <form action="/scammer-check" method="GET" className="pt-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-[#5F5F5F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      name="q"
                      placeholder="Enter 07... number or handle"
                      className="w-full h-10 pl-8 pr-3 rounded-md bg-[#F4F3F1] border border-[#C8C8C4] text-xs text-[#0F0F0F] placeholder:text-[#6B6B6B] focus:bg-white focus:outline-none focus:border-[#0F0F0F]"
                    />
                  </div>
                  <Button type="submit" variant="secondary" size="md" className="h-10 shrink-0">
                    Check
                  </Button>
                </form>
              </div>

              <div className="pt-4 border-t border-[#E2E2E0] flex items-center justify-between gap-3">
                <span className="text-xs text-[#5F5F5F] font-medium">
                  Agreed on a price already?
                </span>
                <Link href="/middleman">
                  <Button variant="outline" size="sm">
                    <Handshake className="w-3.5 h-3.5 text-[#006340]" />
                    <span>Middleman Escrow</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. COMMUNITY TOURNAMENTS (When Active) */}
      {tournaments.length > 0 && (
        <section className="py-10 border-t border-[#E2E2E0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#0F0F0F] font-display">
                  Community Tournaments
                </h2>
                <p className="text-xs text-[#5F5F5F] mt-0.5">
                  Organized 1v1 and knockout eFootball cups in Kenya.
                </p>
              </div>
              <Link
                href="/tournaments"
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#006340] hover:underline shrink-0"
              >
                <span>All Brackets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg bg-white border border-[#E2E2E0] p-5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded bg-[#F4F3F1] text-[#0F0F0F] font-semibold capitalize">
                        {t.status?.replace("_", " ")}
                      </span>
                      <span className="text-[#5F5F5F] font-mono">
                        {t.registered_count || 0}/{t.max_players} slots
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#0F0F0F] font-display">{t.title}</h3>
                    <p className="text-xs text-[#5F5F5F] line-clamp-2">{t.subtitle}</p>
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-[#5F5F5F]">Champion Pool</span>
                      <strong className="text-[#006340] font-mono text-sm">
                        {formatCurrency(t.prize_pool_kes, "KES")}
                      </strong>
                    </div>
                  </div>
                  <div className="pt-4 mt-4 border-t border-[#E2E2E0]">
                    <Link href="/tournaments">
                      <Button variant="outline" size="sm" className="w-full">
                        <Trophy className="w-3.5 h-3.5 text-[#006340]" />
                        <span>View Bracket</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. STOCKX EDITORIAL & META GUIDES SHELF (6 SSR Articles) */}
      {articles.length > 0 && (
        <section className="py-10 sm:py-12 border-t border-[#E2E2E0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#0F0F0F] font-display tracking-tight">
                  Editorial: eFootball 2026 Tactics &amp; Trading Guides
                </h2>
                <p className="text-xs sm:text-sm text-[#5F5F5F] mt-0.5">
                  Team playstyles, 88+ manager stat breakpoints, custom progression builds, 60 FPS mobile tuning &amp; Konami ID safety.
                </p>
              </div>
              <Link
                href="/news"
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#006340] hover:underline shrink-0"
              >
                <span>Read All Guides</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.map((article) => {
                const isAlert = article.category === "scammer_alert";
                const isMeta = article.category === "efootball_news";
                const readMin = Math.max(
                  3,
                  Math.ceil((article.content || "").split(/\s+/).length / 195)
                );
                return (
                  <Link
                    key={article.id}
                    href={`/news/${article.slug}`}
                    className="group flex flex-col justify-between rounded-lg border border-[#E2E2E0] hover:border-[#0F0F0F] bg-white overflow-hidden transition-colors"
                  >
                    <div>
                      <div className="relative h-44 w-full bg-[#F4F3F1] overflow-hidden border-b border-[#E2E2E0]">
                        {article.cover_image_url ? (
                          <Image
                            src={article.cover_image_url}
                            alt={article.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            unoptimized={!article.cover_image_url.startsWith("/")}
                            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          />
                        ) : null}
                      </div>

                      <div className="p-5 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span
                            className={
                              isAlert
                                ? "text-[#B91C1C]"
                                : "text-[#006340]"
                            }
                          >
                            {isAlert
                              ? "SAFETY ADVISORY"
                              : isMeta
                              ? "META & TACTICS"
                              : "VERIFICATION GUIDE"}
                          </span>
                          <span className="text-[#5F5F5F] flex items-center gap-1 font-normal">
                            <Clock className="w-3 h-3" />
                            {readMin} min
                          </span>
                        </div>

                        <h3 className="text-base font-bold font-display text-[#0F0F0F] group-hover:underline line-clamp-2 leading-snug">
                          {article.title}
                        </h3>
                        <p className="text-xs text-[#5F5F5F] line-clamp-2 leading-relaxed">
                          {article.summary}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 pb-4 pt-3 border-t border-[#F0F0EE] flex items-center justify-between text-xs font-semibold text-[#0F0F0F] group-hover:text-[#006340]">
                      <span>Read Article</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 7. FAQ & NAIROBI SUPPORT DESK */}
      <section className="py-10 sm:py-12 border-t border-[#E2E2E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F0F0F] font-display">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-[#5F5F5F] leading-relaxed">
                How Safaricom Till 1572931 custody, Clean Konami ID checks, and seller M-Pesa payouts work.
              </p>
              <div className="rounded-lg bg-[#F4F3F1] border border-[#E2E2E0] p-5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#0F0F0F] font-bold">
                  <Smartphone className="w-4 h-4 text-[#006340]" />
                  <span>Direct Order Support</span>
                </div>
                <p className="text-[#5F5F5F] leading-relaxed">
                  Need assistance with an active escrow order or M-Pesa confirmation? Reach our support desk on WhatsApp at <strong className="text-[#0F0F0F]">0794 400 365</strong>.
                </p>
                <div className="pt-1">
                  <Link href="/contact" className="text-[#006340] hover:underline font-semibold">
                    Contact &amp; Support Hours &rarr;
                  </Link>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <HomeFaqAccordion />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
