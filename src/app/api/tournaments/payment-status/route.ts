import { mpesaClient } from "@/lib/mpesa/client";
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
    const rate = checkRateLimit(`tourney_pay_status:${ip}`, 90, 60000);
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

    // 2. If already completed in DB, return success immediately
    if (payment && payment.status === "completed") {
      const tourney = await TournamentService.getTournamentById(payment.tournament_id);
      const participant = (tourney?.participants || []).find(
        (p) => p.friend_id.toLowerCase() === payment.friend_id.toLowerCase()
      );
      const safeReceipt = authUser
        ? payment.mpesa_receipt_number || "CONFIRMED"
        : payment.mpesa_receipt_number
        ? `${String(payment.mpesa_receipt_number).slice(0, 3)}****${String(
            payment.mpesa_receipt_number
          ).slice(-2)}`
        : "CONFIRMED";

      return NextResponse.json(
        {
          status: "completed",
          receiptNumber: safeReceipt,
          resultCode: 0,
          resultDesc: "Payment verified successfully",
          participant: sanitizeParticipant(participant),
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // 3. Actively query UnifiedPay Till 1572931 for live settlement status
    const idToPoll = sanitizeTransactionId(
      checkoutRequestId || payment?.checkout_request_id || payment?.merchant_request_id
    );
    if (idToPoll && mpesaClient.isUnifiedPay()) {
      const liveStatus = await mpesaClient.checkUnifiedPayStatus(idToPoll);
      const expectedAmt = Number(payment?.amount || 0);
      const settledAmt = Number(liveStatus?.amount || expectedAmt);

      if (liveStatus && liveStatus.isSuccess && (expectedAmt <= 0 || settledAmt + 1 >= expectedAmt)) {
        const receipt = liveStatus.receiptNumber || `CONFIRMED_${Date.now()}`;
        const confirmResult = await TournamentService.confirmTournamentPayment(
          idToPoll,
          receipt,
          settledAmt || payment?.amount
        );

        const tourney = payment ? await TournamentService.getTournamentById(payment.tournament_id) : null;

        await dispatchAdminWhatsAppAlert({
          eventType: "TOURNAMENT_REGISTRATION",
          listingTitle: tourney?.title || "eFootball Tournament",
          username: `${payment?.gamer_tag || "Player"} (CONFIRMED PAID)`,
          buyerPhone: payment?.phone_number || liveStatus.phoneNumber || "254794400365",
          amount: settledAmt || payment?.amount || 0,
          details: `Gamer Tag: ${payment?.gamer_tag} | Friend ID: ${payment?.friend_id} | M-Pesa Receipt: ${receipt} | Till 1572931`,
        }).catch((e) => console.warn("WhatsApp alert error:", e));

        return NextResponse.json(
          {
            status: "completed",
            receiptNumber: authUser ? receipt : `${String(receipt).slice(0, 3)}****`,
            resultCode: 0,
            resultDesc: "Payment verified via Safaricom Till 1572931",
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
  } catch (err: any) {
    console.error("Tournament payment status route error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to check tournament payment status" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
