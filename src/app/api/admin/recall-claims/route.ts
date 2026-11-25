import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { isUserAdmin } from "@/lib/security/adminAuth";

export const dynamic = "force-dynamic";

/**
 * Admin queue for account-recovery claims.
 *
 * A claim freezes money, so an unresolved claim is a stuck payout. This endpoint
 * is the only way to unfreeze it, which is why it resolves through the RPC
 * rather than updating tables directly: the RPC re-checks admin rights, locks
 * the order and escrow rows, and keeps the balances consistent.
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasServiceRoleKey()) {
      return NextResponse.json({ error: "Admin claim queue is temporarily unavailable." }, { status: 503 });
    }
    const client = createAdminClient();

    const { data: profile } = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!isUserAdmin(user.email, profile?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: claims, error } = await client
      .from("account_recall_claims")
      .select(
        `id, order_id, claimant_id, claimed_amount, status, description,
         evidence_urls, konami_notice_reference, resolution_notes,
         resolved_at, created_at,
         order:orders(id, order_number, buyer_id, seller_id, total_amount, status)`
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ claims: claims ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
  }
}

const resolveSchema = z.object({
  claimId: z.string().uuid(),
  outcome: z.enum(["upheld", "rejected"]),
  notes: z.string().min(3).max(4000),
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

    if (!hasServiceRoleKey()) {
      return NextResponse.json(
        {
          error:
            "Claim resolution needs the server-only service role key so the ledger RPC can run safely.",
        },
        { status: 503 }
      );
    }

    const client = createAdminClient();

    const { data: profile } = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!isUserAdmin(user.email, profile?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = resolveSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid resolution payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { claimId, outcome, notes } = parsed.data;

    const { error } = await client.rpc("resolve_account_recall_claim", {
      p_claim_id: claimId,
      p_admin_id: user.id,
      p_outcome: outcome,
      p_notes: notes,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      // Never claim a refund was sent: an upheld claim parks funds in
      // refund_pending for a manual transfer, matching how every other refund on
      // this platform works.
      message:
        outcome === "upheld"
          ? "Claim upheld. Held funds are parked in refund_pending and the seller is restricted — any approved refund must be arranged manually and confirmed with the buyer."
          : "Claim rejected. Held funds were released to the seller and the order is complete.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
  }
}
