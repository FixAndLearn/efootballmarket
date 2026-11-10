import { Button } from "@/components/ui/Button";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NewsService } from "@/services/newsService";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MessageCircle,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface NewsArticlePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: NewsArticlePageProps): Promise<Metadata> {
  try {
    const resolvedParams = await Promise.resolve(params);
    const slug = decodeURIComponent(resolvedParams?.slug || "").trim();
    const primaryClient = hasServiceRoleKey() ? createAdminClient() : createServerSupabaseClient();
    const service = new NewsService(primaryClient);
    const article = await service.getArticleBySlug(slug);

    if (!article) {
      return {
        title: "Guide Not Found | eFootballMarket",
      };
    }

    return {
      title: `${article.title} | eFootballMarket`,
      description: article.summary,
      openGraph: {
        title: article.title,
        description: article.summary,
        images: article.cover_image_url ? [article.cover_image_url] : [],
      },
    };
  } catch {
    return {
      title: "eFootballMarket Guide",
    };
  }
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const resolvedParams = await Promise.resolve(params);
  const rawSlug = resolvedParams?.slug || "";
  const decodedSlug = decodeURIComponent(rawSlug).trim();

  const supabase = createServerSupabaseClient();
  const adminSupabase = createAdminClient();
  const primaryClient = hasServiceRoleKey() ? adminSupabase : supabase;

  const service = new NewsService(primaryClient);
  let article = await service.getArticleBySlug(decodedSlug);

  if (!article && primaryClient !== supabase) {
    const fallbackService = new NewsService(supabase);
    article = await fallbackService.getArticleBySlug(decodedSlug);
  }

  if (!article) {
    notFound();
  }

  const isScammerAlert = article.category === "scammer_alert";
  const readMinutes = Math.max(1, Math.ceil((article.content || "").split(/\s+/).length / 190));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Guides</span>
        </Link>

        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
            `${article.title} - https://www.efootballmarket.co.ke/news/${article.slug}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#11141B] hover:bg-[#171B24] border border-[#242A36] text-slate-300 hover:text-white text-xs font-medium transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Share</span>
        </a>
      </div>

      <header className="space-y-4 border-b border-[#242A36] pb-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span
            className={`px-2 py-0.5 rounded font-medium border ${
              isScammerAlert
                ? "bg-rose-950/60 border-rose-800/60 text-rose-300"
                : "bg-[#171B24] border-[#283040] text-emerald-400"
            }`}
          >
            {isScammerAlert ? "Safety Advisory" : "Guide"}
          </span>

          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(article.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>

          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {readMinutes} min read
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white font-display leading-tight">
          {article.title}
        </h1>

        <p className="text-sm text-slate-400 leading-relaxed">
          {article.summary}
        </p>
      </header>

      {article.cover_image_url && (
        <div className="w-full h-64 sm:h-80 rounded-xl overflow-hidden border border-[#242A36] bg-[#11141B]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <article className="space-y-4 text-sm sm:text-[15px] text-slate-300 leading-relaxed whitespace-pre-line">
        {article.content}
      </article>

      <div className="pt-6 border-t border-[#242A36] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Ready to buy or sell an eFootball account?
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Every order on eFootballMarket includes M-Pesa Till 1572931 payment hold and a 24-hour buyer check.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/browse">
            <Button variant="primary" size="sm">
              Browse Listings
            </Button>
          </Link>
          <Link href="/middleman">
            <Button variant="secondary" size="sm">
              Middleman
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
