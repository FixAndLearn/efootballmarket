import React from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PRIMARY_SUPER_ADMIN_EMAIL } from "@/lib/security/adminAuth";
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

  const isSuperAdminEmail =
    user.email?.trim().toLowerCase() === PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase();

  let hasAdminAccess = isSuperAdminEmail;

  if (!hasAdminAccess) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    hasAdminAccess = role === "admin" || role === "super_admin";
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
