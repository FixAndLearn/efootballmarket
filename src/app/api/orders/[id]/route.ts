import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSuperAdminEmail, isUserAdmin } from "@/lib/security/adminAuth";
import { OrderService } from "@/services/orderService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const orderService = new OrderService(primaryClient);
    const order = await orderService.getOrderById(params.id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Ensure the requester is either the buyer, the seller, or an admin
    if (order.buyer_id !== user.id && order.seller_id !== user.id) {
      let isAdmin = isSuperAdminEmail(user.email);
      if (!isAdmin) {
        const { data: prof } = await primaryClient
          .from("profiles")
          .select("role, is_suspended")
          .eq("id", user.id)
          .maybeSingle();
        isAdmin = isUserAdmin(user.email, prof?.role, prof?.is_suspended);
      }
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Forbidden. You are not a party to this order." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
