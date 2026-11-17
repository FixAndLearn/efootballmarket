import { Listing } from "@/types/database";

/**
 * A listing can be bargained on only while it is published and by a buyer who
 * does not own it. This check is intentionally independent of day/time and
 * promotional or featured listing flags.
 */
export function canListingBeBargained(
  listing?: Listing | null,
  currentUserId?: string
): {
  allowed: boolean;
  reason?: "not_published" | "is_owner";
  message?: string;
} {
  if (!listing) {
    return { allowed: false, reason: "not_published", message: "Listing not found." };
  }

  if (listing.status !== "published") {
    return {
      allowed: false,
      reason: "not_published",
      message:
        listing.status === "sold"
          ? "This account has already been sold and delivered."
          : "This account is currently locked in escrow inspection.",
    };
  }

  if (currentUserId && currentUserId === listing.seller_id) {
    return {
      allowed: false,
      reason: "is_owner",
      message: "You own this listing.",
    };
  }

  return { allowed: true };
}
