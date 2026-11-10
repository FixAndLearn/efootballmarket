import { createAdminClient } from "@/lib/supabase/admin";
import { mpesaClient } from "@/lib/mpesa/client";
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

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`mpesa_webhook:${ip}`, 120, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { ResultCode: 1, ResultDesc: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // 1. Optional shared webhook secret check (configure MPESA_WEBHOOK_SECRET or UNIFIEDPAY_WEBHOOK_SECRET)
    const configuredSecret =
      process.env.MPESA_WEBHOOK_SECRET || process.env.UNIFIEDPAY_WEBHOOK_SECRET;
    if (configuredSecret) {
      const url = new URL(req.url);
      const providedSecret =
        req.headers.get("x-webhook-secret") ||
        req.headers.get("x-mpesa-secret") ||
        url.searchParams.get("secret") ||
        url.searchParams.get("token");

      if (!timingSafeCompare(providedSecret, configuredSecret)) {
        console.warn(`[Security] Rejected unauthenticated M-Pesa callback from IP ${ip}`);
        return NextResponse.json(
          { ResultCode: 1, ResultDesc: "Unauthorized webhook signature" },
          { status: 401 }
        );
      }
    }

    const body = await req.json();
    const parsed = mpesaClient.parseCallback(body);
    const checkoutId = sanitizeTransactionId(
      parsed.checkoutRequestId || parsed.merchantRequestId
    );

    if (!checkoutId) {
      return NextResponse.json(
        { ResultCode: 1, ResultDesc: "Missing CheckoutRequestID" },
        { status: 400 }
      );
    }

    // 2. Upstream Zero-Trust Verification: When UnifiedPay is active and callback claims success,
    // verify directly with UnifiedPay API so spoofed HTTP POSTs can never fake a settlement.
    if (parsed.isSuccess && mpesaClient.isUnifiedPay()) {
      const upstream = await mpesaClient.checkUnifiedPayStatus(checkoutId);
      if (!upstream || !upstream.isSuccess) {
        console.warn(
          `[Security] Blocked unverified callback for ${checkoutId} from IP ${ip}: upstream status not settled.`
        );
        return NextResponse.json(
          { ResultCode: 1, ResultDesc: "Upstream settlement verification failed" },
          { status: 400 }
        );
      }
    }

    // 3. Check if callback belongs to a tournament entry fee
    const tourneyPayment = await TournamentService.getTournamentPayment(checkoutId);
    if (tourneyPayment) {
      if (parsed.isSuccess) {
        const expectedFee = Number(tourneyPayment.amount || 0);
        const paidAmount = Number(parsed.amount || expectedFee);

        if (expectedFee > 0 && paidAmount + 0.01 < expectedFee) {
          console.warn(
            `[Security] Rejected underpaid tournament callback (${paidAmount} < ${expectedFee}) for ${checkoutId}`
          );
          return NextResponse.json(
            { ResultCode: 1, ResultDesc: "Paid amount is less than required entry fee" },
            { status: 400 }
          );
        }

        const receipt = parsed.receiptNumber || `CONFIRMED_${Date.now()}`;
        await TournamentService.confirmTournamentPayment(
          checkoutId,
          receipt,
          paidAmount
        );
        const tourney = await TournamentService.getTournamentById(tourneyPayment.tournament_id);
        await dispatchAdminWhatsAppAlert({
          eventType: "TOURNAMENT_REGISTRATION",
          listingTitle: tourney?.title || "eFootball Tournament",
          username: `${tourneyPayment.gamer_tag} (CONFIRMED WEBHOOK)`,
          buyerPhone: tourneyPayment.phone_number,
          amount: paidAmount,
          details: `Gamer Tag: ${tourneyPayment.gamer_tag} | Friend ID: ${tourneyPayment.friend_id} | Receipt: ${receipt} | Phone: ${tourneyPayment.phone_number}`,
        }).catch((e) => console.warn("WhatsApp alert error:", e));
      } else {
        await TournamentService.failTournamentPayment(checkoutId, parsed.resultDesc);
      }

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Tournament callback processed successfully",
      });
    }

    // 4. Marketplace Order Payment
    const adminSupabase = createAdminClient();
    const paymentService = new PaymentService(adminSupabase);
    await paymentService.processCallback(body);

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Callback accepted and processed successfully",
    });
  } catch (error: any) {
    console.error("M-Pesa callback processing error:", error);
    return NextResponse.json({
      ResultCode: 1,
      ResultDesc: "Internal callback handler error",
    });
  }
}
