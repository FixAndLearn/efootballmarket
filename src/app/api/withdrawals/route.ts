import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mpesaClient } from "@/lib/mpesa/client";
import { dispatchAdminWhatsAppAlert } from "@/lib/notifications/adminAlert";
import {
  checkRateLimit,
  claimIdempotencyKey,
  completeIdempotencyKey,
  hashSharedIdempotencyKey,
  releaseIdempotencyKey,
} from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/guards";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const withdrawalSchema = z.object({
  amount: z.number().finite().positive().min(10, "Minimum withdrawal is KES 10").max(250000, "Maximum single withdrawal is KES 250,000"),
  phoneNumber: z.string().min(9, "Valid M-Pesa phone number required"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to withdraw." }, { status: 401 });
    }

    const rate = await checkRateLimit(`withdraw:${user.id}:${ip}`, 3, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many withdrawal attempts. Please wait 1 minute before retrying." },
        { status: 429 }
      );
    }

    const json = await req.json();
    const parsed = withdrawalSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid withdrawal parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const amount = Math.round(parsed.data.amount * 100) / 100;
    const normalizedPhone = mpesaClient.normalizePhoneNumber(parsed.data.phoneNumber);
    if (!/^254[17]\d{8}$/.test(normalizedPhone)) {
      return NextResponse.json({ error: "Please enter a valid Kenyan M-Pesa phone number." }, { status: 400 });
    }

    if (!hasServiceRoleKey()) {
      return NextResponse.json(
        { error: "Secure withdrawal requests are unavailable without the server-only service role key." },
        { status: 503 }
      );
    }
    const adminSupabase = createAdminClient();

    const suppliedIdempotencyKey = req.headers.get("x-idempotency-key")?.trim() || "";
    if (suppliedIdempotencyKey.length > 255) {
      return NextResponse.json({ error: "Idempotency key is too long." }, { status: 400 });
    }
    const idemKey = `withdrawal:${user.id}:${suppliedIdempotencyKey || `${amount}:${normalizedPhone}`}`;
    const idempotencyClaim = await claimIdempotencyKey<any>(idemKey, 30000, 300000);
    if (idempotencyClaim.status === "cached") {
      return NextResponse.json({ ...idempotencyClaim.response, idempotent: true });
    }
    if (idempotencyClaim.status === "in_progress") {
      return NextResponse.json(
        { error: "A withdrawal request with this idempotency key is already processing. Retry shortly." },
        { status: 409, headers: { "Retry-After": "2" } }
      );
    }

    const releaseClaim = async () => {
      try {
        await releaseIdempotencyKey(idemKey, idempotencyClaim.ownerToken);
      } catch {
        console.warn("Could not release an unused withdrawal idempotency claim.");
      }
    };

    const { data: withdrawal, error: requestError } = await adminSupabase.rpc(
      "request_seller_withdrawal",
      {
        p_seller_id: user.id,
        p_amount: amount,
        p_phone_number: normalizedPhone,
        p_request_key: hashSharedIdempotencyKey(idemKey),
      }
    );

    if (requestError) {
      await releaseClaim();
      const message = requestError.message || "Could not record the withdrawal request.";
      const status = /suspended/i.test(message)
        ? 403
        : /profile not found/i.test(message)
        ? 404
        : /insufficient|amount must|valid Kenyan M-Pesa/i.test(message)
        ? 400
        : 503;
      if (status === 503) console.error("Atomic withdrawal reservation failed; no direct balance fallback was attempted.");
      return NextResponse.json(
        { error: status === 503 ? "Withdrawal request could not be safely recorded. Please try again later." : message },
        { status }
      );
    }

    const withdrawalRecord = withdrawal as {
      id?: string;
      amount?: number | string;
      phone_number?: string;
      idempotent?: boolean;
    } | null;

    if (!withdrawalRecord?.id) {
      await releaseClaim();
      console.error("Atomic withdrawal reservation returned no request record.");
      return NextResponse.json(
        { error: "Withdrawal status could not be verified. Contact support before retrying." },
        { status: 503 }
      );
    }

    const withdrawalAmount = Number(withdrawalRecord.amount || amount);
    const wasReused = Boolean(withdrawalRecord.idempotent);

    if (!wasReused) {
      try {
        const { error: notificationError } = await adminSupabase.from("notifications").insert({
          recipient_id: user.id,
          type: "order_update",
          title: "M-Pesa Withdrawal Submitted",
          message: `Your withdrawal request of KES ${withdrawalAmount} to ${normalizedPhone} is queued for manual review. This system has not sent an M-Pesa transfer.`,
          action_url: "/seller/earnings",
          is_read: false,
        });
        if (notificationError) console.warn("Withdrawal notification was not recorded.");
      } catch {
        console.warn("Withdrawal notification dispatch failed.");
      }

      const sellerUsername =
        user.user_metadata?.username ||
        (user.email ? user.email.split("@")[0] : "Trader");

      dispatchAdminWhatsAppAlert({
        eventType: "WITHDRAWAL_REQUESTED",
        orderId: withdrawalRecord.id,
        amount: withdrawalAmount,
        sellerPhone: normalizedPhone,
        username: sellerUsername,
        userEmail: user.email || undefined,
      }).catch(() => {
        console.warn("Admin withdrawal alert dispatch failed.");
      });
    }

    const responsePayload = {
      success: true,
      message: wasReused
        ? "This withdrawal request was already recorded. No second balance reservation was made."
        : `Your withdrawal request of KES ${withdrawalAmount} to ${normalizedPhone} is queued for manual review. This system has not sent an M-Pesa transfer.`,
      withdrawal,
      idempotent: wasReused,
    };

    try {
      await completeIdempotencyKey(idemKey, idempotencyClaim.ownerToken, responsePayload, 30000);
    } catch {
      // The ledger RPC also stores a request key, so a cache failure cannot create
      // a second reservation when this same request is retried.
      console.error("Withdrawal was recorded, but its shared response cache could not be completed.");
    }

    return NextResponse.json(responsePayload);
  } catch {
    return NextResponse.json({ error: "Withdrawal request could not be safely completed. Check Seller Earnings before retrying." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const serviceRoleConfigured = hasServiceRoleKey();
    const primaryClient = serviceRoleConfigured ? adminSupabase : supabase;

    let withdrawals: any[] = [];
    const { data: wData1, error: wErr1 } = await primaryClient
      .from("seller_withdrawals")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    if (!wErr1 && wData1) {
      withdrawals = wData1;
    } else {
      const { data: wData2 } = await adminSupabase
        .from("seller_withdrawals")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      withdrawals = wData2 || [];
    }

    return NextResponse.json({ withdrawals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
