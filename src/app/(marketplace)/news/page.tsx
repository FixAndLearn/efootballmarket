"use client";

import { Button } from "@/components/ui/Button";
import { AdBanner } from "@/components/common/AdBanner";
import { useAuth } from "@/hooks/useAuth";
import { isUserAdmin } from "@/lib/security/adminAuth";
import { NewsArticle, NewsCategory } from "@/types/database";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  PenSquare,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

function getCategoryLabel(category: NewsCategory | string) {
  switch (category) {
    case "scammer_alert":
      return {
        label: "Safety Advisory",
        color: "bg-rose-950/60 border-rose-800/60 text-rose-300",
      };
    case "escrow_guide":
      return {
        label: "Guide",
        color: "bg-[#171B24] border-[#283040] text-emerald-400",
      };
    case "announcement":
      return {
        label: "Update",
        color: "bg-[#171B24] border-[#283040] text-amber-300",
      };
    default:
      return {
        label: "Article",
        color: "bg-[#171B24] border-[#283040] text-slate-300",
      };
  }
}

export default function NewsFeedPage() {
  const { user, profile } = useAuth();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = isUserAdmin(user?.email, profile?.role);

  useEffect(() => {
    async function loadNews() {
      setLoading(true);
      try {
        const url =
          activeCategory === "all"
            ? "/api/news"
            : `/api/news?category=${activeCategory}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.articles)) {
            setArticles(data.articles);
          }
        }
      } catch (err) {
        console.warn("Failed to load articles:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNews();
  }, [activeCategory]);

  const filteredArticles = articles.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q)
    );
  });

  const pinnedArticle = filteredArticles.find((a) => a.is_pinned);
  const standardArticles = filteredArticles.filter((a) => a.id !== pinnedArticle?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#242A36] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
            Trading Guides &amp; Safety Advisories
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Walkthroughs for Konami ID transfers, checking Link Data, M-Pesa payment holds, and avoiding common trading scams in Kenya.
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
            { id: "all", label: "All" },
            { id: "escrow_guide", label: "Guides" },
            { id: "scammer_alert", label: "Safety Advisories" },
            { id: "efootball_news", label: "Seller & Game Tips" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeCategory === cat.id
                  ? "bg-emerald-500 text-zinc-950 font-semibold"
                  : "bg-[#11141B] border border-[#242A36] text-slate-400 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#11141B] border border-[#242A36] text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Featured Guide */}
      {!loading && pinnedArticle && (
        <div className="p-6 sm:p-7 rounded-xl bg-[#11141B] border border-[#242A36] space-y-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
            <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-medium text-[11px]">
              Featured Guide
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(pinnedArticle.created_at).toLocaleDateString()}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
            <Link href={`/news/${pinnedArticle.slug}`} className="hover:text-emerald-400 transition-colors">
              {pinnedArticle.title}
            </Link>
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            {pinnedArticle.summary}
          </p>

          <div className="pt-2">
            <Link
              href={`/news/${pinnedArticle.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              <span>Read full guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="p-5 rounded-xl bg-[#11141B] border border-[#242A36] animate-pulse space-y-3">
              <div className="h-4 w-20 bg-[#171B24] rounded" />
              <div className="h-5 w-4/5 bg-[#171B24] rounded" />
              <div className="h-12 w-full bg-[#171B24] rounded" />
            </div>
          ))}
        </div>
      ) : standardArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {standardArticles.map((article) => {
            const badge = getCategoryLabel(article.category);
            return (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className="bg-[#11141B] border border-[#242A36] hover:border-slate-600 rounded-xl overflow-hidden transition-colors flex flex-col group"
              >
                {article.cover_image_url && (
                  <div className="h-44 w-full relative overflow-hidden bg-[#171B24]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.cover_image_url}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded border ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(article.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#242A36] flex items-center justify-between text-xs text-slate-400 group-hover:text-slate-200 font-medium">
                    <span>Read article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : !pinnedArticle ? (
        <div className="p-10 text-center rounded-xl bg-[#11141B] border border-[#242A36] space-y-2">
          <BookOpen className="w-7 h-7 text-slate-500 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">No matching guides</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try clearing your search query or switching back to All categories.
          </p>
        </div>
      ) : null}

      <AdBanner
        slot="news_feed_bottom"
        format="horizontal"
        hasContent={!loading && filteredArticles.length >= 2}
      />
    </div>
  );
}
