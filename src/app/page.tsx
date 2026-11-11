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
import { getCategoryLabel } from "@/lib/data/editorialGuides";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Handshake,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";

export const revalidate = 0;

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
    articles = (articlesResult || []).slice(0, 7);
  } catch (err) {
    console.error("HomePage query error:", err);
  }

  const featuredBlogPost =
    articles.find((a) => a.is_pinned) ||
    articles.find((a) => a.category === "announcement" || a.category === "update") ||
    articles[0];
  const remainingPosts = articles.filter((a) => a.id !== featuredBlogPost?.id);
  const upcomingBriefings = remainingPosts.slice(0, 3);
  const guideCards = remainingPosts.slice(3, 6);

  return (
    <div className="min-h-screen bg-sx-canvas text-sx-ink">
      {/* 1. FRAMED SPLIT HERO BANNER */}
      <section className="pt-5 pb-8 sm:pt-7 sm:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-sx-stone border border-sx-border overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sx-green text-white text-[11px] font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>eFootballMarket Verified</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold font-display tracking-[-0.035em] text-sx-ink leading-[1.08]">
                  Buy &amp; Sell Verified eFootball Squads in Kenya.
                </h1>

                <p className="text-sm sm:text-base text-sx-ink-soft max-w-lg leading-relaxed">
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

                <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                  <span className="text-sx-muted font-medium">Trending:</span>
                  {[
                    { label: "3150+ OVR", href: "/browse?minStrength=3150" },
                    { label: "Gullit", href: "/browse?search=Gullit" },
                    { label: "Vieira", href: "/browse?search=Vieira" },
                    { label: "Under KES 5K", href: "/browse?maxPrice=5000" },
                    { label: "Blog & What's Coming", href: "/news" },
                  ].map((pill) => (
                    <Link
                      key={pill.label}
                      href={pill.href}
                      className="px-2.5 py-1 rounded-full bg-sx-canvas border border-sx-border hover:border-sx-ink text-sx-ink font-medium transition-colors"
                    >
                      {pill.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 relative min-h-[250px] sm:min-h-[340px] bg-sx-elevated">
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

      {/* 2. RECENTLY VERIFIED SQUADS SHELF */}
      <section className="py-8 sm:py-10 border-t border-sx-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display tracking-tight">
                Recently Listed Squads
              </h2>
              <p className="text-xs text-sx-muted mt-0.5">
                Live Ask Prices in Kenyan Shillings (KES) · Verified Clean Konami ID Required
              </p>
            </div>
            <Link
              href="/browse"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-sx-green-text hover:underline shrink-0"
            >
              <span>Browse All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-sx-stone border border-sx-border p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-xl">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sx-green-text uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Real Seller Inventory Only</span>
                </span>
                <h3 className="text-lg font-bold text-sx-ink font-display">
                  Have a Clean Konami ID Squad Ready to Sell?
                </h3>
                <p className="text-xs sm:text-sm text-sx-muted leading-relaxed">
                  We never display placeholder stock—every card on our market is a real user-submitted squad. List your Android, iOS, or Console team for free and get paid via M-Pesa once the buyer verifies in-game.
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

      {/* 4. VERIFICATION STANDARD & TRADER CHECK */}
      <section className="py-10 sm:py-12 border-t border-sx-border bg-sx-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
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
                className="p-6 rounded-lg bg-sx-canvas border border-sx-border space-y-2"
              >
                <span className="inline-block px-2 py-0.5 rounded bg-sx-green-tint text-sx-green-text font-mono text-xs font-bold">
                  STEP {item.step}
                </span>
                <h3 className="text-base font-bold text-sx-ink font-display">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-sx-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 rounded-lg bg-sx-canvas border border-sx-border p-6 sm:p-7 flex flex-col justify-between space-y-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sx-green-text">
                  Buyer &amp; Seller Protection
                </span>
                <h2 className="text-xl font-bold text-sx-ink font-display mt-1">
                  Why Kenyan Players Use Verified Escrow Instead of Group Chats
                </h2>
              </div>

              <div className="rounded-md border border-sx-border overflow-hidden text-xs">
                <div className="grid grid-cols-12 bg-sx-stone px-4 py-2.5 font-bold uppercase tracking-wider text-[10px] text-sx-muted border-b border-sx-border">
                  <div className="col-span-5">Verification Point</div>
                  <div className="col-span-3">Direct Chat</div>
                  <div className="col-span-4 text-sx-green-text">eFootballMarket</div>
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
                    className={`grid grid-cols-12 items-center px-4 py-3 bg-sx-canvas ${
                      idx !== 3 ? "border-b border-sx-border" : ""
                    }`}
                  >
                    <div className="col-span-5 font-semibold text-sx-ink pr-2">
                      {row.feature}
                    </div>
                    <div className="col-span-3 text-sx-muted flex items-center gap-1.5 pr-2">
                      <X className="w-3.5 h-3.5 text-sx-red-text shrink-0" />
                      <span className="truncate">{row.bad}</span>
                    </div>
                    <div className="col-span-4 text-sx-ink font-semibold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-sx-green-text shrink-0" />
                      <span className="truncate">{row.good}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 rounded-lg bg-sx-canvas border border-sx-border p-6 sm:p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sx-red-tint text-sx-red-text text-[11px] font-bold uppercase tracking-wider">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Trader Verification</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
                  Trading Off-Platform? Check Their Number First.
                </h3>
                <p className="text-xs sm:text-sm text-sx-muted leading-relaxed">
                  Look up any Kenyan 07... or 01... phone number against community scam reports—or move your WhatsApp deal into a neutral Middleman contract.
                </p>

                <form action="/scammer-check" method="GET" className="pt-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-sx-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      name="q"
                      placeholder="Enter 07... number or handle"
                      className="w-full h-10 pl-8 pr-3 rounded-md bg-sx-stone border border-sx-border-strong text-xs text-sx-ink placeholder:text-sx-muted focus:bg-sx-canvas focus:outline-none focus:border-sx-ink"
                    />
                  </div>
                  <Button type="submit" variant="secondary" size="md" className="h-10 shrink-0">
                    Check
                  </Button>
                </form>
              </div>

              <div className="pt-4 border-t border-sx-border flex items-center justify-between gap-3">
                <span className="text-xs text-sx-muted font-medium">
                  Agreed on a price already?
                </span>
                <Link href="/middleman">
                  <Button variant="outline" size="sm">
                    <Handshake className="w-3.5 h-3.5 text-sx-green-text" />
                    <span>Middleman Escrow</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. COMMUNITY TOURNAMENTS */}
      {tournaments.length > 0 && (
        <section className="py-10 border-t border-sx-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
                  Community Tournaments
                </h2>
                <p className="text-xs text-sx-muted mt-0.5">
                  Organized 1v1 and knockout eFootball cups in Kenya.
                </p>
              </div>
              <Link
                href="/tournaments"
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-sx-green-text hover:underline shrink-0"
              >
                <span>All Brackets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg bg-sx-canvas border border-sx-border p-5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded bg-sx-stone text-sx-ink font-semibold capitalize">
                        {t.status?.replace("_", " ")}
                      </span>
                      <span className="text-sx-muted font-mono">
                        {t.registered_count || 0}/{t.max_players} slots
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-sx-ink font-display">{t.title}</h3>
                    <p className="text-xs text-sx-muted line-clamp-2">{t.subtitle}</p>
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-sx-muted">Champion Pool</span>
                      <strong className="text-sx-green-text font-mono text-sm">
                        {formatCurrency(t.prize_pool_kes, "KES")}
                      </strong>
                    </div>
                  </div>
                  <div className="pt-4 mt-4 border-t border-sx-border">
                    <Link href="/tournaments">
                      <Button variant="outline" size="sm" className="w-full">
                        <Trophy className="w-3.5 h-3.5 text-sx-green-text" />
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

      {/* 6. BLOG, GUIDES & WHAT'S COMING HUB */}
      {articles.length > 0 && (
        <section className="py-10 sm:py-12 border-t border-sx-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-sx-green-text">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>eFootballMarket Blogger &amp; Guides</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-sx-ink font-display tracking-tight">
                  Guides, Meta Tactics &amp; What&apos;s Coming Next
                </h2>
                <p className="text-xs sm:text-sm text-sx-muted max-w-2xl">
                  Upcoming eFootball pack drops, new platform features, 88+ manager stat breakpoints, custom builds, and Clean Konami ID escrow walkthroughs.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {[
                  { label: "What's Coming", href: "/news?category=upcoming" },
                  { label: "Meta & Tactics", href: "/news?category=efootball_news" },
                  { label: "Konami ID & Escrow", href: "/news?category=escrow_guide" },
                ].map((tab) => (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className="px-3 py-1.5 rounded-full bg-sx-subtle border border-sx-border hover:border-sx-green-border text-xs font-semibold text-sx-ink transition-colors"
                  >
                    {tab.label}
                  </Link>
                ))}
                <Link
                  href="/news"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-sx-green hover:bg-sx-green-hover text-xs font-bold text-white transition-colors"
                >
                  <span>Full Blog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Top Split: Featured What's Coming Spotlight + Latest Updates Feed */}
            {featuredBlogPost && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                <Link
                  href={`/news/${featuredBlogPost.slug}`}
                  className="lg:col-span-7 group rounded-xl bg-sx-subtle border border-sx-border hover:border-sx-green-border overflow-hidden flex flex-col justify-between transition-all shadow-sm hover:shadow-md"
                >
                  <div>
                    {featuredBlogPost.cover_image_url && (
                      <div className="relative h-52 sm:h-64 w-full bg-sx-stone overflow-hidden border-b border-sx-border">
                        <Image
                          src={featuredBlogPost.cover_image_url}
                          alt={featuredBlogPost.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 58vw"
                          unoptimized={!featuredBlogPost.cover_image_url.startsWith("/")}
                          className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-5 sm:p-6 space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span
                          className={`px-2.5 py-0.5 rounded-md border font-bold ${
                            getCategoryLabel(featuredBlogPost.category).color
                          }`}
                        >
                          {getCategoryLabel(featuredBlogPost.category).label}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-sx-green text-white font-bold">
                          Featured Post
                        </span>
                        <span className="text-sx-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.max(
                            3,
                            Math.ceil(
                              (featuredBlogPost.content || "").split(/\s+/).length / 195
                            )
                          )}{" "}
                          min read
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-extrabold font-display text-sx-ink group-hover:text-sx-green-text transition-colors leading-snug">
                        {featuredBlogPost.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-sx-ink-soft leading-relaxed line-clamp-3">
                        {featuredBlogPost.summary}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 sm:px-6 pb-4 pt-3 border-t border-sx-border flex items-center justify-between text-xs font-bold text-sx-green-text">
                    <span>Read Featured Post</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>

                {/* Right Column: What's Coming & Latest Briefings */}
                <div className="lg:col-span-5 rounded-xl bg-sx-subtle border border-sx-border p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-sx-border">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sx-ink uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-sx-amber-text" />
                        <span>Latest Updates &amp; Walkthroughs</span>
                      </span>
                      <Link
                        href="/news?category=upcoming"
                        className="text-[11px] font-semibold text-sx-green-text hover:underline"
                      >
                        See All
                      </Link>
                    </div>

                    <div className="divide-y divide-sx-border">
                      {upcomingBriefings.map((item) => {
                        const badge = getCategoryLabel(item.category);
                        return (
                          <Link
                            key={item.id}
                            href={`/news/${item.slug}`}
                            className="group block py-3.5 first:pt-0 last:pb-0 space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2 text-[10.5px]">
                              <span
                                className={`px-2 py-0.5 rounded border font-bold ${badge.color}`}
                              >
                                {badge.label}
                              </span>
                              <span className="text-sx-muted">
                                {new Date(item.created_at).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-sx-ink group-hover:text-sx-green-text transition-colors font-display leading-snug line-clamp-2">
                              {item.title}
                            </h4>
                            <p className="text-xs text-sx-muted line-clamp-2 leading-relaxed">
                              {item.summary}
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-sx-border">
                    <Link href="/news" className="block">
                      <Button variant="outline" size="sm" className="w-full">
                        <BookOpen className="w-3.5 h-3.5 text-sx-green-text" />
                        <span>Browse All {articles.length}+ Guides &amp; Posts</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom 3 Essential Guides */}
            {guideCards.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {guideCards.map((article) => {
                  const badge = getCategoryLabel(article.category);
                  const readMin = Math.max(
                    3,
                    Math.ceil((article.content || "").split(/\s+/).length / 195)
                  );
                  return (
                    <Link
                      key={article.id}
                      href={`/news/${article.slug}`}
                      className="group flex flex-col justify-between rounded-xl border border-sx-border hover:border-sx-green-border hover:-translate-y-0.5 bg-sx-subtle overflow-hidden transition-all shadow-sm hover:shadow-md"
                    >
                      <div>
                        <div className="relative h-44 w-full bg-sx-stone overflow-hidden border-b border-sx-border">
                          {article.cover_image_url ? (
                            <Image
                              src={article.cover_image_url}
                              alt={article.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              unoptimized={!article.cover_image_url.startsWith("/")}
                              className="object-cover group-hover:scale-[1.04] transition-transform duration-300"
                            />
                          ) : null}
                        </div>

                        <div className="p-5 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-semibold">
                            <span
                              className={`px-2 py-0.5 rounded-md border font-bold ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                            <span className="text-sx-muted flex items-center gap-1 font-normal">
                              <Clock className="w-3 h-3" />
                              {readMin} min
                            </span>
                          </div>

                          <h3 className="text-[15.5px] font-bold font-display text-sx-ink group-hover:text-sx-green-text transition-colors line-clamp-2 leading-snug">
                            {article.title}
                          </h3>
                          <p className="text-xs text-sx-muted line-clamp-2 leading-relaxed">
                            {article.summary}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 pb-4 pt-3 border-t border-sx-border flex items-center justify-between text-xs font-bold text-sx-green-text">
                        <span>Read Guide</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 7. FAQ & SUPPORT DESK */}
      <section className="py-10 sm:py-12 border-t border-sx-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-sx-ink font-display">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-sx-muted leading-relaxed">
                How Safaricom Till 1572931 custody, Clean Konami ID checks, and seller M-Pesa payouts work.
              </p>
              <div className="rounded-lg bg-sx-stone border border-sx-border p-5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-sx-ink font-bold">
                  <Smartphone className="w-4 h-4 text-sx-green-text" />
                  <span>Direct Order Support</span>
                </div>
                <p className="text-sx-muted leading-relaxed">
                  Need assistance with an active escrow order or M-Pesa confirmation? Reach our support desk on WhatsApp at <strong className="text-sx-ink">0794 400 365</strong>.
                </p>
                <div className="pt-1">
                  <Link href="/contact" className="text-sx-green-text hover:underline font-semibold">
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
