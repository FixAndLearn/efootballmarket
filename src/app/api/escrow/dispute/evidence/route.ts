import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const evidenceSchema = z.object({
  orderId: z.string().uuid(),
  evidenceUrl: z.string().url(),
  title: z.string().optional().default("Dispute Evidence Screenshot"),
  description: z.string().optional().default("Uploaded evidence for order dispute"),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const json = await req.json();
    const parsed = evidenceSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid evidence payload", details: parsed.error.format() }, { status: 400 });
    }

    const { orderId, evidenceUrl, title, description } = parsed.data;

    if (!hasServiceRoleKey()) {
      return NextResponse.json(
        { error: "Secure dispute evidence storage is temporarily unavailable. No evidence record was changed." },
        { status: 503 }
      );
    }

    const client = createAdminClient();

    // Fetch order to verify permission
    const { data: order, error: orderError } = await client
      .from("orders")
      .select("id, order_number, buyer_id, seller_id, status, total_amount, listing:listings(title)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const isBuyer = order.buyer_id === user.id;
    const isSeller = order.seller_id === user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Unauthorized to submit evidence for this order." }, { status: 403 });
    }

    const uploaderRole = isBuyer ? "Buyer" : "Seller";

    // Evidence is attached only to an active case. In particular, never replace
    // resolution notes on a case that has already been closed.
    const { data: dispute, error: disputeError } = await client
      .from("disputes")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (disputeError) {
      return NextResponse.json({ error: "Could not safely load the dispute record." }, { status: 503 });
    }
    if (!dispute || !["open", "under_review"].includes(dispute.status)) {
      return NextResponse.json(
        { error: "There is no active dispute for this order. Contact support to add information to a closed case." },
        { status: 409 }
      );
    }

    // Append evidence into resolution_notes as a structured JSON log.
    const evidenceItem = {
      url: evidenceUrl,
      title,
      description,
      uploaderId: user.id,
      uploaderRole,
      uploadedAt: new Date().toISOString(),
    };

    let currentEvidence: any[] = [];
    if (dispute.resolution_notes) {
      try {
        const parsedEvidence = JSON.parse(dispute.resolution_notes);
        if (!Array.isArray(parsedEvidence)) throw new Error("Stored dispute notes are not an evidence list.");
        currentEvidence = parsedEvidence;
      } catch {
        return NextResponse.json(
          { error: "Existing moderator notes could not be safely merged with evidence. Contact support before retrying." },
          { status: 409 }
        );
      }
    }

    currentEvidence.push(evidenceItem);
    const { data: updatedDispute, error: updateError } = await client
      .from("disputes")
      .update({
        resolution_notes: JSON.stringify(currentEvidence),
        updated_at: new Date().toISOString(),
      })
      .eq("id", dispute.id)
      .in("status", ["open", "under_review"])
      .select("id")
      .maybeSingle();

    if (updateError || !updatedDispute) {
      return NextResponse.json(
        { error: "The dispute changed while evidence was being attached. Refresh the case and retry." },
        { status: 409 }
      );
    }

    // Also record a system message in the order chat so both parties and admin see it
    try {
      const { data: conv } = await client
        .from("conversations")
        .select("id")
        .eq("order_id", orderId)
        .single();

      if (conv) {
        // `messages` has no `message_text` column; the body lives in `content`.
        // The bare catch below swallowed the 42703, so the order chat never
        // showed that evidence had been attached.
        const { error: msgError } = await client.from("messages").insert({
          conversation_id: conv.id,
          sender_id: user.id,
          content: `[Dispute Evidence Uploaded by ${uploaderRole}]: ${title} - ${evidenceUrl}`,
          message_type: "system",
        });
        if (msgError) {
          console.error("[dispute-evidence] chat notice failed:", msgError.message);
        }
      }
    } catch (e) {
      // quiet fallback
    }

    return NextResponse.json({
      success: true,
      message: "Evidence registered successfully.",
      evidence: evidenceItem,
    });
  } catch (err: any) {
    console.error("Dispute evidence upload error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit evidence." }, { status: 500 });
  }
}
