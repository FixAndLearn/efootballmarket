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
        color: "bg-[#FEE2E2] border-[#FECACA] text-[#B91C1C]",
      };
    case "escrow_guide":
      return {
        label: "Verification & Escrow",
        color: "bg-[#EBF5F0] border-[#BFE0CE] text-[#006340]",
      };
    case "efootball_news":
      return {
        label: "Meta & Tactics",
        color: "bg-[#F4F3F1] border-[#DCDCD8] text-[#0F0F0F]",
      };
    case "announcement":
    case "update":
      return {
        label: "Platform Update",
        color: "bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]",
      };
    default:
      return {
        label: "Editorial Guide",
        color: "bg-[#F4F3F1] border-[#E2E2E0] text-[#0F0F0F]",
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
      {/* StockX Editorial Magazine Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2E2E0] pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#006340] mb-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>eFootballMarket Editorial</span>
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0F0F0F] font-display tracking-tight">
            eFootball 2026 Guides, Tactics &amp; Safety
          </h1>
          <p className="text-sm text-[#5F5F5F] max-w-3xl mt-1.5 leading-relaxed">
            In-depth tactical breakdowns for Quick Counter and Long Ball Counter, 88+ manager stat breakpoints, custom progression builds, 60 FPS mobile tuning, Konami ID 2FA transfers, and M-Pesa escrow security in Kenya.
          </p>
        </div>

        {isAdmin && (
          <Link href="/admin?tab=news" className="shrink-0">
            <Button variant="secondary" size="sm">
              <PenSquare className="w-3.5 h-3.5" />
              <span>Publish Guide</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Category Filter Pills & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: `All (${initialArticles.length})` },
            { id: "efootball_news", label: "Gameplay & Meta" },
            { id: "escrow_guide", label: "Konami ID & Escrow" },
            { id: "scammer_alert", label: "Safety Advisories" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-[#0F0F0F] text-white border-[#0F0F0F]"
                  : "bg-[#F4F3F1] border-transparent text-[#0F0F0F] hover:border-[#C8C8C4]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#5F5F5F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search playstyles, boosters, Konami ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search editorial guides"
            className="w-full pl-9 pr-3 py-2 rounded-md bg-[#F4F3F1] border border-transparent focus:bg-white focus:border-[#0F0F0F] text-xs text-[#0F0F0F] placeholder-[#6B6B6B] focus:outline-none"
          />
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="p-10 rounded-lg bg-[#F9F9F8] border border-[#E2E2E0] text-center space-y-3">
          <BookOpen className="w-8 h-8 text-[#5F5F5F] mx-auto" />
          <h2 className="text-base font-bold text-[#0F0F0F] font-display">
            No matching guides found
          </h2>
          <p className="text-xs text-[#5F5F5F] max-w-md mx-auto">
            Try clearing your search filter or switching back to All Guides to view our complete eFootball 2026 library.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveCategory("all");
              setSearchQuery("");
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0F0F0F] text-xs font-semibold text-white cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Featured Lead Story (StockX Editorial Split Card) */}
          {featuredArticle && (
            <Link
              href={`/news/${featuredArticle.slug}`}
              className="block group rounded-lg bg-[#F4F3F1] border border-[#E2E2E0] hover:border-[#0F0F0F] overflow-hidden transition-colors"
            >
              <article className="grid grid-cols-1 lg:grid-cols-12">
                {featuredArticle.cover_image_url && (
                  <div className="lg:col-span-5 relative min-h-[220px] sm:min-h-[270px] bg-[#EAE8E3] overflow-hidden">
                    <img
                      src={featuredArticle.cover_image_url}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  </div>
                )}
                <div
                  className={`${
                    featuredArticle.cover_image_url
                      ? "lg:col-span-7"
                      : "lg:col-span-12"
                  } p-6 sm:p-9 flex flex-col justify-between space-y-4`}
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#5F5F5F]">
                      <span
                        className={`px-2.5 py-0.5 rounded font-semibold border ${
                          getCategoryLabel(featuredArticle.category).color
                        }`}
                      >
                        {getCategoryLabel(featuredArticle.category).label}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#006340] text-white font-semibold">
                        Featured
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

                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F0F0F] group-hover:underline font-display leading-snug">
                      {featuredArticle.title}
                    </h2>

                    <p className="text-sm text-[#4A4A4A] leading-relaxed max-w-3xl">
                      {featuredArticle.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#DCDCD8] text-xs text-[#5F5F5F]">
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
                    <span className="inline-flex items-center gap-1.5 font-bold text-[#006340]">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    className="group rounded-lg bg-white border border-[#E2E2E0] hover:border-[#0F0F0F] overflow-hidden flex flex-col justify-between transition-colors"
                  >
                    <article className="flex flex-col justify-between h-full">
                      <div>
                        {article.cover_image_url && (
                          <div className="h-44 w-full bg-[#F4F3F1] relative overflow-hidden border-b border-[#E2E2E0]">
                            <img
                              src={article.cover_image_url}
                              alt={article.title}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-5 space-y-2.5">
                          <div className="flex items-center justify-between gap-2 text-[11px] text-[#5F5F5F]">
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

                          <h2 className="text-base font-bold text-[#0F0F0F] group-hover:underline font-display leading-snug line-clamp-2">
                            {article.title}
                          </h2>

                          <p className="text-xs text-[#5F5F5F] leading-relaxed line-clamp-3">
                            {article.summary}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 pb-4 pt-3 border-t border-[#F0F0EE] flex items-center justify-between text-[11px] text-[#5F5F5F]">
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
                        <span className="inline-flex items-center gap-1 text-[#006340] font-bold">
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

      <AdBanner
        slot="news_feed_bottom"
        format="horizontal"
        hasContent={filteredArticles.length >= 4}
      />
    </div>
  );
}
