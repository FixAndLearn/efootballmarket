import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EscrowService, SecureEscrowReleaseUnavailableError } from "@/services/escrowService";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const releaseSchema = z.object({
  orderId: z.string().uuid(),
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
    const parsed = releaseSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    if (!hasServiceRoleKey()) {
      return NextResponse.json(
        { error: "Secure escrow release is temporarily unavailable. No funds were released; contact support." },
        { status: 503 }
      );
    }

    const escrowService = new EscrowService(createAdminClient());
    await escrowService.confirmAndRelease(parsed.data.orderId, user.id);

    return NextResponse.json({ success: true, message: "Seller proceeds were credited to the available platform balance." });
  } catch (error: any) {
    if (error instanceof SecureEscrowReleaseUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
