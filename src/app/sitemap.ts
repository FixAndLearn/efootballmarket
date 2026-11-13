import { MetadataRoute } from "next";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EDITORIAL_GUIDES } from "@/lib/data/editorialGuides";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = "https://www.efootballmarket.co.ke";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${siteUrl}/browse`, lastModified: new Date(), changeFrequency: "daily", priority: 0.95 },
    { url: `${siteUrl}/news`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/tournaments`, lastModified: new Date(), changeFrequency: "daily", priority: 0.85 },
    { url: `${siteUrl}/scammer-check`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteUrl}/compare`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/wanted`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/friday-drops`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/middleman`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/escrow-guarantee`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
    { url: `${siteUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
    { url: `${siteUrl}/fraud-prevention`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
    { url: `${siteUrl}/seller/guidelines`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/dispute-policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.65 },
    { url: `${siteUrl}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const guideRoutes: MetadataRoute.Sitemap = EDITORIAL_GUIDES.map((g) => ({
    url: `${siteUrl}/news/${g.slug}`,
    lastModified: new Date(g.updated_at || g.created_at),
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
        .select("id, seller_id, updated_at")
        .eq("status", "published")
        .is("deleted_at", null)
        .limit(200),
      supabase
        .from("news_articles")
        .select("slug, updated_at")
        .eq("is_published", true)
        .limit(100),
    ]);

    const publishedListings = listingsRes.data || [];
    const listingRoutes: MetadataRoute.Sitemap = publishedListings.map((listing: any) => ({
      url: `${siteUrl}/listings/${listing.id}`,
      lastModified: new Date(listing.updated_at || Date.now()),
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
        .select("username, updated_at")
        .in("id", activeSellerIds)
        .eq("is_suspended", false)
        .limit(100);

      sellerStorefrontRoutes = (sellers || [])
        .filter((s: any) => Boolean(s.username))
        .map((s: any) => ({
          url: `${siteUrl}/u/${encodeURIComponent(s.username)}`,
          lastModified: new Date(s.updated_at || Date.now()),
          changeFrequency: "weekly" as const,
          priority: 0.75,
        }));
    }

    const guideSlugs = new Set(EDITORIAL_GUIDES.map((g) => g.slug));
    const dbNewsRoutes: MetadataRoute.Sitemap = (newsRes.data || [])
      .filter((article: any) => !guideSlugs.has(article.slug))
      .map((article: any) => ({
        url: `${siteUrl}/news/${article.slug}`,
        lastModified: new Date(article.updated_at || Date.now()),
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
