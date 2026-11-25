import { MetadataRoute } from "next";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EDITORIAL_GUIDES } from "@/lib/data/editorialGuides";
import { isContentDateReached, safeLastModified } from "@/lib/news/publishing";
import { getPublicStorefrontPath } from "@/lib/security/publicSanitizer";

// The listing query filters to status='published', so the only way a stale
// entry can appear is cache age. api/listings/[id] now calls
// revalidatePath("/sitemap.xml") on any status change or delete, which is what
// actually keeps this honest; the TTL is only a backstop for rows that change
// through some other path (direct SQL, admin scripts).
//
// 300 was chosen when the TTL *was* the mechanism. It forced a full rebuild --
// several queries against listings, profiles and news -- every five minutes
// whether anything had changed or not. 900 is enough as a backstop now that
// the real trigger is on-demand.
export const revalidate = 900;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = "https://www.efootballmarket.co.ke";
  const now = new Date();
  const nowIso = now.toISOString();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}`, changeFrequency: "daily", priority: 1.0 },
    { url: `${siteUrl}/browse`, changeFrequency: "daily", priority: 0.95 },
    { url: `${siteUrl}/news`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/tournaments`, changeFrequency: "daily", priority: 0.85 },
    { url: `${siteUrl}/scammer-check`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteUrl}/compare`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/wanted`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/escrow-guarantee`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${siteUrl}/contact`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${siteUrl}/fraud-prevention`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${siteUrl}/seller/guidelines`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/dispute-policy`, changeFrequency: "monthly", priority: 0.65 },
    { url: `${siteUrl}/terms`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/privacy`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const guideRoutes: MetadataRoute.Sitemap = EDITORIAL_GUIDES
    .filter((guide) => guide.is_published && isContentDateReached(guide.created_at, now))
    .map((guide) => ({
      url: `${siteUrl}/news/${guide.slug}`,
      lastModified: safeLastModified(guide.updated_at || guide.created_at, now),
      changeFrequency: "monthly",
      priority: 0.85,
    }));

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!supaUrl || supaUrl.includes("placeholder")) {
    return [...staticRoutes, ...guideRoutes];
  }

  try {
    const supabase = hasServiceRoleKey() ? createAdminClient() : createServerSupabaseClient();

    const [listingsRes, newsRes] = await Promise.all([
      supabase
        .from("listings")
        .select("id, seller_id, created_at, updated_at")
        .eq("status", "published")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("news_articles")
        .select("slug, created_at, updated_at")
        .eq("is_published", true)
        .lte("created_at", nowIso)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const publishedListings = listingsRes.data || [];
    const listingRoutes: MetadataRoute.Sitemap = publishedListings.map((listing: any) => ({
      url: `${siteUrl}/listings/${listing.id}`,
      lastModified: safeLastModified(listing.updated_at || listing.created_at, now),
      changeFrequency: "daily",
      priority: 0.85,
    }));

    // Include active seller storefronts that have published inventory
    const activeSellerIds = Array.from(
      new Set(
        publishedListings
          .map((l: any) => l.seller_id)
          .filter((id: any): id is string => Boolean(id))
      )
    );

    let sellerStorefrontRoutes: MetadataRoute.Sitemap = [];
    if (activeSellerIds.length > 0) {
      const { data: sellers } = await supabase
        .from("profiles")
        .select("id, username, updated_at")
        .in("id", activeSellerIds)
        .eq("is_suspended", false)
        .limit(100);

      sellerStorefrontRoutes = (sellers || [])
        .filter((s: any) => Boolean(s.id))
        .map((s: any) => ({
          url: `${siteUrl}${getPublicStorefrontPath(s.id, s.username)}`,
          lastModified: safeLastModified(s.updated_at, now),
          changeFrequency: "weekly" as const,
          priority: 0.75,
        }));
    }

    const guideSlugs = new Set(
      EDITORIAL_GUIDES
        .filter((guide) => guide.is_published && isContentDateReached(guide.created_at, now))
        .map((guide) => guide.slug)
    );
    const dbNewsRoutes: MetadataRoute.Sitemap = (newsRes.data || [])
      .filter(
        (article: any) =>
          isContentDateReached(article.created_at, now) &&
          !guideSlugs.has(article.slug)
      )
      .map((article: any) => ({
        url: `${siteUrl}/news/${article.slug}`,
        lastModified: safeLastModified(article.updated_at || article.created_at, now),
        changeFrequency: "weekly",
        priority: 0.85,
      }));

    return [
      ...staticRoutes,
      ...guideRoutes,
      ...listingRoutes,
      ...sellerStorefrontRoutes,
      ...dbNewsRoutes,
    ];
  } catch {
    return [...staticRoutes, ...guideRoutes];
  }
}
