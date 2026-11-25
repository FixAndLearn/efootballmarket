import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { EscrowService } from "@/services/escrowService";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/guards";
import { sendAdminAlertEmail } from "@/lib/notifications/emailAlert";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/orders/[id]/recall-claim
 *
 * The buyer reports that the seller recovered the account after handover.
 *
 * This is the counterpart to the recall window: the window only helps if the
 * buyer can actually raise the claim while funds are still held. Filing a claim
 * freezes the held portion and escalates to an admin -- it never moves money by
 * itself, so a false report costs the seller nothing but time.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    if (!UUID_RE.test(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }

    const rate = await checkRateLimit(
      `recall-claim:${user.id}:${getClientIp(req)}`,
      5,
      60 * 60 * 1000
    );
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many reports. Contact support if this is urgent." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const evidenceUrls = Array.isArray(body?.evidenceUrls)
      ? body.evidenceUrls.filter((u: unknown) => typeof u === "string").slice(0, 10)
      : [];
    const konamiNoticeReference =
      typeof body?.konamiNoticeReference === "string"
        ? body.konamiNoticeReference.trim().slice(0, 200)
        : null;

    if (description.length < 20) {
      return NextResponse.json(
        {
          error:
            "Describe what happened in at least 20 characters — when you lost access, and what Konami support told you.",
        },
        { status: 400 }
      );
    }
    if (description.length > 4000) {
      return NextResponse.json({ error: "Keep the description under 4,000 characters." }, { status: 400 });
    }

    if (!hasServiceRoleKey()) {
      return NextResponse.json(
        { error: "Secure claim filing is temporarily unavailable. No money was moved; contact support." },
        { status: 503 }
      );
    }
    const client = createAdminClient();

    // Confirm the caller is the buyer before touching anything.
    const { data: order } = await client
      .from("orders")
      .select("id, order_number, buyer_id, seller_id, status, total_amount")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.buyer_id !== user.id) {
      return NextResponse.json(
        { error: "Only the buyer on this order can report an account recovery." },
        { status: 403 }
      );
    }

    const escrowService = new EscrowService(client as any);
    const claimId = await escrowService.openRecallClaim({
      orderId,
      claimantId: user.id,
      description,
      evidenceUrls,
      konamiNoticeReference: konamiNoticeReference ?? undefined,
    });

    // A frozen payout is the most time-sensitive event on the platform: the
    // seller's money is stuck until a human looks at it.
    const adminEmail = process.env.ADMIN_EMAIL || "brianokibo@gmail.com";
    sendAdminAlertEmail({
      toEmail: adminEmail,
      subject: `[ACTION] Account-recovery claim on ${order.order_number}`,
      severity: "action",
      body: [
        "An account-recovery claim was filed. The held portion of this payment is frozen until you resolve it.",
        "",
        `Order: ${order.order_number}`,
        `Order URL: https://www.efootballmarket.co.ke/orders/${orderId}`,
        `Claim ID: ${claimId}`,
        `Order total: KES ${Number(order.total_amount || 0).toLocaleString()}`,
        konamiNoticeReference ? `Konami reference: ${konamiNoticeReference}` : "",
        evidenceUrls.length ? `Evidence files: ${evidenceUrls.length}` : "",
        "",
        "Buyer's description:",
        description,
      ]
        .filter(Boolean)
        .join("\n"),
    }).catch((err) => console.error("Recall claim admin alert failed:", err));

    return NextResponse.json({
      success: true,
      claimId,
      message:
        "Report received. The held portion of this payment is frozen while an admin reviews it. Keep every email from Konami support — that is the evidence that decides the outcome.",
    });
  } catch (err: any) {
    console.error("Recall claim error:", err);
    return NextResponse.json(
      { error: err?.message || "Could not file the report." },
      { status: 400 }
    );
  }
}
