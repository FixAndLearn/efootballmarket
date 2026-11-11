import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  ShieldCheck,
  MessageCircle,
  MessageSquare,
  ExternalLink,
  Trophy,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  Coins,
  Shield,
  Check,
  Share2,
} from "lucide-react";
import { OrderEscrowController } from "@/components/escrow/OrderEscrowController";
import { OrderCopyButton } from "@/components/orders/OrderCopyButton";
import {
  formatCurrency,
  formatCompactNumber,
  getPlatformLabel,
} from "@/lib/utils";
import { formatWhatsAppPhone } from "@/lib/utils/phone";
import { calculateEscrowCommission } from "@/lib/utils/commission";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MessageService } from "@/services/messageService";
import { OrderService } from "@/services/orderService";
import { isSuperAdminEmail } from "@/lib/security/adminAuth";
import { OrderStatus } from "@/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface OrderPageProps {
  params: {
    id: string;
  };
}

const getStatusConfig = (status: OrderStatus | string) => {
  switch (status) {
    case "payment_pending":
      return {
        label: "Awaiting M-Pesa Deposit",
        colorClass: "bg-sx-amber-tint text-sx-amber-text border-sx-amber-border",
        icon: Clock,
      };
    case "escrow_locked":
      return {
        label: "Escrow Funded (12h Seller SLA)",
        colorClass: "bg-sx-green-tint text-sx-green-text border-sx-green-border",
        icon: ShieldCheck,
      };
    case "seller_delivered":
    case "buyer_reviewing":
      return {
        label: "24h Buyer Inspection Active",
        colorClass: "bg-sx-info-tint text-sx-info-text border-sx-info-border",
        icon: KeyRound,
      };
    case "completed":
      return {
        label: "Completed & Settled",
        colorClass: "bg-sx-green-tint text-sx-green-text border-sx-green-border",
        icon: CheckCircle2,
      };
    case "disputed":
      return {
        label: "Dispute Under Review",
        colorClass: "bg-sx-red-tint text-sx-red-text border-sx-red-border",
        icon: ShieldAlert,
      };
    case "cancelled":
    case "refunded":
      return {
        label: status === "refunded" ? "Escrow Refunded" : "Order Cancelled",
        colorClass: "bg-sx-stone text-sx-muted border-sx-border-strong",
        icon: Shield,
      };
    default:
      return {
        label: status.replace(/_/g, " ").toUpperCase(),
        colorClass: "bg-sx-stone text-sx-muted border-sx-border-strong",
        icon: Clock,
      };
  }
};

export default async function OrderDetailPage({ params }: OrderPageProps) {
  const resolved = await Promise.resolve(params);
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/orders/${resolved.id}`);
  }

  const adminSupabase = createAdminClient();
  const primaryClient = hasServiceRoleKey() ? adminSupabase : supabase;

  const orderService = new OrderService(primaryClient);
  const order = await orderService.getOrderById(resolved.id);

  if (!order) {
    notFound();
  }

  const isAdmin = isSuperAdminEmail(user.email);
  if (order.buyer_id !== user.id && order.seller_id !== user.id && !isAdmin) {
    redirect("/dashboard/buyer");
  }

  const isBuyer = order.buyer_id === user.id;

  const messageService = new MessageService(primaryClient);
  const conversation = await messageService.getOrCreateOrderConversation(
    order.id,
    order.buyer_id,
    order.seller_id
  );
  const messages = await messageService.getMessages(conversation.id);
  const userMessages = messages.filter((m) => m.message_type !== "system");
  const lastMessage =
    userMessages[userMessages.length - 1] || messages[messages.length - 1] || null;

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  const primaryImage =
    order.listing?.images?.find((img) => img.is_primary)?.image_url ||
    order.listing?.images?.[0]?.image_url ||
    null;

  const totalAmount = Number(order.total_amount || 0);
  const commissionFee =
    Number(order.platform_fee) > 0
      ? Number(order.platform_fee)
      : calculateEscrowCommission(totalAmount);
  const sellerNetAmount =
    Number(order.seller_net_amount) > 0
      ? Number(order.seller_net_amount)
      : Math.max(0, totalAmount - commissionFee);

  const orderUrl = `https://www.efootballmarket.co.ke/orders/${order.id}`;
  const shareOrderWhatsApp = `https://wa.me/?text=${encodeURIComponent(
    `eFootballMarket Escrow Order #${order.order_number} (${
      order.listing?.title || "Squad Transfer"
    }) — Open Order Room: ${orderUrl}`
  )}`;

  const counterpartyName = isBuyer
    ? order.seller?.username || "Verified Seller"
    : order.buyer?.username || "Verified Buyer";
  const counterpartyPhone = isBuyer
    ? order.seller?.phone_number
    : order.buyer?.phone_number;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full space-y-6">
      {/* Top Header + Clean Page Switcher */}
      <div className="space-y-4 pb-4 border-b border-sx-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Link
              href={isBuyer ? "/dashboard/buyer" : "/dashboard/seller"}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sx-muted hover:text-sx-ink transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {isBuyer ? "Buyer" : "Seller"} Dashboard</span>
            </Link>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-sx-ink font-display tracking-tight">
                Order Escrow Room
              </h1>
              <OrderCopyButton orderNumber={order.order_number} />
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusConfig.colorClass}`}
              >
                <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{statusConfig.label}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <a
              href={shareOrderWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sx-subtle hover:bg-sx-stone border border-sx-border text-sx-ink font-semibold transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-sx-green-text" />
              <span>Share Order</span>
            </a>
            <a
              href={`https://wa.me/254794400365?text=${encodeURIComponent(
                `Hello eFootballMarket Escrow Desk, I need help with Order #${order.order_number} (${
                  order.listing?.title || "Squad"
                }, KES ${totalAmount.toLocaleString()}).`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sx-subtle hover:bg-sx-stone border border-sx-border text-sx-ink font-semibold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-sx-green-text" />
              <span>Escrow Desk</span>
            </a>
          </div>
        </div>

        {/* Dedicated Mode Switcher: Escrow Room vs Full-Page Chat */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="inline-flex rounded-xl bg-sx-subtle border border-sx-border p-1 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sx-stone text-sx-ink shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-sx-green-text" />
              <span>Escrow &amp; Credentials</span>
            </span>
            <Link
              href={`/orders/${order.id}/chat`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sx-ink hover:text-sx-green-text transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Open Dedicated Chat Page</span>
              {userMessages.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-sx-green text-white text-[10px] font-mono">
                  {userMessages.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Spacious Layout: Main Escrow Controller (8 cols) + Clean Summary & Chat Launcher (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Uncluttered Escrow & Handover Controller */}
        <div className="lg:col-span-8 space-y-6">
          <OrderEscrowController order={order} currentUserId={user.id} />
        </div>

        {/* Right Column (4 cols): Dedicated Chat Launch Card + Squad Ledger */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Dedicated Full-Page Chat Launcher Card */}
          <div className="rounded-2xl bg-sx-subtle border border-sx-border p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-sx-stone border border-sx-border-strong flex items-center justify-center font-bold text-sm text-sx-green-text shrink-0">
                  {counterpartyName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-sx-ink font-display truncate">
                    @{counterpartyName}
                  </p>
                  <span className="text-[11px] text-sx-muted block">
                    {isBuyer
                      ? "Seller · OTP & Handover Partner"
                      : "Buyer · 24h Inspection"}
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sx-green-tint border border-sx-green-border text-sx-green-text text-[10.5px] font-bold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Chat</span>
              </span>
            </div>

            {lastMessage && (
              <div className="p-3 rounded-xl bg-sx-canvas border border-sx-border space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-sx-muted block">
                  Latest Message ({userMessages.length} total)
                </span>
                <p className="text-xs text-sx-ink-soft line-clamp-2 leading-relaxed">
                  {lastMessage.content}
                </p>
              </div>
            )}

            <Link
              href={`/orders/${order.id}/chat`}
              className="w-full h-11 rounded-xl bg-sx-green hover:bg-sx-green-hover text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Open Full-Page Order Chat</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {counterpartyPhone && (
              <a
                href={`https://wa.me/${formatWhatsAppPhone(counterpartyPhone)}?text=${encodeURIComponent(
                  isBuyer
                    ? `Hello ${order.seller?.username || "Seller"}, I am ready inside our eFootballMarket Order Chat (#${order.order_number}): ${orderUrl}/chat`
                    : `Hello ${order.buyer?.username || "Buyer"}, I am inside our eFootballMarket Order Chat (#${order.order_number}) ready to share the Konami OTP: ${orderUrl}/chat`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-9 rounded-xl bg-sx-canvas hover:bg-sx-stone border border-sx-border text-sx-ink font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-sx-green-text" />
                <span>Nudge {isBuyer ? "Seller" : "Buyer"} on WhatsApp</span>
              </a>
            )}

            <p className="text-[11px] text-sx-muted flex items-start gap-1.5 leading-relaxed">
              <Check className="w-3.5 h-3.5 text-sx-green-text shrink-0 mt-0.5" />
              <span>
                Chat opens on its own distraction-free page for easy Konami 2FA code copying.
              </span>
            </p>
          </div>

          {/* 2. Squad & Escrow Settlement Ledger */}
          <div className="rounded-2xl bg-sx-subtle border border-sx-border p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-sx-border pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sx-muted">
                Squad &amp; Escrow Ledger
              </span>
              {order.listing && (
                <Link
                  href={`/listings/${order.listing.id}`}
                  target="_blank"
                  className="text-xs font-semibold text-sx-green-text hover:underline inline-flex items-center gap-1"
                >
                  <span>Listing</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            {order.listing && (
              <div className="space-y-3">
                <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-sx-stone border border-sx-border">
                  {primaryImage ? (
                    <Image
                      src={primaryImage}
                      alt={order.listing.title}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sx-green-text">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-sx-canvas border border-sx-border font-bold uppercase text-sx-ink">
                      {getPlatformLabel(order.listing.platform)}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-sx-green-tint border border-sx-green-border text-sx-green-text font-mono font-bold">
                      {order.listing.overall_team_strength} OVR
                    </span>
                    {(order.listing.coin_balance || 0) > 0 && (
                      <span className="px-2 py-0.5 rounded bg-sx-amber-tint border border-sx-amber-border text-sx-amber-text font-mono font-semibold">
                        <Coins className="w-3 h-3 inline mr-1" />
                        {(order.listing.coin_balance || 0).toLocaleString()} Coins
                      </span>
                    )}
                    {(order.listing.epic_players_count || 0) > 0 && (
                      <span className="px-2 py-0.5 rounded bg-sx-canvas border border-sx-border text-sx-ink-soft font-semibold">
                        <Trophy className="w-3 h-3 inline mr-1 text-sx-green-text" />
                        {order.listing.epic_players_count} Epics
                      </span>
                    )}
                  </div>

                  <h2 className="text-sm sm:text-base font-bold text-sx-ink font-display leading-snug">
                    {order.listing.title}
                  </h2>

                  <p className="text-xs text-sx-muted">
                    Clean Konami ID · {formatCompactNumber(order.listing.gp_balance || 0)} GP
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-sx-canvas border border-sx-border p-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-sx-muted">
                <span>Till 1572931 Custody</span>
                <span className="font-mono font-semibold text-sx-ink">
                  {formatCurrency(totalAmount, order.currency)}
                </span>
              </div>

              {isBuyer ? (
                <>
                  <div className="flex justify-between text-sx-muted">
                    <span>Buyer Escrow Fee</span>
                    <span className="font-mono font-bold text-sx-green-text">
                      KES 0
                    </span>
                  </div>
                  <div className="pt-2 border-t border-sx-border flex justify-between items-baseline">
                    <span className="font-bold text-sx-ink">Total Paid</span>
                    <span className="text-base font-extrabold font-mono text-sx-green-text">
                      {formatCurrency(totalAmount, order.currency)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sx-muted">
                    <span>Escrow Fee (5%)</span>
                    <span className="font-mono text-sx-muted">
                      - {formatCurrency(commissionFee, order.currency)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-sx-border flex justify-between items-baseline">
                    <span className="font-bold text-sx-ink">Net Payout</span>
                    <span className="text-base font-extrabold font-mono text-sx-green-text">
                      {formatCurrency(sellerNetAmount, order.currency)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
