import { verifyAdminOrSecret } from "@/lib/security/guards";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendSellerWithdrawalStatusSms } from "@/lib/notifications/smsAlert";
import { sendSellerWithdrawalStatusWhatsApp } from "@/lib/whatsapp/notifications";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminOrSecret(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const supabase = createServerSupabaseClient();
    const adminSupabase = createAdminClient();
    const serviceRoleConfigured = hasServiceRoleKey();
    const primaryClient = serviceRoleConfigured ? adminSupabase : supabase;

    // Resilient multi-tier query:
    // NOTE: profiles table does NOT have an 'email' column (email lives in auth.users).
    // We select valid columns only: id, username, first_name, last_name, phone_number, available_balance
    let fetchedWithdrawals: any[] = [];

    // Attempt 1: Joined query with valid profile columns
    const { data: joinedData, error: joinError } = await primaryClient
      .from("seller_withdrawals")
      .select("*, seller:profiles(id, username, first_name, last_name, phone_number, available_balance)")
      .order("created_at", { ascending: false });

    if (!joinError && joinedData) {
      fetchedWithdrawals = joinedData;
    } else {
      console.warn("Joined withdrawals query warning:", joinError?.message);

      // Attempt 2: Fallback direct query on seller_withdrawals to ensure data is never lost
      const { data: directData, error: directError } = await primaryClient
        .from("seller_withdrawals")
        .select("*")
        .order("created_at", { ascending: false });

      if (directError) {
        // Attempt 3: Try adminSupabase in case of RLS differences
        const { data: adminData, error: adminErr } = await adminSupabase
          .from("seller_withdrawals")
          .select("*")
          .order("created_at", { ascending: false });

        if (adminErr) {
          console.error("Admin withdrawals fetch failed:", adminErr);
          throw adminErr;
        }
        fetchedWithdrawals = adminData || [];
      } else {
        fetchedWithdrawals = directData || [];
      }

      // Hydrate profiles manually
      if (fetchedWithdrawals.length > 0) {
        const sellerIds = Array.from(new Set(fetchedWithdrawals.map((w) => w.seller_id)));
        try {
          const { data: profiles } = await primaryClient
            .from("profiles")
            .select("id, username, first_name, last_name, phone_number, available_balance")
            .in("id", sellerIds);

          const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
          fetchedWithdrawals = fetchedWithdrawals.map((w) => ({
            ...w,
            seller: profileMap.get(w.seller_id) || null,
          }));
        } catch {
          // Non-blocking profile mapping
        }
      }
    }

    // Enrich with auth email addresses from auth.users (if service role / admin client permits)
    try {
      const { data: authData } = await adminSupabase.auth.admin.listUsers();
      if (authData?.users) {
        const emailMap = new Map(authData.users.map((u) => [u.id, u.email]));
        fetchedWithdrawals = fetchedWithdrawals.map((w) => {
          const sellerEmail = emailMap.get(w.seller_id) || "";
          return {
            ...w,
            seller: {
              ...(w.seller || {}),
              email: sellerEmail || w.seller?.email || "",
            },
          };
        });
      }
    } catch {
      // Non-blocking email enrichment
    }

    return NextResponse.json({ withdrawals: fetchedWithdrawals || [] });
  } catch (error: any) {
    console.error("GET /api/admin/withdrawals fatal:", error);
    return NextResponse.json({ error: error.message || "Failed to load withdrawals" }, { status: 500 });
  }
}

const updateWithdrawalSchema = z.object({
  withdrawalId: z.string().uuid(),
  status: z.enum(["pending", "processing", "completed", "rejected"]),
  failureReason: z.string().trim().max(1000).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth = await verifyAdminOrSecret(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const json = await req.json();
    const parsed = updateWithdrawalSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid parameters", details: parsed.error.format() }, { status: 400 });
    }

    if (!hasServiceRoleKey()) {
      return NextResponse.json(
        { error: "Secure withdrawal status updates are unavailable without the server-only service role key." },
        { status: 503 }
      );
    }

    const { withdrawalId, status, failureReason } = parsed.data;
    const adminSupabase = createAdminClient();
    const { data: review, error: reviewError } = await adminSupabase.rpc(
      "review_seller_withdrawal",
      {
        p_withdrawal_id: withdrawalId,
        p_status: status,
        p_reviewed_by: user.id,
        p_failure_reason: failureReason || null,
      }
    );

    if (reviewError) {
      console.error("Atomic seller withdrawal review failed.");
      return NextResponse.json(
        { error: "Withdrawal status and balance could not be safely updated. No manual balance fallback was attempted." },
        { status: 503 }
      );
    }

    const result = review as {
      id?: string;
      seller_id?: string;
      amount?: number | string;
      phone_number?: string;
      status?: string;
      changed?: boolean;
      balance_restored?: boolean;
    } | null;

    if (!result?.id || result.status !== status || !result.seller_id) {
      console.error("Atomic seller withdrawal review returned an invalid result.");
      return NextResponse.json(
        { error: "Withdrawal status could not be verified. Contact support before retrying." },
        { status: 503 }
      );
    }

    const payoutAmount = Number(result.amount || 0);

    // ---- B2C payout initiation -----------------------------------------
    // When an admin moves a withdrawal to 'processing', fire the real M-Pesa
    // B2C transfer and record the Daraja conversation ids so the result
    // callback can correlate and settle it automatically.
    // If initiation fails the withdrawal is reverted to 'pending' so the
    // reserved balance is never left stranded in 'processing'.
    if (status === "processing" && result.changed && result.phone_number) {
      try {
        const { mpesaClient } = await import("@/lib/mpesa/client");

        if (!mpesaClient.hasProtectedDarajaCallbackUrl() && process.env.MPESA_ENV === "production") {
          throw new Error(
            "M-Pesa callback URL is not protected by MPESA_WEBHOOK_SECRET; refusing to start a payout that could not be reconciled."
          );
        }

        const payout = await mpesaClient.initiateB2CPayout({
          phoneNumber: result.phone_number,
          amount: payoutAmount,
          remarks: `Payout ${result.id}`,
          occasion: "SellerWithdrawal",
        });

        const conversationId = payout?.ConversationID ?? null;
        const originatorId = payout?.OriginatorConversationID ?? null;

        if (!conversationId) {
          throw new Error("Daraja accepted no ConversationID for this payout.");
        }

        const { error: attachError } = await adminSupabase.rpc("attach_b2c_conversation_id", {
          p_withdrawal_id: result.id,
          p_b2c_conversation_id: conversationId,
          p_b2c_originator_conversation_id: originatorId,
        });

        if (attachError) {
          // The transfer is already in flight and irreversible; log loudly.
          console.error(
            "B2C transfer initiated but conversation id could not be stored:",
            conversationId,
            attachError.message
          );
        }
      } catch (payoutError) {
        const reason =
          payoutError instanceof Error ? payoutError.message : "M-Pesa payout initiation failed";
        console.error("B2C payout initiation failed; reverting withdrawal to pending.", reason);

        // revert: pending restores nothing (funds still reserved) and allows retry
        await adminSupabase.rpc("review_seller_withdrawal", {
          p_withdrawal_id: result.id,
          p_status: "pending",
          p_reviewed_by: user.id,
          p_failure_reason: null,
        }).then(({ error }: { error: { message: string } | null }) => {
          if (error) console.error("Could not revert withdrawal to pending:", error.message);
        });

        return NextResponse.json(
          {
            error: `Payout could not be started: ${reason} The withdrawal was returned to pending and no balance was changed.`,
          },
          { status: 502 }
        );
      }
    }

    const amount = Number(result.amount || 0);
    if (result.changed) {
      const message =
        status === "completed"
          ? `An administrator marked your withdrawal of KES ${amount.toLocaleString()} as paid after manual handling. This system does not independently verify the M-Pesa transfer; check your M-Pesa SMS or receipt and contact support if it has not arrived.`
          : status === "rejected"
          ? `Your withdrawal request of KES ${amount.toLocaleString()} was rejected.${result.balance_restored ? " The reserved amount was restored to your available balance." : " Check your available balance or contact support."}${failureReason ? ` Reason: ${failureReason}` : ""}`
          : `Your withdrawal request of KES ${amount.toLocaleString()} is being reviewed. This system has not initiated an M-Pesa transfer.`;

      try {
        const { error: notificationError } = await adminSupabase.from("notifications").insert({
          recipient_id: result.seller_id,
          type: "order_update",
          title:
            status === "completed"
              ? "Withdrawal Marked Paid"
              : status === "rejected"
              ? "Withdrawal Rejected"
              : "Withdrawal Processing",
          message,
          action_url: "/seller/earnings",
          is_read: false,
        });
        if (notificationError) console.warn("Seller withdrawal notification was not recorded.");
      } catch {
        console.warn("Seller withdrawal notification dispatch failed.");
      }

      if (result.phone_number && (status === "completed" || status === "rejected")) {
        sendSellerWithdrawalStatusWhatsApp(
          result.phone_number,
          amount,
          status,
          failureReason
        ).catch(() => console.warn("Seller withdrawal WhatsApp notification failed."));

        sendSellerWithdrawalStatusSms(
          result.phone_number,
          amount,
          status,
          failureReason
        ).catch(() => console.warn("Seller withdrawal SMS notification failed."));
      }
    }

    const responseMessage = !result.changed
      ? `Withdrawal is already ${status}; no further balance update was made.`
      : status === "completed"
      ? "Withdrawal marked paid based on administrator confirmation. This system does not independently verify the M-Pesa transfer."
      : status === "rejected"
      ? result.balance_restored
        ? "Withdrawal rejected and the reserved balance was restored atomically."
        : "Withdrawal rejected. Check the available balance or contact support."
      : status === "processing"
      ? "Withdrawal marked as processing. This system has not initiated an M-Pesa transfer."
      : "Withdrawal status updated.";

    return NextResponse.json({ success: true, message: responseMessage, changed: Boolean(result.changed) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
