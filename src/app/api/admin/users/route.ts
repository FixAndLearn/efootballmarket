import { isSuperAdminEmail, isUserAdmin } from "@/lib/security/adminAuth";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

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
    const primaryClient = hasServiceRoleKey() ? adminSupabase : supabase;

    // Check caller privileges
    const { data: callerProfile } = await primaryClient
      .from("profiles")
      .select("role, is_suspended")
      .eq("id", user.id)
      .single();

    if (!isUserAdmin(user.email, callerProfile?.role, callerProfile?.is_suspended)) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    // Fetch all profiles
    const { data: profiles, error } = await primaryClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Fetch auth emails if admin client is available
    let usersWithEmail = profiles || [];
    try {
      const { data: authData } = await adminSupabase.auth.admin.listUsers();
      if (authData?.users) {
        const emailMap = new Map(authData.users.map((u) => [u.id, u.email]));
        usersWithEmail = usersWithEmail.map((p) => {
          const email = emailMap.get(p.id) || "";
          const isSuper = isSuperAdminEmail(email);
          return {
            ...p,
            email,
            is_super_admin: isSuper,
            role: isSuper ? "super_admin" : p.role || "user",
          };
        });
      }
    } catch {
      // Non-blocking fallback
    }

    return NextResponse.json({
      users: usersWithEmail,
      isSuperAdmin: isSuperAdminEmail(user.email),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const actionSchema = z.object({
  targetUserId: z.string().uuid(),
  action: z.enum([
    "grant_admin",
    "dismiss_admin",
    "ban_user",
    "unban_user",
    // ID verification was previously unreachable: is_verified_seller is read
    // all over the UI but no route could ever set it, so the "ID-Verified"
    // tier could not be earned by anyone.
    "verify_seller",
    "unverify_seller",
  ]),
  reason: z.string().optional(),
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

    const adminSupabase = createAdminClient();
    const primaryClient = hasServiceRoleKey() ? adminSupabase : supabase;

    const { data: callerProfile } = await primaryClient
      .from("profiles")
      .select("role, is_suspended")
      .eq("id", user.id)
      .single();

    const isCallerSuperAdmin = isSuperAdminEmail(user.email);
    const isCallerAdmin = isUserAdmin(
      user.email,
      callerProfile?.role,
      callerProfile?.is_suspended
    );

    if (!isCallerAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
    }

    const json = await req.json();
    const parsed = actionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action payload", details: parsed.error.format() }, { status: 400 });
    }

    const { targetUserId, action, reason } = parsed.data;

    // Check target user email
    let targetEmail = "";
    try {
      const { data: targetAuth } = await adminSupabase.auth.admin.getUserById(targetUserId);
      targetEmail = targetAuth?.user?.email || "";
    } catch {
      // Ignore
    }

    // IMMUTABLE PROTECTION: Primary Super Admin cannot be dismissed or banned!
    if (isSuperAdminEmail(targetEmail)) {
      return NextResponse.json(
        { error: "Action rejected: Primary Super Admin privileges cannot be altered." },
        { status: 400 }
      );
    }

    // Only Super Admin can grant or dismiss admin privileges!
    if ((action === "grant_admin" || action === "dismiss_admin") && !isCallerSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only the Primary Super Admin can manage admin privileges." },
        { status: 403 }
      );
    }

    if (action === "grant_admin") {
      await primaryClient
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", targetUserId);

      // Notify user
      await primaryClient.from("notifications").insert({
        recipient_id: targetUserId,
        type: "admin_role_granted",
        title: "Administrator Privileges Granted",
        message: "You have been granted platform administrator privileges by Brian Okibo, Super Admin.",
        action_url: "/admin",
        is_read: false,
      });

      return NextResponse.json({ success: true, message: "User successfully promoted to Administrator." });
    }

    if (action === "dismiss_admin") {
      await primaryClient
        .from("profiles")
        .update({ role: "user" })
        .eq("id", targetUserId);

      await primaryClient.from("notifications").insert({
        recipient_id: targetUserId,
        type: "admin_role_revoked",
        title: "Administrator Privileges Revoked",
        message: "Your platform administrator privileges have been dismissed by the Super Admin.",
        action_url: "/dashboard/buyer",
        is_read: false,
      });

      return NextResponse.json({ success: true, message: "Administrator dismissed back to regular user." });
    }

    if (action === "ban_user") {
      await primaryClient
        .from("profiles")
        .update({ is_suspended: true })
        .eq("id", targetUserId);

      // Unpublish all their published/active listings
      await primaryClient
        .from("listings")
        .update({ status: "archived" })
        .eq("seller_id", targetUserId)
        .in("status", ["published", "active"]);

      await primaryClient.from("notifications").insert({
        recipient_id: targetUserId,
        type: "account_suspended",
        title: "Account Suspended for Rule Violation",
        message: reason || "Your account has been suspended by administration for violating marketplace rules.",
        action_url: "/dispute-policy",
        is_read: false,
      });

      return NextResponse.json({ success: true, message: "User banned and their active listings taken down." });
    }

    if (action === "unban_user") {
      await primaryClient
        .from("profiles")
        .update({ is_suspended: false })
        .eq("id", targetUserId);

      await primaryClient.from("notifications").insert({
        recipient_id: targetUserId,
        type: "account_reinstated",
        title: "Account Reinstated",
        message: "Your account suspension has been lifted by administration.",
        action_url: "/dashboard/buyer",
        is_read: false,
      });

      return NextResponse.json({ success: true, message: "User account reinstated." });
    }

    if (action === "verify_seller" || action === "unverify_seller") {
      const verified = action === "verify_seller";

      await primaryClient
        .from("profiles")
        .update({ is_verified_seller: verified })
        .eq("id", targetUserId);

      // Record the decision in the platform audit log. `seller_verifications`
      // is NOT usable here: it requires id_document_front_url and
      // selfie_with_id_url, and no seller-facing document upload flow exists
      // yet, so an INSERT would violate NOT NULL. audit_logs is the audit
      // mechanism this codebase already relies on.
      try {
        await primaryClient.from("audit_logs").insert({
          actor_id: user.id,
          action: verified ? "SELLER_ID_VERIFIED" : "SELLER_ID_VERIFICATION_REVOKED",
          resource_type: "profiles",
          resource_id: targetUserId,
          changes: {
            is_verified_seller: verified,
            reason: reason || null,
            actor_email: user.email || null,
          },
        });
      } catch (logErr: any) {
        // Never block the decision on the audit row, but surface it.
        console.error("seller verification audit write failed:", logErr?.message);
      }

      await primaryClient.from("notifications").insert({
        recipient_id: targetUserId,
        type: verified ? "seller_verified" : "seller_verification_revoked",
        title: verified ? "Seller Identity Verified" : "Seller Verification Removed",
        message: verified
          ? "Your identity check is complete. The ID-Verified badge now appears on your listings and storefront."
          : "Your seller identity verification has been removed by administration.",
        action_url: "/dashboard/seller",
        is_read: false,
      });

      return NextResponse.json({
        success: true,
        message: verified ? "Seller marked as ID-Verified." : "Seller verification removed.",
      });
    }

    return NextResponse.json({ error: "Unhandled action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
