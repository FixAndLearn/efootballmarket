import { Listing, ListingImage, ListingStatus, Platform, Playstyle } from "@/types/database";
import { SupabaseClient } from "@supabase/supabase-js";
import { checkListingIntegrity, recordListingFingerprint } from "@/lib/security/listingIntegrity";
import { verifyListingScreenshot, exactHash, perceptualHash } from "@/lib/security/listingVerification";
import {
  PUBLIC_SELLER_PROFILE_SELECT,
  sanitizeListingForPublic,
} from "@/lib/security/publicSanitizer";

export interface ListingFilterParams {
  search?: string;
  platform?: Platform | "all";
  playstyle?: Playstyle | "all";
  minPrice?: number;
  maxPrice?: number;
  minStrength?: number;
  minCoins?: number;
  minGp?: number;
  minEpics?: number;
  allowsSwap?: boolean;
  manager?: string;
  sortBy?: "newest" | "price_asc" | "price_desc" | "strength_desc" | "coins_desc" | "views";
  limit?: number;
  offset?: number;
  _skipPlayerSearchCol?: boolean;
}

export interface ListingQueryResult {
  listings: Listing[];
  totalCount: number;
  /**
   * True when PostgREST rejected the request because the offset is past the
   * end of the result set (code PGRST103, "requested range not satisfiable").
   * This is not a failure -- it means the caller asked for a page that no
   * longer exists, so the page can redirect instead of reporting an outage.
   */
  outOfRange?: boolean;
}

export class ListingService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Queries listings with dynamic multi-faceted filtering against the live database.
   * Never returns mock or demo data.
   */
  async getListings(filters: ListingFilterParams = {}): Promise<ListingQueryResult> {
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (!sbUrl || sbUrl.includes("placeholder-project")) {
      return { listings: [], totalCount: 0 };
    }
    const {
      search,
      platform,
      playstyle,
      minPrice,
      maxPrice,
      minStrength,
      minCoins,
      minGp,
      minEpics,
      allowsSwap,
      manager,
      sortBy = "newest",
      limit = 20,
      offset = 0,
    } = filters;

    let query = this.supabase
      .from("listings")
      .select(`*, seller:profiles(${PUBLIC_SELLER_PROFILE_SELECT}), images:listing_images(*)`, { count: "exact" })
      .eq("status", "published")
      .is("deleted_at", null);

    if (platform && platform !== "all") {
      query = query.eq("platform", platform);
    }

    if (playstyle && playstyle !== "all") {
      query = query.eq("primary_playstyle", playstyle);
    }

    if (minPrice !== undefined && minPrice > 0) {
      query = query.gte("price", minPrice);
    }

    if (maxPrice !== undefined && maxPrice > 0) {
      query = query.lte("price", maxPrice);
    }

    if (minStrength !== undefined && minStrength > 0) {
      query = query.gte("overall_team_strength", minStrength);
    }

    if (minCoins !== undefined && minCoins > 0) {
      query = query.gte("coin_balance", minCoins);
    }

    if (minGp !== undefined && minGp > 0) {
      query = query.gte("gp_balance", minGp);
    }

    if (minEpics !== undefined && minEpics > 0) {
      query = query.gte("epic_players_count", minEpics);
    }

    if (allowsSwap) {
      query = query.eq("allows_swap", true);
    }

    if (manager && manager.trim() !== "") {
      query = query.ilike("manager_name", `%${manager.trim()}%`);
    }

    if (search && search.trim() !== "") {
      const sanitizedTerm = search.trim().replace(/[,()%]/g, " ").replace(/\s+/g, " ").trim();
      if (sanitizedTerm) {
        const ovrPlusMatch = sanitizedTerm.match(/^(\d{4})\+$/);
        const exactOvrMatch = sanitizedTerm.match(/^(\d{4})$/);

        if (ovrPlusMatch) {
          const minOvr = Number(ovrPlusMatch[1]);
          query = query.gte("overall_team_strength", minOvr);
        } else {
          const orClauses = [
            `title.ilike.%${sanitizedTerm}%`,
            `description.ilike.%${sanitizedTerm}%`,
            `manager_name.ilike.%${sanitizedTerm}%`,
            `dream_team_name.ilike.%${sanitizedTerm}%`,
          ];
          if (!filters._skipPlayerSearchCol) {
            orClauses.push(`player_search_text.ilike.%${sanitizedTerm}%`);
          }
          if (exactOvrMatch) {
            orClauses.push(`overall_team_strength.eq.${Number(exactOvrMatch[1])}`);
          }
          query = query.or(orClauses.join(","));
        }
      }
    }

    // Sorting
    switch (sortBy) {
      case "price_asc":
        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false });
        break;
      case "strength_desc":
        query = query.order("overall_team_strength", { ascending: false });
        break;
      case "coins_desc":
        query = query.order("coin_balance", { ascending: false });
        break;
      case "views":
        query = query.order("views_count", { ascending: false });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      // A deep offset past the last row is a stale page number, not an
      // outage. PostgREST answers 416 with PGRST103 for this.
      const isRangeError =
        error.code === "PGRST103" ||
        /requested range not satisfiable|range/i.test(error.message || "");
      if (isRangeError) {
        return { listings: [], totalCount: 0, outOfRange: true };
      }

      if (!filters._skipPlayerSearchCol && error.message.includes("player_search_text")) {
        return this.getListings({
          ...filters,
          _skipPlayerSearchCol: true,
        });
      }
      if (allowsSwap && error.message.includes("allows_swap")) {
        // Retry without the swap constraint, keeping every other filter and the
        // caller's search term intact. The previous fallback appended the word
        // "swap" to the search query and silently changed what the shopper saw.
        return this.getListings({ ...filters, allowsSwap: false });
      }
      console.error("Listing query error:", error.message, error.code ?? "");
      throw new Error(`Failed to fetch listings: ${error.message}`);
    }

    const rawList = (data as unknown as Listing[]) || [];
    return {
      listings: rawList.map(sanitizeListingForPublic),
      totalCount: count || 0,
    };
  }

  /**
   * Retrieves a single listing by its primary ID, with sanitized public seller info and images.
   */
  async getListingById(id: string): Promise<Listing | null> {
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (!sbUrl || sbUrl.includes("placeholder-project")) {
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from("listings")
        .select(`*, seller:profiles(${PUBLIC_SELLER_PROFILE_SELECT}), images:listing_images(*)`)
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        console.warn(`getListingById warning (${id}):`, error.message);
        return null;
      }

      // Non-blocking view increment so SSR TTFB never waits on analytics RPC
      void Promise.resolve(
        this.supabase.rpc("increment_listing_views", { listing_id: id })
      ).catch(() => {});

      return sanitizeListingForPublic(data as unknown as Listing);
    } catch (err) {
      console.warn(`getListingById network error (${id}):`, err);
      return null;
    }
  }

  /**
   * Creates a new listing with image URLs in a real database transaction.
   */
  async createListing(
    listingData: Omit<Listing, "id" | "created_at" | "updated_at" | "deleted_at" | "views_count" | "favorites_count" | "seller" | "images">,
    imageUrls: string[]
  ): Promise<Listing> {
    const nowIso = new Date().toISOString();
    const basePayload: Record<string, any> = {
      ...listingData,
      views_count: 0,
      favorites_count: 0,
      created_at: nowIso,
      updated_at: nowIso,
    };

    let { data: newListing, error: insertError } = await this.supabase
      .from("listings")
      .insert(basePayload)
      .select()
      .single();

    if (
      insertError &&
      (insertError.message.includes("allows_swap") ||
        insertError.message.includes("swap_preferences"))
    ) {
      if (basePayload.allows_swap) {
        const swapTag = basePayload.swap_preferences
          ? `\n\n[Open to Squad Swap + Cash Top-Up: ${basePayload.swap_preferences}]`
          : "\n\n[Open to Squad Swap + Cash Top-Up]";
        basePayload.description = `${basePayload.description || ""}${swapTag}`.trim();
      }
      delete basePayload.allows_swap;
      delete basePayload.swap_preferences;
      const retry = await this.supabase
        .from("listings")
        .insert(basePayload)
        .select()
        .single();
      newListing = retry.data;
      insertError = retry.error;
    }

    if (insertError) {
      throw new Error(`Listing creation failed: ${insertError.message}`);
    }

    if (imageUrls && imageUrls.length > 0) {
      const imageRecords = imageUrls.map((url, index) => ({
        listing_id: newListing.id,
        image_url: url,
        display_order: index,
        is_primary: index === 0,
      }));

      const { error: imgError } = await this.supabase
        .from("listing_images")
        .insert(imageRecords);

      if (imgError) {
        console.error("Failed to associate listing images:", imgError);
      }
    }

    // Screenshot screening runs server-side against the claimed squad strength
    // and known image hashes. OCR is optional: when it cannot read the screenshot
    // we mark it pending/manual rather than falsely claiming it was verified.
    let screenshotStatus: "pending" | "verified" | "mismatch" | "rejected" = "pending";
    let screenshotStrength: number | null = null;
    let screenshotNotes = "Screenshot queued for manual review.";
    const recordedImageHashes: string[] = [];
    try {
      const supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").origin;
      const { data: priorFingerprints } = await this.supabase
        .from("listing_fingerprints")
        .select("image_hashes")
        .neq("listing_id", newListing.id)
        .limit(500);
      const exactKnown: string[] = [];
      const perceptualKnown: string[] = [];
      for (const row of priorFingerprints || []) {
        for (const tagged of row.image_hashes || []) {
          if (tagged.startsWith("exact:")) exactKnown.push(tagged.slice(6));
          else if (tagged.startsWith("phash:")) perceptualKnown.push(tagged.slice(6));
          // Legacy untagged entries were perceptual hashes.
          else if (/^[01]{64}$/.test(tagged)) perceptualKnown.push(tagged);
        }
      }

      const outcomes: string[] = [];
      for (const imageUrl of imageUrls || []) {
        try {
          const parsedUrl = new URL(imageUrl);
          // Only fetch images from this project's public Supabase Storage. Do
          // not turn seller-controlled URLs into an SSRF primitive.
          if (parsedUrl.origin !== supabaseOrigin || !parsedUrl.pathname.includes("/storage/v1/object/public/")) continue;
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 8000);
          let response: Response;
          try {
            response = await fetch(parsedUrl.toString(), { signal: controller.signal });
          } finally {
            clearTimeout(timer);
          }
          if (!response.ok) continue;
          const contentLength = Number(response.headers.get("content-length") || 0);
          if (contentLength > 8 * 1024 * 1024) continue;
          const bytes = Buffer.from(await response.arrayBuffer());
          if (!bytes.length || bytes.length > 8 * 1024 * 1024) continue;

          const result = await verifyListingScreenshot(
            bytes,
            Number(newListing.overall_team_strength),
            { exact: exactKnown, perceptual: perceptualKnown }
          );
          outcomes.push(result.outcome);
          screenshotNotes = result.notes;
          screenshotStrength = result.detectedStrength ?? screenshotStrength;
          const exact = exactHash(bytes);
          const perceptual = await perceptualHash(bytes);
          recordedImageHashes.push(`exact:${exact}`, `phash:${perceptual}`);
          exactKnown.push(exact);
          perceptualKnown.push(perceptual);
        } catch {
          // A missing/unreadable image remains a manual check, not a publish crash.
        }
      }
      if (outcomes.includes("rejected")) screenshotStatus = "rejected";
      else if (outcomes.includes("mismatch")) screenshotStatus = "mismatch";
      else if (outcomes.length > 0 && outcomes.every((outcome) => outcome === "verified")) screenshotStatus = "verified";
      else screenshotStatus = "pending";
      await this.supabase.from("listings").update({
        verification_status: screenshotStatus,
        verified_strength: screenshotStrength,
        verification_notes: screenshotNotes,
        verified_at: screenshotStatus === "verified" ? new Date().toISOString() : null,
      }).eq("id", newListing.id);
    } catch (verificationErr) {
      console.warn("Screenshot verification deferred to manual review:", verificationErr);
    }

    // Anti-fraud pass. Records the account fingerprint so future listings can be
    // compared against this one, and blocks outright when the same squad is being
    // relisted after it already sold -- the sell/recall/resell pattern.
    //
    // Never throws: a failure here must not cost the seller their listing.
    try {
      const created = newListing as Listing;
      const flags = await checkListingIntegrity(this.supabase, {
        id: created.id,
        seller_id: created.seller_id,
        dream_team_name: created.dream_team_name,
        overall_team_strength: created.overall_team_strength,
        matches_played: created.matches_played,
        wins: created.wins,
        goals_scored: created.goals_scored,
      });

      const blocking = flags.filter((f) => f.severity === "block");
      const screenshotBlocked = screenshotStatus === "mismatch" || screenshotStatus === "rejected";
      if (blocking.length > 0 || screenshotBlocked) {
        // Unpublish rather than delete: keep the seller's work, hold the listing
        // for an admin decision, and make the verification outcome visible.
        const notes = [
          ...blocking.map((f) => f.message),
          ...(screenshotBlocked ? [screenshotNotes] : []),
        ].join(" ");
        await this.supabase
          .from("listings")
          .update({
            status: "pending_review",
            verification_status: screenshotStatus,
            verification_notes: notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", created.id);
        await recordListingFingerprint(this.supabase, {
          id: created.id,
          seller_id: created.seller_id,
          dream_team_name: created.dream_team_name,
          overall_team_strength: created.overall_team_strength,
          matches_played: created.matches_played,
          wins: created.wins,
          goals_scored: created.goals_scored,
        }, recordedImageHashes);

        return {
          ...(newListing as Listing),
          status: "pending_review" as any,
          verification_status: screenshotStatus,
          verification_notes: notes,
        } as Listing;
      }

      const review = flags.filter((f) => f.severity === "review");
      if (review.length > 0) {
        await this.supabase
          .from("listings")
          .update({
            verification_notes: review.map((f) => f.message).join(" "),
            updated_at: new Date().toISOString(),
          })
          .eq("id", created.id);
      }

      await recordListingFingerprint(this.supabase, {
        id: created.id,
        seller_id: created.seller_id,
        dream_team_name: created.dream_team_name,
        overall_team_strength: created.overall_team_strength,
        matches_played: created.matches_played,
        wins: created.wins,
        goals_scored: created.goals_scored,
      }, recordedImageHashes);
    } catch (integrityErr) {
      console.warn("Listing integrity check skipped:", integrityErr);
    }

    return newListing as Listing;
  }

  /**
   * Toggles favorite status for a given user and listing.
   */
  async toggleFavorite(userId: string, listingId: string): Promise<{ isFavorited: boolean }> {
    const { data: existing } = await this.supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("listing_id", listingId)
      .single();

    if (existing) {
      await this.supabase.from("favorites").delete().eq("id", existing.id);
      try {
        await this.supabase.rpc("decrement_listing_favorites", { listing_id: listingId });
      } catch {
        // Silently continue
      }
      return { isFavorited: false };
    } else {
      await this.supabase.from("favorites").insert({ user_id: userId, listing_id: listingId });
      try {
        await this.supabase.rpc("increment_listing_favorites", { listing_id: listingId });
      } catch {
        // Silently continue
      }
      return { isFavorited: true };
    }
  }

  /**
   * Updates an existing listing and optionally refreshes its gallery images.
   */
  async updateListing(
    id: string,
    userId: string,
    listingData: Partial<Listing>,
    imageUrls?: string[],
    isAdmin = false
  ): Promise<Listing> {
    const { data: existing, error: findError } = await this.supabase
      .from("listings")
      .select("id, seller_id, status")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (findError || !existing) {
      throw new Error("Listing not found or has been deleted.");
    }

    if (!isAdmin && existing.seller_id !== userId) {
      throw new Error("Unauthorized: You can only edit your own listings.");
    }

    if (existing.status === "sold") {
      throw new Error("Cannot edit an account that has already been sold.");
    }

    if (existing.status === "in_escrow") {
      throw new Error("Cannot edit an account currently locked in an active escrow transaction.");
    }

    // Check if there is any active or completed order for this listing
    const { data: activeOrder } = await this.supabase
      .from("orders")
      .select("id, status")
      .eq("listing_id", id)
      .not("status", "in", '("cancelled","refunded")')
      .maybeSingle();

    if (activeOrder) {
      if (activeOrder.status === "completed" || existing.status === "sold") {
        throw new Error("Cannot edit an account that has already been sold.");
      }
      throw new Error("Cannot edit an account currently locked in an active escrow trade.");
    }

    const { data: updated, error: updateError } = await this.supabase
      .from("listings")
      .update({
        ...listingData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update listing: ${updateError.message}`);
    }

    if (imageUrls && imageUrls.length > 0) {
      await this.supabase.from("listing_images").delete().eq("listing_id", id);

      const imageRecords = imageUrls.map((url, index) => ({
        listing_id: id,
        image_url: url,
        display_order: index,
        is_primary: index === 0,
      }));

      await this.supabase.from("listing_images").insert(imageRecords);
    }

    return updated as Listing;
  }

  /**
   * Soft deletes an existing listing.
   */
  async deleteListing(id: string, userId: string, isAdmin = false): Promise<void> {
    const { data: existing, error: findError } = await this.supabase
      .from("listings")
      .select("id, seller_id, status")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (findError || !existing) {
      throw new Error("Listing not found.");
    }

    if (!isAdmin && existing.seller_id !== userId) {
      throw new Error("Unauthorized: You can only delete your own listings.");
    }

    if (existing.status === "sold") {
      throw new Error("Cannot delete an account that has already been sold.");
    }

    if (existing.status === "in_escrow") {
      throw new Error("Cannot delete an account currently locked in an active escrow transaction.");
    }

    const { data: orderExists } = await this.supabase
      .from("orders")
      .select("id")
      .eq("listing_id", id)
      .not("status", "in", '("cancelled","refunded")')
      .maybeSingle();

    if (orderExists) {
      throw new Error("Cannot delete an account that has an associated escrow trade.");
    }

    const { error: deleteError } = await this.supabase
      .from("listings")
      .update({
        deleted_at: new Date().toISOString(),
        status: "archived",
      })
      .eq("id", id);

    if (deleteError) {
      throw new Error(`Failed to delete listing: ${deleteError.message}`);
    }
  }
}
