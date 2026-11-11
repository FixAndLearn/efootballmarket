"use client";

import React, { useState, useEffect } from "react";
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
  ExternalLink,
} from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [pathname]);

  const isSeller = profile?.role === "seller" || profile?.role === "admin";
  const isAdmin = profile?.role === "admin" || isSuperAdminEmail(user?.email);

  const categoryStrip = [
    { name: "All Squads", href: "/browse" },
    { name: "Epic Rosters", href: "/browse?minStrength=3150" },
    { name: "Android", href: "/browse?platform=android" },
    { name: "iOS", href: "/browse?platform=ios" },
    { name: "PS5 & PC", href: "/browse?platform=playstation_5" },
    { name: "Blog & Guides", href: "/news" },
    { name: "Friday Drops", href: "/friday-drops" },
    { name: "Middleman", href: "/middleman" },
    { name: "Tournaments", href: "/tournaments" },
    { name: "Scammer Check", href: "/scammer-check" },
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
    <header className="sticky top-0 z-50 w-full bg-sx-canvas border-b border-sx-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-5 lg:gap-8 h-16">
          <Logo size="md" />

          <form
            onSubmit={handleHeaderSearch}
            className="hidden md:flex items-center flex-1 max-w-lg relative"
          >
            <Search className="w-4 h-4 text-sx-muted absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Search squads, Epic players, OVR..."
              aria-label="Search marketplace squads"
              className="w-full h-10 pl-10 pr-4 rounded-full bg-sx-stone border border-sx-border hover:border-sx-border-strong focus:bg-sx-canvas focus:border-sx-ink text-sm text-sx-ink placeholder:text-sx-muted focus:outline-none transition-colors"
            />
          </form>

          <div className="hidden md:flex items-center gap-4 lg:gap-5 shrink-0">
            <nav className="hidden lg:flex items-center gap-5 text-[13px] font-medium text-sx-muted">
              <Link href="/browse" className="text-sx-ink font-semibold hover:text-sx-green-text transition-colors">
                Browse Squads
              </Link>
              <Link href="/escrow-guarantee" className="hover:text-sx-ink transition-colors">
                How Escrow Works
              </Link>
              <Link href="/news" className="hover:text-sx-ink transition-colors">
                Guides
              </Link>
            </nav>

            <div className="flex items-center gap-2.5">
              <Link
                href="/seller/create-listing"
                className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-sx-green hover:bg-sx-green-hover text-xs font-bold text-white transition-colors"
              >
                Sell Your Squad
              </Link>

              {user ? (
                <>
                  <NotificationBell />
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="flex items-center gap-2 h-9 pl-2 pr-3 rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border transition-colors cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-full bg-sx-green flex items-center justify-center text-white font-mono font-bold text-[11px]">
                        {profile?.username ? profile.username.slice(0, 2).toUpperCase() : "ME"}
                      </div>
                      <span className="text-xs font-semibold text-sx-ink max-w-[96px] truncate">
                        {profile?.username || "Account"}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-sx-muted" />
                    </button>

                    {profileDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setProfileDropdownOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-56 rounded-lg bg-sx-canvas border border-sx-border shadow-xl py-1.5 z-20 text-sm">
                          <div className="px-4 py-2.5 border-b border-sx-border">
                            <p className="font-bold text-sx-ink text-xs truncate">
                              {profile?.username || user.email}
                            </p>
                            <p className="text-[11px] text-sx-muted capitalize mt-0.5">
                              {isAdmin ? "Administrator" : `${profile?.role || "Verified"} Member`}
                            </p>
                          </div>

                          <div className="py-1">
                            <Link
                              href="/dashboard/buyer"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-sx-ink hover:bg-sx-stone"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 text-sx-muted" />
                              <span>Buying &amp; Orders</span>
                            </Link>

                            <Link
                              href="/dashboard/seller"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-sx-ink hover:bg-sx-stone"
                            >
                              <Store className="w-3.5 h-3.5 text-sx-muted" />
                              <span>Selling Portfolio</span>
                            </Link>

                            <Link
                              href={`/u/${encodeURIComponent(
                                profile?.username ||
                                  user.user_metadata?.username ||
                                  user.id
                              )}`}
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-sx-ink hover:bg-sx-stone"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-sx-muted" />
                              <span>Public Storefront</span>
                            </Link>

                            {isSeller && (
                              <Link
                                href="/seller/earnings"
                                onClick={() => setProfileDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-sx-ink hover:bg-sx-stone"
                              >
                                <Wallet className="w-3.5 h-3.5 text-sx-muted" />
                                <span>Payouts &amp; Earnings</span>
                              </Link>
                            )}

                            <Link
                              href="/profile"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-sx-ink hover:bg-sx-stone"
                            >
                              <Settings className="w-3.5 h-3.5 text-sx-muted" />
                              <span>Profile Settings</span>
                            </Link>

                            {isAdmin && (
                              <Link
                                href="/admin"
                                onClick={() => setProfileDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-sx-green-text hover:bg-sx-green-tint"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>Admin Console</span>
                              </Link>
                            )}
                          </div>

                          <div className="border-t border-sx-border pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setProfileDropdownOpen(false);
                                signOut();
                              }}
                              className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-sx-red-text hover:bg-sx-red-tint cursor-pointer"
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
                    className="inline-flex items-center justify-center h-9 px-3.5 rounded-full border border-sx-border-strong text-xs font-semibold text-sx-ink hover:border-sx-ink transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-sx-contrast text-xs font-semibold text-sx-contrast-fg hover:bg-sx-contrast-hover transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:hidden shrink-0">
            {user ? (
              <>
                <NotificationBell />
                <Link
                  href="/dashboard/buyer"
                  className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-full bg-sx-stone border border-sx-border text-xs font-semibold text-sx-ink"
                >
                  <span className="w-5 h-5 rounded-full bg-sx-green flex items-center justify-center text-white font-mono font-bold text-[10px]">
                    {profile?.username ? profile.username.slice(0, 2).toUpperCase() : "ME"}
                  </span>
                  <span className="max-w-[68px] truncate">
                    {profile?.username || "Account"}
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center h-9 px-3 rounded-full border border-sx-border-strong text-xs font-semibold text-sx-ink active:bg-sx-stone whitespace-nowrap"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center h-9 px-3 rounded-full bg-sx-green text-xs font-bold text-white active:bg-sx-green-hover whitespace-nowrap"
                >
                  Sign Up
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="w-9 h-9 inline-flex items-center justify-center rounded-md text-sx-ink hover:bg-sx-stone"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="hidden md:block border-t border-sx-border bg-sx-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Product Categories"
            className="flex items-center lg:justify-between gap-6 lg:gap-4 h-10 overflow-x-auto no-scrollbar"
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
                      ? "text-sx-green-text font-semibold"
                      : "text-sx-muted hover:text-sx-ink"
                  }`}
                >
                  <span>{item.name}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-sx-green-text" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-sx-canvas border-t border-sx-border px-4 pt-3 pb-5 space-y-4 shadow-lg">
          <form onSubmit={handleHeaderSearch} className="relative flex items-center">
            <Search className="w-4 h-4 text-sx-muted absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Search squads, players, OVR..."
              className="w-full h-11 pl-9 pr-20 rounded-md bg-sx-stone text-base text-sx-ink placeholder:text-sx-muted focus:outline-none focus:ring-1 focus:ring-sx-ink"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1.5 rounded bg-sx-contrast text-sx-contrast-fg text-xs font-semibold"
            >
              Search
            </button>
          </form>

          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "Browse Market", href: "/browse" },
              { name: "Sell Your Squad", href: "/seller/create-listing" },
              { name: "Blog & Guides", href: "/news" },
              { name: "Middleman Escrow", href: "/middleman" },
              { name: "Scammer Check", href: "/scammer-check" },
              { name: "1v1 Tournaments", href: "/tournaments" },
              { name: "How Escrow Works", href: "/escrow-guarantee" },
              { name: "Contact Support", href: "/contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2.5 rounded-md bg-sx-stone text-xs font-semibold text-sx-ink hover:bg-sx-elevated"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-sx-border">
            {user ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/dashboard/buyer"
                    className="inline-flex items-center justify-center min-h-[42px] px-4 rounded-full border border-sx-border-strong bg-sx-canvas text-sx-ink text-xs font-semibold"
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/dashboard/seller"
                    className="inline-flex items-center justify-center min-h-[42px] px-4 rounded-full bg-sx-contrast text-sx-contrast-fg text-xs font-semibold"
                  >
                    Selling Hub
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/profile"
                    className="inline-flex items-center justify-center min-h-[38px] px-3 rounded-full bg-sx-stone text-sx-ink text-xs font-semibold"
                  >
                    Profile Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3 rounded-full bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-full border border-sx-border-strong bg-sx-canvas text-sx-ink text-xs font-bold active:bg-sx-stone"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-full bg-sx-green text-white text-xs font-bold active:bg-sx-green-hover"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
