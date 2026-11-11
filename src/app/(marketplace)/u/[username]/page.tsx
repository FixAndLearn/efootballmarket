import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  PlusCircle,
  Settings,
  ShieldCheck,
  Star,
  Store,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { VerifiedSellerBadge } from "@/components/marketplace/VerifiedSellerBadge";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { ShareStorefrontBar } from "@/components/marketplace/ShareStorefrontBar";
import { Button } from "@/components/ui/Button";
import { Listing, Profile } from "@/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SellerStorefrontProps {
  params: {
    username: string;
  };
}

async function fetchSellerByUsername(rawUsername: string) {
  const decoded = decodeURIComponent(rawUsername || "")
    .replace(/^@/, "")
    .trim();
  if (!decoded) return null;

  const userSupabase = createServerSupabaseClient();
  const {
    data: { user: viewer },
  } = await userSupabase.auth.getUser();

  const client = hasServiceRoleKey() ? createAdminClient() : userSupabase;

  // 1. Exact username match first, then case-insensitive fallback
  let { data: seller } = await client
    .from("profiles")
    .select("*")
    .eq("username", decoded)
    .limit(1)
    .maybeSingle();

  if (!seller) {
    const { data: ilikeSeller } = await client
      .from("profiles")
      .select("*")
      .ilike("username", decoded)
      .limit(1)
      .maybeSingle();
    seller = ilikeSeller;
  }

  // 2. Fallback if viewer is opening their own storefront by user ID or newly registered handle
  if (!seller && viewer) {
    const emailHandle = viewer.email
      ? viewer.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "")
      : "";
    const metaUsername = String(viewer.user_metadata?.username || "").trim();

    if (
      decoded === viewer.id ||
      (metaUsername && metaUsername.toLowerCase() === decoded.toLowerCase()) ||
      (emailHandle && emailHandle.toLowerCase() === decoded.toLowerCase())
    ) {
      const { data: ownProfile } = await client
        .from("profiles")
        .select("*")
        .eq("id", viewer.id)
        .maybeSingle();

      if (ownProfile) {
        seller = ownProfile;
      } else {
        const cleanId = viewer.id.replace(/-/g, "").slice(0, 6);
        const autoUsername =
          metaUsername || (emailHandle ? `${emailHandle}_${cleanId}` : `trader_${cleanId}`);
        const newProfile = {
          id: viewer.id,
          username: autoUsername,
          first_name: String(viewer.user_metadata?.first_name || emailHandle || "Trader"),
          last_name: String(viewer.user_metadata?.last_name || ""),
          phone_number: String(viewer.user_metadata?.phone_number || ""),
          country: "KEN",
          is_verified_seller: false,
          seller_rating: 0,
          total_reviews_count: 0,
          completed_sales_count: 0,
          available_balance: 0,
          escrow_balance: 0,
          is_suspended: false,
        };
        await client.from("profiles").upsert(newProfile, { onConflict: "id" });
        seller = {
          ...newProfile,
          avatar_url: null,
          bio: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        };
      }
    }
  }

  if (!seller) return null;

  // 3. Query active listings without fragile FK constraint hints and attach seller profile directly
  const { data: rawListings } = await client
    .from("listings")
    .select("*, images:listing_images(*)")
    .eq("seller_id", seller.id)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const listings: Listing[] = (rawListings || []).map((item: any) => ({
    ...(item as Listing),
    seller: seller as Profile,
  }));

  return {
    seller: seller as Profile,
    listings,
    isOwner: Boolean(viewer && viewer.id === seller.id),
  };
}

export async function generateMetadata({
  params,
}: SellerStorefrontProps): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const result = await fetchSellerByUsername(resolved.username);
  if (!result) {
    return { title: "Seller Storefront Not Found | eFootballMarket" };
  }

  const { seller, listings } = result;
  const title = `@${seller.username} — eFootball Squad Catalog (${listings.length} Active)`;
  const description = `Browse ${listings.length} verified Konami eFootball squads listed by @${seller.username} on eFootballMarket Kenya with M-Pesa Escrow protection.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
  };
}

export default async function SellerStorefrontPage({
  params,
}: SellerStorefrontProps) {
  const resolved = await Promise.resolve(params);
  const result = await fetchSellerByUsername(resolved.username);

  if (!result) {
    notFound();
  }

  const { seller, listings, isOwner } = result;
  const sales = Number(seller.completed_sales_count || 0);
  const rating = Number(seller.seller_rating || 0);
  const reviewsCount = Number(seller.total_reviews_count || 0);
  const fullDisplayName = [seller.first_name, seller.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const memberSince = seller.created_at
    ? new Date(seller.created_at).toLocaleDateString("en-KE", {
        month: "short",
        year: "numeric",
      })
    : "2026";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between pb-3 border-b border-sx-border">
        <Link
          href="/browse"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-sx-muted hover:text-sx-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Marketplace</span>
        </Link>
        <span className="text-[11px] font-mono uppercase tracking-wider text-sx-muted">
          {isOwner ? "Your Public Storefront" : "Verified Seller Storefront"}
        </span>
      </div>

      {/* Storefront Hero Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-sx-subtle border border-sx-border flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-sx-stone border border-sx-border flex items-center justify-center font-display font-extrabold text-xl text-sx-green-text shrink-0">
            {seller.username?.slice(0, 2).toUpperCase() || "EF"}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-sx-ink font-display tracking-tight">
                @{seller.username}
              </h1>
              <VerifiedSellerBadge
                seller={seller}
                size="md"
                showPopover={false}
              />
            </div>

            {seller.bio ? (
              <p className="text-xs sm:text-sm text-sx-ink-soft max-w-2xl">
                {seller.bio}
              </p>
            ) : fullDisplayName ? (
              <p className="text-xs text-sx-muted">{fullDisplayName}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-sx-ink-soft">
              <span className="inline-flex items-center gap-1 font-semibold text-sx-ink">
                <CheckCircle2 className="w-3.5 h-3.5 text-sx-green-text" />
                <span>{sales} Completed Escrow Sales</span>
              </span>

              {rating > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold text-sx-ink">
                  <Star className="w-3.5 h-3.5 text-sx-amber-text fill-current" />
                  <span>
                    {rating.toFixed(1)} ({reviewsCount} review
                    {reviewsCount === 1 ? "" : "s"})
                  </span>
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-sx-muted">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {memberSince}</span>
              </span>
            </div>

            <p className="text-xs text-sx-muted flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sx-green-text shrink-0" />
              <span>
                Every squad below is backed by Safaricom M-Pesa Escrow (Till 1572931) &amp; 24-hour login inspection.
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0">
          <ShareStorefrontBar
            username={seller.username}
            activeCount={listings.length}
          />

          {isOwner && (
            <div className="flex items-center gap-2">
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </Button>
              </Link>
              <Link href="/seller/create-listing">
                <Button variant="primary" size="sm">
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>List Squad</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Published Squads Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-sx-ink font-display flex items-center gap-2">
            <Store className="w-5 h-5 text-sx-green-text" />
            <span>Active Squads ({listings.length})</span>
          </h2>
        </div>

        {listings.length === 0 ? (
          <div className="p-12 rounded-2xl bg-sx-subtle border border-sx-border text-center space-y-3">
            <p className="text-sm font-bold text-sx-ink">
              {isOwner
                ? "You haven't published any active squads yet"
                : `No active squads currently listed by @${seller.username}`}
            </p>
            <p className="text-xs text-sx-muted max-w-md mx-auto">
              {isOwner
                ? "List your first Clean Konami ID squad to showcase it on your shareable public storefront."
                : "All previous squads may be sold or currently locked in buyer escrow inspection."}
            </p>
            <Link
              href={isOwner ? "/seller/create-listing" : "/browse"}
              className="inline-block pt-1 text-xs font-bold text-sx-green-text hover:underline"
            >
              {isOwner
                ? "Create Your First Squad Listing →"
                : "Explore All Marketplace Squads →"}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
