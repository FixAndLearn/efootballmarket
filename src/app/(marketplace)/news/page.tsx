import { NewsFeedClient } from "@/components/news/NewsFeedClient";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NewsService } from "@/services/newsService";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Blog, Guides & What's Coming | eFootballMarket Kenya",
  description:
    "eFootballMarket's official blog & guides hub: upcoming Thursday pack drops, new platform features, Quick Counter & Long Ball Counter meta tactics, 88+ manager stat breakpoints, Konami ID 2FA transfers, and M-Pesa escrow safety.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/news",
  },
  openGraph: {
    title: "Blog, Guides & What's Coming | eFootballMarket Kenya",
    description:
      "Upcoming eFootball drops & platform features, tactical meta guides, 88+ manager stat breakpoints, and safe Konami ID M-Pesa escrow walkthroughs.",
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
