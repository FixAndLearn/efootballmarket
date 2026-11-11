import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  MessageCircle,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { OrderChatBox } from "@/components/chat/OrderChatBox";
import { OrderCopyButton } from "@/components/orders/OrderCopyButton";
import { formatCurrency } from "@/lib/utils";
import { formatWhatsAppPhone } from "@/lib/utils/phone";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MessageService } from "@/services/messageService";
import { OrderService } from "@/services/orderService";
import { isSuperAdminEmail } from "@/lib/security/adminAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface OrderChatPageProps {
  params: {
    id: string;
  };
}

export default async function OrderDedicatedChatPage({
  params,
}: OrderChatPageProps) {
  const resolved = await Promise.resolve(params);
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/orders/${resolved.id}/chat`);
  }

  const primaryClient = hasServiceRoleKey() ? createAdminClient() : supabase;

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
  const counterpartyName = isBuyer
    ? order.seller?.username || "Seller"
    : order.buyer?.username || "Buyer";

  const messageService = new MessageService(primaryClient);
  const conversation = await messageService.getOrCreateOrderConversation(
    order.id,
    order.buyer_id,
    order.seller_id
  );
  const messages = await messageService.getMessages(conversation.id);

  const orderUrl = `https://www.efootballmarket.co.ke/orders/${order.id}/chat`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 w-full space-y-4">
      {/* Compact Navigation & Mode Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sx-border">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sx-subtle hover:bg-sx-stone border border-sx-border text-xs font-bold text-sx-ink transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Escrow Room</span>
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-extrabold text-sx-ink font-display truncate">
                Chat with @{counterpartyName}
              </span>
              <OrderCopyButton orderNumber={order.order_number} />
            </div>
            <p className="text-xs text-sx-muted truncate">
              {order.listing?.title || "eFootball Squad Handover"} ·{" "}
              <strong className="text-sx-ink font-mono">
                {formatCurrency(Number(order.total_amount || 0), order.currency)}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Mode Tabs */}
          <div className="inline-flex rounded-xl bg-sx-subtle border border-sx-border p-1 text-xs font-bold">
            <Link
              href={`/orders/${order.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sx-muted hover:text-sx-ink transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Escrow &amp; Credentials</span>
            </Link>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sx-green text-white shadow-sm">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Full-Page Chat</span>
            </span>
          </div>

          <a
            href={`https://wa.me/254794400365?text=${encodeURIComponent(
              `Hello eFootballMarket Escrow Desk, I need assistance in Order Chat (#${order.order_number}) with @${counterpartyName}: ${orderUrl}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sx-subtle hover:bg-sx-stone border border-sx-border text-xs font-semibold text-sx-ink transition-colors"
            title="Contact Escrow Desk on WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 text-sx-green-text" />
            <span className="hidden md:inline">Escrow Desk</span>
          </a>
        </div>
      </div>

      {/* Dedicated Full-Screen Chat Room */}
      <OrderChatBox
        conversationId={conversation.id}
        currentUserId={user.id}
        initialMessages={messages}
        orderId={order.id}
        orderNumber={order.order_number}
        orderStatus={order.status}
        isBuyer={isBuyer}
        counterpartyName={counterpartyName}
        totalAmount={order.total_amount}
        currency={order.currency}
        fullPage={true}
      />
    </div>
  );
}
