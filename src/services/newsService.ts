import { EDITORIAL_GUIDES } from "@/lib/data/editorialGuides";
import { NewsArticle, NewsCategory } from "@/types/database";
import { SupabaseClient } from "@supabase/supabase-js";

function hasLiveSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return Boolean(url && !url.includes("placeholder"));
}

export class NewsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Fetch all published news & editorial guides, merging live database bulletins
   * with evergreen platform & eFootball reference guides (deduplicated by slug).
   */
  async getPublishedArticles(category?: string): Promise<NewsArticle[]> {
    let dbArticles: NewsArticle[] = [];

    if (hasLiveSupabaseConfig()) {
      try {
        let query = this.supabase
          .from("news_articles")
          .select("*")
          .eq("is_published", true)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });

        if (category && category !== "all") {
          query = query.eq("category", category);
        }

        const { data, error } = await query;

        if (!error && Array.isArray(data)) {
          dbArticles = data as NewsArticle[];
        }
      } catch (err) {
        console.warn("News query fallback to editorial guides:", err);
      }
    }

    const seenSlugs = new Set(dbArticles.map((a) => a.slug.toLowerCase()));
    const staticGuides = EDITORIAL_GUIDES.filter((g) => {
      if (!g.is_published) return false;
      if (seenSlugs.has(g.slug.toLowerCase())) return false;
      if (category && category !== "all" && g.category !== category) return false;
      return true;
    });

    const combined = [...dbArticles, ...staticGuides];
    combined.sort((a, b) => {
      if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) {
        return a.is_pinned ? -1 : 1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return combined;
  }

  /**
   * Fetch article by slug or ID from the live database, falling back cleanly
   * to the evergreen EDITORIAL_GUIDES catalog so sitemap & internal links never 404.
   */
  async getArticleBySlug(identifier: string): Promise<NewsArticle | null> {
    if (!identifier) return null;
    const clean = decodeURIComponent(identifier).trim();
    const cleanLower = clean.toLowerCase();

    if (hasLiveSupabaseConfig()) {
      try {
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

        let query = this.supabase.from("news_articles").select("*");

        if (isUuid) {
          query = query.or(`id.eq.${clean},slug.eq.${clean}`);
        } else {
          query = query.ilike("slug", clean);
        }

        const { data, error } = await query.limit(1).maybeSingle();

        if (!error && data) {
          try {
            this.supabase
              .from("news_articles")
              .update({ views_count: (data.views_count || 0) + 1 })
              .eq("id", data.id)
              .then(
                () => {},
                () => {}
              );
          } catch {
            // Non-blocking view increment
          }

          return data as NewsArticle;
        }
      } catch (err) {
        console.warn("getArticleBySlug DB lookup fallback:", err);
      }
    }

    const staticMatch = EDITORIAL_GUIDES.find(
      (g) =>
        g.is_published &&
        (g.slug.toLowerCase() === cleanLower || g.id.toLowerCase() === cleanLower)
    );

    return staticMatch || null;
  }

  /**
   * Fetch related guides for internal linking on article detail pages.
   */
  async getRelatedArticles(
    excludeSlug: string,
    preferredCategory?: string,
    limit = 3
  ): Promise<NewsArticle[]> {
    const all = await this.getPublishedArticles();
    const candidates = all.filter(
      (a) => a.slug.toLowerCase() !== excludeSlug.toLowerCase()
    );
    const sameCategory = preferredCategory
      ? candidates.filter((a) => a.category === preferredCategory)
      : [];
    const others = preferredCategory
      ? candidates.filter((a) => a.category !== preferredCategory)
      : candidates;

    return [...sameCategory, ...others].slice(0, limit);
  }

  /**
   * Create a news article and optionally broadcast notification to all users
   */
  async createArticle(
    payload: {
      title: string;
      category: NewsCategory;
      summary: string;
      content: string;
      cover_image_url?: string;
      author_name?: string;
      is_pinned?: boolean;
      broadcastNotification?: boolean;
    },
    authorId?: string
  ): Promise<NewsArticle> {
    const slug =
      payload.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Math.random().toString(36).substring(2, 7);

    const { data, error } = await this.supabase
      .from("news_articles")
      .insert({
        title: payload.title,
        slug,
        category: payload.category,
        summary: payload.summary,
        content: payload.content,
        cover_image_url: payload.cover_image_url || null,
        author_id: authorId || null,
        author_name: payload.author_name || "eFootballMarket Support",
        is_pinned: Boolean(payload.is_pinned),
        is_published: true,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create news article: ${error?.message}`);
    }

    if (payload.broadcastNotification) {
      try {
        const { data: allProfiles } = await this.supabase
          .from("profiles")
          .select("id");

        if (allProfiles && allProfiles.length > 0) {
          const notifications = allProfiles.map((p: any) => ({
            recipient_id: p.id,
            type:
              payload.category === "scammer_alert"
                ? "scammer_alert"
                : "news_broadcast",
            title:
              payload.category === "scammer_alert"
                ? `SCAMMER ALERT: ${payload.title}`
                : `NEW GUIDE: ${payload.title}`,
            message: payload.summary.slice(0, 110),
            action_url: `/news/${slug}`,
            is_read: false,
          }));

          await this.supabase.from("notifications").insert(notifications);
        }
      } catch (broadcastErr) {
        console.warn("Failed to broadcast notifications:", broadcastErr);
      }
    }

    return data as NewsArticle;
  }

  /**
   * Update an article
   */
  async updateArticle(
    idOrSlug: string,
    payload: Partial<Omit<NewsArticle, "id" | "created_at">>
  ): Promise<NewsArticle> {
    const clean = decodeURIComponent(idOrSlug).trim();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

    let query = this.supabase.from("news_articles").update({
      ...payload,
      updated_at: new Date().toISOString(),
    });

    if (isUuid) {
      query = query.or(`id.eq.${clean},slug.eq.${clean}`);
    } else {
      query = query.eq("slug", clean);
    }

    const { data, error } = await query.select().single();

    if (error || !data) {
      throw new Error(`Failed to update news article: ${error?.message}`);
    }

    return data as NewsArticle;
  }

  /**
   * Delete an article
   */
  async deleteArticle(idOrSlug: string): Promise<void> {
    const clean = decodeURIComponent(idOrSlug).trim();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

    let query = this.supabase.from("news_articles").delete();

    if (isUuid) {
      query = query.or(`id.eq.${clean},slug.eq.${clean}`);
    } else {
      query = query.eq("slug", clean);
    }

    const { error } = await query;

    if (error) {
      throw new Error(`Failed to delete news article: ${error.message}`);
    }
  }
}
