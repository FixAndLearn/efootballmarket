"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Edit3,
  PlusCircle,
  ShieldCheck,
  Star,
  Trophy,
  Crown,
  Lock,
  Image as ImageIcon,
  Share2,
  KeyRound,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { WithdrawModal } from "@/components/seller/WithdrawModal";
import { WhatsAppFlyerModal } from "@/components/seller/WhatsAppFlyerModal";
import { FastBuyLinkButton } from "@/components/marketplace/FastBuyLinkButton";
import { SellerListingOffersPanel } from "@/components/marketplace/SellerListingOffersPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, getPlatformLabel } from "@/lib/utils";
import { calculateEscrowCommission } from "@/lib/utils/commission";
import { getSellerTier } from "@/lib/utils/sellerTier";
import { Listing, ListingOffer, Order } from "@/types/database";

export interface SellerDashboardViewProps {
  sellerProfile: {
    available_balance: number;
    escrow_balance: number;
    completed_sales_count: number;
    seller_rating: number;
    is_verified_seller: boolean;
  };
  listings: Listing[];
  pendingOrders: Order[];
  incomingOffers?: ListingOffer[];
  userId?: string;
}

export function SellerDashboardView({
  sellerProfile,
  listings,
  pendingOrders,
  incomingOffers,
  userId,
}: SellerDashboardViewProps) {
  const router = useRouter();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedFlyerListing, setSelectedFlyerListing] = useState<Listing | null>(null);

  const tier = getSellerTier(
    sellerProfile.completed_sales_count,
    sellerProfile.seller_rating,
    Boolean(sellerProfile.is_verified_seller)
  );
  const currentSales = Number(sellerProfile.completed_sales_count) || 0;
  const targetSales = tier.level === "new_seller" ? 1 : 10;
  const progressPercent =
    tier.level === "top_seller"
      ? 100
      : Math.min(100, Math.round((currentSales / targetSales) * 100));

  const getOrderActionMeta = (status: string) => {
    switch (status) {
      case "escrow_locked":
        return {
          badge: "12h SLA · Deliver Credentials",
          badgeCls: "bg-sx-amber-tint text-sx-amber-text border-sx-amber-border",
          cta: "Deliver Credentials",
          urgent: true,
          icon: Clock,
        };
      case "seller_delivered":
      case "buyer_reviewing":
        return {
          badge: "24h Buyer Inspection · Share OTP",
          badgeCls: "bg-sx-info-tint text-sx-info-text border-sx-info-border",
          cta: "Open Order Chat",
          urgent: false,
          icon: KeyRound,
        };
      case "disputed":
        return {
          badge: "Dispute Active · Upload Proof",
          badgeCls: "bg-sx-red-tint text-sx-red-text border-sx-red-border",
          cta: "Open Dispute Room",
          urgent: true,
          icon: ShieldAlert,
        };
      default:
        return {
          badge: status.replace(/_/g, " ").toUpperCase(),
          badgeCls: "bg-sx-stone text-sx-muted border-sx-border",
          cta: "Open Order Room",
          urgent: false,
          icon: Clock,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Financial & Reputation Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-sx-canvas border border-sx-border flex flex-col justify-between">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-sx-muted">
              Available to Withdraw
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-sx-green-text font-mono mt-1.5 block">
              {formatCurrency(sellerProfile.available_balance)}
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="mt-4 w-full"
            onClick={() => setIsWithdrawModalOpen(true)}
            disabled={sellerProfile.available_balance < 10 && sellerProfile.escrow_balance <= 0}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Withdraw to M-Pesa</span>
          </Button>
        </div>

        <div className="p-5 rounded-xl bg-sx-canvas border border-sx-border flex flex-col justify-between">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-sx-muted">
              Locked in Escrow
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-sx-amber-text font-mono mt-1.5 block">
              {formatCurrency(sellerProfile.escrow_balance)}
            </span>
          </div>
          <span className="text-[11px] text-sx-muted mt-4 block">
            Released to M-Pesa wallet once buyer verifies squad
          </span>
        </div>

        <div className="p-5 rounded-xl bg-sx-canvas border border-sx-border flex flex-col justify-between">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-sx-muted">
              Completed Transfers
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-sx-ink font-mono mt-1.5 block">
              {sellerProfile.completed_sales_count}
            </span>
          </div>
          <span className="text-[11px] text-sx-muted mt-4 block">
            Escrow fee: 5% (min KES 50, max KES 500)
          </span>
        </div>

        <div className="p-5 rounded-xl bg-sx-canvas border border-sx-border flex flex-col justify-between">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-sx-muted">
              Seller Rating &amp; KYC
            </span>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-sx-ink font-mono">
                {sellerProfile.seller_rating > 0
                  ? Number(sellerProfile.seller_rating).toFixed(1)
                  : "New"}
              </span>
              {sellerProfile.seller_rating > 0 && (
                <Star className="w-5 h-5 text-sx-amber-text fill-current" />
              )}
            </div>
          </div>
          <div className="mt-4 text-xs">
            {sellerProfile.is_verified_seller ? (
              <span className="text-sx-green-text inline-flex items-center gap-1 font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" /> KYC Verified Seller
              </span>
            ) : (
              <Link
                href="/seller/verification"
                className="text-sx-amber-text font-semibold hover:underline text-[11px]"
              >
                Submit KYC Verification &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 1. Active Escrow Orders FIRST so sellers never miss handovers or OTP requests */}
      {pendingOrders.length > 0 && (
        <div className="rounded-xl bg-sx-canvas border-2 border-sx-amber-border overflow-hidden">
          <div className="px-5 py-3.5 bg-sx-amber-tint border-b border-sx-amber-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sx-amber-text animate-pulse" />
              <h2 className="text-sm sm:text-base font-bold text-sx-amber-text font-display">
                Active Escrow Orders ({pendingOrders.length})
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-sx-amber-text hidden sm:inline">
              Deliver Konami ID &amp; stay ready for my.konami.net OTP
            </span>
          </div>

          <div className="divide-y divide-sx-border">
            {pendingOrders.map((order) => {
              const meta = getOrderActionMeta(order.status);
              const MetaIcon = meta.icon;
              const gross = Number(order.total_amount || 0);
              const fee =
                Number(order.platform_fee) > 0
                  ? Number(order.platform_fee)
                  : calculateEscrowCommission(gross);
              const net =
                Number(order.seller_net_amount) > 0
                  ? Number(order.seller_net_amount)
                  : Math.max(0, gross - fee);

              return (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-sx-subtle transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sx-muted">
                        #{order.order_number}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${meta.badgeCls}`}
                      >
                        <MetaIcon className="w-3 h-3" />
                        <span>{meta.badge}</span>
                      </span>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-sx-ink">
                      {order.listing?.title || "Squad Transfer"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-sx-border">
                    <div className="text-left sm:text-right">
                      <span className="block text-[11px] text-sx-muted">Your Net Payout</span>
                      <span className="text-sm sm:text-base font-extrabold font-mono text-sx-green-text">
                        {formatCurrency(net, order.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(order.status === "seller_delivered" ||
                        order.status === "buyer_reviewing") && (
                        <Link href={`/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            <span>Escrow Room</span>
                          </Button>
                        </Link>
                      )}
                      <Link
                        href={
                          order.status === "seller_delivered" ||
                          order.status === "buyer_reviewing"
                            ? `/orders/${order.id}/chat`
                            : `/orders/${order.id}`
                        }
                      >
                        <Button variant={meta.urgent ? "primary" : "secondary"} size="sm">
                          <span>{meta.cta}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Incoming Buyer Price Offers */}
      {incomingOffers && incomingOffers.length > 0 && (
        <SellerListingOffersPanel initialOffers={incomingOffers} />
      )}

      {/* 3. Seller Inventory with Direct Pay Links, Net Payouts & WhatsApp Flyer */}
      <div className="rounded-xl bg-sx-canvas border border-sx-border overflow-hidden">
        <div className="px-5 py-4 border-b border-sx-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-sx-ink font-display">
              Your Squad Inventory ({listings.length})
            </h2>
            <p className="text-xs text-sx-muted">
              Copy direct M-Pesa checkout links (<code className="font-mono">/pay/id</code>) to share in WhatsApp groups or DMs.
            </p>
          </div>
          <Link href="/seller/create-listing" className="shrink-0">
            <Button variant="primary" size="sm">
              <PlusCircle className="w-4 h-4" />
              <span>New Listing</span>
            </Button>
          </Link>
        </div>

        {listings.length > 0 ? (
          <div className="divide-y divide-sx-border">
            {listings.map((item) => {
              const primaryImage =
                item.images?.find((img) => img.is_primary)?.image_url ||
                item.images?.[0]?.image_url;
              const fee = calculateEscrowCommission(item.price);
              const netPayout = Math.max(0, item.price - fee);
              const payLink = `https://www.efootballmarket.co.ke/pay/${item.id}`;
              const waShareUrl = `https://wa.me/?text=${encodeURIComponent(
                `Buy my verified eFootball squad "${item.title}" (${
                  item.overall_team_strength
                } OVR) for ${formatCurrency(
                  item.price,
                  item.currency
                )} via Safaricom M-Pesa Escrow (Till 1572931): ${payLink}`
              )}`;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-sx-subtle transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <Link
                      href={`/listings/${item.id}`}
                      className="relative w-20 h-16 rounded-lg overflow-hidden bg-sx-stone border border-sx-border shrink-0 block"
                    >
                      {primaryImage ? (
                        <Image
                          src={primaryImage}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sx-green-text">
                          <Trophy className="w-5 h-5" />
                        </div>
                      )}
                    </Link>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant={item.status === "published" ? "success" : "default"}
                          size="sm"
                        >
                          {item.status.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-sx-muted font-medium">
                          {getPlatformLabel(item.platform)}
                        </span>
                        <span className="text-xs text-sx-green-text font-bold font-mono">
                          {item.overall_team_strength} OVR
                        </span>
                      </div>

                      <Link
                        href={`/listings/${item.id}`}
                        className="text-sm sm:text-base font-bold text-sx-ink hover:text-sx-green-text transition-colors line-clamp-1 block"
                      >
                        {item.title}
                      </Link>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                        <span className="font-mono font-bold text-sx-ink">
                          Ask: {formatCurrency(item.price, item.currency)}
                        </span>
                        <span className="font-mono font-semibold text-sx-green-text">
                          Net Payout: {formatCurrency(netPayout, item.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Marketing & Management Actions */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-sx-border shrink-0">
                    {item.status === "published" && (
                      <>
                        <FastBuyLinkButton listingId={item.id} variant="compact" />
                        <a
                          href={waShareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Share Direct M-Pesa Link on WhatsApp"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-sx-stone hover:bg-sx-elevated border border-sx-border text-sx-ink transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5 text-sx-green-text" />
                          <span>WhatsApp</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => setSelectedFlyerListing(item)}
                          title="Download Squad Promo Flyer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-sx-stone hover:bg-sx-elevated border border-sx-border text-sx-ink transition-colors"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-sx-muted" />
                          <span>Flyer</span>
                        </button>
                      </>
                    )}

                    <div className="flex items-center gap-2">
                      {item.status === "sold" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sx-stone border border-sx-border text-xs font-semibold text-sx-muted">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Sold</span>
                        </span>
                      ) : item.status === "in_escrow" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sx-amber-tint border border-sx-amber-border text-xs font-semibold text-sx-amber-text">
                          <Lock className="w-3.5 h-3.5" />
                          <span>In Escrow</span>
                        </span>
                      ) : (
                        <Link href={`/seller/edit-listing/${item.id}`}>
                          <Button variant="secondary" size="sm">
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Button>
                        </Link>
                      )}

                      <Link href={`/listings/${item.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={Trophy}
              title="No squad listings yet"
              description="Publish your first clean Konami ID squad with live M-Pesa payout calculation."
              actionLabel="List Squad Now"
              actionHref="/seller/create-listing"
            />
          </div>
        )}
      </div>

      {/* 4. Seller Reputation Tier */}
      <div className="rounded-xl bg-sx-canvas border border-sx-border p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                tier.level === "top_seller"
                  ? "bg-sx-amber-tint text-sx-amber-text border-sx-amber-border"
                  : tier.level === "id_verified"
                  ? "bg-sx-green-tint text-sx-green-text border-sx-green-border"
                  : tier.level === "proven_seller"
                  ? "bg-sx-info-tint text-sx-info-text border-sx-info-border"
                  : "bg-sx-stone text-sx-ink border-sx-border"
              }`}
            >
              {tier.level === "top_seller" ? (
                <Crown className="w-5 h-5" />
              ) : tier.level === "id_verified" || tier.level === "proven_seller" ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <Trophy className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-sx-ink font-display">{tier.label}</h3>
              <p className="text-xs text-sx-muted">{tier.description}</p>
            </div>
          </div>
          {tier.nextTierLabel && (
            <span className="text-xs font-bold text-sx-green-text shrink-0">
              {progressPercent}%
            </span>
          )}
        </div>

        {tier.nextTierLabel && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-sx-muted">
              <span>
                Progress to <strong className="text-sx-ink">{tier.nextTierLabel}</strong>
              </span>
              <span>
                {currentSales} / {targetSales} sales
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-sx-stone overflow-hidden border border-sx-border">
              <div
                className="h-full bg-sx-green transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-sx-border grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-sx-ink-soft">
          {tier.perks.map((perk, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sx-green shrink-0" />
              <span>{perk}</span>
            </div>
          ))}
        </div>
      </div>

      <WithdrawModal
        availableBalance={sellerProfile.available_balance}
        escrowBalance={sellerProfile.escrow_balance}
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {selectedFlyerListing && (
        <WhatsAppFlyerModal
          listing={selectedFlyerListing}
          isOpen={Boolean(selectedFlyerListing)}
          onClose={() => setSelectedFlyerListing(null)}
        />
      )}
    </div>
  );
}
