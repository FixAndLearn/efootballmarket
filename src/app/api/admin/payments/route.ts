import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminOrSecret } from "@/lib/security/guards";
import { PaymentService } from "@/services/paymentService";

export const dynamic = "force-dynamic";

const adminPaymentActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve_manual_payment"),
    orderId: z.string().uuid(),
    receiptNumber: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{8,12}$/, "Enter a valid 8–12 character Safaricom receipt code"),
  }),
  z.object({
    action: z.literal("reject_manual_payment"),
    orderId: z.string().uuid(),
    reason: z.string().trim().min(3).max(300).optional(),
  }),
  z.object({
    action: z.literal("update_middleman_status"),
    dealId: z.string().min(1).max(80),
    status: z.enum([
      "awaiting_payment",
      "escrow_locked",
      "seller_delivering",
      "buyer_verifying",
      "completed",
      "disputed",
    ]),
    mpesaReceipt: z.string().trim().toUpperCase().max(16).optional(),
  }),
]);

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminOrSecret(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const adminSupabase = createAdminClient();

    const [{ data: pendingOrders }, { data: pendingPayments }, { data: middlemanDeals }] =
      await Promise.all([
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
        adminSupabase
          .from("middleman_deals")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
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
      middlemanDeals: middlemanDeals || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load Till 1572931 & Middleman queue" },
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
    const parsed = adminPaymentActionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const payload = parsed.data;

    // 1. Approve Manual Till 1572931 Receipt & Lock Escrow
    if (payload.action === "approve_manual_payment") {
      const { orderId, receiptNumber } = payload;

      const { data: dupPayment } = await adminSupabase
        .from("payments")
        .select("id, order_id, status")
        .eq("mpesa_receipt_number", receiptNumber)
        .maybeSingle();

      if (dupPayment && dupPayment.order_id !== orderId && dupPayment.status === "completed") {
        return NextResponse.json(
          { error: `Receipt ${receiptNumber} is already used on another completed order.` },
          { status: 400 }
        );
      }

      const { data: order } = await adminSupabase
        .from("orders")
        .select("*, buyer:profiles!buyer_id(phone_number)")
        .eq("id", orderId)
        .maybeSingle();

      if (!order) {
        return NextResponse.json({ error: "Order not found." }, { status: 404 });
      }

      if (order.status !== "payment_pending") {
        return NextResponse.json(
          { error: `Order is already in '${order.status}' state.` },
          { status: 400 }
        );
      }

      const { data: existingPay } = await adminSupabase
        .from("payments")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let paymentId = existingPay?.id;
      const buyerPhone =
        existingPay?.phone_number ||
        (Array.isArray(order.buyer) ? order.buyer[0]?.phone_number : order.buyer?.phone_number) ||
        "254700000000";

      if (!paymentId) {
        const { data: created, error: insErr } = await adminSupabase
          .from("payments")
          .insert({
            order_id: orderId,
            payment_method: "mpesa",
            phone_number: buyerPhone,
            amount: Number(order.total_amount),
            currency: order.currency || "KES",
            merchant_request_id: `TILL-ADMIN-${order.order_number}`,
            checkout_request_id: `TILL-ADMIN-${order.order_number}`,
            status: "pending",
          })
          .select("id")
          .single();

        if (insErr || !created) {
          return NextResponse.json(
            { error: insErr?.message || "Could not create payment ledger row" },
            { status: 500 }
          );
        }
        paymentId = created.id;
      }

      const paymentService = new PaymentService(adminSupabase);
      await paymentService.markPaymentSuccessful(
        paymentId,
        receiptNumber,
        Number(order.total_amount),
        {
          verified_by_admin: auth.email || auth.userId,
          verified_at: new Date().toISOString(),
          till_number: "1572931",
          receipt_number: receiptNumber,
        }
      );

      // Write audit log
      try {
        await adminSupabase.from("audit_logs").insert({
          actor_id: auth.userId || order.buyer_id,
          action: "ADMIN_APPROVED_TILL_RECEIPT",
          resource_type: "orders",
          resource_id: orderId,
          changes: {
            receipt_number: receiptNumber,
            amount: order.total_amount,
            approved_by: auth.email,
          },
        });
      } catch {
        // non-blocking
      }

      return NextResponse.json({
        success: true,
        message: `Receipt ${receiptNumber} approved! Order #${order.order_number} is now Escrow Locked and seller has been alerted.`,
      });
    }

    // 2. Reject unverified receipt claim
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

    // 3. Advance Middleman Deal Status
    if (payload.action === "update_middleman_status") {
      const { dealId, status, mpesaReceipt } = payload;

      const updateFields: Record<string, any> = { status };
      if (mpesaReceipt) {
        updateFields.mpesa_receipt = mpesaReceipt;
      }

      const { data: updated, error: updErr } = await adminSupabase
        .from("middleman_deals")
        .update(updateFields)
        .eq("id", dealId)
        .select("*")
        .maybeSingle();

      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        deal: updated,
        message: `Middleman deal updated to '${status.replace(/_/g, " ")}'.`,
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
