"use client";

import { AdBanner } from "@/components/common/AdBanner";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { getCategoryLabel } from "@/lib/data/editorialGuides";
import { isUserAdmin } from "@/lib/security/adminAuth";
import { NewsArticle } from "@/types/database";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  PenSquare,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

function isOptimizableImage(src: string): boolean {
  return (
    src.startsWith("/") ||
    src.includes(".supabase.co/") ||
    src.includes("images.unsplash.com")
  );
}

interface NewsFeedClientProps {
  initialArticles: NewsArticle[];
  initialCategory?: string;
}

export function NewsFeedClient({
  initialArticles,
  initialCategory = "all",
}: NewsFeedClientProps) {
  const { user, profile } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = isUserAdmin(user?.email, profile?.role);

  const counts = useMemo(() => {
    return {
      all: initialArticles.length,
      upcoming: initialArticles.filter(
        (a) => a.category === "update" || a.category === "announcement"
      ).length,
      efootball_news: initialArticles.filter(
        (a) => a.category === "efootball_news"
      ).length,
      escrow_guide: initialArticles.filter((a) => a.category === "escrow_guide")
        .length,
      scammer_alert: initialArticles.filter(
        (a) => a.category === "scammer_alert"
      ).length,
    };
  }, [initialArticles]);

  const filteredArticles = useMemo(() => {
    return initialArticles.filter((a) => {
      if (activeCategory === "upcoming") {
        if (a.category !== "update" && a.category !== "announcement") {
          return false;
        }
      } else if (activeCategory !== "all" && a.category !== activeCategory) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q)
      );
    });
  }, [initialArticles, activeCategory, searchQuery]);

  const featuredArticle =
    filteredArticles.find((a) => a.is_pinned) || filteredArticles[0];

  const upcomingSpotlight = useMemo(() => {
    if (activeCategory !== "all" || searchQuery.trim()) return [];
    return initialArticles
      .filter(
        (a) =>
          a.id !== featuredArticle?.id &&
          (a.category === "update" ||
            a.category === "announcement" ||
            a.slug.includes("masterclass"))
      )
      .slice(0, 3);
  }, [initialArticles, activeCategory, searchQuery, featuredArticle]);

  const upcomingIds = useMemo(
    () => new Set(upcomingSpotlight.map((u) => u.id)),
    [upcomingSpotlight]
  );

  const standardArticles = filteredArticles.filter(
    (a) => a.id !== featuredArticle?.id && !upcomingIds.has(a.id)
  );

  const categoryTabs = [
    { id: "all", label: `All Posts (${counts.all})`, icon: BookOpen },
    {
      id: "upcoming",
      label: `What's Coming & Updates (${counts.upcoming})`,
      icon: Sparkles,
    },
    {
      id: "efootball_news",
      label: `Gameplay & Meta (${counts.efootball_news})`,
      icon: Zap,
    },
    {
      id: "escrow_guide",
      label: `Konami ID & Escrow (${counts.escrow_guide})`,
      icon: ShieldCheck,
    },
    {
      id: "scammer_alert",
      label: `Safety Alerts (${counts.scammer_alert})`,
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="space-y-8">
      {/* BLOGGER HERO HEADER */}
      <div className="rounded-2xl bg-sx-subtle border border-sx-border p-6 sm:p-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2.5 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sx-green-tint border border-sx-green-border text-[11px] font-bold uppercase tracking-wider text-sx-green-text">
            <BookOpen className="w-3.5 h-3.5" />
            <span>eFootballMarket Blog &amp; Guides Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-sx-ink font-display tracking-tight">
            Guides, Meta Tactics &amp; What&apos;s Coming Next
          </h1>
          <p className="text-xs sm:text-sm text-sx-ink-soft leading-relaxed">
            Stay ahead with upcoming eFootball Thursday pack drops, new eFootballMarket features &amp; weekend cash cups, Division 1 tactical guides, 88+ manager stat breakpoints, and step-by-step Clean Konami ID + M-Pesa Till 1572931 escrow walkthroughs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {isAdmin && (
            <Link href="/admin?tab=news">
              <Button variant="primary" size="md">
                <PenSquare className="w-4 h-4" />
                <span>Open Blogger Studio</span>
              </Button>
            </Link>
          )}
          <Link href="/escrow-guarantee">
            <Button variant="outline" size="md">
              <span>Watch Video Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* FILTER TABS + SEARCH */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
          {categoryTabs.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  active
                    ? "bg-sx-green text-white border-sx-green shadow-sm"
                    : "bg-sx-subtle border-sx-border text-sx-ink hover:border-sx-border-strong"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-4 h-4 text-sx-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search upcoming drops, tactics, 2FA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search blog posts and guides"
            className="w-full pl-9 pr-3.5 py-2 rounded-full bg-sx-subtle border border-sx-border focus:bg-sx-canvas focus:border-sx-green text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none"
          />
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="p-10 rounded-xl bg-sx-subtle border border-sx-border text-center space-y-3">
          <BookOpen className="w-8 h-8 text-sx-muted mx-auto" />
          <h2 className="text-base font-bold text-sx-ink font-display">
            No matching blog posts or guides found
          </h2>
          <p className="text-xs text-sx-muted max-w-md mx-auto">
            Try clearing your search or switching back to All Posts to browse every eFootball guide and upcoming release update.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveCategory("all");
              setSearchQuery("");
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-sx-green text-xs font-semibold text-white cursor-pointer"
          >
            Show All Posts
          </button>
        </div>
      ) : (
        <div className="space-y-9">
          {/* 1. FEATURED SPOTLIGHT POST */}
          {featuredArticle && (
            <Link
              href={`/news/${featuredArticle.slug}`}
              className="block group rounded-2xl bg-sx-subtle border border-sx-border hover:border-sx-green-border overflow-hidden transition-all shadow-sm hover:shadow-md"
            >
              <article className="grid grid-cols-1 lg:grid-cols-12">
                {featuredArticle.cover_image_url && (
                  <div className="lg:col-span-5 relative min-h-[230px] sm:min-h-[290px] bg-sx-stone overflow-hidden border-b lg:border-b-0 lg:border-r border-sx-border">
                    <Image
                      src={featuredArticle.cover_image_url}
                      alt={featuredArticle.title}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 480px"
                      unoptimized={!isOptimizableImage(featuredArticle.cover_image_url)}
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  </div>
                )}
                <div
                  className={`${
                    featuredArticle.cover_image_url
                      ? "lg:col-span-7"
                      : "lg:col-span-12"
                  } p-6 sm:p-8 lg:p-9 flex flex-col justify-between space-y-5`}
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-sx-muted">
                      <span
                        className={`px-2.5 py-0.5 rounded-md font-bold border ${
                          getCategoryLabel(featuredArticle.category).color
                        }`}
                      >
                        {getCategoryLabel(featuredArticle.category).label}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-sx-green text-white font-bold">
                        Featured Spotlight
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {Math.max(
                          3,
                          Math.ceil(
                            (featuredArticle.content || "").split(/\s+/).length /
                              195
                          )
                        )}{" "}
                        min read
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold text-sx-ink group-hover:text-sx-green-text transition-colors font-display leading-snug">
                      {featuredArticle.title}
                    </h2>

                    <p className="text-sm text-sx-ink-soft leading-relaxed max-w-3xl">
                      {featuredArticle.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-sx-border text-xs text-sx-muted">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(featuredArticle.created_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                      {featuredArticle.author_name
                        ? ` · ${featuredArticle.author_name}`
                        : ""}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-bold text-sx-green-text">
                      <span>Read Full Post</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          )}

          {/* 2. WHAT'S COMING & NEW RELEASES RADAR */}
          {upcomingSpotlight.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sx-amber-text" />
                  <h2 className="text-base sm:text-lg font-bold text-sx-ink font-display">
                    What&apos;s Coming &amp; Latest Releases
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCategory("upcoming")}
                  className="text-xs font-semibold text-sx-green-text hover:underline cursor-pointer"
                >
                  View All Updates →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {upcomingSpotlight.map((post) => {
                  const badge = getCategoryLabel(post.category);
                  return (
                    <Link
                      key={post.id}
                      href={`/news/${post.slug}`}
                      className="group rounded-xl bg-sx-subtle border border-sx-border hover:border-sx-amber-border p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span
                            className={`px-2 py-0.5 rounded border font-bold ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-sx-muted">
                            {new Date(post.created_at).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-[15px] font-bold text-sx-ink group-hover:text-sx-green-text transition-colors font-display leading-snug line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-xs text-sx-muted line-clamp-2 leading-relaxed">
                          {post.summary}
                        </p>
                      </div>
                      <div className="pt-2.5 border-t border-sx-border/70 flex items-center justify-between text-xs font-semibold text-sx-green-text">
                        <span>Read Update</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. COMPLETE GUIDES & TACTICS LIBRARY */}
          {standardArticles.length > 0 && (
            <div className="space-y-4">
              {activeCategory === "all" && (
                <h2 className="text-base sm:text-lg font-bold text-sx-ink font-display">
                  All Gameplay Guides, Konami ID Walkthroughs &amp; Safety Posts
                </h2>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {standardArticles.map((article) => {
                  const badge = getCategoryLabel(article.category);
                  const readMin = Math.max(
                    3,
                    Math.ceil((article.content || "").split(/\s+/).length / 195)
                  );
                  return (
                    <Link
                      key={article.id}
                      href={`/news/${article.slug}`}
                      className="group rounded-xl bg-sx-subtle border border-sx-border hover:border-sx-green-border hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between transition-all shadow-sm hover:shadow-md"
                    >
                      <article className="flex flex-col justify-between h-full">
                        <div>
                          {article.cover_image_url && (
                            <div className="h-44 w-full bg-sx-stone relative overflow-hidden border-b border-sx-border">
                              <Image
                                src={article.cover_image_url}
                                alt={article.title}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 380px"
                                unoptimized={!isOptimizableImage(article.cover_image_url)}
                                className="object-cover group-hover:scale-[1.04] transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="p-5 space-y-2.5">
                            <div className="flex items-center justify-between gap-2 text-[11px] text-sx-muted">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold border ${badge.color}`}
                              >
                                {badge.label}
                              </span>
                              <span className="flex items-center gap-1 shrink-0">
                                <Clock className="w-3 h-3" />
                                {readMin} min
                              </span>
                            </div>

                            <h3 className="text-[15.5px] font-bold text-sx-ink group-hover:text-sx-green-text transition-colors font-display leading-snug line-clamp-2">
                              {article.title}
                            </h3>

                            <p className="text-xs text-sx-muted leading-relaxed line-clamp-3">
                              {article.summary}
                            </p>
                          </div>
                        </div>

                        <div className="px-5 pb-4 pt-3 border-t border-sx-border flex items-center justify-between text-[11px] text-sx-muted">
                          <span>
                            {new Date(article.created_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                          <span className="inline-flex items-center gap-1 text-sx-green-text font-bold">
                            <span>Read Post</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <AdBanner
        slot="news_feed_bottom"
        format="horizontal"
        hasContent={filteredArticles.length >= 4}
      />
    </div>
  );
}
