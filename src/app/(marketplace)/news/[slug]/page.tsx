import { AdBanner } from "@/components/common/AdBanner";
import { Button } from "@/components/ui/Button";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NewsService } from "@/services/newsService";
import { NewsCategory } from "@/types/database";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";
import { notFound } from "next/navigation";

function getCategoryLabel(category: NewsCategory | string) {
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

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface NewsArticlePageProps {
  params: {
    slug: string;
  };
}

/**
 * Renders inline **bold** and `code` spans cleanly without raw markdown asterisks.
 */
function renderInlineText(text: string): React.ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-[#151B26] border border-[#253044] text-emerald-300 text-[0.85em] font-mono"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{token}</React.Fragment>;
  });
}

/**
 * Converts structured editorial content (## H2, ### H3, numbered lists, bullet lists, paragraphs)
 * into semantic HTML elements for accessibility and search/AdSense crawler clarity.
 */
function renderStructuredArticleContent(raw: string): React.ReactNode[] {
  const blocks = raw
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks.map((block, idx) => {
    if (block.startsWith("### ")) {
      return (
        <h3
          key={idx}
          className="text-lg font-bold text-white font-display tracking-tight pt-3"
        >
          {block.replace(/^###\s+/, "")}
        </h3>
      );
    }

    if (block.startsWith("## ")) {
      return (
        <h2
          key={idx}
          className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight pt-5 border-t border-[#1E2636]/70 first:border-t-0 first:pt-0"
        >
          {block.replace(/^##\s+/, "")}
        </h2>
      );
    }

    const lines = block.split("\n").map((l) => l.trim());
    const allNumbered =
      lines.length > 0 && lines.every((l) => /^\d+\.\s+/.test(l));
    if (allNumbered) {
      return (
        <ol key={idx} className="space-y-2.5 pl-5 list-decimal marker:text-[#00E676] marker:font-bold">
          {lines.map((line, lIdx) => (
            <li key={lIdx} className="text-slate-300 text-sm sm:text-[15px] leading-relaxed pl-1">
              {renderInlineText(line.replace(/^\d+\.\s+/, ""))}
            </li>
          ))}
        </ol>
      );
    }

    const allBullets =
      lines.length > 0 && lines.every((l) => /^[-*]\s+/.test(l));
    if (allBullets) {
      return (
        <ul key={idx} className="space-y-2.5 pl-5 list-disc marker:text-[#00E676]">
          {lines.map((line, lIdx) => (
            <li key={lIdx} className="text-slate-300 text-sm sm:text-[15px] leading-relaxed pl-1">
              {renderInlineText(line.replace(/^[-*]\s+/, ""))}
            </li>
          ))}
        </ul>
      );
    }

    // Legacy single-line plain-text heading support (short standalone Title Case lines without trailing punctuation)
    if (
      lines.length === 1 &&
      block.length < 85 &&
      !/[.:;!?]$/.test(block) &&
      idx > 0
    ) {
      return (
        <h2
          key={idx}
          className="text-xl font-bold text-white font-display tracking-tight pt-4"
        >
          {block}
        </h2>
      );
    }

    return (
      <p key={idx} className="text-slate-300 text-sm sm:text-[15px] leading-relaxed">
        {lines.map((line, lIdx) => (
          <React.Fragment key={lIdx}>
            {lIdx > 0 && <br />}
            {renderInlineText(line)}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

export async function generateMetadata({
  params,
}: NewsArticlePageProps): Promise<Metadata> {
  try {
    const resolvedParams = await Promise.resolve(params);
    const slug = decodeURIComponent(resolvedParams?.slug || "").trim();
    const primaryClient = hasServiceRoleKey()
      ? createAdminClient()
      : createServerSupabaseClient();
    const service = new NewsService(primaryClient);
    const article = await service.getArticleBySlug(slug);

    if (!article) {
      return {
        title: "Guide Not Found | eFootballMarket",
      };
    }

    const canonicalUrl = `https://www.efootballmarket.co.ke/news/${article.slug}`;

    return {
      title: `${article.title} | eFootballMarket`,
      description: article.summary,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: article.title,
        description: article.summary,
        url: canonicalUrl,
        type: "article",
        publishedTime: article.created_at,
        modifiedTime: article.updated_at,
        authors: [article.author_name || "eFootballMarket Editorial Desk"],
        images: article.cover_image_url ? [article.cover_image_url] : [],
      },
    };
  } catch {
    return {
      title: "eFootballMarket Guide",
    };
  }
}

export default async function NewsArticlePage({
  params,
}: NewsArticlePageProps) {
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

  const relatedArticles = await service.getRelatedArticles(
    article.slug,
    article.category,
    3
  );

  const badge = getCategoryLabel(article.category);
  const wordCount = (article.content || "").trim().split(/\s+/).length;
  const readMinutes = Math.max(3, Math.ceil(wordCount / 195));
  const canonicalUrl = `https://www.efootballmarket.co.ke/news/${article.slug}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.title,
        description: article.summary,
        datePublished: article.created_at,
        dateModified: article.updated_at || article.created_at,
        wordCount,
        mainEntityOfPage: canonicalUrl,
        image: article.cover_image_url
          ? [`https://www.efootballmarket.co.ke${article.cover_image_url}`]
          : undefined,
        author: {
          "@type": "Organization",
          name: article.author_name || "eFootballMarket Editorial Desk",
          url: "https://www.efootballmarket.co.ke/about",
        },
        publisher: {
          "@type": "Organization",
          name: "eFootballMarket Kenya",
          url: "https://www.efootballmarket.co.ke",
          logo: {
            "@type": "ImageObject",
            url: "https://www.efootballmarket.co.ke/icon-512.png",
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://www.efootballmarket.co.ke",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Guides & Tactics",
            item: "https://www.efootballmarket.co.ke/news",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: article.title,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* Breadcrumb & Share Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Guides &amp; Tactics</span>
        </Link>

        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
            `${article.title} - ${canonicalUrl}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D1117] hover:bg-[#151B26] border border-[#1E2636] text-slate-300 hover:text-white text-xs font-medium transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5 text-[#00E676]" />
          <span>Share Guide</span>
        </a>
      </div>

      <article className="rounded-2xl bg-[#0D1117] border border-[#1E2636] overflow-hidden shadow-xl">
        {article.cover_image_url && (
          <div className="h-52 sm:h-72 w-full bg-[#07090D] relative overflow-hidden border-b border-[#1E2636]">
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-transparent to-transparent" />
          </div>
        )}

        <div className="p-6 sm:p-10 space-y-6">
          <header className="space-y-4 border-b border-[#1E2636] pb-6">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span
                className={`px-2.5 py-0.5 rounded-md font-semibold border ${badge.color}`}
              >
                {badge.label}
              </span>

              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {new Date(article.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>

              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {readMinutes} min read
              </span>

              {article.author_name && (
                <span className="text-slate-300 font-medium">
                  By {article.author_name}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-display tracking-tight leading-tight">
              {article.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {article.summary}
            </p>
          </header>

          {/* Structured Semantic Article Body */}
          <div className="space-y-4">
            {renderStructuredArticleContent(article.content)}
          </div>

          {/* Editorial Standards & Attribution Footer */}
          <footer className="mt-8 pt-6 border-t border-[#1E2636] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#090C12] -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 px-6 sm:px-10 py-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-[#00E676]" />
                <span>
                  Published by {article.author_name || "eFootballMarket Editorial Desk"}
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                Verified against eFootball 2026 Mobile &amp; Console mechanics and eFootballMarket Kenya escrow safety rules. Independent community platform — not affiliated with Konami Digital Entertainment.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/browse">
                <Button variant="primary" size="sm">
                  <span>Browse Squads</span>
                </Button>
              </Link>
              <Link href="/escrow-guarantee">
                <Button variant="secondary" size="sm">
                  <span>How Escrow Works</span>
                </Button>
              </Link>
            </div>
          </footer>
        </div>
      </article>

      {/* Gated Ad Unit — only renders when real numeric AdSense slot ID is configured and article has rich depth */}
      <AdBanner
        slot="article_bottom"
        format="horizontal"
        hasContent={wordCount >= 350}
      />

      {/* Related Guides Internal Linking Section */}
      {relatedArticles.length > 0 && (
        <section aria-labelledby="related-guides-heading" className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2
              id="related-guides-heading"
              className="text-lg font-bold text-white font-display flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-[#00E676]" />
              <span>Related eFootball Guides</span>
            </h2>
            <Link
              href="/news"
              className="text-xs font-semibold text-[#00E676] hover:underline inline-flex items-center gap-1"
            >
              <span>View all 12+ guides</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.id}
                href={`/news/${rel.slug}`}
                className="group p-4 rounded-xl bg-[#0D1117] border border-[#1E2636] hover:border-[#00E676]/45 flex flex-col justify-between space-y-3 transition-colors"
              >
                <div className="space-y-2">
                  <span
                    className={`inline-block text-[10px] px-2 py-0.5 rounded font-semibold border ${
                      getCategoryLabel(rel.category).color
                    }`}
                  >
                    {getCategoryLabel(rel.category).label}
                  </span>
                  <h3 className="text-sm font-bold text-white group-hover:text-[#00E676] transition-colors font-display line-clamp-2 leading-snug">
                    {rel.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {rel.summary}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00E676]">
                  <span>Read Guide</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
