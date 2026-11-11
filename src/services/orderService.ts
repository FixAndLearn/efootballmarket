import { EscrowAccount, Listing, Order, Profile } from "@/types/database";
import { SupabaseClient } from "@supabase/supabase-js";
import { calculateEscrowCommission } from "@/lib/utils/commission";

export class OrderService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Generates a high-entropy sequential order number.
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `EFM-${timestamp}-${random}`;
  }

  /**
   * Creates an order and creates the matching escrow account atomically.
   */
  async createOrder(buyerId: string, listingId: string): Promise<Order> {
    // 1. Fetch and verify listing
    const { data: listing, error: listingError } = await this.supabase
      .from("listings")
      .select("*")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      throw new Error("Listing not found.");
    }

    if (listing.status !== "published") {
      throw new Error("This listing is no longer available for purchase.");
    }

    if (listing.seller_id === buyerId) {
      throw new Error("You cannot purchase your own account listing.");
    }

    const price = Number(listing.price);
    // Platform escrow commission: 5% based on account value, bounded between KES 50 and KES 500
    const platformFee = calculateEscrowCommission(price);
    const sellerNetAmount = Math.max(0, price - platformFee);
    const orderNumber = this.generateOrderNumber();

    // 2. Insert order
    const { data: order, error: orderError } = await this.supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        listing_id: listingId,
        buyer_id: buyerId,
        seller_id: listing.seller_id,
        total_amount: price,
        platform_fee: platformFee,
        seller_net_amount: sellerNetAmount,
        currency: listing.currency || "KES",
        status: "payment_pending",
      })
      .select()
      .single();

    if (orderError || !order) {
      throw new Error(`Failed to create order: ${orderError?.message}`);
    }

    // 3. Create Escrow Account record
    const { error: escrowError } = await this.supabase
      .from("escrow_accounts")
      .insert({
        order_id: order.id,
        buyer_id: buyerId,
        seller_id: listing.seller_id,
        gross_amount: price,
        fee_amount: platformFee,
        net_amount: sellerNetAmount,
        currency: listing.currency || "KES",
        escrow_state: "pending",
      });

    if (escrowError) {
      console.error("Escrow initialization error:", escrowError);
      throw new Error("Failed to initialize escrow account for order.");
    }

    return order as Order;
  }

  /**
   * Hydrates raw order rows with listings (+ images), buyer/seller profiles, and escrow accounts
   * without relying on fragile or ambiguous PostgREST foreign-key constraint names.
   */
  private async hydrateOrders(rawOrders: any[]): Promise<Order[]> {
    if (!rawOrders || rawOrders.length === 0) return [];

    const orderIds = Array.from(
      new Set(rawOrders.map((o) => o.id).filter(Boolean))
    );
    const listingIds = Array.from(
      new Set(rawOrders.map((o) => o.listing_id).filter(Boolean))
    );
    const profileIds = Array.from(
      new Set(
        rawOrders
          .flatMap((o) => [o.buyer_id, o.seller_id])
          .filter(Boolean)
      )
    );

    const [listingsRes, profilesRes, escrowsRes] = await Promise.all([
      listingIds.length > 0
        ? this.supabase
            .from("listings")
            .select("*, images:listing_images(*)")
            .in("id", listingIds)
        : Promise.resolve({ data: [] as any[] }),
      profileIds.length > 0
        ? this.supabase.from("profiles").select("*").in("id", profileIds)
        : Promise.resolve({ data: [] as any[] }),
      orderIds.length > 0
        ? this.supabase
            .from("escrow_accounts")
            .select("*")
            .in("order_id", orderIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const listingMap = new Map<string, Listing>();
    for (const l of listingsRes.data || []) {
      listingMap.set(l.id, l as Listing);
    }

    const profileMap = new Map<string, Profile>();
    for (const p of profilesRes.data || []) {
      profileMap.set(p.id, p as Profile);
    }

    const escrowMap = new Map<string, EscrowAccount>();
    for (const e of escrowsRes.data || []) {
      if (e?.order_id && !escrowMap.has(e.order_id)) {
        escrowMap.set(e.order_id, e as EscrowAccount);
      }
    }

    return rawOrders.map((o) => ({
      ...(o as Order),
      listing: listingMap.get(o.listing_id) || o.listing || undefined,
      buyer: profileMap.get(o.buyer_id) || o.buyer || undefined,
      seller: profileMap.get(o.seller_id) || o.seller || undefined,
      escrow:
        escrowMap.get(o.id) ||
        (Array.isArray(o.escrow) ? o.escrow[0] : o.escrow) ||
        undefined,
    }));
  }

  /**
   * Retrieves full order details with joined listing, escrow, buyer, and seller.
   */
  async getOrderById(identifier: string): Promise<Order | null> {
    if (!identifier) return null;

    const clean = decodeURIComponent(identifier).trim();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        clean
      );

    let query = this.supabase.from("orders").select("*");
    if (isUuid) {
      query = query.eq("id", clean);
    } else {
      query = query.eq("order_number", clean);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      if (error) {
        console.warn("Order retrieval warning:", error.message);
      }
      return null;
    }

    const hydrated = await this.hydrateOrders([data]);
    return hydrated[0] || null;
  }

  /**
   * Retrieves orders for a given user (either as buyer or seller).
   */
  async getUserOrders(
    userId: string,
    role: "buyer" | "seller"
  ): Promise<Order[]> {
    if (!userId) return [];
    const column = role === "buyer" ? "buyer_id" : "seller_id";

    const { data, error } = await this.supabase
      .from("orders")
      .select("*")
      .eq(column, userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getUserOrders query error:", error.message);
      return [];
    }

    return this.hydrateOrders(data || []);
  }
}
