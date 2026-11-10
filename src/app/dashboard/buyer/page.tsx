import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BuyerDashboardView } from "@/components/dashboard/BuyerDashboardView";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { OrderService } from "@/services/orderService";

export const revalidate = 0;

export default async function BuyerDashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/buyer");
  }

  const orderService = new OrderService(supabase);
  const orders = await orderService.getUserOrders(user.id, "buyer");

  const activeOrders = orders.filter((o) =>
    ["payment_pending", "escrow_locked", "seller_delivered", "buyer_reviewing", "disputed"].includes(
      o.status
    )
  );
  const completedOrders = orders.filter((o) => o.status === "completed");

  const { data: myOffersRaw } = await supabase
    .from("listing_offers")
    .select(
      `
      id,
      listing_id,
      offer_amount,
      currency,
      message,
      status,
      created_at,
      listing:listings!listing_id(id, title, price, platform, overall_team_strength)
    `
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  const myOffers = (myOffersRaw || []).map((o: any) => ({
    ...o,
    listing: Array.isArray(o.listing) ? o.listing[0] : o.listing,
  }));

  const { data: favoritesRaw } = await supabase
    .from("favorites")
    .select(
      `
      id,
      created_at,
      listing:listings!listing_id(
        *,
        images:listing_images(*),
        seller:profiles!listings_seller_id_fkey(id, username, is_verified_seller, seller_rating, completed_sales_count)
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(24);

  const savedListings = (favoritesRaw || [])
    .map((f: any) => (Array.isArray(f.listing) ? f.listing[0] : f.listing))
    .filter((l: any) => l && !l.deleted_at);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-sx-border">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sx-green-text">
            Buyer Account
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-sx-ink font-display tracking-tight mt-0.5">
            Orders &amp; Offers
          </h1>
          <p className="text-xs sm:text-sm text-sx-muted mt-1">
            Track M-Pesa escrow custody, inspect delivered Konami IDs, and manage your squad offers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/wanted">
            <Button variant="secondary" size="sm">
              <Plus className="w-3.5 h-3.5" />
              Post Wanted Squad
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="primary" size="sm">
              Browse Squads
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-xl bg-sx-canvas border border-sx-border flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-sx-stone border border-sx-border flex items-center justify-center text-sx-ink shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-sx-muted">Total Orders</p>
            <p className="text-2xl font-extrabold text-sx-ink font-mono">{orders.length}</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-sx-canvas border border-sx-border flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-sx-amber-tint border border-sx-amber-border flex items-center justify-center text-sx-amber-text shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-sx-muted">Active Escrow / Pending</p>
            <p className="text-2xl font-extrabold text-sx-amber-text font-mono">
              {activeOrders.length}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-sx-canvas border border-sx-border flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-sx-green-tint border border-sx-green-border flex items-center justify-center text-sx-green-text shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-sx-muted">Verified &amp; Completed</p>
            <p className="text-2xl font-extrabold text-sx-green-text font-mono">
              {completedOrders.length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Orders, Offers & Watchlist Interactive View */}
      <BuyerDashboardView
        orders={orders}
        myOffers={myOffers}
        savedListings={savedListings}
      />

      {/* Need Escrow Help Bar */}
      <div className="rounded-xl bg-sx-stone border border-sx-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <span className="text-sx-muted">
          Paid via Safaricom Buy Goods Till <strong className="font-mono text-sx-ink">1572931</strong> or need help verifying a Konami ID?
        </span>
        <a
          href="https://wa.me/254794400365?text=Hello%20eFootballMarket%20Escrow%20Desk%2C%20I%20need%20help%20with%20my%20buyer%20order."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-bold text-sx-green-text hover:underline shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp Escrow Desk (+254 794 400 365)</span>
        </a>
      </div>
    </div>
  );
}
