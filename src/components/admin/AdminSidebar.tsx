"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Layers,
  AlertTriangle,
  Banknote,
  Users,
  Newspaper,
  Send,
  Crown,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AdminSidebarProps {
  userEmail: string;
}

export function AdminSidebar({ userEmail }: AdminSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab") || "listings";
  const activeTab = rawTab === "whatsapp" ? "telegram" : rawTab;

  // Real-time badge counts
  const [counts, setCounts] = useState({
    pendingWithdrawals: 0,
    openDisputes: 0,
    totalListings: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    const supabase = createClient();

    async function fetchBadgeCounts() {
      try {
        const [
          { count: disputesCount },
          { count: withdrawalsCount },
          { count: listingsCount },
          { count: usersCount },
        ] = await Promise.all([
          supabase.from("disputes").select("*", { count: "exact", head: true }).eq("status", "open"),
          supabase.from("seller_withdrawals").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("listings").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
        ]);

        setCounts({
          openDisputes: disputesCount || 0,
          pendingWithdrawals: withdrawalsCount || 0,
          totalListings: listingsCount || 0,
          totalUsers: usersCount || 0,
        });
      } catch (err) {
        // non-blocking
      }
    }

    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 12000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      id: "listings",
      label: "Squad Listings",
      icon: Layers,
      href: "/admin?tab=listings",
      badge: counts.totalListings > 0 ? `${counts.totalListings}` : null,
      badgeColor: "bg-sx-green-tint text-sx-green-text border-sx-green-border",
    },
    {
      id: "disputes",
      label: "Escrow Disputes",
      icon: AlertTriangle,
      href: "/admin?tab=disputes",
      badge: counts.openDisputes > 0 ? `${counts.openDisputes} open` : null,
      badgeColor: "bg-sx-red-tint text-sx-red-text border-sx-red-border animate-pulse",
    },
    {
      id: "withdrawals",
      label: "M-Pesa Payouts",
      icon: Banknote,
      href: "/admin?tab=withdrawals",
      badge: counts.pendingWithdrawals > 0 ? `${counts.pendingWithdrawals} pending` : null,
      badgeColor: "bg-sx-amber-tint text-sx-amber-text border-sx-amber-border animate-pulse",
    },
    {
      id: "users",
      label: "User Directory",
      icon: Users,
      href: "/admin?tab=users",
      badge: counts.totalUsers > 0 ? `${counts.totalUsers}` : null,
      badgeColor: "bg-sx-stone text-sx-ink-soft border-sx-border-strong",
    },
    {
      id: "news",
      label: "Market Bulletins",
      icon: Newspaper,
      href: "/admin?tab=news",
      badge: null,
      badgeColor: "",
    },
    {
      id: "telegram",
      label: "Telegram Deals Feed",
      icon: Send,
      href: "/admin?tab=telegram",
      badge: null,
      badgeColor: "",
    },
  ];

  const handleNavClick = (tabId: string) => {
    router.push(`/admin?tab=${tabId}`, { scroll: false });
  };

  return (
    <aside className="w-full lg:w-64 bg-sx-stone border-r border-sx-border flex flex-col shrink-0">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-sx-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 font-black">
            <Crown className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-black text-sm tracking-tight text-sx-ink block">
              eFootball Admin
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
              <span className="text-[10px] text-sx-green-text font-mono font-bold tracking-wider">
                RBAC ENFORCED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-sx-muted">
          OPERATIONS &amp; SECURITY
        </div>

        {/* Mobile: Horizontal scrollable pill row */}
        <div className="flex lg:hidden overflow-x-auto gap-1.5 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#11213D] border-emerald-500/70 text-sx-green-text shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/40"
                    : "bg-sx-canvas border-transparent text-sx-muted hover:text-sx-ink"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-sx-green-text" : "text-sx-muted"}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${item.badgeColor || "bg-sx-stone text-sx-ink-soft border-sx-border-strong"}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop: Full interactive sidebar list */}
        <div className="hidden lg:block space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border text-left cursor-pointer ${
                  isSelected
                    ? "bg-[#11213D] border-emerald-500/60 text-sx-ink shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/40"
                    : "border-transparent text-sx-ink-soft hover:text-sx-ink hover:bg-[#11213D]/70 hover:border-sx-border"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-sx-green-tint text-sx-green-text border border-sx-green-border"
                        : "bg-sx-stone text-sx-muted"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`truncate ${isSelected ? "font-bold text-sx-ink" : "font-medium"}`}>
                    {item.label}
                  </span>
                </div>

                {item.badge ? (
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider border shrink-0 ${
                      item.badgeColor || "bg-sx-stone text-sx-ink-soft border-sx-border-strong"
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : isSelected ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981] shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Administrator Status & Return to Site */}
      <div className="p-4 border-t border-sx-border space-y-2.5 bg-sx-canvas">
        <div className="flex items-center gap-2 text-xs text-sx-muted">
          <ShieldCheck className="w-4 h-4 text-sx-green-text shrink-0" />
          <span className="truncate font-mono text-[11px] text-sx-ink-soft">{userEmail}</span>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-sx-muted hover:text-sx-green-text pt-1 transition-colors font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Marketplace</span>
        </Link>
      </div>
    </aside>
  );
}
