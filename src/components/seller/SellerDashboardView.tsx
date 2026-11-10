"use client";

import { WithdrawModal } from "@/components/seller/WithdrawModal";
import { WhatsAppFlyerModal } from "@/components/seller/WhatsAppFlyerModal";
import { FastBuyLinkButton } from "@/components/marketplace/FastBuyLinkButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, getPlatformLabel } from "@/lib/utils";
import { Listing, ListingOffer, Order } from "@/types/database";
import { SellerListingOffersPanel } from "@/components/marketplace/SellerListingOffersPanel";
import { SellerTelegramCard } from "@/components/seller/SellerTelegramCard";
import { ArrowRight, ArrowUpRight, Edit3, PlusCircle, ShieldCheck, Star, Trophy, Wallet, Sparkles, Crown, Lock } from "lucide-react";
import { getSellerTier } from "@/lib/utils/sellerTier";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface SellerDashboardViewProps {
  sellerProfile: {
    available_balance: number;
    escrow_balance: number;
    completed_sales_count: number;
    seller_rating: number;
    is_verified_seller: boolean;
    telegram_username?: string | null;
    telegram_chat_id?: string | null;
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

  return (
    <div className="space-y-8">
      {/* Top Financial Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="p-5 rounded-2xl bg-pitch-surface border border-pitch-border shadow-lg">
          <span className="block text-xs uppercase font-bold text-sx-muted tracking-wider">
            Available to Withdraw
          </span>
          <span className="text-3xl font-bold text-sx-green-text font-display mt-2 block font-mono">
            {formatCurrency(sellerProfile.available_balance)}
          </span>
          <Button
            variant="gold"
            size="sm"
            className="mt-3 w-full"
            onClick={() => setIsWithdrawModalOpen(true)}
            disabled={sellerProfile.available_balance < 10 && sellerProfile.escrow_balance <= 0}
          >
            <ArrowUpRight className="w-4 h-4 mr-1.5" />
            Withdraw M-Pesa
          </Button>
        </div>

        <div className="p-5 rounded-2xl bg-pitch-surface border border-pitch-border shadow-lg">
          <span className="block text-xs uppercase font-bold text-sx-amber-text tracking-wider">
            Locked in Escrow
          </span>
          <span className="text-3xl font-bold text-sx-amber-text font-display mt-2 block font-mono">
            {formatCurrency(sellerProfile.escrow_balance)}
          </span>
          <span className="text-[11px] text-sx-muted mt-3 block">
            Released automatically after buyer confirmation
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-pitch-surface border border-pitch-border shadow-lg">
          <span className="block text-xs uppercase font-bold text-sx-info-text tracking-wider">
            Completed Sales
          </span>
          <span className="text-3xl font-bold text-sx-ink font-display mt-2 block">
            {sellerProfile.completed_sales_count}
          </span>
          <span className="text-[11px] text-sx-muted mt-3 block">
            Total successful transfers
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-pitch-surface border border-pitch-border shadow-lg">
          <span className="block text-xs uppercase font-bold text-sx-muted tracking-wider">
            Seller Rating
          </span>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-3xl font-bold text-sx-ink font-display">
              {sellerProfile.seller_rating > 0
                ? Number(sellerProfile.seller_rating).toFixed(1)
                : "New"}
            </span>
            {sellerProfile.seller_rating > 0 && (
              <Star className="w-5 h-5 text-sx-amber-text fill-amber-400" />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-sx-ink-soft">
            {sellerProfile.is_verified_seller ? (
              <span className="text-sx-green-text flex items-center gap-1 font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" /> KYC Verified Seller
              </span>
            ) : (
              <Link href="/seller/verification" className="text-sx-amber-text hover:underline text-[11px]">
                Submit KYC Verification →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Seller Reputation & Tier Progress Ribbon */}
      {(() => {
        const tier = getSellerTier(sellerProfile.completed_sales_count, sellerProfile.seller_rating);
        const currentSales = Number(sellerProfile.completed_sales_count) || 0;
        const targetSales = tier.level === "rookie" ? 3 : tier.level === "verified" ? 10 : 10;
        const progressPercent = tier.level === "master" ? 100 : Math.min(100, Math.round((currentSales / targetSales) * 100));

        return (
          <div className="bg-pitch-surface/90 border border-pitch-border rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-inner ${
                    tier.level === "master"
                      ? "bg-sx-amber-tint text-sx-amber-text border border-amber-400/50"
                      : tier.level === "verified"
                      ? "bg-sx-green-tint text-sx-green-text border border-sx-green-border"
                      : "bg-sx-stone text-sx-ink-soft border border-sx-border-strong"
                  }`}
                >
                  {tier.level === "master" ? (
                    <Crown className="w-6 h-6 text-sx-amber-text fill-amber-400" />
                  ) : tier.level === "verified" ? (
                    <ShieldCheck className="w-6 h-6 text-sx-green-text" />
                  ) : (
                    <Trophy className="w-6 h-6 text-sx-muted" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-sx-ink font-display">{tier.label}</h3>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        tier.level === "master"
                          ? "bg-amber-400/20 text-sx-amber-text border border-amber-400/40"
                          : tier.level === "verified"
                          ? "bg-emerald-400/20 text-sx-green-text border border-emerald-400/40"
                          : "bg-sx-stone text-sx-ink-soft border border-sx-border-strong"
                      }`}
                    >
                      Tier {tier.level === "master" ? "3 (Elite)" : tier.level === "verified" ? "2 (Verified)" : "1 (Rookie)"}
                    </span>
                  </div>
                  <p className="text-xs text-sx-muted mt-0.5">{tier.description}</p>
                </div>
              </div>

              {tier.nextTierLabel ? (
                <div className="text-left sm:text-right">
                  <span className="text-xs font-semibold text-sx-ink-soft">
                    Next Tier: <span className="text-sx-amber-text font-bold">{tier.nextTierLabel}</span>
                  </span>
                  <span className="block text-[11px] text-sx-muted">
                    {tier.salesRequiredForNext} more completed trade{tier.salesRequiredForNext === 1 ? "" : "s"} required
                  </span>
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-xl bg-sx-amber-tint border border-sx-amber-border text-sx-amber-text text-xs font-bold text-center">
                  VIP Escrow Partner Tier Active
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {tier.nextTierLabel && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-sx-muted font-medium">
                  <span>Level Progress: {currentSales} / {targetSales} Deals</span>
                  <span className="text-sx-green-text font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-sx-stone overflow-hidden border border-sx-border-strong">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 via-emerald-400 to-amber-400 transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Tier Perks */}
            <div className="pt-2 border-t border-pitch-border/60">
              <span className="text-[11px] uppercase font-bold text-sx-muted tracking-wider block mb-2">
                Unlocked Privileges:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-sx-ink-soft">
                {tier.perks.map((perk, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Telegram Push Alerts & Official Community Group */}
      {userId && (
        <SellerTelegramCard
          userId={userId}
          initialTelegramUsername={sellerProfile.telegram_username}
          initialTelegramChatId={sellerProfile.telegram_chat_id}
        />
      )}

      {/* Action Required: Orders Awaiting Credential Delivery */}
      {pendingOrders.length > 0 && (
        <div className="bg-sx-amber-tint border border-sx-amber-border rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <h2 className="text-base font-bold text-sx-amber-text font-display">
              Action Required: {pendingOrders.length} Order(s) Awaiting Credential Delivery
            </h2>
          </div>

          <div className="divide-y divide-amber-900/40">
            {pendingOrders.map((order) => (
              <div key={order.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-sx-amber-text">
                    Order #{order.order_number}
                  </span>
                  <p className="text-sm font-semibold text-sx-ink-soft mt-0.5">
                    {order.listing?.title}
                  </p>
                </div>
                <Link href={`/orders/${order.id}`}>
                  <Button variant="gold" size="sm">
                    Deliver Credentials Now
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incoming Buyer Price Offers & Bargains */}
      {incomingOffers && incomingOffers.length > 0 && (
        <SellerListingOffersPanel initialOffers={incomingOffers} />
      )}

      {/* Seller Listings */}
      <div className="bg-pitch-surface border border-pitch-border rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-sx-ink font-display">
            Your Listed Accounts ({listings.length})
          </h2>
          <Link href="/seller/create-listing">
            <Button variant="primary" size="sm">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Create New Listing
            </Button>
          </Link>
        </div>

        {listings.length > 0 ? (
          <div className="divide-y divide-pitch-border/60">
            {listings.map((item) => (
              <div
                key={item.id}
                className="py-3.5 px-3 rounded-xl hover:bg-pitch-card/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={item.status === "published" ? "success" : "default"} size="sm">
                      {item.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-sx-muted">{getPlatformLabel(item.platform)}</span>
                    <span className="text-xs text-sx-amber-text font-semibold font-mono">
                      OVR {item.overall_team_strength}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-sx-ink">{item.title}</h3>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-pitch-border/40">
                  <span className="text-base font-bold text-sx-green-text font-display font-mono">
                    {formatCurrency(item.price, item.currency)}
                  </span>
                  <div className="flex items-center gap-2">
                    {item.status === "sold" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sx-stone border border-sx-border-strong text-xs font-semibold text-sx-muted select-none">
                        <Lock className="w-3.5 h-3.5 text-sx-muted" />
                        <span>Sold (Locked)</span>
                      </span>
                    ) : item.status === "in_escrow" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sx-amber-tint border border-sx-amber-border text-xs font-semibold text-sx-amber-text select-none">
                        <Lock className="w-3.5 h-3.5 text-sx-amber-text" />
                        <span>In Escrow</span>
                      </span>
                    ) : (
                      <Link href={`/seller/edit-listing/${item.id}`}>
                        <Button variant="gold" size="sm" className="text-xs px-3 py-1.5">
                          <Edit3 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    )}
                    <Link href={`/listings/${item.id}`}>
                      <Button variant="secondary" size="sm" className="text-xs px-3 py-1.5">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Trophy}
            title="No listings yet"
            description="You haven't listed any eFootball accounts for sale yet. Publish your squad to reach thousands of buyers."
            actionLabel="Create Account Listing"
            actionHref="/seller/create-listing"
          />
        )}
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
