import React from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSuperAdminEmail } from "@/lib/security/adminAuth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const metadata = {
  title: "Admin Console | eFootballMarket Kenya",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  const isSuperAdmin = isSuperAdminEmail(user.email);

  let hasAdminAccess = isSuperAdmin;

  if (!hasAdminAccess) {
    // Own row via SECURITY DEFINER RPC. role/is_suspended are still in the
    // safe grant set, but routing the gate through the RPC keeps it working
    // regardless of future column-grant changes.
    const { data: rpcRow } = await supabase.rpc("get_my_profile");
    const profile = (Array.isArray(rpcRow) ? rpcRow[0] : rpcRow) as
      | { role?: string | null; is_suspended?: boolean | null }
      | null;

    const role = profile?.role;
    hasAdminAccess =
      !profile?.is_suspended && (role === "admin" || role === "super_admin");
  }

  if (!hasAdminAccess) {
    redirect("/?error=unauthorized_admin_access");
  }

  return (
    <div className="min-h-screen bg-sx-canvas text-sx-ink flex flex-col lg:flex-row">
      <AdminSidebar userEmail={user.email!} />
      <main className="flex-1 min-w-0 bg-sx-subtle p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto space-y-6">{children}</div>
      </main>
    </div>
  );
}
