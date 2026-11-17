import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { timingSafeCompare } from "@/lib/security/guards";

/**
 * Safaricom Daraja B2C queue-timeout callback.
 *
 * Daraja calls this when the payout request expires in the queue. The money was
 * never sent, so the seller's reserved balance must be restored — the same
 * failure path as a rejected payout, hence it reuses finalize_b2c_payout().
 *
 * Same authentication model as /api/withdrawals/callback.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const configuredSecret = process.env.MPESA_WEBHOOK_SECRET?.trim();
  if (!configuredSecret) {
    console.error("[b2c-timeout] MPESA_WEBHOOK_SECRET not configured.");
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Not configured" }, { status: 503 });
  }

  const providedSecret =
    req.nextUrl.searchParams.get("secret") ||
    req.nextUrl.searchParams.get("token") ||
    req.headers.get("x-webhook-secret");

  if (!timingSafeCompare(providedSecret, configuredSecret)) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Unauthorized" }, { status: 401 });
  }

  if (!hasServiceRoleKey()) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Malformed" }, { status: 400 });
  }

  const result = (body as Record<string, any>)?.Result ?? {};
  const conversationId: string | null = result?.ConversationID ?? null;
  const originatorConversationId: string | null =
    result?.OriginatorConversationID ?? null;
  const resultDesc = String(result?.ResultDesc ?? "Request timed out in queue");

  const admin = createAdminClient();

  let withdrawalId: string | null =
    req.nextUrl.searchParams.get("withdrawalId") ||
    req.nextUrl.searchParams.get("withdrawal_id");

  if (!withdrawalId) {
    const { data } = await admin.rpc("find_withdrawal_by_b2c_ids", {
      p_b2c_conversation_id: conversationId,
      p_b2c_originator_conversation_id: originatorConversationId,
    });
    const row = Array.isArray(data) ? data[0] : data;
    withdrawalId = row?.id ?? null;
  }

  if (!withdrawalId) {
    console.error(
      "[b2c-timeout] no withdrawal matched",
      JSON.stringify({ conversationId, originatorConversationId })
    );
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const { data: settled, error } = await admin.rpc("finalize_b2c_payout", {
    p_withdrawal_id: withdrawalId,
    p_outcome: "failed",
    p_b2c_conversation_id: conversationId,
    p_b2c_originator_conversation_id: originatorConversationId,
    p_b2c_transaction_id: null,
    p_failure_reason: `M-Pesa payout timed out in queue: ${resultDesc}`,
  });

  if (error) {
    console.error("[b2c-timeout] settlement failed:", error.message);
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Settlement failed" }, { status: 503 });
  }

  const record = settled as { seller_id?: string; amount?: number | string; changed?: boolean } | null;
  if (record?.changed && record.seller_id) {
    await admin
      .from("notifications")
      .insert({
        recipient_id: record.seller_id,
        type: "order_update",
        title: "Payout Timed Out — Balance Restored",
        message: `Your payout of KES ${Number(record.amount || 0).toLocaleString()} timed out before M-Pesa could send it. The full amount has been returned to your available balance, and no money was sent.`,
        action_url: "/seller/earnings",
        is_read: false,
      })
      .then(({ error: e }) => {
        if (e) console.warn("[b2c-timeout] notification not recorded:", e.message);
      });
  }

  console.log(`[b2c-timeout] withdrawal=${withdrawalId} restored=${record?.changed ?? false}`);
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
