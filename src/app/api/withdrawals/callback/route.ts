import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { timingSafeCompare } from "@/lib/security/guards";
import { checkRateLimit } from "@/lib/security/rateLimiter";

/**
 * Safaricom Daraja B2C result callback for seller payouts.
 *
 * Why this file exists: `mpesaClient.initiateB2CPayout()` has always pointed
 * Daraja at `/api/withdrawals/callback`, but no such route was ever implemented.
 * Every payout result therefore 404'd, so a completed or failed B2C transfer
 * could never be recorded — a seller's money could be debited and left in limbo.
 *
 * Security model (mirrors /api/payments/mpesa/callback):
 *  - Daraja does not sign B2C callbacks, so the URL carries a shared secret that
 *    must match MPESA_WEBHOOK_SECRET (constant-time compared).
 *  - Server-only service role key required; degrades to 503 (Daraja retries).
 *  - Replay-safe: settlement happens inside finalize_b2c_payout(), which is a
 *    no-op for an already-terminal withdrawal.
 *  - Never trusts the payload's amount; it is only recorded, never credited.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function reject(message: string, status: number) {
  console.warn(`[b2c-callback] rejected (${status}): ${message}`);
  return NextResponse.json({ ResultCode: 1, ResultDesc: message }, { status });
}

export async function POST(req: NextRequest) {
  // ---- 1. Rate limit by source IP -------------------------------------
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  try {
    const rate = await checkRateLimit(`b2c_callback:${ip}`, 120, 60_000);
    if (!rate.success) {
      return reject("Too many callbacks", 429);
    }
  } catch {
    // Rate limiter unavailable must not drop a payout result.
  }

  // ---- 2. Authenticate the callback URL ------------------------------
  const configuredSecret = process.env.MPESA_WEBHOOK_SECRET?.trim();
  if (!configuredSecret) {
    console.error(
      "[b2c-callback] MPESA_WEBHOOK_SECRET is not configured; refusing to settle payouts."
    );
    return reject("Callback authentication is not configured", 503);
  }

  const providedSecret =
    req.nextUrl.searchParams.get("secret") ||
    req.nextUrl.searchParams.get("token") ||
    req.headers.get("x-webhook-secret");

  if (!timingSafeCompare(providedSecret, configuredSecret)) {
    return reject("Unauthorized webhook secret", 401);
  }

  // ---- 3. Service role is mandatory for ledger writes ----------------
  if (!hasServiceRoleKey()) {
    console.error(
      "[b2c-callback] SUPABASE_SERVICE_ROLE_KEY missing; cannot settle payout safely."
    );
    return reject("Server is not configured to settle payouts", 503);
  }

  // ---- 4. Parse the Daraja envelope ----------------------------------
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return reject("Malformed callback body", 400);
  }

  const payload = body as Record<string, any>;
  const result = payload?.Result ?? payload;
  const resultCode = Number(result?.ResultCode);
  const resultDesc = String(result?.ResultDesc ?? "");

  const conversationId: string | null =
    result?.ConversationID ?? null;
  const originatorConversationId: string | null =
    result?.OriginatorConversationID ?? null;

  // Transaction id lives in ResultParameters for successful payments.
  const resultParams: Array<{ Key?: string; Value?: unknown }> =
    result?.ResultParameters?.ResultParameter ?? [];
  const transactionIdRaw = resultParams.find(
    (p) => p?.Key === "TransactionReceipt" || p?.Key === "TransactionID"
  )?.Value;
  const b2cTransactionId =
    typeof transactionIdRaw === "string" && transactionIdRaw.trim()
      ? transactionIdRaw.trim()
      : null;

  // ---- 5. Correlate the callback to a withdrawal ----------------------
  const admin = createAdminClient();

  // Preferred: the admin UI attaches the conversation id at initiation.
  let withdrawalId: string | null = null;
  let currentStatus: string | null = null;

  const explicitId =
    req.nextUrl.searchParams.get("withdrawalId") ||
    req.nextUrl.searchParams.get("withdrawal_id");

  if (explicitId) {
    const { data } = await admin
      .from("seller_withdrawals")
      .select("id, status")
      .eq("id", explicitId)
      .maybeSingle();
    if (data) {
      withdrawalId = data.id;
      currentStatus = data.status;
    }
  }

  if (!withdrawalId) {
    const { data, error } = await admin.rpc("find_withdrawal_by_b2c_ids", {
      p_b2c_conversation_id: conversationId,
      p_b2c_originator_conversation_id: originatorConversationId,
    });
    if (error) {
      console.error("[b2c-callback] withdrawal lookup failed:", error.message);
      return reject("Lookup failed", 503);
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.id) {
      withdrawalId = row.id;
      currentStatus = row.status;
    }
  }

  if (!withdrawalId) {
    // Acknowledge so Daraja stops retrying, but investigate: this means a real
    // payout happened that we cannot tie to a withdrawal record.
    console.error(
      "[b2c-callback] ORPHAN PAYOUT RESULT — no withdrawal matched",
      JSON.stringify({ conversationId, originatorConversationId, resultCode, resultDesc })
    );
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  // ---- 6. Settle (idempotent) ----------------------------------------
  const succeeded = resultCode === 0 && Boolean(b2cTransactionId);

  const { data: settled, error: settleError } = await admin.rpc("finalize_b2c_payout", {
    p_withdrawal_id: withdrawalId,
    p_outcome: succeeded ? "success" : "failed",
    p_b2c_conversation_id: conversationId,
    p_b2c_originator_conversation_id: originatorConversationId,
    p_b2c_transaction_id: b2cTransactionId,
    p_failure_reason: succeeded
      ? null
      : `M-Pesa payout failed (code ${Number.isFinite(resultCode) ? resultCode : "unknown"}): ${resultDesc}`,
  });

  if (settleError) {
    console.error("[b2c-callback] settlement failed:", settleError.message);
    // 503 so Daraja retries rather than losing the outcome.
    return reject("Settlement failed", 503);
  }

  const record = settled as {
    id?: string;
    seller_id?: string;
    amount?: number | string;
    status?: string;
    changed?: boolean;
    balance_restored?: boolean;
  } | null;

  // ---- 7. Notify the seller only when something actually changed -----
  if (record?.changed && record.seller_id) {
    const amount = Number(record.amount || 0);
    const paid = record.status === "completed";

    const { error: notifyError } = await admin.from("notifications").insert({
      recipient_id: record.seller_id,
      type: "order_update",
      title: paid ? "M-Pesa Payout Sent" : "Payout Failed — Balance Restored",
      message: paid
        ? `KES ${amount.toLocaleString()} was sent to M-Pesa and confirmed by Safaricom${
            b2cTransactionId ? ` (receipt ${b2cTransactionId})` : ""
          }.`
        : `Your payout of KES ${amount.toLocaleString()} could not be completed${
            resultDesc ? ` (${resultDesc})` : ""
          }. ${
            record.balance_restored
              ? "The full amount has been returned to your available balance."
              : "Contact support."
          }`,
      action_url: "/seller/earnings",
      is_read: false,
    });
    if (notifyError) {
      console.warn("[b2c-callback] seller notification not recorded:", notifyError.message);
    }
  }

  console.log(
    `[b2c-callback] settled withdrawal=${withdrawalId} outcome=${
      succeeded ? "success" : "failed"
    } status=${record?.status ?? currentStatus} changed=${record?.changed ?? false}`
  );

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
