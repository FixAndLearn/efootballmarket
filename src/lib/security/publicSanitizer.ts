import { Listing, Profile } from "@/types/database";

/**
 * Safe public columns on `public.profiles`.
 * Never includes `email`, `phone_number`, `first_name`, `last_name`,
 * `available_balance`, or `escrow_balance`.
 */
export const PUBLIC_SELLER_PROFILE_SELECT =
  "id, username, avatar_url, bio, country, role, is_verified_seller, is_suspended, seller_rating, total_reviews_count, completed_sales_count, created_at, updated_at";

/**
 * Columns a signed-in user may read for their OWN row.
 * `anon` no longer holds privileges on the sensitive columns below, so client
 * code must never use `.select("*")` on `public.profiles`.
 */
export const SELF_PROFILE_SELECT =
  `${PUBLIC_SELLER_PROFILE_SELECT}, first_name, last_name, phone_number, email, whatsapp_number, telegram_chat_id, telegram_username, telegram_phone, available_balance, escrow_balance, deleted_at`;

/**
 * Safe public columns on `public.tournament_participants`.
 * `phone_number` is deliberately excluded: it identifies a real player and the
 * roster is world-readable.
 */
export const PUBLIC_TOURNAMENT_PARTICIPANT_SELECT =
  "id, tournament_id, user_id, gamer_tag, friend_id, payment_status, payment_method, amount_paid, seed, created_at";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const KENYAN_PHONE_IN_TEXT_REGEX =
  /(?:\+?254|0)\s*[17]\d{1,2}[\s-]*\d{3}[\s-]*\d{3}\b/g;

/** Treat any at-sign in a public handle as private email-like content. */
export function isEmailLikeUsername(raw?: string | null): boolean {
  return Boolean(raw?.trim().includes("@"));
}

/**
 * Returns a public storefront path that never embeds an email-like handle.
 * Email-like handles use the profile UUID as an opaque, stable route key.
 */
export function getPublicStorefrontPath(
  profileId?: string | null,
  username?: string | null
): string {
  const id = String(profileId || "").trim();
  const handle = String(username || "").trim();
  const segment = isEmailLikeUsername(handle) ? id : handle || id;
  return segment ? `/u/${encodeURIComponent(segment)}` : "/browse";
}

/**
 * Ensures a public handle never exposes an email address.
 * Example: "brian.player@gmail.com" -> "brian_player"
 */
export function sanitizePublicUsername(raw?: string | null): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "seller";
  if (trimmed.includes("@")) {
    const localPart = trimmed
      .split("@")[0]
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
    return localPart || "seller";
  }
  return trimmed;
}

/**
 * Redacts accidental email addresses or personal phone numbers from public
 * listing titles, descriptions, metadata snippets, and structured data.
 */
export function redactAccidentalPii(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(EMAIL_REGEX, "[contact hidden]")
    .replace(KENYAN_PHONE_IN_TEXT_REGEX, "[phone hidden]");
}

/**
 * Strips private contact & financial fields from a seller profile object before
 * it reaches public pages, RSC client props, or public JSON APIs.
 */
export function sanitizePublicSellerProfile(
  seller?: Partial<Profile> | Record<string, any> | null
): Profile | undefined {
  if (!seller) return undefined;

  return {
    id: String(seller.id || ""),
    username: sanitizePublicUsername(seller.username),
    public_storefront_path: getPublicStorefrontPath(
      String(seller.id || ""),
      seller.username
    ),
    first_name: "",
    last_name: "",
    phone_number: "",
    avatar_url: seller.avatar_url || null,
    bio: seller.bio ? redactAccidentalPii(String(seller.bio)) : null,
    country: seller.country || "KEN",
    role: seller.role || "seller",
    is_verified_seller: Boolean(seller.is_verified_seller),
    seller_rating: Number(seller.seller_rating || 0),
    total_reviews_count: Number(seller.total_reviews_count || 0),
    completed_sales_count: Number(seller.completed_sales_count || 0),
    available_balance: 0,
    escrow_balance: 0,
    is_suspended: Boolean(seller.is_suspended),
    created_at: String(seller.created_at || ""),
    updated_at: String(seller.updated_at || ""),
    deleted_at: null,
  };
}

/**
 * Sanitizes a listing (and nested seller profile) for safe public display,
 * RSC serialization, search-engine snippets, and JSON-LD.
 */
export function sanitizeListingForPublic(listing: Listing): Listing {
  return {
    ...listing,
    title: redactAccidentalPii(listing.title),
    description: redactAccidentalPii(listing.description),
    dream_team_name: listing.dream_team_name
      ? redactAccidentalPii(listing.dream_team_name)
      : null,
    swap_preferences: listing.swap_preferences
      ? redactAccidentalPii(listing.swap_preferences)
      : null,
    seller: sanitizePublicSellerProfile(listing.seller),
  };
}
