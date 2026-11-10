"use client";

import { AdBanner } from "@/components/common/AdBanner";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { isUserAdmin } from "@/lib/security/adminAuth";
import { NewsArticle, NewsCategory } from "@/types/database";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  PenSquare,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export function getCategoryLabel(category: NewsCategory | string) {
  switch (category) {
    case "scammer_alert":
      return {
        label: "Safety Advisory",
        color: "bg-rose-950/70 border-rose-800/60 text-rose-300",
      };
    case "escrow_guide":
      return {
        label: "Escrow & Security Guide",
        color: "bg-[#142922] border-emerald-500/30 text-emerald-300",
      };
    case "efootball_news":
      return {
        label: "eFootball Meta & Guides",
        color: "bg-[#151D2E] border-sky-500/30 text-sky-300",
      };
    case "announcement":
    case "update":
      return {
        label: "Platform Update",
        color: "bg-[#241E12] border-amber-500/30 text-amber-300",
      };
    default:
      return {
        label: "Editorial Guide",
        color: "bg-[#171B24] border-[#283040] text-slate-300",
      };
  }
}

interface NewsFeedClientProps {
  initialArticles: NewsArticle[];
}

export function NewsFeedClient({ initialArticles }: NewsFeedClientProps) {
  const { user, profile } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = isUserAdmin(user?.email, profile?.role);

  const filteredArticles = useMemo(() => {
    return initialArticles.filter((a) => {
      if (activeCategory !== "all" && a.category !== activeCategory) {
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
  const standardArticles = filteredArticles.filter(
    (a) => a.id !== featuredArticle?.id
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1E2636] pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#00E676] mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>eFootball 2026 Knowledge Base &amp; Trading Guides</span>
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-display tracking-tight">
            eFootball Guides, Tactics &amp; Safety Advisories
          </h1>
          <p className="text-sm text-slate-400 max-w-3xl mt-2 leading-relaxed">
            In-depth tactical breakdowns for Quick Counter and Long Ball Counter, 88+ manager stat breakpoints, custom progression builds, 60 FPS mobile tuning, Konami ID 2FA transfers, and M-Pesa escrow security in Kenya.
          </p>
        </div>

        {isAdmin && (
          <Link href="/admin?tab=news" className="shrink-0">
            <Button variant="secondary" size="sm">
              <PenSquare className="w-3.5 h-3.5" />
              <span>New Article</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Category Filter & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: `All Guides (${initialArticles.length})` },
            { id: "efootball_news", label: "Gameplay & Meta" },
            { id: "escrow_guide", label: "Konami ID & Escrow" },
            { id: "scammer_alert", label: "Safety Advisories" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-[#00E676] text-[#07090D] border-[#00E676]"
                  : "bg-[#0D1117] border-[#1E2636] text-slate-300 hover:text-white hover:border-[#2C374D]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search playstyles, boosters, Konami ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search editorial guides"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0D1117] border border-[#1E2636] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00E676]/60"
          />
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="p-10 rounded-xl bg-[#0D1117] border border-[#1E2636] text-center space-y-3">
          <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
          <h2 className="text-base font-semibold text-white font-display">
            No matching guides found
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try clearing your search filter or switching back to All Guides to browse our complete eFootball 2026 library.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveCategory("all");
              setSearchQuery("");
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#151B26] border border-[#263042] text-xs font-semibold text-white hover:border-[#00E676]/50 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Featured Lead Guide */}
          {featuredArticle && (
            <Link
              href={`/news/${featuredArticle.slug}`}
              className="block group rounded-2xl bg-[#0D1117] border border-[#1E2636] hover:border-[#00E676]/50 overflow-hidden transition-all shadow-lg"
            >
              <article className="grid grid-cols-1 lg:grid-cols-12">
                {featuredArticle.cover_image_url && (
                  <div className="lg:col-span-5 relative min-h-[220px] sm:min-h-[260px] bg-[#07090D] overflow-hidden">
                    <img
                      src={featuredArticle.cover_image_url}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover opacity-85 group-hover:scale-[1.03] transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#0D1117]" />
                  </div>
                )}
                <div
                  className={`${
                    featuredArticle.cover_image_url
                      ? "lg:col-span-7"
                      : "lg:col-span-12"
                  } p-6 sm:p-8 flex flex-col justify-between space-y-4`}
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
                      <span
                        className={`px-2.5 py-0.5 rounded-md font-semibold border ${
                          getCategoryLabel(featuredArticle.category).color
                        }`}
                      >
                        {getCategoryLabel(featuredArticle.category).label}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] font-semibold">
                        Featured Guide
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

                    <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-[#00E676] transition-colors font-display leading-snug">
                      {featuredArticle.title}
                    </h2>

                    <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                      {featuredArticle.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#1E2636]/80 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
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
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#00E676] group-hover:translate-x-0.5 transition-transform">
                      <span>Read Full Guide</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          )}

          {/* Editorial Grid */}
          {standardArticles.length > 0 && (
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
                    className="group rounded-xl bg-[#0D1117] border border-[#1E2636] hover:border-[#00E676]/45 overflow-hidden flex flex-col justify-between transition-all"
                  >
                    <article className="flex flex-col justify-between h-full">
                      <div>
                        {article.cover_image_url && (
                          <div className="h-40 w-full bg-[#07090D] relative overflow-hidden border-b border-[#1E2636]">
                            <img
                              src={article.cover_image_url}
                              alt={article.title}
                              loading="lazy"
                              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <div className="p-5 space-y-3">
                          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                            <span
                              className={`px-2 py-0.5 rounded font-semibold border ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                            <span className="flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3" />
                              {readMin} min
                            </span>
                          </div>

                          <h2 className="text-base font-bold text-white group-hover:text-[#00E676] transition-colors font-display leading-snug line-clamp-2">
                            {article.title}
                          </h2>

                          <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                            {article.summary}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 pb-5 pt-3 border-t border-[#1E2636]/60 flex items-center justify-between text-[11px] text-slate-500">
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
                        <span className="inline-flex items-center gap-1 text-[#00E676] font-semibold">
                          <span>Read Guide</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Gated Ad Unit — only renders when real numeric AdSense slot ID is configured and >= 4 articles are visible */}
      <AdBanner
        slot="news_feed_bottom"
        format="horizontal"
        hasContent={filteredArticles.length >= 4}
      />
    </div>
  );
}
