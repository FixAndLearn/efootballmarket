import { verifyAdminOrSecret } from "@/lib/security/guards";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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
    const client = serviceRoleConfigured ? adminSupabase : supabase;

    const { data: disputes, error } = await client
      .from("disputes")
      .select(
        "*, order:orders(id, order_number, total_amount, seller_net_amount, currency, status, created_at, listing:listings(id, title, platform, overall_team_strength), buyer:profiles!buyer_id(id, username, phone_number), seller:profiles!seller_id(id, username, phone_number, available_balance, escrow_balance))"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Parse evidence list from resolution_notes for each dispute
    const enrichedDisputes = (disputes || []).map((d: any) => {
      let evidenceList: any[] = [];
      try {
        if (d.resolution_notes && d.resolution_notes.startsWith("[")) {
          evidenceList = JSON.parse(d.resolution_notes);
        }
      } catch (e) {
        evidenceList = [];
      }

      const rawOrder = Array.isArray(d.order) ? d.order[0] : d.order;
      const order = rawOrder
        ? {
            ...rawOrder,
            listing: Array.isArray(rawOrder.listing) ? rawOrder.listing[0] : rawOrder.listing,
            buyer: Array.isArray(rawOrder.buyer) ? rawOrder.buyer[0] : rawOrder.buyer,
            seller: Array.isArray(rawOrder.seller) ? rawOrder.seller[0] : rawOrder.seller,
          }
        : null;

      return {
        ...d,
        order,
        evidenceList,
      };
    });

    return NextResponse.json({ disputes: enrichedDisputes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const resolveDisputeSchema = z.object({
  disputeId: z.string().uuid(),
  orderId: z.string().uuid(),
  action: z.enum(["release_to_seller", "refund_buyer", "dismiss"]),
  notes: z.string().trim().min(3, "Resolution notes required").max(10000),
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
    const parsed = resolveDisputeSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid resolution payload", details: parsed.error.format() }, { status: 400 });
    }

    if (!hasServiceRoleKey()) {
      return NextResponse.json(
        { error: "Atomic dispute resolution is unavailable without the server-only service role key." },
        { status: 503 }
      );
    }

    const adminSupabase = createAdminClient();
    const { disputeId, orderId, action, notes } = parsed.data;
    const { data: resolution, error: resolutionError } = await adminSupabase.rpc(
      "resolve_escrow_dispute",
      {
        p_dispute_id: disputeId,
        p_order_id: orderId,
        p_action: action,
        p_reviewed_by: user.id,
        p_notes: notes,
      }
    );

    if (resolutionError) {
      if (resolutionError.code === "P0001") {
        return NextResponse.json(
          { error: "Dispute state changed or is no longer eligible for this action. Refresh and review it before retrying." },
          { status: 409 }
        );
      }
      console.error("Atomic escrow dispute resolution RPC failed; no direct balance fallback was attempted.");
      return NextResponse.json(
        { error: "Dispute resolution is temporarily unavailable. No partial status or balance update was attempted." },
        { status: 503 }
      );
    }

    const result = resolution as {
      dispute_id?: string;
      order_id?: string;
      action?: string;
      status?: string;
      post_release?: boolean;
      changed?: boolean;
    } | null;

    if (
      !result?.dispute_id ||
      result.dispute_id !== disputeId ||
      result.order_id !== orderId ||
      result.action !== action ||
      typeof result.post_release !== "boolean" ||
      typeof result.changed !== "boolean"
    ) {
      console.error("Atomic escrow dispute resolution RPC returned an invalid result.");
      return NextResponse.json(
        { error: "Dispute resolution could not be verified. Contact support before retrying." },
        { status: 503 }
      );
    }

    const message =
      action === "refund_buyer"
        ? "Refund decision recorded. This action does not send M-Pesa funds; staff must arrange any approved refund manually and confirm it with the buyer."
        : result.post_release
        ? "Post-release dispute closed. Seller balances were not automatically changed, and any M-Pesa transfer already sent was not reversed."
        : `Dispute resolved successfully (${action}).`;

    return NextResponse.json({
      success: true,
      message,
      idempotent: !result.changed,
      postRelease: result.post_release,
    });
  } catch (error: any) {
    console.error("Dispute resolution error:", error);
    return NextResponse.json({ error: error.message || "Failed to resolve dispute." }, { status: 500 });
  }
}
