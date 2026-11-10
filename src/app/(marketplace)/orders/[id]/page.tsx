import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  MessageCircle,
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
import { OrderChatBox } from "@/components/chat/OrderChatBox";
import { OrderEscrowController } from "@/components/escrow/OrderEscrowController";
import { OrderCopyButton } from "@/components/orders/OrderCopyButton";
import { formatCurrency, formatCompactNumber, getPlatformLabel } from "@/lib/utils";
import { formatWhatsAppPhone } from "@/lib/utils/phone";
import { calculateEscrowCommission } from "@/lib/utils/commission";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MessageService } from "@/services/messageService";
import { OrderService } from "@/services/orderService";
import { isSuperAdminEmail } from "@/lib/security/adminAuth";
import { OrderStatus } from "@/types/database";

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
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/orders/${params.id}`);
  }

  const adminSupabase = createAdminClient();
  const primaryClient = hasServiceRoleKey() ? adminSupabase : supabase;

  const orderService = new OrderService(primaryClient);
  const order = await orderService.getOrderById(params.id);

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

  const counterpartyPhone = isBuyer
    ? order.seller?.phone_number
    : order.buyer?.phone_number;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sx-border">
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border text-sx-ink font-semibold transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-sx-green-text" />
            <span>Share Order Link</span>
          </a>
          <a
            href={`https://wa.me/254794400365?text=${encodeURIComponent(
              `Hello eFootballMarket Escrow Desk, I need help with Order #${order.order_number} (${
                order.listing?.title || "Squad"
              }, KES ${totalAmount.toLocaleString()}).`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sx-green hover:bg-sx-green-hover text-white font-bold transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Escrow Support</span>
          </a>
        </div>
      </div>

      {/* Main 2-Column Layout: Action Controller FIRST on Mobile! */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column (7 cols): Primary Handover Controller + Squad & Fee Summary */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Primary Action Controller (Payment / Credential Vault / 5-Point Inspection) */}
          <OrderEscrowController order={order} currentUserId={user.id} />

          {/* 2. Squad & Escrow Fee Breakdown Card */}
          <div className="rounded-xl bg-sx-canvas border border-sx-border p-5 sm:p-6 space-y-5">
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
                  <span>Listing Page</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            {order.listing && (
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="relative w-full sm:w-36 h-36 sm:h-28 rounded-lg overflow-hidden bg-sx-stone border border-sx-border shrink-0">
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

                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-sx-stone border border-sx-border font-bold uppercase text-sx-ink">
                      {getPlatformLabel(order.listing.platform)}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-sx-green-tint text-sx-green-text font-mono font-bold">
                      {order.listing.overall_team_strength} OVR
                    </span>
                    <span className="px-2 py-0.5 rounded bg-sx-stone border border-sx-border text-sx-muted font-mono">
                      <Coins className="w-3 h-3 inline mr-1 text-sx-amber-text" />
                      {(order.listing.coin_balance || 0).toLocaleString()} Coins
                    </span>
                    {(order.listing.epic_players_count || 0) > 0 && (
                      <span className="px-2 py-0.5 rounded bg-sx-amber-tint text-sx-amber-text font-semibold">
                        <Trophy className="w-3 h-3 inline mr-1" />
                        {order.listing.epic_players_count} Epics
                      </span>
                    )}
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-sx-ink font-display leading-snug">
                    {order.listing.title}
                  </h2>

                  <p className="text-xs text-sx-muted">
                    Clean Konami ID required · {formatCompactNumber(order.listing.gp_balance || 0)} GP
                  </p>
                </div>
              </div>
            )}

            {/* Clear Buyer vs Seller Settlement Math */}
            <div className="rounded-lg bg-sx-stone border border-sx-border p-4 space-y-2 text-xs">
              <div className="flex justify-between text-sx-muted">
                <span>Escrow Custody Amount (Safaricom Till 1572931)</span>
                <span className="font-mono font-semibold text-sx-ink">
                  {formatCurrency(totalAmount, order.currency)}
                </span>
              </div>

              {isBuyer ? (
                <>
                  <div className="flex justify-between text-sx-muted">
                    <span>Buyer Protection &amp; 24h Inspection Fee</span>
                    <span className="font-mono font-bold text-sx-green-text">KES 0 (Included)</span>
                  </div>
                  <div className="pt-2 border-t border-sx-border flex justify-between items-baseline">
                    <span className="font-bold text-sx-ink">Total Buyer Settlement</span>
                    <span className="text-lg font-extrabold font-mono text-sx-green-text">
                      {formatCurrency(totalAmount, order.currency)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sx-muted">
                    <span>Platform Escrow Commission (5%, KES 50–500)</span>
                    <span className="font-mono text-sx-muted">
                      - {formatCurrency(commissionFee, order.currency)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-sx-border flex justify-between items-baseline">
                    <span className="font-bold text-sx-ink">Your Net M-Pesa Payout</span>
                    <span className="text-lg font-extrabold font-mono text-sx-green-text">
                      {formatCurrency(sellerNetAmount, order.currency)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Encrypted Order Chat + Counterparty WhatsApp */}
        <div className="lg:col-span-5 space-y-6">
          <OrderChatBox
            conversationId={conversation.id}
            currentUserId={user.id}
            initialMessages={messages}
            orderId={order.id}
            orderNumber={order.order_number}
            orderStatus={order.status}
            isBuyer={isBuyer}
            totalAmount={order.total_amount}
            currency={order.currency}
          />

          <div className="rounded-xl bg-sx-canvas border border-sx-border p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-sx-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sx-stone border border-sx-border-strong flex items-center justify-center font-bold text-sm text-sx-ink">
                  {isBuyer
                    ? (order.seller?.username?.[0] || "S").toUpperCase()
                    : (order.buyer?.username?.[0] || "B").toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-sx-ink font-display">
                    {isBuyer
                      ? order.seller?.username || "Verified Seller"
                      : order.buyer?.username || "Verified Buyer"}
                  </p>
                  <span className="text-[11px] text-sx-muted">
                    {isBuyer ? "Seller · 12h Handover SLA" : "Buyer · 24h Inspection Window"}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-sx-green-tint text-sx-green-text text-[11px] font-semibold">
                Escrow Protected
              </span>
            </div>

            {counterpartyPhone && (
              <a
                href={`https://wa.me/${formatWhatsAppPhone(counterpartyPhone)}?text=${encodeURIComponent(
                  isBuyer
                    ? `Hello ${order.seller?.username || "Seller"}, I funded Order #${order.order_number} on eFootballMarket (${orderUrl}). Ready for Konami ID handover & OTP.`
                    : `Hello ${order.buyer?.username || "Buyer"}, I am your seller for Order #${order.order_number} on eFootballMarket (${orderUrl}). Ready to share the my.konami.net OTP.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-10 rounded-lg bg-sx-stone hover:bg-sx-elevated border border-sx-border-strong text-sx-ink font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-sx-green-text" />
                <span>
                  Ping {isBuyer ? "Seller" : "Buyer"} on WhatsApp (Keep OTPs in Order Chat)
                </span>
              </a>
            )}

            <ul className="space-y-1.5 text-[11px] text-sx-muted leading-relaxed pt-1">
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-sx-green-text shrink-0 mt-0.5" />
                <span>Keep credential reveals and dispute screenshots inside this Order Room for moderator audit logs.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-sx-green-text shrink-0 mt-0.5" />
                <span>Check <em>Extras &rarr; Support &rarr; Link Data</em> to confirm Google Play &amp; Apple ID say <strong>Not Linked</strong> before releasing payout.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
