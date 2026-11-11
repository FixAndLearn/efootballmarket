"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, BookOpen, ShieldAlert, Plus } from "lucide-react";
import { isStandaloneDocPath } from "@/components/legal/StandaloneDocLayout";

export function MobileBottomNav() {
  const pathname = usePathname() || "/";

  if (isStandaloneDocPath(pathname)) {
    return null;
  }

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
    {
      label: "Blog",
      href: "/news",
      icon: BookOpen,
      isActive: pathname.startsWith("/news") || pathname.startsWith("/blog"),
    },
    { label: "Check", href: "/scammer-check", icon: ShieldAlert, isActive: pathname.startsWith("/scammer-check") },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-sx-canvas backdrop-blur-md border-t border-sx-border px-2 py-1"
    >
      <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center min-h-[46px] py-1 rounded-lg transition-colors ${
                item.isActive
                  ? "text-sx-green-text font-semibold"
                  : "text-sx-muted hover:text-sx-ink"
              }`}
            >
              {item.highlight ? (
                <div className="w-7 h-7 rounded-full bg-sx-green flex items-center justify-center text-white">
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
