"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, BookOpen, ShieldAlert, Plus } from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname() || "/";

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/auth");

  const isHighIntentRoute =
    pathname.startsWith("/pay/") ||
    pathname.startsWith("/orders/") ||
    pathname.startsWith("/listings/") ||
    pathname.startsWith("/tournaments/host") ||
    pathname.startsWith("/tournaments/register") ||
    pathname === "/seller/create-listing" ||
    pathname === "/seller/verification" ||
    pathname === "/profile";

  if (isHighIntentRoute || isAuthRoute) {
    return null;
  }

  const navItems = [
    { label: "Home", href: "/", icon: Home, isActive: pathname === "/" },
    { label: "Browse", href: "/browse", icon: Search, isActive: pathname.startsWith("/browse") },
    { label: "Sell", href: "/seller/create-listing", icon: Plus, highlight: true, isActive: pathname.startsWith("/seller") },
    { label: "Guides", href: "/news", icon: BookOpen, isActive: pathname.startsWith("/news") },
    { label: "Check", href: "/scammer-check", icon: ShieldAlert, isActive: pathname.startsWith("/scammer-check") },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090B0E]/95 backdrop-blur-md border-t border-[#242A36] px-2 py-1"
    >
      <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center min-h-[46px] py-1 rounded-lg transition-colors ${
                item.isActive ? "text-white font-medium" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {item.highlight ? (
                <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center text-zinc-950">
                  <Icon className="w-4 h-4 stroke-[2.5]" />
                </div>
              ) : (
                <Icon className="w-4 h-4 stroke-[2]" />
              )}
              <span className="text-[10px] mt-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
