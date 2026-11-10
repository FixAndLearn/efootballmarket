import { NewsFeedClient } from "@/components/news/NewsFeedClient";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NewsService } from "@/services/newsService";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "eFootball 2026 Guides, Tactics & Trading Safety | eFootballMarket Kenya",
  description:
    "Original eFootball 2026 guides covering Quick Counter vs Long Ball Counter playstyles, 88+ manager stat breakpoints, custom player progression builds, 60 FPS mobile tuning, Konami ID 2FA transfers, and M-Pesa escrow protection.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/news",
  },
  openGraph: {
    title: "eFootball 2026 Guides, Tactics & Trading Safety | eFootballMarket",
    description:
      "Tactical meta guides, 88+ manager stat breakpoints, custom player progression blueprints, and safe Konami ID M-Pesa escrow walkthroughs for Kenyan eFootball players.",
    url: "https://www.efootballmarket.co.ke/news",
    type: "website",
  },
};

export default async function NewsFeedPage() {
  const supabase = createServerSupabaseClient();
  const primaryClient = hasServiceRoleKey() ? createAdminClient() : supabase;
  const service = new NewsService(primaryClient);
  const articles = await service.getPublishedArticles();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <NewsFeedClient initialArticles={articles} />
    </div>
  );
}
