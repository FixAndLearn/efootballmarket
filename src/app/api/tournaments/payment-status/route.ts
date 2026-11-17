import { mpesaClient } from "@/lib/mpesa/client";
import { VerifiedMpesaSettlement } from "@/lib/mpesa/types";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  amountsMatch,
  isVerifiedSettlementClaim,
  normalizeMpesaReceiptNumber,
  normalizePositiveAmount,
} from "@/lib/mpesa/settlement";
import { dispatchAdminWhatsAppAlert } from "@/lib/notifications/adminAlert";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import {
  getClientIp,
  maskPhoneNumber,
  sanitizeTransactionId,
} from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TournamentService } from "@/services/tournamentService";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate",
  "CDN-Cache-Control": "no-store",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * GET /api/tournaments/payment-status
 * Real-time polling endpoint to detect M-Pesa STK Push payment settlements instantly.
 */
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = await checkRateLimit(`tourney_pay_status:${ip}`, 90, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many status checks. Please wait a moment." },
        { status: 429, headers: NO_CACHE_HEADERS }
      );
    }

    const { searchParams } = new URL(req.url);
    const checkoutRequestId = sanitizeTransactionId(searchParams.get("checkoutRequestId"));
    const tournamentId = searchParams.get("tournamentId");
    const userId = searchParams.get("userId");
    const phoneNumber = searchParams.get("phone") || searchParams.get("phoneNumber");
    const forceCheck = searchParams.get("forceCheck") === "true";

    const supabase = createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const sanitizeParticipant = (p: any) =>
      p ? { ...p, phone_number: maskPhoneNumber(p.phone_number) } : p;

    // 1. Resolve payment record
    let payment = checkoutRequestId ? await TournamentService.getTournamentPayment(checkoutRequestId) : null;

    if (!payment && tournamentId && authUser && (userId || phoneNumber)) {
      const safeUserId = userId && userId === authUser.id ? userId : authUser.id;
      payment = await TournamentService.getLatestPaymentForUser(
        tournamentId,
        safeUserId,
        phoneNumber ? mpesaClient.normalizePhoneNumber(phoneNumber) : undefined
      );
    }

    // 2. A completed row is trusted only if its receipt has a matching global claim.
    if (payment && payment.status === "completed") {
      const receipt = normalizeMpesaReceiptNumber(payment.mpesa_receipt_number);
      const adminSupabase = createAdminClient();
      const { data: receiptClaim, error: receiptClaimError } = receipt
        ? await adminSupabase
            .from("mpesa_settlement_receipts")
            .select("source, entity_id, provider, verification_method, transaction_id, amount")
            .eq("receipt_number", receipt)
            .maybeSingle()
        : { data: null, error: true };

      if (
        !receipt ||
        receiptClaimError ||
        !isVerifiedSettlementClaim(receiptClaim, {
          source: "tournament",
          entityId: payment.id,
          transactionIds: [payment.checkout_request_id, payment.merchant_request_id],
          amount: payment.amount,
        })
      ) {
        return NextResponse.json(
          { error: "Provider settlement record could not be confirmed." },
          { status: 503, headers: NO_CACHE_HEADERS }
        );
      }

      const tourney = await TournamentService.getTournamentById(payment.tournament_id);
      const participant = (tourney?.participants || []).find(
        (p) =>
          String(p.friend_id || "").trim().toLowerCase() ===
          String(payment.friend_id || "").trim().toLowerCase()
      );
      if (
        !tourney ||
        !amountsMatch(payment.amount, tourney.entry_fee_kes) ||
        !participant ||
        participant.payment_status !== "paid" ||
        !String(participant.payment_method || "").trim().toLowerCase().startsWith("mpesa") ||
        !amountsMatch(participant.amount_paid, payment.amount) ||
        (participant.user_id ?? null) !== (payment.user_id ?? null)
      ) {
        return NextResponse.json(
          { error: "Provider settlement does not match a paid tournament participant." },
          { status: 503, headers: NO_CACHE_HEADERS }
        );
      }

      const safeReceipt = authUser
        ? receipt
        : `${receipt.slice(0, 3)}****${receipt.slice(-2)}`;

      return NextResponse.json(
        {
          status: "completed",
          receiptNumber: safeReceipt,
          resultCode: 0,
          resultDesc: "Provider-confirmed payment is registered",
          participant: sanitizeParticipant(participant),
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // 3. Query UnifiedPay only for a transaction linked to the stored tournament payment.
    const storedTransactionIds = [
      payment?.checkout_request_id,
      payment?.merchant_request_id,
    ]
      .filter(Boolean)
      .map((id) => String(id));
    if (checkoutRequestId && payment && !storedTransactionIds.includes(checkoutRequestId)) {
      return NextResponse.json(
        { error: "Checkout ID does not belong to this tournament payment." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }
    const idToPoll = sanitizeTransactionId(
      payment?.checkout_request_id || payment?.merchant_request_id
    );
    if (payment && idToPoll && mpesaClient.isUnifiedPay()) {
      const liveStatus = await mpesaClient.checkUnifiedPayStatus(idToPoll);
      const expectedAmt = normalizePositiveAmount(payment.amount);
      const settledAmt = normalizePositiveAmount(liveStatus?.amount);
      const receipt = normalizeMpesaReceiptNumber(liveStatus?.receiptNumber);
      const tournament = await TournamentService.getTournamentById(payment.tournament_id);

      if (
        liveStatus?.isSuccess &&
        receipt &&
        settledAmt !== null &&
        expectedAmt !== null &&
        tournament &&
        amountsMatch(expectedAmt, tournament.entry_fee_kes) &&
        amountsMatch(settledAmt, expectedAmt)
      ) {
        const settlement: VerifiedMpesaSettlement = {
          provider: "unifiedpay",
          verificationMethod: "provider_status_query",
          providerStatus: "completed",
          transactionId: idToPoll,
          checkoutRequestId: payment.checkout_request_id || undefined,
          merchantRequestId: payment.merchant_request_id || undefined,
          receiptNumber: receipt,
          amount: settledAmt,
          verifiedAt: new Date().toISOString(),
        };
        const confirmResult = await TournamentService.confirmTournamentPayment(
          idToPoll,
          settlement
        );
        if (!confirmResult.success) {
          return NextResponse.json(
            { status: "pending", resultCode: 100, resultDesc: "Payment confirmation is pending." },
            { headers: NO_CACHE_HEADERS }
          );
        }

        await dispatchAdminWhatsAppAlert({
          eventType: "TOURNAMENT_REGISTRATION",
          listingTitle: tournament.title || "eFootball Tournament",
          username: `${payment.gamer_tag || "Player"} (PROVIDER CONFIRMED)`,
          buyerPhone: payment.phone_number || liveStatus.phoneNumber || "",
          amount: settledAmt,
          details: `Gamer Tag: ${payment.gamer_tag} | Friend ID: ${payment.friend_id} | M-Pesa Receipt: ${receipt} | Till 1572931`,
        }).catch(() => console.warn("Tournament payment alert failed."));

        return NextResponse.json(
          {
            status: "completed",
            receiptNumber: authUser ? receipt : `${String(receipt).slice(0, 3)}****`,
            resultCode: 0,
            resultDesc: "Payment verified by the provider",
            participant: sanitizeParticipant(confirmResult.participant),
          },
          { headers: NO_CACHE_HEADERS }
        );
      }

      // Check for genuine cancellation (ONLY if NOT pending)
      const descLower = String(liveStatus?.resultDesc || "").toLowerCase();
      const isGenuineFailure =
        liveStatus &&
        !liveStatus.isSuccess &&
        !descLower.includes("pending") &&
        (liveStatus.resultCode === 1037 ||
          descLower.includes("cancelled") ||
          descLower.includes("cancel") ||
          descLower.includes("rule limited") ||
          descLower.includes("timeout"));

      if (isGenuineFailure && forceCheck) {
        await TournamentService.failTournamentPayment(
          idToPoll,
          liveStatus.resultDesc || "Transaction cancelled"
        );

        return NextResponse.json(
          {
            status: "failed",
            resultCode: liveStatus.resultCode || 1032,
            resultDesc: liveStatus.resultDesc || "Transaction was cancelled.",
          },
          { headers: NO_CACHE_HEADERS }
        );
      }
    }

    // 4. Default state: Still waiting for PIN confirmation
    return NextResponse.json(
      {
        status: "pending",
        resultCode: 100,
        resultDesc: "Waiting for M-Pesa PIN confirmation...",
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch {
    console.error("Tournament payment status check failed.");
    return NextResponse.json(
      { error: "Failed to check tournament payment status" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
