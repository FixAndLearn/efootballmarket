import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AnalyticsService } from "@/services/analyticsService";
import { ListingService } from "@/services/listingService";
import { NewsService } from "@/services/newsService";
import { TournamentService } from "@/services/tournamentService";
import { Listing, NewsArticle, Tournament } from "@/types/database";
import { ListingCard3D } from "@/components/marketplace/ListingCard3D";
import { HomeFaqAccordion } from "@/components/home/HomeFaqAccordion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Handshake,
  Lock,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Target,
  Trophy,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 0;

const STOREFRONT_CATEGORIES = [
  {
    title: "3150+ Division 1 Squads",
    subtitle: "High-strength meta lineups & booster managers",
    tag: "3150+ OVR",
    tagStyle: "bg-amber-500/20 border-amber-400/40 text-amber-300",
    image: "/images/cat-elite.jpg",
    href: "/browse?minStrength=3150",
  },
  {
    title: "Stacked Epic & Big Time",
    subtitle: "Gullit, Vieira, Maldini & double-booster legends",
    tag: "EPIC ROSTERS",
    tagStyle: "bg-amber-500/20 border-amber-400/40 text-amber-300",
    image: "/images/cat-epics.jpg",
    href: "/browse?search=Epic",
  },
  {
    title: "Starter & Budget Squads",
    subtitle: "Unlinked Android & iOS accounts under KES 5,000",
    tag: "UNDER KES 5K",
    tagStyle: "bg-emerald-500/20 border-emerald-400/40 text-emerald-300",
    image: "/images/cat-budget.jpg",
    href: "/browse?maxPrice=5000",
  },
  {
    title: "WhatsApp / FB Middleman",
    subtitle: "Lock off-platform deals via M-Pesa Till 1572931",
    tag: "TILL 1572931",
    tagStyle: "bg-emerald-500/20 border-emerald-400/40 text-emerald-300",
    image: "/images/cat-middleman.jpg",
    href: "/middleman",
  },
];

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
      listingService.getListings({ limit: 8, sortBy: "newest" }).catch(() => ({ listings: [], totalCount: 0 })),
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
      {/* 1. FRAMED PRO GAMING STADIUM HERO */}
      <section className="pt-5 pb-8 sm:pt-7 sm:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-[#1E2636] bg-[#0B0F16] overflow-hidden shadow-panel">
            {/* Stadium Floodlight Backdrop */}
            <div className="absolute inset-0 pointer-events-none select-none">
              <Image
                src="/images/hero-stadium.jpg"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-center opacity-55"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#07090D] via-[#07090D]/90 to-[#07090D]/45" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07090D] via-transparent to-[#07090D]/40" />
            </div>

            <div className="relative z-10 p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left: Storefront Pitch & Search Dock */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-300">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    M-PESA TILL 1572931
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-[#131923]/90 border border-[#242E42] text-slate-300">
                    24H BUYER CHECK
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-[#131923]/90 border border-[#242E42] text-slate-300">
                    KONAMI ID ONLY
                  </span>
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-5xl lg:text-[50px] font-bold font-display tracking-[-0.03em] text-white leading-[1.06]">
                    Trade Verified eFootball Squads in Kenya.
                  </h1>
                  <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                    Buy unlinked Android, iOS, and console accounts with automated M-Pesa payment hold—or list your squad and get paid once the buyer verifies in-game.
                  </p>
                </div>

                {/* High-Contrast Storefront Search Dock */}
                <div className="max-w-xl space-y-3">
                  <form
                    action="/browse"
                    method="GET"
                    className="flex items-center p-1.5 rounded-xl bg-[#0D1117]/95 border border-[#283348] focus-within:border-emerald-500 shadow-2xl transition-colors"
                  >
                    <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
                    <input
                      type="text"
                      name="search"
                      placeholder="Search player, coach, or OVR (e.g. Gullit, Vieira, 3180)..."
                      className="w-full px-3 py-2.5 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                    />
                    <Button type="submit" variant="primary" size="md" className="shrink-0 px-5">
                      Search
                    </Button>
                  </form>

                  {/* Popular Filter Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-slate-400 font-medium mr-1">Popular:</span>
                    {[
                      { label: "3150+ OVR", href: "/browse?minStrength=3150" },
                      { label: "Gullit", href: "/browse?search=Gullit" },
                      { label: "Vieira", href: "/browse?search=Vieira" },
                      { label: "Android", href: "/browse?platform=android" },
                      { label: "iOS", href: "/browse?platform=ios" },
                      { label: "Under KES 5K", href: "/browse?maxPrice=5000" },
                    ].map((tag) => (
                      <Link
                        key={tag.label}
                        href={tag.href}
                        className="px-2.5 py-1 rounded-md bg-[#111620]/90 hover:bg-[#192130] border border-[#242E42] hover:border-slate-600 text-slate-300 hover:text-white transition-colors"
                      >
                        {tag.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Primary Storefront CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link href="/browse">
                    <Button variant="primary" size="lg">
                      <span>Explore Marketplace</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/seller/create-listing">
                    <Button variant="secondary" size="lg" className="bg-[#131923]/90 border-[#283348]">
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span>List Your Squad</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right: Machined Live M-Pesa Escrow HUD */}
              <div className="lg:col-span-5">
                <div className="rounded-xl bg-[#0D1117]/95 backdrop-blur-md border border-[#232D40] shadow-panel p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#1E2636]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                          Escrow Order Flow
                        </h2>
                        <p className="text-[11px] text-slate-400">Safaricom Lipa Na M-Pesa</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-[#131923] border border-[#253045] font-mono text-xs font-bold text-emerald-400">
                      Till 1572931
                    </span>
                  </div>

                  {/* 4-Stage Pipeline */}
                  <div className="space-y-2.5">
                    {[
                      {
                        step: "01",
                        title: "Buyer Pays via STK Push",
                        meta: "LOCKED",
                        desc: "Payment is held on Till 1572931—never sent directly to the seller's personal line.",
                      },
                      {
                        step: "02",
                        title: "Encrypted Konami ID Delivery",
                        meta: "≤ 12 HRS",
                        desc: "Seller submits login credentials and shares the email change code in order chat.",
                      },
                      {
                        step: "03",
                        title: "In-Game & Link Data Check",
                        meta: "24H WINDOW",
                        desc: "Verify squad OVR, confirm Google Play & Apple show Not Linked, and bind your email.",
                      },
                      {
                        step: "04",
                        title: "Instant Payout or Refund",
                        meta: "AUTOMATED",
                        desc: "Confirm to release seller M-Pesa payout, or open a dispute for a 100% refund.",
                      },
                    ].map((item) => (
                      <div
                        key={item.step}
                        className="p-3 rounded-lg bg-[#131923] border border-[#20293A] flex items-start gap-3"
                      >
                        <span className="px-1.5 py-0.5 rounded bg-[#0D1117] border border-[#273246] font-mono text-[11px] font-bold text-emerald-400 shrink-0 mt-0.5">
                          {item.step}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-white truncate">
                              {item.title}
                            </span>
                            <span className="text-[10px] font-mono font-semibold text-slate-400 shrink-0">
                              {item.meta}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3 text-xs border-t border-[#1E2636]">
                    <Link
                      href="/middleman"
                      className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-medium transition-colors"
                    >
                      <Handshake className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Use for WhatsApp/FB deal</span>
                    </Link>
                    <Link
                      href="/escrow-guarantee"
                      className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      <span>Protection rules</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STOREFRONT CATEGORY TILES (ELDORADO / EPIC STORE STYLE) */}
      <section className="pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white font-display">
                Shop by Squad Tier
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Jump straight to Division 1 rosters, stacked Epic legends, or off-platform escrow.
              </p>
            </div>
            <Link
              href="/friday-drops"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-300 hover:text-amber-200 shrink-0"
            >
              <span>Friday 8H Drops</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STOREFRONT_CATEGORIES.map((cat) => (
              <Link
                key={cat.title}
                href={cat.href}
                className="group relative h-48 rounded-xl overflow-hidden border border-[#1E2636] hover:border-emerald-500/60 bg-[#0D1117] shadow-card flex flex-col justify-between p-4 transition-all"
              >
                <Image
                  src={cat.image}
                  alt={cat.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07090D] via-[#07090D]/65 to-black/25" />

                <div className="relative z-10 flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-sm ${cat.tagStyle}`}
                  >
                    {cat.tag}
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-[#0D1117]/80 border border-[#253045] flex items-center justify-center text-slate-300 group-hover:text-emerald-400 group-hover:border-emerald-500/50 transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>

                <div className="relative z-10 space-y-1">
                  <h3 className="text-base font-bold font-display text-white group-hover:text-emerald-300 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-1">
                    {cat.subtitle}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. LIVE MARKETPLACE SQUADS GRID */}
      <section className="py-12 border-t border-[#181F2C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                  Available Squads
                </h2>
                {metrics.activeListingsCount > 0 && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-300">
                    {metrics.activeListingsCount} LIVE
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Verified unlinked Konami ID accounts ready for immediate M-Pesa STK checkout.
              </p>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { label: "All", href: "/browse", active: true },
                { label: "3150+ OVR", href: "/browse?minStrength=3150" },
                { label: "Android", href: "/browse?platform=android" },
                { label: "iOS", href: "/browse?platform=ios" },
                { label: "Under 5K", href: "/browse?maxPrice=5000" },
              ].map((pill) => (
                <Link
                  key={pill.label}
                  href={pill.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors ${
                    pill.active
                      ? "bg-[#131923] border-emerald-500/40 text-white"
                      : "bg-[#0D1117] border-[#1E2636] text-slate-400 hover:text-white hover:border-slate-600"
                  }`}
                >
                  {pill.label}
                </Link>
              ))}
            </div>
          </div>

          {listings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {listings.map((item) => (
                  <ListingCard3D key={item.id} listing={item} />
                ))}
              </div>
              <div className="pt-2 flex justify-center">
                <Link href="/browse">
                  <Button variant="secondary" size="lg" className="px-8">
                    <span>View All Marketplace Squads</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            /* Rich 2-Column Storefront Action Split when catalog has 0 active rows */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="relative rounded-2xl overflow-hidden store-panel p-6 sm:p-8 flex flex-col justify-between min-h-[240px]">
                <Image
                  src="/images/cat-elite.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover opacity-20 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0D1117] via-[#0D1117]/90 to-[#0D1117]/60 pointer-events-none" />

                <div className="relative z-10 space-y-2.5 max-w-md">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-300 uppercase">
                    All Current Squads Sold / In Inspection
                  </span>
                  <h3 className="text-xl font-bold font-display text-white">
                    Have a Clean Konami ID Squad to Sell?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Publish your Starting XI screenshots and KES price in 2 minutes. Buyers pay upfront into Till 1572931 before you ever share credentials, and you withdraw straight to M-Pesa.
                  </p>
                </div>

                <div className="relative z-10 pt-5 flex flex-wrap items-center gap-3">
                  <Link href="/seller/create-listing">
                    <Button variant="primary" size="md">
                      <Plus className="w-4 h-4" />
                      <span>List Squad for Sale</span>
                    </Button>
                  </Link>
                  <Link href="/seller/guidelines">
                    <Button variant="secondary" size="md">
                      <span>Seller Rules</span>
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden store-panel p-6 sm:p-8 flex flex-col justify-between min-h-[240px]">
                <Image
                  src="/images/cat-budget.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover opacity-20 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0D1117] via-[#0D1117]/90 to-[#0D1117]/60 pointer-events-none" />

                <div className="relative z-10 space-y-2.5 max-w-md">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300 uppercase">
                    Buyer Request Board
                  </span>
                  <h3 className="text-xl font-bold font-display text-white">
                    Hunting for a Specific Player or OVR?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Post your target OVR, desired Epic cards (Gullit, Vieira, Blitz Curler), and KES budget on the Wanted Board. Verified Kenyan sellers will send matching squads directly to you.
                  </p>
                </div>

                <div className="relative z-10 pt-5 flex flex-wrap items-center gap-3">
                  <Link href="/wanted">
                    <Button variant="gold" size="md">
                      <Target className="w-4 h-4" />
                      <span>Post on Wanted Board</span>
                    </Button>
                  </Link>
                  <Link href="/friday-drops">
                    <Button variant="secondary" size="md">
                      <span>Friday 8H Drops</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. SAFETY MATRIX + INSTANT TRADER BLACKLIST CHECK */}
      <section className="py-12 border-t border-[#181F2C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left (7 cols): Why Traders Use Till 1572931 Comparison */}
            <div className="lg:col-span-7 store-panel rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-white font-display">
                  Why Kenyan Players Trade Through Till 1572931
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Side-by-side comparison between unverified group chats and platform-held M-Pesa checkout.
                </p>
              </div>

              <div className="rounded-xl border border-[#1E2636] overflow-hidden text-xs">
                <div className="grid grid-cols-12 bg-[#131923] border-b border-[#1E2636] px-4 py-2.5 font-mono font-semibold text-[11px] uppercase tracking-wider text-slate-400">
                  <div className="col-span-5">Checkpoint</div>
                  <div className="col-span-3 text-rose-400">Group DM</div>
                  <div className="col-span-4 text-emerald-400">eFootballMarket</div>
                </div>

                {[
                  {
                    feature: "M-Pesa Payment Custody",
                    bad: "Sent to stranger",
                    good: "Held on Till 1572931",
                  },
                  {
                    feature: "Google Play / Apple Link",
                    bad: "Hidden backdoor",
                    good: "Unlinked or full refund",
                  },
                  {
                    feature: "Fake M-Pesa SMS Risk",
                    bad: "Edited screenshots",
                    good: "Safaricom API callback",
                  },
                  {
                    feature: "Inspection Window",
                    bad: "Blocked after pay",
                    good: "24-hour full squad check",
                  },
                ].map((row, idx) => (
                  <div
                    key={row.feature}
                    className={`grid grid-cols-12 items-center px-4 py-3 ${
                      idx !== 3 ? "border-b border-[#181F2C]" : ""
                    }`}
                  >
                    <div className="col-span-5 font-medium text-slate-200 pr-2">
                      {row.feature}
                    </div>
                    <div className="col-span-3 text-slate-400 flex items-center gap-1.5 pr-2">
                      <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">{row.bad}</span>
                    </div>
                    <div className="col-span-4 text-slate-100 font-medium flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{row.good}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right (5 cols): Quick Blacklist Check + Middleman */}
            <div className="lg:col-span-5 store-panel rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/15 border border-rose-500/30 text-[11px] font-mono font-bold text-rose-300">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>TRADER VERIFICATION</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white font-display">
                  Trading on WhatsApp or Facebook? Check Their Number First.
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Run any Kenyan `07...` / `01...` mobile number or handle against reported scam incidents—or lock the deal inside a neutral Middleman contract.
                </p>

                <form action="/scammer-check" method="GET" className="pt-1 flex items-center gap-2">
                  <input
                    type="text"
                    name="q"
                    placeholder="Enter 07... number or handle"
                    className="flex-1 h-10 px-3.5 rounded-lg bg-[#131923] border border-[#242E42] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                  />
                  <Button type="submit" variant="danger" size="md" className="h-10 shrink-0">
                    Check
                  </Button>
                </form>
              </div>

              <div className="pt-4 border-t border-[#1E2636] flex items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  Agreed on a price already?
                </div>
                <Link href="/middleman">
                  <Button variant="secondary" size="sm">
                    <Handshake className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Open Middleman Contract</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TOURNAMENTS (When Active) */}
      {tournaments.length > 0 && (
        <section className="py-12 border-t border-[#181F2C]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                  1v1 Community Tournaments
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Knockout eFootball brackets with verified M-Pesa prize pools.
                </p>
              </div>
              <Link
                href="/tournaments"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 shrink-0"
              >
                <span>All Brackets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  className="store-panel rounded-xl p-5 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded bg-[#131923] border border-[#242E42] text-slate-300 capitalize">
                        {t.status?.replace("_", " ")}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {t.registered_count || 0}/{t.max_players} slots
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white font-display">{t.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{t.subtitle}</p>
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Prize Pool</span>
                      <strong className="text-emerald-400 font-mono text-sm">
                        {formatCurrency(t.prize_pool_kes, "KES")}
                      </strong>
                    </div>
                  </div>
                  <div className="pt-4 mt-4 border-t border-[#1E2636]">
                    <Link href="/tournaments">
                      <Button variant="secondary" size="sm" className="w-full">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
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

      {/* 6. VISUAL TRADING GUIDES & SECURITY BRIEFINGS */}
      {articles.length > 0 && (
        <section className="py-12 border-t border-[#181F2C]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                  Trading Guides &amp; Security Briefings
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Essential walkthroughs for Konami ID transfers, Link Data checks, and M-Pesa escrow safety.
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
                    className="store-panel rounded-xl overflow-hidden hover:border-slate-600 flex flex-col justify-between transition-colors group"
                  >
                    <div>
                      <div className="relative h-44 w-full bg-[#131923] overflow-hidden border-b border-[#1E2636]">
                        {article.cover_image_url ? (
                          <Image
                            src={article.cover_image_url}
                            alt={article.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            unoptimized={!article.cover_image_url.startsWith("/")}
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-transparent to-black/30" />
                        <span
                          className={`absolute top-3 left-3 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border backdrop-blur-sm ${
                            isAlert
                              ? "bg-rose-950/80 text-rose-300 border-rose-700/60"
                              : "bg-[#0D1117]/85 text-emerald-300 border-emerald-500/35"
                          }`}
                        >
                          {isAlert ? "Safety Advisory" : "Handover Guide"}
                        </span>
                      </div>

                      <div className="p-5 space-y-2">
                        <h3 className="text-base font-bold font-display text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                          {article.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {article.summary}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 pb-4 pt-3 border-t border-[#181F2C] flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-white">
                      <span>Read briefing</span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 7. FAQ & SUPPORT SPLIT */}
      <section className="py-12 border-t border-[#181F2C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Everything you need to know about Safaricom Till 1572931 deposits, 24-hour squad verification, and seller payouts.
              </p>
              <div className="store-panel rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Direct Order Support</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Need help with an active trade or M-Pesa confirmation? Reach our Nairobi desk on WhatsApp at <strong className="text-slate-200">0794 400 365</strong>.
                </p>
                <div className="pt-1">
                  <Link href="/contact" className="text-emerald-400 hover:text-emerald-300 font-semibold">
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
