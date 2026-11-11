import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface VerifiedSellerReview {
  id: string;
  orderId: string;
  orderNumber: string;
  rating: number;
  comment: string | null;
  buyerLabel: string;
  createdAt: string;
}

function maskBuyerHandle(raw?: string | null): string {
  const clean = (raw || "").trim().replace(/^@/, "");
  if (!clean) return "Verified Buyer";
  if (clean.length <= 3) return `@${clean[0]}***`;
  return `@${clean.slice(0, 2)}***${clean.slice(-1)}`;
}

/**
 * Fetches verified completed-escrow buyer ratings & comments for a seller.
 * Pulls from `audit_logs` (`action = "ORDER_SELLER_RATING"`) and optionally `reviews`.
 */
export async function getVerifiedSellerReviews(
  sellerId: string,
  limit = 8
): Promise<VerifiedSellerReview[]> {
  if (!sellerId) return [];

  try {
    const client = hasServiceRoleKey()
      ? createAdminClient()
      : createServerSupabaseClient();

    const byOrder = new Map<string, VerifiedSellerReview>();

    // 1. Primary source: audit_logs (written by POST /api/orders/[id]/rate)
    const { data: logs } = await client
      .from("audit_logs")
      .select("id, user_id, resource_id, changes, created_at")
      .eq("action", "ORDER_SELLER_RATING")
      .order("created_at", { ascending: false })
      .limit(120);

    const matchingLogs = (logs || []).filter((row: any) => {
      const ch = row?.changes;
      return ch && String(ch.seller_id || "") === sellerId;
    });

    // Hydrate masked buyer usernames safely
    const buyerIds = Array.from(
      new Set(
        matchingLogs
          .map((r: any) => r.user_id)
          .filter((id: any): id is string => Boolean(id))
      )
    );

    const buyerMap = new Map<string, string>();
    if (buyerIds.length > 0) {
      const { data: buyers } = await client
        .from("profiles")
        .select("id, username, first_name")
        .in("id", buyerIds);

      for (const b of buyers || []) {
        buyerMap.set(
          b.id,
          maskBuyerHandle(b.username || b.first_name || "Buyer")
        );
      }
    }

    for (const row of matchingLogs) {
      const ch = (row as any).changes || {};
      const orderId = String(row.resource_id || row.id);
      const rating = Math.min(5, Math.max(1, Number(ch.rating) || 5));
      const comment =
        typeof ch.comment === "string" && ch.comment.trim()
          ? ch.comment.trim()
          : null;
      const orderNumRaw = String(ch.order_number || "").trim();
      const orderNumber = orderNumRaw
        ? `#${orderNumRaw.slice(-6).toUpperCase()}`
        : "Escrow Verified";

      if (!byOrder.has(orderId)) {
        byOrder.set(orderId, {
          id: String(row.id),
          orderId,
          orderNumber,
          rating,
          comment,
          buyerLabel:
            (row.user_id && buyerMap.get(row.user_id)) || "Verified Buyer",
          createdAt: String(row.created_at || new Date().toISOString()),
        });
      }
    }

    // 2. Secondary optional source: `reviews` table if present
    try {
      const { data: directReviews } = await client
        .from("reviews")
        .select("id, order_id, reviewer_id, rating, comment, created_at")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false })
        .limit(limit);

      for (const rev of directReviews || []) {
        const oid = String(rev.order_id || rev.id);
        if (!byOrder.has(oid)) {
          byOrder.set(oid, {
            id: String(rev.id),
            orderId: oid,
            orderNumber: "Escrow Verified",
            rating: Math.min(5, Math.max(1, Number(rev.rating) || 5)),
            comment:
              typeof rev.comment === "string" && rev.comment.trim()
                ? rev.comment.trim()
                : null,
            buyerLabel: "Verified Buyer",
            createdAt: String(rev.created_at || new Date().toISOString()),
          });
        }
      }
    } catch {
      // `reviews` table optional
    }

    return Array.from(byOrder.values())
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);
  } catch {
    return [];
  }
}
