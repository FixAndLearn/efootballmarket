import React, { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { ListingService } from "@/services/listingService";
import { TournamentService } from "@/services/tournamentService";
import { NewsService } from "@/services/newsService";
import { Listing, NewsArticle, Tournament, WantedRequest } from "@/types/database";
import { HomeSquadCatalog } from "@/components/home/HomeSquadCatalog";
import { SmartSearchBar } from "@/components/marketplace/SmartSearchBar";
import { RecentlyViewedRow } from "@/components/marketplace/RecentlyViewedRow";
import { QuietAlertOptIn } from "@/components/common/QuietAlertOptIn";
import { getCategoryLabel } from "@/lib/data/editorialGuides";
import { Button } from "@/components/ui/Button";
import { DetailTabLink } from "@/components/ui/DetailTabLink";
import {
  formatCurrency,
  formatSmartListingTitle,
  getPlatformLabel,
  getShortPlatformLabel,
} from "@/lib/utils";
import {
  ArrowLeftRight,
  ArrowRight,
  Bell,
  BookOpen,
  Clock,
  Handshake,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Store,
  Target,
  Trophy,
} from "lucide-react";

export const revalidate = 0;

export const metadata: Metadata = {
  alternates: {
    canonical: "https://www.efootballmarket.co.ke",
  },
};

/**
 * Streamed async RSC: Live Tournaments & Buyer Squad Requests.
 * Isolated inside <Suspense> so slower secondary queries never delay the
 * above-the-fold Hero or Available Squads LCP!
 */
async function CommunityActivitySection() {
  const supabase = createServerSupabaseClient();
  const adminOrUser = hasServiceRoleKey() ? createAdminClient() : supabase;

  let tournaments: Tournament[] = [];
  let wantedRequests: WantedRequest[] = [];

  try {
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isRealDb = sbUrl && !sbUrl.includes("placeholder-project");

    if (isRealDb) {
      const [tourneysResult, wantedResult] = await Promise.all([
        TournamentService.getAllTournaments().catch(() => []),
        Promise.resolve(
          adminOrUser
            .from("wanted_requests")
            .select("*")
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(3)
        )
          .then((r) => (r.data as WantedRequest[]) || [])
          .catch(() => [] as WantedRequest[]),
      ]);

      tournaments = (tourneysResult || [])
        .filter((t) => t.status !== "completed")
        .slice(0, 3);
      wantedRequests = wantedResult || [];
    }
  } catch {
    // graceful fallback
  }

  const hasActiveTournaments = tournaments.length > 0;
  const hasActiveWanted = wantedRequests.length > 0;

  return (
    <section className="py-8 sm:py-10 border-t border-sx-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {hasActiveTournaments || hasActiveWanted ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Active Tournaments Column */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-sx-ink font-display flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-sx-green-text" />
                  <span>Open 1v1 Tournaments</span>
                </h2>
                <Link
                  href="/tournaments"
                  className="text-xs font-semibold text-sx-green-text hover:underline"
                >
                  All Cups &rarr;
                </Link>
              </div>

              {hasActiveTournaments ? (
                <div className="space-y-3">
                  {tournaments.map((t) => (
                    <Link
                      key={t.id}
                      href="/tournaments"
                      className="block rounded-xl bg-sx-subtle border border-sx-border hover:border-sx-green-border p-4 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs mb-1">
                        <span className="font-bold text-sx-ink truncate">{t.title}</span>
                        <span className="font-mono font-bold text-sx-green-text shrink-0">
                          Prize: {formatCurrency(t.prize_pool_kes, "KES")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-sx-muted">
                        <span>
                          {t.entry_fee_kes > 0
                            ? `Entry: ${formatCurrency(t.entry_fee_kes, "KES")}`
                            : "Free Entry"}{" "}
                          &middot; {t.registered_count || 0}/{t.max_players} Players
                        </span>
                        <span>Join Bracket &rarr;</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-sx-subtle border border-sx-border p-4 space-y-2.5">
                  <p className="text-xs text-sx-muted">
                    No open tournament brackets right now. Get notified when the next cup opens:
                  </p>
                  <QuietAlertOptIn topic="tournament" compact />
                </div>
              )}
            </div>

            {/* Active Buyer Requests Column */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-sx-ink font-display flex items-center gap-2">
                  <Target className="w-4 h-4 text-sx-amber-text" />
                  <span>Buyer Squad Requests</span>
                </h2>
                <Link
                  href="/wanted"
                  className="text-xs font-semibold text-sx-green-text hover:underline"
                >
                  Wanted Board &rarr;
                </Link>
              </div>

              {hasActiveWanted ? (
                <div className="space-y-3">
                  {wantedRequests.map((req) => (
                    <Link
                      key={req.id}
                      href="/wanted"
                      className="block rounded-xl bg-sx-subtle border border-sx-border hover:border-sx-amber-border p-4 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs mb-1">
                        <span className="font-bold text-sx-ink line-clamp-1">
                          {req.title}
                        </span>
                        <span className="font-mono font-bold text-sx-amber-text shrink-0">
                          Budget: {formatCurrency(req.budget_kes, "KES")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-sx-muted">
                        <span>
                          {getPlatformLabel(req.preferred_platform)} &middot;{" "}
                          {req.min_overall_rating}+ OVR
                        </span>
                        <span>Pitch Squad &rarr;</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-sx-subtle border border-sx-border p-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-sx-muted">
                    Looking for a specific OVR or Epic card? Post what you want and let sellers come to you.
                  </p>
                  <Link href="/wanted" className="shrink-0">
                    <Button variant="outline" size="sm">
                      Post Request
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-sx-subtle border border-sx-border p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-sx-ink">
                <Bell className="w-4 h-4 text-sx-green-text shrink-0" />
                <span>
                  Tournaments are quiet right now — get alerted when the next cup opens
                </span>
              </div>
              <QuietAlertOptIn topic="tournament" compact />
            </div>

            <div className="md:border-l md:border-sx-border md:pl-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-sx-ink block">
                  Can&apos;t find the exact squad you want?
                </span>
                <span className="text-xs text-sx-muted block">
                  Post your target OVR, players, and KES budget for sellers to match.
                </span>
              </div>
              <Link href="/wanted" className="shrink-0">
                <Button variant="outline" size="sm">
                  Request a Squad
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Streamed async RSC: Editorial Guides & Platform Updates.
 */
async function GuidesSection() {
  const supabase = createServerSupabaseClient();
  const newsService = new NewsService(supabase);

  let articles: NewsArticle[] = [];
  try {
    const result = await newsService.getPublishedArticles();
    articles = (result || []).slice(0, 3);
  } catch {
    articles = [];
  }

  if (articles.length === 0) return null;

  return (
    <section className="py-9 sm:py-10 border-t border-sx-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sx-green-text" />
              <span>eFootball 2027 Blog &amp; Meta Guides</span>
            </h2>
            <p className="text-xs text-sx-muted mt-0.5">
              Fluid Formation, v6.1 Select Tokens, Dual Link-Up managers, and safe Konami ID escrow.
            </p>
          </div>
          <Link
            href="/news"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-sx-green-text hover:underline shrink-0"
          >
            <span>All Guides</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {articles.map((article) => {
            const badge = getCategoryLabel(article.category);
            const readMin = Math.max(
              3,
              Math.ceil((article.content || "").split(/\s+/).length / 195)
            );
            return (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className="group flex flex-col justify-between rounded-xl border border-sx-border hover:border-sx-green-border bg-sx-subtle p-5 transition-colors space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`px-2 py-0.5 rounded border font-bold ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-sx-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {readMin} min
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-[15px] font-bold font-display text-sx-ink group-hover:text-sx-green-text transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-xs text-sx-muted line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>
                </div>

                <span className="text-xs font-semibold text-sx-green-text inline-flex items-center gap-1 pt-1">
                  <span>Read guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  const listingService = new ListingService(supabase);

  let listings: Listing[] = [];
  let totalSquads = 0;

  try {
    const listingsResult = await listingService
      .getListings({ limit: 16, sortBy: "newest" })
      .catch(() => ({ listings: [], totalCount: 0 }));

    listings = listingsResult.listings || [];
    totalSquads = listingsResult.totalCount || listings.length;
  } catch (err) {
    console.error("HomePage listings query error:", err);
  }

  const lowestPrice =
    listings.length > 0
      ? Math.min(...listings.map((l) => Number(l.price || 0)).filter((p) => p > 0))
      : null;
  const peakOvr =
    listings.length > 0
      ? Math.max(...listings.map((l) => Number(l.overall_team_strength || 0)))
      : null;

  // Top squad with a screenshot for the contextual hero preview card
  const heroSpotlightSquad =
    listings.find(
      (l) =>
        (l.images?.length || 0) > 0 &&
        Number(l.overall_team_strength || 0) >= 3100
    ) || listings[0];

  const homeJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.efootballmarket.co.ke/#website",
        url: "https://www.efootballmarket.co.ke",
        name: "eFootballMarket",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://www.efootballmarket.co.ke/browse?search={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://www.efootballmarket.co.ke/#organization",
        name: "eFootballMarket Kenya",
        url: "https://www.efootballmarket.co.ke",
        logo: "https://www.efootballmarket.co.ke/icon-512.png",
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+254-794-400-365",
          contactType: "customer support",
          areaServed: "KE",
          availableLanguage: ["en", "sw"],
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-sx-canvas text-sx-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* 1. SQUAD-FIRST HERO SCREEN */}
      <section className="pt-4 pb-8 sm:pt-8 sm:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-sx-subtle border border-sx-border grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 min-w-0 p-5 sm:p-9 lg:p-11 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {totalSquads > 0 && (
                  <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-sx-canvas border border-sx-border text-[11px] font-medium text-sx-muted">
                    <span className="w-2 h-2 rounded-full bg-sx-green" />
                    <span className="font-bold text-sx-ink">
                      {totalSquads} Live Squads
                    </span>
                    {lowestPrice ? (
                      <>
                        <span>&middot;</span>
                        <span>From {formatCurrency(lowestPrice, "KES")}</span>
                      </>
                    ) : null}
                    {peakOvr && peakOvr > 3000 ? (
                      <>
                        <span>&middot;</span>
                        <span className="font-mono font-semibold text-sx-green-text">
                          Up to {peakOvr} OVR
                        </span>
                      </>
                    ) : null}
                  </div>
                )}

                <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold font-display tracking-[-0.03em] text-sx-ink leading-[1.1]">
                  Find Your Next eFootball Squad in Kenya.
                </h1>

                {/* Predictive Squad & Service Search Bar */}
                <SmartSearchBar variant="hero" />

                {/* Quick Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-sx-muted font-medium mr-0.5">Popular:</span>
                  {[
                    { label: "Under KES 1,000", href: "/browse?maxPrice=1000" },
                    { label: "3200+ OVR", href: "/browse?minStrength=3200" },
                    { label: "Android", href: "/browse?platform=android" },
                    { label: "iOS", href: "/browse?platform=ios" },
                    { label: "Lowest Price", href: "/browse?sortBy=price_asc" },
                    { label: "Swap Open", href: "/browse?swap=1" },
                  ].map((pill) => (
                    <Link
                      key={pill.label}
                      href={pill.href}
                      className="min-h-[32px] inline-flex items-center px-3 py-1 rounded-full bg-sx-stone/80 hover:bg-sx-elevated border border-sx-border-strong/70 hover:border-sx-green-text text-sx-ink font-semibold transition-colors"
                    >
                      {pill.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Primary CTAs: Browse Squads beside Sell Your Squad */}
              <div className="space-y-4 pt-1">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
                  <Link href="/browse" className="w-full sm:w-auto">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full sm:w-auto min-h-[46px] whitespace-nowrap"
                    >
                      <span>Browse Squads{totalSquads > 0 ? ` (${totalSquads})` : ""}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </Button>
                  </Link>
                  <Link href="/seller/create-listing" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto min-h-[46px] whitespace-nowrap"
                    >
                      <span>Sell Your Squad</span>
                    </Button>
                  </Link>
                </div>

                {/* Crisp 1-Line Escrow Trust Bar + New-Tab Detail Link */}
                <div className="px-3.5 py-2.5 rounded-xl bg-sx-canvas border border-sx-border flex flex-wrap items-center justify-between gap-2 text-xs text-sx-ink-soft">
                  <span className="inline-flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-sx-green-text shrink-0" />
                    <span>
                      <strong className="text-sx-ink">M-Pesa Till 1572931 Hold</strong> · KES 0 Buyer Fee · 24h Login Check
                    </span>
                  </span>
                  <DetailTabLink href="/escrow-guarantee">
                    Detailed Escrow Info
                  </DetailTabLink>
                </div>
              </div>
            </div>

            {/* Contextual Hero Media Panel */}
            <div className="hidden lg:block lg:col-span-5 relative min-h-[360px] bg-sx-elevated border-l border-sx-border rounded-r-2xl overflow-hidden">
              <Image
                src="/images/sx-hero-banner.jpg"
                alt="eFootball Mobile and PlayStation squads in Kenya"
                fill
                priority
                sizes="42vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none" />

              {heroSpotlightSquad && (
                <Link
                  href={`/listings/${heroSpotlightSquad.id}`}
                  className="group absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 hover:border-emerald-400/60 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>
                        In Stock &middot; {getShortPlatformLabel(heroSpotlightSquad.platform)} &middot;{" "}
                        {heroSpotlightSquad.overall_team_strength} OVR
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white truncate mt-0.5 font-display">
                      {formatSmartListingTitle(heroSpotlightSquad)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-sm font-extrabold font-mono text-white">
                      {formatCurrency(heroSpotlightSquad.price, heroSpotlightSquad.currency)}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-300 group-hover:underline">
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. AVAILABLE SQUADS GRID (With Instant Zero-Reload Category Tabs) */}
      <section className="py-8 sm:py-10 border-t border-sx-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-sx-ink font-display tracking-tight">
                Available Squads
              </h2>
              <p className="text-xs text-sx-muted mt-0.5">
                Compare OVR, Epics, Coins, and KES prices · Buyer pays KES 0 extra fee
              </p>
            </div>
            <Link
              href="/browse"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-sx-green-text hover:underline shrink-0"
            >
              <span>Compare All Squads</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {listings.length > 0 ? (
            <HomeSquadCatalog listings={listings} totalSquads={totalSquads} />
          ) : (
            <div className="rounded-xl bg-sx-subtle border border-sx-border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-lg">
                <h3 className="text-base font-bold text-sx-ink font-display">
                  No open squads listed right now
                </h3>
                <p className="text-xs sm:text-sm text-sx-muted leading-relaxed">
                  We only show real seller accounts — never fake placeholder stock. Get alerted when the next squad is listed, or list your own Clean Konami ID squad for free.
                </p>
              </div>
              <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <QuietAlertOptIn topic="new_squads" compact />
                <Link href="/seller/create-listing">
                  <Button variant="outline" size="md" className="w-full sm:w-auto h-10">
                    Sell Your Squad
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2B. RECENTLY INSPECTED SQUADS (Aligned Full-Width Section) */}
      <RecentlyViewedRow title="Continue Inspecting" minItems={1} />

      {/* 3. OUR MARKETPLACE, ESCROW & CONCIERGE SERVICES */}
      <section className="py-9 sm:py-11 border-t border-sx-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sx-green-text block mb-1">
                eFootballMarket Kenya Services
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-sx-ink font-display tracking-tight">
                Everything Our Desk Handles For Kenyan Players
              </h2>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1 text-xs font-semibold text-sx-green-text hover:underline"
            >
              <span>Book 1-on-1 Concierge Help</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Store,
                title: "Buy & Sell Verified Squads",
                desc: "List your Clean Konami ID squad for free or buy verified Android, iOS, PS5 & PC accounts with KES 0 extra buyer fee and 24-hour login inspection.",
                cta: "List or Browse Squads",
                href: "/seller/create-listing",
              },
              {
                icon: Handshake,
                title: "WhatsApp & Facebook Middleman",
                desc: "Agreed on a squad deal in a WhatsApp group, TikTok, or Facebook? Generate an official Deal Code and hold payment safely in M-Pesa Till 1572931.",
                cta: "Open Middleman Contract",
                href: "/middleman",
              },
              {
                icon: Target,
                title: "Custom Squad Sourcing",
                desc: "Looking for 3150+ OVR or specific Epics like Gullit, Vieira, or Blitz Curler Son? Post your KES budget and let our desk & verified sellers match you.",
                cta: "Request Your Dream Squad",
                href: "/wanted",
              },
              {
                icon: ArrowLeftRight,
                title: "Account Swap + Cash Top-Up",
                desc: "Upgrade your current squad safely—propose a Clean Konami ID trade-in plus M-Pesa top-up settled through neutral Order Room inspection.",
                cta: "Start Protected Swap",
                href: "/middleman?title=Account%20Swap%20%2B%20Cash%20Top-Up",
              },
              {
                icon: Trophy,
                title: "1v1 Matches & Paid Cup Hosting",
                desc: "Enter competitive 1v1 fixtures or host 4–16 player knockout tournaments for your clan with automated brackets and M-Pesa prize pool custody.",
                cta: "Explore or Host Cups",
                href: "/tournaments",
              },
              {
                icon: ShieldAlert,
                title: "Free Phone Check & Handover Help",
                desc: "Check any 07.../01... phone number for verified fraud reports before trading, or chat with Brian Okibo's Nairobi desk for Konami ID rebinding support.",
                cta: "Run Trader Phone Check",
                href: "/scammer-check",
              },
            ].map((srv) => {
              const Icon = srv.icon;
              return (
                <Link
                  key={srv.title}
                  href={srv.href}
                  className="group p-5 rounded-2xl bg-sx-subtle hover:bg-sx-stone border border-sx-border hover:border-sx-green-border transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sx-canvas border border-sx-border flex items-center justify-center text-sx-green-text group-hover:border-sx-green-border transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm sm:text-[15px] font-bold text-sx-ink font-display group-hover:text-sx-green-text transition-colors">
                      {srv.title}
                    </h3>
                    <p className="text-xs text-sx-muted leading-relaxed">{srv.desc}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-sx-green-text">
                    <span>{srv.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. COMPACT 4-STEP ESCROW STRIP */}
      <section className="py-8 sm:py-9 border-t border-sx-border bg-sx-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
                How Buying &amp; Selling Works
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <DetailTabLink href="/escrow-guarantee" variant="pill">
                Full Rules &amp; Fee Table
              </DetailTabLink>
              <DetailTabLink href="/dispute-policy" variant="pill">
                Refund Guarantee
              </DetailTabLink>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                num: "01",
                step: "Pay Till 1572931",
                desc: "KES 0 extra buyer fee. Funds lock on the platform.",
              },
              {
                num: "02",
                step: "12h Seller Delivery",
                desc: "Logins & OTP delivered inside encrypted Order Room.",
              },
              {
                num: "03",
                step: "24h Login Check",
                desc: "Verify squad & Link Data = Not Linked, then rebind email.",
              },
              {
                num: "04",
                step: "Release or Refund",
                desc: "Confirm to pay seller, or tap Open Dispute for review.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="p-4 rounded-xl bg-sx-canvas border border-sx-border space-y-1"
              >
                <span className="text-[10px] font-mono font-bold text-sx-green-text">
                  STEP {item.num}
                </span>
                <h3 className="text-sm font-bold text-sx-ink font-display">{item.step}</h3>
                <p className="text-xs text-sx-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. STREAMED TOURNAMENTS & BUYER SQUAD REQUESTS */}
      <Suspense
        fallback={
          <section className="py-8 sm:py-10 border-t border-sx-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="h-24 rounded-xl bg-sx-subtle border border-sx-border animate-pulse" />
            </div>
          </section>
        }
      >
        <CommunityActivitySection />
      </Suspense>

      {/* 6. STREAMED GUIDES & PLATFORM UPDATES */}
      <Suspense
        fallback={
          <section className="py-9 sm:py-10 border-t border-sx-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-xl bg-sx-subtle border border-sx-border animate-pulse"
                />
              ))}
            </div>
          </section>
        }
      >
        <GuidesSection />
      </Suspense>

      {/* 7. CLEAN QUICK-REFERENCE & SUPPORT STRIP (Opens Detailed Info in New Tab) */}
      <section className="py-8 sm:py-10 border-t border-sx-border bg-sx-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-sx-canvas border border-sx-border p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-sx-green-text uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Detailed Guides, Fees &amp; Human Support</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
                Need detailed rules or live handover help?
              </h2>
              <p className="text-xs sm:text-sm text-sx-muted">
                Every guide and policy opens in a separate reference tab so you never lose your place. Nairobi desk:{" "}
                <a
                  href="https://wa.me/254794400365"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-sx-ink underline hover:text-sx-green-text"
                >
                  WhatsApp 0794 400 365
                </a>{" "}
                (8 AM – 10 PM EAT).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <DetailTabLink href="/escrow-guarantee" variant="pill">
                Escrow &amp; Fee Table
              </DetailTabLink>
              <DetailTabLink href="/dispute-policy" variant="pill">
                Refund &amp; Dispute Rules
              </DetailTabLink>
              <DetailTabLink
                href="/news/how-to-verify-clean-konami-id-before-releasing-escrow"
                variant="pill"
              >
                Clean Konami ID Guide
              </DetailTabLink>
              <DetailTabLink href="/seller/guidelines" variant="pill">
                Seller Payout Rules
              </DetailTabLink>
              <DetailTabLink href="/terms" variant="pill">
                Terms of Service
              </DetailTabLink>
              <DetailTabLink href="/privacy" variant="pill">
                Privacy Policy
              </DetailTabLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
