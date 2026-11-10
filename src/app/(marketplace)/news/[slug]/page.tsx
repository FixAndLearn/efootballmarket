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

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface NewsArticlePageProps {
  params: {
    slug: string;
  };
}

function getCategoryLabel(category: NewsCategory | string) {
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

function renderInlineText(text: string): React.ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-[#0F0F0F]">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-[#F4F3F1] border border-[#E2E2E0] text-[#006340] text-[0.85em] font-mono"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{token}</React.Fragment>;
  });
}

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
          className="text-lg font-bold text-[#0F0F0F] font-display tracking-tight pt-3"
        >
          {block.replace(/^###\s+/, "")}
        </h3>
      );
    }

    if (block.startsWith("## ")) {
      return (
        <h2
          key={idx}
          className="text-xl sm:text-2xl font-bold text-[#0F0F0F] font-display tracking-tight pt-6 border-t border-[#E2E2E0] first:border-t-0 first:pt-0"
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
        <ol
          key={idx}
          className="space-y-2.5 pl-5 list-decimal marker:text-[#006340] marker:font-bold"
        >
          {lines.map((line, lIdx) => (
            <li
              key={lIdx}
              className="text-[#262626] text-sm sm:text-[15px] leading-relaxed pl-1"
            >
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
        <ul
          key={idx}
          className="space-y-2.5 pl-5 list-disc marker:text-[#006340]"
        >
          {lines.map((line, lIdx) => (
            <li
              key={lIdx}
              className="text-[#262626] text-sm sm:text-[15px] leading-relaxed pl-1"
            >
              {renderInlineText(line.replace(/^[-*]\s+/, ""))}
            </li>
          ))}
        </ul>
      );
    }

    if (
      lines.length === 1 &&
      block.length < 85 &&
      !/[.:;!?]$/.test(block) &&
      idx > 0
    ) {
      return (
        <h2
          key={idx}
          className="text-xl font-bold text-[#0F0F0F] font-display tracking-tight pt-4"
        >
          {block}
        </h2>
      );
    }

    return (
      <p key={idx} className="text-[#262626] text-sm sm:text-[15px] leading-relaxed">
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5F5F5F] hover:text-[#0F0F0F] transition-colors"
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
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F4F3F1] hover:bg-[#E5E4E0] border border-[#E2E2E0] text-[#0F0F0F] text-xs font-semibold transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5 text-[#006340]" />
          <span>Share</span>
        </a>
      </div>

      <article className="rounded-lg bg-white border border-[#E2E2E0] overflow-hidden">
        {article.cover_image_url && (
          <div className="h-56 sm:h-72 w-full bg-[#F4F3F1] relative overflow-hidden border-b border-[#E2E2E0]">
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 sm:p-10 space-y-6">
          <header className="space-y-4 border-b border-[#E2E2E0] pb-6">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#5F5F5F]">
              <span
                className={`px-2.5 py-0.5 rounded font-semibold border ${badge.color}`}
              >
                {badge.label}
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

              {article.author_name && (
                <span className="text-[#0F0F0F] font-semibold">
                  By {article.author_name}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0F0F0F] font-display tracking-tight leading-tight">
              {article.title}
            </h1>

            <p className="text-sm sm:text-base text-[#4A4A4A] leading-relaxed">
              {article.summary}
            </p>
          </header>

          {/* Structured Semantic Article Body */}
          <div className="space-y-4">
            {renderStructuredArticleContent(article.content)}
          </div>

          {/* Editorial Attribution Footer */}
          <footer className="mt-8 pt-6 border-t border-[#E2E2E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F9F9F8] -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 px-6 sm:px-10 py-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F0F0F]">
                <ShieldCheck className="w-4 h-4 text-[#006340]" />
                <span>
                  Published by {article.author_name || "eFootballMarket Editorial Desk"}
                </span>
              </div>
              <p className="text-xs text-[#5F5F5F] max-w-xl leading-relaxed">
                Verified against eFootball 2026 Mobile &amp; Console mechanics and eFootballMarket Kenya escrow safety rules. Independent community platform — not affiliated with Konami Digital Entertainment.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/browse">
                <Button variant="primary" size="sm">
                  <span>Browse Market</span>
                </Button>
              </Link>
              <Link href="/escrow-guarantee">
                <Button variant="outline" size="sm">
                  <span>Verification Rules</span>
                </Button>
              </Link>
            </div>
          </footer>
        </div>
      </article>

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
              className="text-lg font-bold text-[#0F0F0F] font-display flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-[#006340]" />
              <span>Related Guides</span>
            </h2>
            <Link
              href="/news"
              className="text-xs font-semibold text-[#006340] hover:underline inline-flex items-center gap-1"
            >
              <span>See All Guides</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.id}
                href={`/news/${rel.slug}`}
                className="group p-4 rounded-lg bg-[#F9F9F8] border border-[#E2E2E0] hover:border-[#0F0F0F] flex flex-col justify-between space-y-3 transition-colors"
              >
                <div className="space-y-2">
                  <span
                    className={`inline-block text-[10px] px-2 py-0.5 rounded font-semibold border ${
                      getCategoryLabel(rel.category).color
                    }`}
                  >
                    {getCategoryLabel(rel.category).label}
                  </span>
                  <h3 className="text-sm font-bold text-[#0F0F0F] group-hover:underline font-display line-clamp-2 leading-snug">
                    {rel.title}
                  </h3>
                  <p className="text-xs text-[#5F5F5F] line-clamp-2 leading-relaxed">
                    {rel.summary}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006340]">
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
