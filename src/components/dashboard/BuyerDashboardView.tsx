"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Search,
  Tag,
  MessageCircle,
  Clock,
  KeyRound,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency, getPlatformLabel } from "@/lib/utils";
import { Order } from "@/types/database";

interface BuyerOfferItem {
  id: string;
  listing_id: string;
  offer_amount: number;
  currency: string;
  message: string | null;
  status: string;
  created_at: string;
  listing?: {
    id: string;
    title: string;
    price: number;
    platform: string;
    overall_team_strength: number;
  } | null;
}

interface BuyerDashboardViewProps {
  orders: Order[];
  myOffers?: BuyerOfferItem[];
}

type StatusFilter = "all" | "action_needed" | "active" | "completed" | "cancelled";

export const BuyerDashboardView: React.FC<BuyerDashboardViewProps> = ({
  orders,
  myOffers = [],
}) => {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const actionNeededCount = useMemo(
    () =>
      orders.filter((o) =>
        ["payment_pending", "seller_delivered", "buyer_reviewing"].includes(o.status)
      ).length,
    [orders]
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filter === "action_needed") {
        if (!["payment_pending", "seller_delivered", "buyer_reviewing"].includes(order.status)) {
          return false;
        }
      } else if (filter === "active") {
        if (
          ![
            "payment_pending",
            "escrow_locked",
            "seller_delivered",
            "buyer_reviewing",
            "disputed",
          ].includes(order.status)
        ) {
          return false;
        }
      } else if (filter === "completed") {
        if (order.status !== "completed") return false;
      } else if (filter === "cancelled") {
        if (!["cancelled", "refunded"].includes(order.status)) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = order.listing?.title?.toLowerCase().includes(q);
        const matchesOrderNum = order.order_number?.toLowerCase().includes(q);
        const matchesSeller = order.seller?.username?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesOrderNum && !matchesSeller) return false;
      }

      return true;
    });
  }, [orders, filter, searchQuery]);

  const getOrderBadge = (status: string) => {
    switch (status) {
      case "payment_pending":
        return {
          label: "Pay M-Pesa Deposit",
          cls: "bg-sx-amber-tint text-sx-amber-text border-sx-amber-border",
          cta: "Pay via M-Pesa",
          urgent: true,
          icon: Clock,
        };
      case "escrow_locked":
        return {
          label: "Escrow Locked · Seller Delivering",
          cls: "bg-sx-green-tint text-sx-green-text border-sx-green-border",
          cta: "Open Order Room",
          urgent: false,
          icon: ShieldCheck,
        };
      case "seller_delivered":
      case "buyer_reviewing":
        return {
          label: "Credentials Ready · Inspect Now",
          cls: "bg-sx-info-tint text-sx-info-text border-sx-info-border",
          cta: "Inspect & Verify Squad",
          urgent: true,
          icon: KeyRound,
        };
      case "completed":
        return {
          label: "Completed",
          cls: "bg-sx-green-tint text-sx-green-text border-sx-green-border",
          cta: "View Receipt",
          urgent: false,
          icon: CheckCircle2,
        };
      case "disputed":
        return {
          label: "Dispute Active",
          cls: "bg-sx-red-tint text-sx-red-text border-sx-red-border",
          cta: "Open Dispute Room",
          urgent: true,
          icon: ShieldAlert,
        };
      default:
        return {
          label: status.replace(/_/g, " ").toUpperCase(),
          cls: "bg-sx-stone text-sx-muted border-sx-border",
          cta: "View Order",
          urgent: false,
          icon: Clock,
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* Orders Section */}
      <div className="rounded-xl bg-sx-canvas border border-sx-border overflow-hidden">
        {/* Filter & Search Toolbar */}
        <div className="p-4 sm:p-5 border-b border-sx-border flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(
              [
                { id: "all", label: `All (${orders.length})` },
                {
                  id: "action_needed",
                  label: `Action Needed (${actionNeededCount})`,
                },
                { id: "active", label: "Active Escrow" },
                { id: "completed", label: "Completed" },
                { id: "cancelled", label: "Cancelled" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  filter === tab.id
                    ? "bg-sx-contrast text-sx-contrast-fg"
                    : "bg-sx-stone text-sx-muted hover:text-sx-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-sx-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order # or squad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-sx-stone border border-sx-border text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-green"
            />
          </div>
        </div>

        {/* Order Rows */}
        {orders.length === 0 ? (
          <div className="p-10 sm:p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-sx-stone border border-sx-border mx-auto flex items-center justify-center text-sx-muted">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-sx-ink font-display">No Orders Yet</h3>
              <p className="text-xs text-sx-muted max-w-sm mx-auto mt-1">
                Every squad purchase is protected by M-Pesa escrow custody (Till 1572931) with KES 0 extra buyer fees.
              </p>
            </div>
            <Link href="/marketplace" className="inline-block">
              <Button variant="primary" size="md">
                Explore Verified Squads
              </Button>
            </Link>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-semibold text-sx-ink">No matching orders</p>
            <button
              type="button"
              onClick={() => {
                setFilter("all");
                setSearchQuery("");
              }}
              className="text-xs font-bold text-sx-green-text hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-sx-border">
            {filteredOrders.map((order) => {
              const primaryImage =
                order.listing?.images?.find((img) => img.is_primary)?.image_url ||
                order.listing?.images?.[0]?.image_url;
              const badge = getOrderBadge(order.status);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-sx-subtle transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <Link
                      href={`/orders/${order.id}`}
                      className="relative w-20 h-16 rounded-lg overflow-hidden bg-sx-stone border border-sx-border shrink-0 block"
                    >
                      {primaryImage ? (
                        <Image
                          src={primaryImage}
                          alt={order.listing?.title || "Squad"}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sx-green-text">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                      )}
                    </Link>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-mono font-bold text-sx-muted">
                          #{order.order_number}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.cls}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      <Link
                        href={`/orders/${order.id}`}
                        className="text-sm sm:text-base font-bold text-sx-ink hover:text-sx-green-text transition-colors line-clamp-1 block"
                      >
                        {order.listing?.title || "eFootball Squad Order"}
                      </Link>

                      <p className="text-xs text-sx-muted">
                        Seller:{" "}
                        <span className="font-medium text-sx-ink-soft">
                          {order.seller?.username || "Verified Seller"}
                        </span>{" "}
                        ·{" "}
                        {new Date(order.created_at).toLocaleDateString("en-KE", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-sx-border shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-sm sm:text-base font-extrabold font-mono text-sx-ink">
                        {formatCurrency(order.total_amount, order.currency)}
                      </p>
                      <span className="text-[11px] text-sx-green-text font-medium">
                        KES 0 buyer fee
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/254794400365?text=${encodeURIComponent(
                          `Hello eFootballMarket Escrow Desk, checking on Buyer Order #${order.order_number}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="WhatsApp Support for this Order"
                        className="h-9 w-9 rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border flex items-center justify-center text-sx-muted hover:text-sx-green-text transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                      <Link href={`/orders/${order.id}`}>
                        <Button
                          variant={badge.urgent ? "primary" : "secondary"}
                          size="sm"
                        >
                          <span>{badge.cta}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Price Offers Section */}
      {myOffers.length > 0 && (
        <div className="rounded-xl bg-sx-canvas border border-sx-border overflow-hidden">
          <div className="px-5 py-4 border-b border-sx-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-sx-ink font-display flex items-center gap-2">
              <Tag className="w-4 h-4 text-sx-green-text" />
              <span>Submitted Price Offers ({myOffers.length})</span>
            </h2>
          </div>

          <div className="divide-y divide-sx-border">
            {myOffers.map((offer) => (
              <div
                key={offer.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                        offer.status === "accepted"
                          ? "bg-sx-green-tint text-sx-green-text border-sx-green-border"
                          : offer.status === "declined"
                          ? "bg-sx-red-tint text-sx-red-text border-sx-red-border"
                          : "bg-sx-amber-tint text-sx-amber-text border-sx-amber-border"
                      }`}
                    >
                      {offer.status === "accepted"
                        ? "Accepted · Ready for Checkout"
                        : offer.status === "declined"
                        ? "Declined"
                        : "Awaiting Seller Reply"}
                    </span>
                    {offer.listing && (
                      <span className="text-[11px] text-sx-muted font-mono">
                        {getPlatformLabel(offer.listing.platform)} ·{" "}
                        {offer.listing.overall_team_strength} OVR
                      </span>
                    )}
                  </div>

                  <Link
                    href={offer.listing ? `/listings/${offer.listing.id}` : "/marketplace"}
                    className="text-sm font-bold text-sx-ink hover:text-sx-green-text transition-colors block"
                  >
                    {offer.listing?.title || "Squad Listing"}
                  </Link>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-sx-muted block">Your Offer</span>
                    <span className="text-sm font-extrabold font-mono text-sx-green-text">
                      {formatCurrency(offer.offer_amount, offer.currency)}
                    </span>
                  </div>

                  {offer.listing && (
                    <Link
                      href={
                        offer.status === "accepted"
                          ? `/pay/${offer.listing.id}`
                          : `/listings/${offer.listing.id}`
                      }
                    >
                      <Button
                        variant={offer.status === "accepted" ? "primary" : "secondary"}
                        size="sm"
                      >
                        {offer.status === "accepted" ? "Checkout Now" : "View Squad"}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
