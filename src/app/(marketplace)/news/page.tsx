import { NewsFeedClient } from "@/components/news/NewsFeedClient";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NewsService } from "@/services/newsService";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "eFootball News, Tactics & Trading Guides | eFootballMarket Kenya",
  description:
    "eFootball updates, tactical guides, player builds, and marketplace checkout-safety articles for players in Kenya.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/news",
  },
  openGraph: {
    title: "eFootball News & Guides | eFootballMarket Kenya",
    description:
      "Read eFootball updates and tactical guides, plus practical marketplace checkout-safety advice for Kenyan players.",
    url: "https://www.efootballmarket.co.ke/news",
    type: "website",
  },
};

export default async function NewsFeedPage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const supabase = createServerSupabaseClient();
  const primaryClient = hasServiceRoleKey() ? createAdminClient() : supabase;
  const service = new NewsService(primaryClient);
  const articles = await service.getPublishedArticles();
  const initialCategory = searchParams?.category || "all";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full">
      <NewsFeedClient
        initialArticles={articles}
        initialCategory={initialCategory}
      />
    </div>
  );
}
