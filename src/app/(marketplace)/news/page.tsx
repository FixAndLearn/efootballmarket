import { NewsFeedClient } from "@/components/news/NewsFeedClient";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NewsService } from "@/services/newsService";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "eFootball 2027 (v6.1) Blog, Fluid Formation, Select Tokens & Meta Guides",
  description:
    "Official eFootballMarket Kenya blog: real eFootball 2027 (v6.0 – v6.1.1) patch breakdowns, Fluid Formation & Overload tactics, Select Skill & Position Tokens, Dual Link-Up 90-proficiency managers, Showdown PvP, $300K Championship 2027, and Clean Konami ID escrow.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/news",
  },
  openGraph: {
    title: "eFootball 2027 (v6.1) Blog & Meta Guides | eFootballMarket Kenya",
    description:
      "Fluid Formation & Overload setups, v6.1 Select Skill Tokens, Dual Link-Up Managers (Klopp, Conte, Kovač), Showdown & Custom Tournaments, and safe Konami ID M-Pesa escrow.",
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
