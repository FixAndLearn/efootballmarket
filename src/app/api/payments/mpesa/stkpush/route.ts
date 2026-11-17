import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PaymentService } from "@/services/paymentService";
import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  claimIdempotencyKey,
  completeIdempotencyKey,
  releaseIdempotencyKey,
} from "@/lib/security/rateLimiter";
import { z } from "zod";
import { mpesaClient } from "@/lib/mpesa/client";

export const dynamic = "force-dynamic";

const stkPushSchema = z.object({
  orderId: z.string().uuid(),
  phoneNumber: z.string().min(9, "Valid M-Pesa phone number required"),
});

export async function POST(req: NextRequest) {
  let claimedKey: { key: string; ownerToken: string } | null = null;
  let providerRequestStarted = false;

  const releaseUnusedClaim = async () => {
    if (!claimedKey || providerRequestStarted) return;
    const claim = claimedKey;
    claimedKey = null;
    try {
      await releaseIdempotencyKey(claim.key, claim.ownerToken);
    } catch {
      console.warn("Could not release an unused STK Push idempotency claim.");
    }
  };

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const rateCheck = await checkRateLimit(`stkpush:${user.id}:${ip}`, 6, 60000);

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many payment requests. Please wait a moment before retrying." },
        { status: 429 }
      );
    }

    const json = await req.json();
    const parsed = stkPushSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment request", details: parsed.error.format() }, { status: 400 });
    }

    const suppliedIdempotencyKey = req.headers.get("x-idempotency-key")?.trim() || "";
    if (suppliedIdempotencyKey.length > 255) {
      return NextResponse.json({ error: "Idempotency key is too long." }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const primaryClient = hasServiceRoleKey() ? adminSupabase : supabase;

    // Verify caller owns the order before initiating STK Push
    const { data: orderOwnerCheck } = await primaryClient
      .from("orders")
      .select("buyer_id")
      .eq("id", parsed.data.orderId)
      .maybeSingle();

    if (!orderOwnerCheck) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (orderOwnerCheck.buyer_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: Only the order buyer can initiate M-Pesa payment." },
        { status: 403 }
      );
    }

    const idempotencyInput =
      suppliedIdempotencyKey || `${parsed.data.orderId}:${parsed.data.phoneNumber}`;
    const idempotencyKey = `order-stk:${user.id}:${idempotencyInput}`;
    const idempotencyClaim = await claimIdempotencyKey<any>(idempotencyKey, 300000, 300000);
    if (idempotencyClaim.status === "cached") {
      return NextResponse.json({ ...idempotencyClaim.response, idempotent: true });
    }
    if (idempotencyClaim.status === "in_progress") {
      return NextResponse.json(
        { error: "A payment request with this idempotency key is already processing. Retry shortly." },
        { status: 409, headers: { "Retry-After": "2" } }
      );
    }

    claimedKey = { key: idempotencyKey, ownerToken: idempotencyClaim.ownerToken };

    const paymentService = new PaymentService(primaryClient);
    const result = await paymentService.initiateOrderPayment(
      parsed.data.orderId,
      parsed.data.phoneNumber,
      () => {
        providerRequestStarted = true;
      }
    );

    const payload = {
      success: true,
      checkoutRequestId: result.checkoutRequestId,
      message: result.customerMessage,
    };
    await completeIdempotencyKey(idempotencyKey, idempotencyClaim.ownerToken, payload, 300000);
    claimedKey = null;

    return NextResponse.json(payload);
  } catch (error: any) {
    await releaseUnusedClaim();
    // Keep credential-bearing detail out of the response, but log a sanitized,
    // actionable reason. The previous version logged only "STK Push initiation
    // failed." with no cause, which is why a persistent configuration failure
    // went unnoticed for weeks.
    const rawMessage = String(error?.message || "unknown error");
    const safeMessage = mpesaClient.sanitizeProviderError(rawMessage);
    console.error("[stkpush] initiation failed:", safeMessage);

    // Configuration faults are the operator's problem, not the buyer's, and
    // returning a generic 500 hid them. Signal 503 so monitoring and the UI can
    // tell "we are misconfigured" apart from "the customer declined".
    const isConfigFault = /not configured|not reachable|verification is not configured/i.test(
      rawMessage
    );

    return NextResponse.json(
      {
        error: isConfigFault
          ? "M-Pesa payments are temporarily unavailable. Please contact support."
          : "Could not initiate the M-Pesa payment. Please try again.",
        code: isConfigFault ? "PROVIDER_NOT_CONFIGURED" : "STK_INITIATION_FAILED",
      },
      { status: isConfigFault ? 503 : 502 }
    );
  }
}
