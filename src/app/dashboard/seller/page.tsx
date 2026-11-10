import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SellerDashboardView } from "@/components/seller/SellerDashboardView";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Listing, Order } from "@/types/database";

export const revalidate = 0;

export default async function SellerDashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/seller");
  }

  // Fetch seller profile
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "username, available_balance, escrow_balance, completed_sales_count, seller_rating, is_verified_seller"
    )
    .eq("id", user.id)
    .single();

  // Fetch seller listings WITH images so thumbnails & WhatsApp flyers render cleanly
  const { data: listings } = await supabase
    .from("listings")
    .select("*, images:listing_images(*)")
    .eq("seller_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Fetch ALL active escrow orders (awaiting credentials, in 24h OTP handover/inspection, or disputed)
  const { data: pendingOrders } = await supabase
    .from("orders")
    .select("*, listing:listings(id, title, platform, overall_team_strength)")
    .eq("seller_id", user.id)
    .in("status", ["escrow_locked", "seller_delivered", "buyer_reviewing", "disputed"])
    .order("created_at", { ascending: false });

  // Fetch incoming buyer price offers for this seller
  const { data: incomingOffers } = await supabase
    .from("listing_offers")
    .select("*, listing:listings(id, title, price, platform, overall_team_strength, manager_name)")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const sellerProfile = {
    available_balance: Number(profile?.available_balance || 0),
    escrow_balance: Number(profile?.escrow_balance || 0),
    completed_sales_count: profile?.completed_sales_count || 0,
    seller_rating: Number(profile?.seller_rating || 0),
    is_verified_seller: profile?.is_verified_seller || false,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-sx-border">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sx-green-text">
            Seller Control Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-sx-ink font-display tracking-tight mt-0.5">
            Inventory, Escrow &amp; M-Pesa Payouts
          </h1>
          <p className="text-xs sm:text-sm text-sx-muted mt-1">
            Share direct M-Pesa checkout links, complete Konami ID handovers, and withdraw earnings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {profile?.username && (
            <Link href={`/u/${encodeURIComponent(profile.username)}`}>
              <Button variant="secondary" size="md">
                <ExternalLink className="w-4 h-4" />
                <span>Public Storefront</span>
              </Button>
            </Link>
          )}
          <Link href="/seller/create-listing">
            <Button variant="primary" size="md">
              <PlusCircle className="w-4 h-4" />
              <span>List Squad</span>
            </Button>
          </Link>
        </div>
      </div>

      <SellerDashboardView
        userId={user.id}
        sellerProfile={sellerProfile}
        listings={(listings as Listing[]) || []}
        pendingOrders={(pendingOrders as Order[]) || []}
        incomingOffers={(incomingOffers as any[]) || []}
      />
    </div>
  );
}
