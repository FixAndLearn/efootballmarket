import { createAdminClient } from "@/lib/supabase/admin";
import { mpesaClient } from "@/lib/mpesa/client";
import {
  amountsMatch,
  normalizeMpesaReceiptNumber,
  normalizePositiveAmount,
} from "@/lib/mpesa/settlement";
import { VerifiedMpesaSettlement } from "@/lib/mpesa/types";
import { PaymentService } from "@/services/paymentService";
import { TournamentService } from "@/services/tournamentService";
import { dispatchAdminWhatsAppAlert } from "@/lib/notifications/adminAlert";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import {
  getClientIp,
  sanitizeTransactionId,
  timingSafeCompare,
} from "@/lib/security/guards";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_CALLBACK_BODY_BYTES = 64 * 1024;
const PAYMENT_SELECT =
  "id, order_id, amount, checkout_request_id, merchant_request_id, status, order:orders(total_amount, status)";

function strictTransactionId(value?: string | null): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const sanitized = sanitizeTransactionId(raw);
  return sanitized === raw ? sanitized : "";
}

function extractProvidedSecret(req: NextRequest): string | null {
  const url = new URL(req.url);
  return (
    req.headers.get("x-webhook-secret") ||
    req.headers.get("x-mpesa-secret") ||
    url.searchParams.get("secret") ||
    url.searchParams.get("token")
  );
}

async function findMarketplacePayment(
  supabase: ReturnType<typeof createAdminClient>,
  checkoutRequestId: string,
  merchantRequestId: string
): Promise<any | null> {
  let byCheckout: any = null;
  let byMerchant: any = null;

  if (checkoutRequestId) {
    const { data, error } = await supabase
      .from("payments")
      .select(PAYMENT_SELECT)
      .eq("checkout_request_id", checkoutRequestId)
      .maybeSingle();
    if (error) throw new Error("Could not resolve callback checkout ID.");
    byCheckout = data;
  }

  if (merchantRequestId) {
    const { data, error } = await supabase
      .from("payments")
      .select(PAYMENT_SELECT)
      .eq("merchant_request_id", merchantRequestId)
      .maybeSingle();
    if (error) throw new Error("Could not resolve callback merchant ID.");
    byMerchant = data;
  }

  if (byCheckout && byMerchant && byCheckout.id !== byMerchant.id) {
    throw new Error("Callback IDs resolve to different payment records.");
  }

  const payment = byCheckout || byMerchant;
  if (!payment) return null;

  const storedCheckout = String(payment.checkout_request_id || "");
  const storedMerchant = String(payment.merchant_request_id || "");
  if (
    (checkoutRequestId && checkoutRequestId !== storedCheckout) ||
    (merchantRequestId && merchantRequestId !== storedMerchant)
  ) {
    throw new Error("Callback IDs do not match the payment record.");
  }

  const callbackIds = [checkoutRequestId, merchantRequestId].filter(Boolean);
  const storedIds = [storedCheckout, storedMerchant].filter(Boolean);
  if (!callbackIds.some((id) => storedIds.includes(id))) {
    throw new Error("Callback does not identify the stored payment.");
  }

  return payment;
}

function verifyCallbackAgainstLedger(payment: any, expectedAmount: number): boolean {
  const paymentAmount = normalizePositiveAmount(payment?.amount);
  const order = Array.isArray(payment?.order) ? payment.order[0] : payment?.order;
  const orderAmount = normalizePositiveAmount(order?.total_amount);

  return Boolean(
    paymentAmount !== null &&
      orderAmount !== null &&
      amountsMatch(paymentAmount, expectedAmount) &&
      amountsMatch(orderAmount, expectedAmount)
  );
}

function rejected(
  resultDesc: string,
  status: number,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    { ResultCode: 1, ResultDesc: resultDesc, ...extra },
    { status }
  );
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = await checkRateLimit(`mpesa_webhook:${ip}`, 120, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { ResultCode: 1, ResultDesc: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_CALLBACK_BODY_BYTES) {
      return rejected("Callback payload is too large", 413);
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return rejected("Invalid callback payload", 400);
    }

    const provider = mpesaClient.getCallbackProvider(body);
    if (!provider) return rejected("Unsupported callback format", 400);

    const signature =
      req.headers.get("x-unifiedpay-signature") ||
      req.headers.get("x-webhook-signature") ||
      req.headers.get("x-signature");
    let signatureVerified = false;
    if (signature) {
      if (
        provider !== "unifiedpay" ||
        !mpesaClient.verifyUnifiedPaySignature(rawBody, signature)
      ) {
        return rejected("Invalid webhook signature", 401);
      }
      signatureVerified = true;
    }

    const configuredSecret = (
      provider === "safaricom"
        ? process.env.MPESA_WEBHOOK_SECRET
        : process.env.UNIFIEDPAY_WEBHOOK_SECRET
    )?.trim();
    const providedSecret = extractProvidedSecret(req);
    const sharedSecretVerified = Boolean(
      configuredSecret && timingSafeCompare(providedSecret, configuredSecret)
    );

    if (providedSecret && configuredSecret && !sharedSecretVerified) {
      return rejected("Unauthorized webhook secret", 401);
    }

    // Daraja does not sign callback bodies and its STK query response does not
    // return the receipt/amount. Require the configured callback URL token to
    // authenticate those fields, then independently query Daraja for settlement.
    if (provider === "safaricom") {
      if (!configuredSecret) {
        return rejected("M-Pesa callback verification is not configured", 503);
      }
      if (!sharedSecretVerified) {
        return rejected("Unauthorized webhook secret", 401);
      }
    }

    const parsed = mpesaClient.parseCallback(body);
    const checkoutRequestId = strictTransactionId(parsed.checkoutRequestId);
    const merchantRequestId = strictTransactionId(parsed.merchantRequestId);
    const transactionId = checkoutRequestId || merchantRequestId;

    if (!transactionId) {
      return rejected("Missing or invalid transaction ID", 400);
    }

    // A failed/pending callback must also be authenticated before it can change
    // payment state. UnifiedPay successes may alternatively be verified by its
    // signed provider status API below.
    const callbackAuthenticated = sharedSecretVerified || signatureVerified;
    if (!parsed.isSuccess && !callbackAuthenticated) {
      return rejected("Callback is not authenticated", 401);
    }

    const tournamentPayment = await TournamentService.getTournamentPayment(transactionId);
    let adminSupabase: ReturnType<typeof createAdminClient> | null = null;
    let marketplacePayment: any = null;
    if (!tournamentPayment) {
      adminSupabase = createAdminClient();
      marketplacePayment = await findMarketplacePayment(
        adminSupabase,
        checkoutRequestId,
        merchantRequestId
      );
    }

    if (!tournamentPayment && !marketplacePayment) {
      return rejected("No matching payment record", 404);
    }

    if (!parsed.isSuccess) {
      if (tournamentPayment) {
        await TournamentService.failTournamentPayment(
          transactionId,
          parsed.resultDesc
        );
      } else {
        const paymentService = new PaymentService(adminSupabase!);
        await paymentService.processFailureCallback(
          checkoutRequestId,
          merchantRequestId,
          parsed.resultCode,
          parsed.resultDesc,
          body
        );
      }

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Authenticated failure callback processed",
      });
    }

    let expectedAmount: number | null = null;
    if (tournamentPayment) {
      expectedAmount = normalizePositiveAmount(tournamentPayment.amount);
      const tournament = await TournamentService.getTournamentById(
        tournamentPayment.tournament_id
      );
      if (
        !tournament ||
        !expectedAmount ||
        !amountsMatch(tournament.entry_fee_kes, expectedAmount)
      ) {
        return rejected("Tournament payment amount could not be verified", 400);
      }
    } else {
      const paymentAmount = normalizePositiveAmount(marketplacePayment.amount);
      const order = Array.isArray(marketplacePayment.order)
        ? marketplacePayment.order[0]
        : marketplacePayment.order;
      const orderAmount = normalizePositiveAmount(order?.total_amount);
      if (
        !paymentAmount ||
        !orderAmount ||
        !amountsMatch(paymentAmount, orderAmount)
      ) {
        return rejected("Payment ledger amount could not be verified", 400);
      }
      expectedAmount = paymentAmount;
    }

    let settlement: VerifiedMpesaSettlement;
    if (provider === "unifiedpay") {
      const upstream = await mpesaClient.checkUnifiedPayStatus(transactionId);
      const upstreamReceipt = normalizeMpesaReceiptNumber(upstream?.receiptNumber);
      const upstreamAmount = normalizePositiveAmount(upstream?.amount);
      if (
        !upstream?.isSuccess ||
        !upstreamReceipt ||
        upstreamAmount === null ||
        !amountsMatch(upstreamAmount, expectedAmount)
      ) {
        return rejected("Provider settlement could not be confirmed", 503);
      }

      const callbackReceipt = parsed.receiptNumber
        ? normalizeMpesaReceiptNumber(parsed.receiptNumber)
        : null;
      const callbackAmount = normalizePositiveAmount(parsed.amount);
      if (
        (parsed.receiptNumber && callbackReceipt !== upstreamReceipt) ||
        (parsed.amount !== undefined &&
          (callbackAmount === null || !amountsMatch(callbackAmount, upstreamAmount)))
      ) {
        return rejected("Callback details do not match provider settlement", 400);
      }

      settlement = {
        provider,
        verificationMethod: "provider_status_query",
        providerStatus: "completed",
        transactionId,
        checkoutRequestId: checkoutRequestId || undefined,
        merchantRequestId: merchantRequestId || undefined,
        receiptNumber: upstreamReceipt,
        amount: upstreamAmount,
        verifiedAt: new Date().toISOString(),
      };
    } else {
      if (!checkoutRequestId) {
        return rejected("Missing Safaricom CheckoutRequestID", 400);
      }

      const callbackReceipt = normalizeMpesaReceiptNumber(parsed.receiptNumber);
      const callbackAmount = normalizePositiveAmount(parsed.amount);
      if (
        !callbackReceipt ||
        callbackAmount === null ||
        !amountsMatch(callbackAmount, expectedAmount)
      ) {
        return rejected("Safaricom callback receipt or amount is invalid", 400);
      }

      const upstream = await mpesaClient.checkSafaricomStkStatus(checkoutRequestId);
      if (
        !upstream?.isSuccess ||
        upstream.checkoutRequestId !== checkoutRequestId ||
        (merchantRequestId &&
          upstream.merchantRequestId &&
          upstream.merchantRequestId !== merchantRequestId)
      ) {
        return rejected("Safaricom settlement could not be confirmed", 503);
      }

      settlement = {
        provider,
        verificationMethod: "authenticated_callback_and_status_query",
        providerStatus: "completed",
        transactionId: checkoutRequestId,
        checkoutRequestId,
        merchantRequestId: merchantRequestId || undefined,
        receiptNumber: callbackReceipt,
        amount: callbackAmount,
        verifiedAt: new Date().toISOString(),
      };
    }

    if (tournamentPayment) {
      const result = await TournamentService.confirmTournamentPayment(
        transactionId,
        settlement
      );
      if (!result.success) {
        return rejected(result.error || "Tournament settlement was not applied", 400);
      }

      if (!result.alreadySettled) {
        const tourney = await TournamentService.getTournamentById(
          tournamentPayment.tournament_id
        );
        await dispatchAdminWhatsAppAlert({
          eventType: "TOURNAMENT_REGISTRATION",
          listingTitle: tourney?.title || "eFootball Tournament",
          username: `${tournamentPayment.gamer_tag} (PROVIDER CONFIRMED)`,
          buyerPhone: tournamentPayment.phone_number,
          amount: settlement.amount,
          details: `Gamer Tag: ${tournamentPayment.gamer_tag} | Friend ID: ${tournamentPayment.friend_id} | Receipt: ${settlement.receiptNumber} | Phone: ${tournamentPayment.phone_number}`,
        }).catch(() => console.warn("Tournament payment alert failed."));
      }
    } else {
      if (!verifyCallbackAgainstLedger(marketplacePayment, settlement.amount)) {
        return rejected("Verified amount does not match the order ledger", 400);
      }
      const paymentService = new PaymentService(adminSupabase!);
      await paymentService.processCallback(body, settlement);
    }

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Provider-confirmed callback processed successfully",
    });
  } catch {
    // Never log raw callback payloads, request URLs, provider responses, or credentials.
    console.error("M-Pesa callback handler failed.");
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: "Internal callback handler error" },
      { status: 500 }
    );
  }
}
