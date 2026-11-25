import type { SupabaseClient } from "@supabase/supabase-js";
import {
  accountFingerprint,
  NEAR_DUPLICATE_DISTANCE,
  hashDistance,
} from "./listingVerification";

export interface IntegrityFlag {
  kind: "relist_after_sale" | "duplicate_seller" | "duplicate_other_seller" | "image_reuse";
  severity: "block" | "review";
  message: string;
}

/**
 * Checks a listing against every other listing before it goes live.
 *
 * The scam this exists to catch: sell an account, let the buyer get comfortable,
 * recover it, then relist the same squad. Buyers only notice weeks later.
 * eFootball metadata makes this detectable — a dream team name plus record is
 * very hard to change without actually playing the account.
 *
 * Deliberately conservative: only a *completed sale by the same seller* blocks
 * outright. Everything else queues for review, because a false block on an
 * honest seller is worse than a delayed real one.
 */
export async function checkListingIntegrity(
  client: SupabaseClient,
  listing: {
    id: string;
    seller_id: string;
    dream_team_name?: string | null;
    overall_team_strength?: number | null;
    matches_played?: number | null;
    wins?: number | null;
    goals_scored?: number | null;
  }
): Promise<IntegrityFlag[]> {
  const flags: IntegrityFlag[] = [];
  const fingerprint = accountFingerprint(listing);

  const { data: existing, error } = await client
    .from("listing_fingerprints")
    .select("listing_id, seller_id, fingerprint_hash, image_hashes")
    .eq("fingerprint_hash", fingerprint)
    .neq("listing_id", listing.id)
    .limit(50);

  if (error) {
    // Never let an integrity check block a legitimate publish; log and move on.
    console.warn("Listing integrity lookup failed:", error.message);
    return flags;
  }

  for (const row of existing ?? []) {
    if (row.seller_id === listing.seller_id) {
      // Same squad, same seller. Only suspicious if the previous copy sold.
      const { data: priorOrder } = await client
        .from("orders")
        .select("id, status")
        .eq("listing_id", row.listing_id)
        .in("status", ["completed", "recall_window", "refunded"])
        .limit(1)
        .maybeSingle();

      if (priorOrder) {
        flags.push({
          kind: "relist_after_sale",
          severity: "block",
          message:
            "This account matches a squad you already sold. Relisting a sold account is the pattern behind recovery fraud, so it needs an admin to approve it.",
        });
      } else {
        flags.push({
          kind: "duplicate_seller",
          severity: "review",
          message: "This looks like a duplicate of another listing of yours.",
        });
      }
    } else {
      flags.push({
        kind: "duplicate_other_seller",
        severity: "review",
        message:
          "Another seller has listed a squad with identical details. At least one of you cannot hand over what is described.",
      });
    }
  }

  return flags;
}

/**
 * Image reuse across listings. Runs on the hashes produced at upload time.
 */
export async function checkImageReuse(
  client: SupabaseClient,
  listingId: string,
  hashes: string[]
): Promise<IntegrityFlag[]> {
  if (hashes.length === 0) return [];

  const { data: others, error } = await client
    .from("listing_fingerprints")
    .select("listing_id, seller_id, image_hashes")
    .neq("listing_id", listingId)
    .not("image_hashes", "is", null)
    .limit(500);

  if (error || !others) return [];

  const parseHash = (value: string) => {
    if (value.startsWith("exact:")) return { kind: "exact", value: value.slice(6) };
    if (value.startsWith("phash:")) return { kind: "perceptual", value: value.slice(6) };
    // Legacy rows stored bare 64-bit perceptual hashes.
    return { kind: "perceptual", value };
  };

  const flags: IntegrityFlag[] = [];
  for (const other of others) {
    const theirs: string[] = other.image_hashes ?? [];
    for (const mineValue of hashes) {
      const mine = parseHash(mineValue);
      for (const theirValue of theirs) {
        const theirsHash = parseHash(theirValue);
        const reused = mine.kind === "exact" && theirsHash.kind === "exact"
          ? mine.value === theirsHash.value
          : mine.kind === "perceptual" && theirsHash.kind === "perceptual"
            ? hashDistance(mine.value, theirsHash.value) <= NEAR_DUPLICATE_DISTANCE
            : false;
        if (reused) {
          flags.push({
            kind: "image_reuse",
            severity: "review",
            message:
              "A screenshot on this listing is already in use on another listing. The same photos usually mean the account is not really being sold twice.",
          });
          return flags;
        }
      }
    }
  }
  return flags;
}

/**
 * Records the listing's fingerprint so future listings can be compared to it.
 * Called after every save/publish; upsert because a listing is edited repeatedly.
 */
export async function recordListingFingerprint(
  client: SupabaseClient,
  listing: {
    id: string;
    seller_id: string;
    dream_team_name?: string | null;
    overall_team_strength?: number | null;
    matches_played?: number | null;
    wins?: number | null;
    goals_scored?: number | null;
  },
  imageHashes: string[] = []
): Promise<void> {
  const { error } = await client.from("listing_fingerprints").upsert(
    {
      listing_id: listing.id,
      seller_id: listing.seller_id,
      fingerprint_hash: accountFingerprint(listing),
      image_hashes: imageHashes,
    },
    { onConflict: "listing_id" }
  );

  if (error) {
    console.warn("Could not record listing fingerprint:", error.message);
  }
}
