"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { isSuperAdminEmail } from "@/lib/security/adminAuth";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/brand/Logo";
import { NotificationBell } from "@/components/layout/NotificationBell";
import {
  Menu,
  X,
  LogOut,
  ChevronDown,
  ShoppingBag,
  Store,
  Wallet,
  Settings,
  ShieldAlert,
  Search,
} from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");

  const isSeller = profile?.role === "seller" || profile?.role === "admin";
  const isAdmin = profile?.role === "admin" || isSuperAdminEmail(user?.email);

  const categoryStrip = [
    { name: "All Squads", href: "/browse" },
    { name: "Epic & Booster", href: "/browse?minStrength=3150" },
    { name: "Mobile Android", href: "/browse?platform=android" },
    { name: "Mobile iOS", href: "/browse?platform=ios" },
    { name: "PlayStation & PC", href: "/browse?platform=playstation_5" },
    { name: "Under KES 5,000", href: "/browse?maxPrice=5000" },
    { name: "Friday Drops", href: "/friday-drops" },
    { name: "Middleman Escrow", href: "/middleman" },
    { name: "Tournaments", href: "/tournaments" },
    { name: "Scammer Check", href: "/scammer-check" },
    { name: "Guides & Tactics", href: "/news" },
  ];

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = headerSearch.trim();
    if (q) {
      router.push(`/browse?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/browse");
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#E2E2E0]">
      {/* Row 1: StockX Signature Top Bar — Wordmark + Wide Stone Search Bar + Nav Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 lg:gap-6 h-[68px]">
          {/* Left: Brand Wordmark */}
          <Logo size="md" />

          {/* Center: StockX Signature Wide Neutral Search Bar */}
          <form
            onSubmit={handleHeaderSearch}
            className="hidden md:flex items-center flex-1 max-w-xl relative"
          >
            <Search className="w-4 h-4 text-[#5F5F5F] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Search for squad strength, Gullit, Vieira, PS5, Booster Manager..."
              aria-label="Search marketplace squads"
              className="w-full h-11 pl-10 pr-4 rounded-md bg-[#F4F3F1] border border-transparent hover:border-[#C8C8C4] focus:bg-white focus:border-[#0F0F0F] text-sm text-[#0F0F0F] placeholder:text-[#6B6B6B] focus:outline-none transition-colors"
            />
          </form>

          {/* Right: StockX Editorial Links + Auth + Outlined 'Sell' Pill */}
          <div className="hidden md:flex items-center gap-5 shrink-0">
            <nav className="hidden xl:flex items-center gap-5 text-sm font-medium text-[#0F0F0F]">
              <Link href="/browse" className="hover:text-[#006340] transition-colors">
                Browse
              </Link>
              <Link href="/news" className="hover:text-[#006340] transition-colors">
                News
              </Link>
              <Link href="/about" className="hover:text-[#006340] transition-colors">
                About
              </Link>
              <Link href="/escrow-guarantee" className="hover:text-[#006340] transition-colors">
                Help
              </Link>
            </nav>

            <div className="flex items-center gap-2.5">
              <Link
                href="/seller/create-listing"
                className="inline-flex items-center justify-center h-9 px-4 rounded-full border border-[#0F0F0F] text-xs font-semibold text-[#0F0F0F] hover:bg-[#0F0F0F] hover:text-white transition-colors"
              >
                Sell
              </Link>

              {user ? (
                <>
                  <NotificationBell />
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="flex items-center gap-2 h-9 pl-2 pr-3 rounded-full bg-[#F4F3F1] hover:bg-[#E9E8E4] border border-[#E2E2E0] transition-colors cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#006340] flex items-center justify-center text-white font-mono font-bold text-[11px]">
                        {profile?.username ? profile.username.slice(0, 2).toUpperCase() : "ME"}
                      </div>
                      <span className="text-xs font-semibold text-[#0F0F0F] max-w-[96px] truncate">
                        {profile?.username || "Account"}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#5F5F5F]" />
                    </button>

                    {profileDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setProfileDropdownOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white border border-[#E2E2E0] shadow-xl py-1.5 z-20 text-sm">
                          <div className="px-4 py-2.5 border-b border-[#E2E2E0]">
                            <p className="font-bold text-[#0F0F0F] text-xs truncate">
                              {profile?.username || user.email}
                            </p>
                            <p className="text-[11px] text-[#5F5F5F] capitalize mt-0.5">
                              {isAdmin ? "Administrator" : `${profile?.role || "Verified"} Member`}
                            </p>
                          </div>

                          <div className="py-1">
                            <Link
                              href="/dashboard/buyer"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#0F0F0F] hover:bg-[#F4F3F1]"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 text-[#5F5F5F]" />
                              <span>Buying &amp; Orders</span>
                            </Link>

                            <Link
                              href="/dashboard/seller"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#0F0F0F] hover:bg-[#F4F3F1]"
                            >
                              <Store className="w-3.5 h-3.5 text-[#5F5F5F]" />
                              <span>Selling Portfolio</span>
                            </Link>

                            {isSeller && (
                              <Link
                                href="/seller/earnings"
                                onClick={() => setProfileDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#0F0F0F] hover:bg-[#F4F3F1]"
                              >
                                <Wallet className="w-3.5 h-3.5 text-[#5F5F5F]" />
                                <span>Payouts &amp; Earnings</span>
                              </Link>
                            )}

                            <Link
                              href="/profile"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#0F0F0F] hover:bg-[#F4F3F1]"
                            >
                              <Settings className="w-3.5 h-3.5 text-[#5F5F5F]" />
                              <span>Profile Settings</span>
                            </Link>

                            {isAdmin && (
                              <Link
                                href="/admin"
                                onClick={() => setProfileDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#006340] hover:bg-[#EBF5F0]"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>Admin Console</span>
                              </Link>
                            )}
                          </div>

                          <div className="border-t border-[#E2E2E0] pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setProfileDropdownOpen(false);
                                signOut();
                              }}
                              className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#C92A2A] hover:bg-[#FEE2E2]/50 cursor-pointer"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Log Out</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center h-9 px-3.5 rounded-full border border-[#C8C8C4] text-xs font-semibold text-[#0F0F0F] hover:border-[#0F0F0F] transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-[#0F0F0F] text-xs font-semibold text-white hover:bg-[#262626] transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 md:hidden">
            {user && <NotificationBell />}
            <Link
              href="/seller/create-listing"
              className="inline-flex items-center justify-center h-8 px-3.5 rounded-full border border-[#0F0F0F] text-xs font-semibold text-[#0F0F0F]"
            >
              Sell
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-[#0F0F0F] hover:bg-[#F4F3F1]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: StockX Signature Category Strip */}
      <div className="border-t border-[#E2E2E0] bg-[#F9F9F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Product Categories"
            className="flex items-center gap-6 h-10 overflow-x-auto no-scrollbar"
          >
            {categoryStrip.map((item) => {
              const baseHref = item.href.split("?")[0];
              const isActive =
                item.href === "/browse"
                  ? pathname === "/browse"
                  : baseHref !== "/browse" && pathname?.startsWith(baseHref);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative h-full inline-flex items-center whitespace-nowrap text-[13px] font-medium transition-colors ${
                    isActive
                      ? "text-[#006340] font-semibold"
                      : "text-[#3D3D3D] hover:text-[#0F0F0F]"
                  }`}
                >
                  <span>{item.name}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#006340]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Search & Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#E2E2E0] px-4 pt-3 pb-5 space-y-4 shadow-lg">
          <form onSubmit={handleHeaderSearch} className="relative flex items-center">
            <Search className="w-4 h-4 text-[#5F5F5F] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Search squads, players, OVR..."
              className="w-full h-10 pl-9 pr-20 rounded-md bg-[#F4F3F1] text-xs text-[#0F0F0F] placeholder:text-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#0F0F0F]"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1 rounded bg-[#0F0F0F] text-white text-xs font-semibold"
            >
              Search
            </button>
          </form>

          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "Browse Market", href: "/browse" },
              { name: "Guides & Tactics", href: "/news" },
              { name: "Middleman Escrow", href: "/middleman" },
              { name: "Scammer Check", href: "/scammer-check" },
              { name: "1v1 Tournaments", href: "/tournaments" },
              { name: "Wanted Board", href: "/wanted" },
              { name: "How Escrow Works", href: "/escrow-guarantee" },
              { name: "Contact Support", href: "/contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-md bg-[#F4F3F1] text-xs font-semibold text-[#0F0F0F] hover:bg-[#EAE9E6]"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-[#E2E2E0]">
            {user ? (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/dashboard/buyer" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    My Orders
                  </Button>
                </Link>
                <Link href="/dashboard/seller" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">
                    Selling Hub
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Log In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
