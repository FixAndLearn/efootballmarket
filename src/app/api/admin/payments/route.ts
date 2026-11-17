import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminOrSecret } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

const adminPaymentActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("reject_manual_payment"),
    orderId: z.string().uuid(),
    reason: z.string().trim().min(3).max(300).optional(),
  }),
]);

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminOrSecret(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const adminSupabase = createAdminClient();

    const [{ data: pendingOrders }, { data: pendingPayments }] = await Promise.all([
        adminSupabase
          .from("orders")
          .select(
            "id, order_number, status, total_amount, currency, created_at, buyer_id, seller_id, listing:listings(id, title), buyer:profiles!buyer_id(username, phone_number), seller:profiles!seller_id(username, phone_number)"
          )
          .eq("status", "payment_pending")
          .order("created_at", { ascending: false })
          .limit(40),
        adminSupabase
          .from("payments")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(60),
      ]);

    const paymentByOrder = new Map<string, any>();
    for (const p of pendingPayments || []) {
      if (p.order_id && !paymentByOrder.has(p.order_id)) {
        paymentByOrder.set(p.order_id, p);
      }
    }

    const enrichedPendingOrders = (pendingOrders || [])
      .map((o: any) => {
        const pay = paymentByOrder.get(o.id) || null;
        const submittedReceipt =
          pay?.raw_callback?.buyer_submitted_receipt ||
          pay?.raw_callback?.receipt_code ||
          null;
        return {
          ...o,
          listing: Array.isArray(o.listing) ? o.listing[0] : o.listing,
          buyer: Array.isArray(o.buyer) ? o.buyer[0] : o.buyer,
          seller: Array.isArray(o.seller) ? o.seller[0] : o.seller,
          pendingPayment: pay,
          submittedReceipt,
        };
      })
      .sort((a: any, b: any) => {
        // Prioritize orders where buyer explicitly submitted an SMS receipt claim
        if (a.submittedReceipt && !b.submittedReceipt) return -1;
        if (!a.submittedReceipt && b.submittedReceipt) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

    return NextResponse.json({
      pendingOrders: enrichedPendingOrders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load pending marketplace payment queue" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminOrSecret(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const json = await req.json();
    if ((json as any)?.action === "approve_manual_payment") {
      return NextResponse.json(
        {
          error:
            "Manual receipt claims cannot unlock escrow. Only a provider-confirmed settlement with a matching receipt and amount can mark payment successful.",
        },
        { status: 409 }
      );
    }

    const parsed = adminPaymentActionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const payload = parsed.data;

    // Reject unverified receipt claims. Admins cannot settle an M-Pesa receipt
    // by typing a code or bypass provider confirmation.

    if (payload.action === "reject_manual_payment") {
      const { orderId, reason } = payload;
      const { data: order } = await adminSupabase
        .from("orders")
        .select("id, order_number, buyer_id")
        .eq("id", orderId)
        .maybeSingle();

      if (!order) {
        return NextResponse.json({ error: "Order not found." }, { status: 404 });
      }

      await adminSupabase
        .from("payments")
        .update({
          status: "failed",
          result_desc: reason || "Receipt did not match Till 1572931 statement",
        })
        .eq("order_id", orderId)
        .eq("status", "pending");

      await adminSupabase.from("notifications").insert({
        recipient_id: order.buyer_id,
        type: "order_update",
        title: `Receipt Verification Update (#${order.order_number})`,
        message:
          reason ||
          "We could not match the submitted M-Pesa receipt code on Safaricom Till 1572931. Please double-check your SMS code or pay via STK Push.",
        action_url: `/orders/${order.id}`,
        is_read: false,
      });

      return NextResponse.json({
        success: true,
        message: `Rejected unverified receipt on Order #${order.order_number} and notified buyer.`,
      });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Admin payment operation failed" },
      { status: 500 }
    );
  }
}
