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
  Plus,
  LogOut,
  ChevronDown,
  ShoppingBag,
  Store,
  Wallet,
  Settings,
  ShieldAlert,
  Search,
  ShieldCheck,
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

  const navLinks = [
    { name: "Marketplace", href: "/browse" },
    { name: "Friday Drops", href: "/friday-drops", tag: "8H" },
    { name: "Middleman", href: "/middleman" },
    { name: "Wanted", href: "/wanted" },
    { name: "Tournaments", href: "/tournaments" },
    { name: "Scam Check", href: "/scammer-check" },
    { name: "Guides", href: "/news" },
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
    <header className="sticky top-0 z-50 w-full bg-[#07090D]/95 backdrop-blur-md border-b border-[#1E2636]">
      {/* Primary Storefront Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Left: Brand + Instant Storefront Search (Eldorado / G2G style) */}
          <div className="flex items-center gap-5 flex-1 min-w-0">
            <Logo size="md" />

            <form
              onSubmit={handleHeaderSearch}
              className="hidden md:flex items-center flex-1 max-w-md relative"
            >
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                placeholder="Search squads, Gullit, Vieira, 3150+ OVR..."
                className="w-full h-9 pl-9 pr-16 rounded-lg bg-[#0D1117] border border-[#222B3C] hover:border-[#2E3A50] focus:border-emerald-500 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-2 py-1 rounded bg-[#161D2A] hover:bg-[#1E2738] border border-[#273246] text-[10px] font-mono font-semibold text-slate-300 hover:text-white transition-colors"
              >
                GO
              </button>
            </form>
          </div>

          {/* Right: Till Indicator + Sell CTA + Account */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            <Link
              href="/escrow-guarantee"
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0D1117] border border-[#1E2636] hover:border-emerald-500/40 text-[11px] font-mono text-slate-300 transition-colors"
              title="Safaricom Lipa Na M-Pesa Buyer Protection"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Till 1572931</span>
            </Link>

            {user && <NotificationBell />}

            <Link href="/seller/create-listing">
              <Button variant="primary" size="sm" className="h-9 px-3.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Sell Squad</span>
              </Button>
            </Link>

            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 h-9 pl-2 pr-2.5 rounded-lg bg-[#0D1117] hover:bg-[#131923] border border-[#222B3C] transition-colors"
                >
                  <div className="w-6 h-6 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-[11px]">
                    {profile?.username ? profile.username.slice(0, 2).toUpperCase() : "ME"}
                  </div>
                  <span className="text-xs font-medium text-slate-200 max-w-[96px] truncate">
                    {profile?.username || "Account"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0D1117] border border-[#222B3C] shadow-2xl py-1.5 z-20 text-sm">
                      <div className="px-3.5 py-2.5 border-b border-[#1E2636]">
                        <p className="font-semibold text-white text-xs truncate">
                          {profile?.username || user.email}
                        </p>
                        <p className="text-[11px] text-slate-400 capitalize mt-0.5">
                          {isAdmin ? "Administrator" : `${profile?.role || "Trader"} Account`}
                        </p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/dashboard/buyer"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:bg-[#131923] hover:text-white"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                          <span>My Purchases</span>
                        </Link>

                        <Link
                          href="/dashboard/seller"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:bg-[#131923] hover:text-white"
                        >
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          <span>Seller Dashboard</span>
                        </Link>

                        {isSeller && (
                          <Link
                            href="/seller/earnings"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:bg-[#131923] hover:text-white"
                          >
                            <Wallet className="w-3.5 h-3.5 text-slate-400" />
                            <span>Earnings &amp; Payouts</span>
                          </Link>
                        )}

                        <Link
                          href="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:bg-[#131923] hover:text-white"
                        >
                          <Settings className="w-3.5 h-3.5 text-slate-400" />
                          <span>Account Settings</span>
                        </Link>

                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-amber-400 hover:bg-[#131923]"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Admin Console</span>
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-[#1E2636] pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            signOut();
                          }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs text-rose-400 hover:bg-[#131923]"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="h-9">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary" size="sm" className="h-9">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 md:hidden">
            {user && <NotificationBell />}
            <Link href="/seller/create-listing">
              <Button variant="primary" size="sm" className="h-8 px-2.5 text-xs">
                <Plus className="w-3.5 h-3.5" />
                <span>Sell</span>
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white bg-[#0D1117] border border-[#222B3C]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Storefront Category Rail (Desktop) */}
      <div className="hidden md:block border-t border-[#161C28] bg-[#0A0D13]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-10">
          <nav className="flex items-center gap-1 h-full">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative h-full inline-flex items-center gap-1.5 px-3 text-xs font-medium transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  <span>{link.name}</span>
                  {link.tag && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-[9px] font-mono font-bold text-amber-300">
                      {link.tag}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-emerald-400 rounded-t-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <Link href="/browse?minStrength=3150" className="hover:text-emerald-400 transition-colors font-mono">
              3150+ OVR
            </Link>
            <Link href="/browse?platform=android" className="hover:text-emerald-400 transition-colors">
              Android
            </Link>
            <Link href="/browse?platform=ios" className="hover:text-emerald-400 transition-colors">
              iOS
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Support: 0794 400 365
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0D1117] border-b border-[#1E2636] px-4 pt-3 pb-5 space-y-3">
          <form onSubmit={handleHeaderSearch} className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Search squads, players, OVR..."
              className="w-full h-10 pl-9 pr-16 rounded-lg bg-[#131923] border border-[#222B3C] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-2.5 py-1 rounded bg-emerald-500 text-zinc-950 text-xs font-bold"
            >
              Search
            </button>
          </form>

          <div className="grid grid-cols-2 gap-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium border ${
                    isActive
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                      : "bg-[#131923] border-[#222B3C] text-slate-300"
                  }`}
                >
                  <span>{link.name}</span>
                  {link.tag && (
                    <span className="text-[9px] font-mono font-bold text-amber-300">
                      {link.tag}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#1E2636] space-y-2">
            {user ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/dashboard/buyer" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full">
                      Purchases
                    </Button>
                  </Link>
                  <Link href="/dashboard/seller" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full">
                      Seller Hub
                    </Button>
                  </Link>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Create Account
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
