import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle2, ShieldCheck, Star, Store } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { VerifiedSellerBadge } from "@/components/marketplace/VerifiedSellerBadge";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { ShareStorefrontBar } from "@/components/marketplace/ShareStorefrontBar";
import { Listing } from "@/types/database";

export const revalidate = 30;

interface SellerStorefrontProps {
  params: {
    username: string;
  };
}

async function fetchSellerByUsername(rawUsername: string) {
  const decoded = decodeURIComponent(rawUsername).replace(/^@/, "").trim();
  if (!decoded) return null;

  const client = hasServiceRoleKey() ? createAdminClient() : createServerSupabaseClient();

  const { data: seller } = await client
    .from("profiles")
    .select(
      "id, username, full_name, avatar_url, is_verified_seller, seller_rating, total_reviews_count, completed_sales_count, created_at"
    )
    .ilike("username", decoded)
    .maybeSingle();

  if (!seller) return null;

  const { data: listings } = await client
    .from("listings")
    .select(
      "*, images:listing_images(*), seller:profiles!listings_seller_id_fkey(id, username, is_verified_seller, seller_rating, completed_sales_count)"
    )
    .eq("seller_id", seller.id)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return {
    seller,
    listings: ((listings as unknown) as Listing[]) || [],
  };
}

export async function generateMetadata({
  params,
}: SellerStorefrontProps): Promise<Metadata> {
  const result = await fetchSellerByUsername(params.username);
  if (!result) {
    return { title: "Seller Storefront Not Found" };
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
  const result = await fetchSellerByUsername(params.username);

  if (!result) {
    notFound();
  }

  const { seller, listings } = result;
  const sales = Number(seller.completed_sales_count || 0);
  const rating = Number(seller.seller_rating || 0);
  const reviewsCount = Number(seller.total_reviews_count || 0);
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
          Verified Seller Storefront
        </span>
      </div>

      {/* Storefront Hero Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-sx-stone border border-sx-border flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-sx-canvas border border-sx-border flex items-center justify-center font-display font-extrabold text-xl text-sx-ink shrink-0">
            {seller.username?.slice(0, 2).toUpperCase() || "EF"}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-sx-ink font-display tracking-tight">
                @{seller.username}
              </h1>
              <VerifiedSellerBadge seller={seller as any} size="md" showPopover={false} />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-sx-ink-soft">
              <span className="inline-flex items-center gap-1 font-semibold text-sx-ink">
                <CheckCircle2 className="w-3.5 h-3.5 text-sx-green-text" />
                <span>{sales} Completed Escrow Sales</span>
              </span>

              {rating > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold text-sx-ink">
                  <Star className="w-3.5 h-3.5 text-sx-amber-text fill-current" />
                  <span>
                    {rating.toFixed(1)} ({reviewsCount} review{reviewsCount === 1 ? "" : "s"})
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

        <ShareStorefrontBar
          username={seller.username}
          activeCount={listings.length}
        />
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
          <div className="p-12 rounded-2xl bg-sx-canvas border border-sx-border text-center space-y-3">
            <p className="text-sm font-bold text-sx-ink">
              No active squads currently listed by @{seller.username}
            </p>
            <p className="text-xs text-sx-muted max-w-md mx-auto">
              All previous squads may be sold or currently locked in buyer escrow inspection.
            </p>
            <Link
              href="/browse"
              className="inline-block pt-1 text-xs font-bold text-sx-green-text hover:underline"
            >
              Explore All Marketplace Squads &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
