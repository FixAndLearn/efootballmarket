import { Listing, Profile } from "@/types/database";

/**
 * Safe public columns on `public.profiles`.
 * Never includes `email`, `phone_number`, `first_name`, `last_name`,
 * `available_balance`, or `escrow_balance`.
 */
export const PUBLIC_SELLER_PROFILE_SELECT =
  "id, username, avatar_url, bio, country, role, is_verified_seller, is_suspended, seller_rating, total_reviews_count, completed_sales_count, created_at, updated_at";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const KENYAN_PHONE_IN_TEXT_REGEX =
  /(?:\+?254|0)\s*[17]\d{1,2}[\s-]*\d{3}[\s-]*\d{3}\b/g;

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
