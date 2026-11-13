"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { isSuperAdminEmail } from "@/lib/security/adminAuth";
import { Logo } from "@/components/brand/Logo";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AppDropdownWidget } from "@/components/app/AppDropdownWidget";
import { SmartSearchBar } from "@/components/marketplace/SmartSearchBar";
import { isStandaloneDocPath } from "@/components/legal/StandaloneDocLayout";
import { useCompareSquads } from "@/lib/compare/compareStore";
import {
  ChevronDown,
  ExternalLink,
  LogOut,
  Menu,
  Scale,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Store,
  Wallet,
  X,
} from "lucide-react";

const CATEGORY_STRIP = [
  { name: "All Squads", href: "/browse", matchParam: null },
  { name: "Epic Rosters", href: "/browse?minStrength=3150", matchParam: ["minStrength", "3150"] },
  { name: "Android", href: "/browse?platform=android", matchParam: ["platform", "android"] },
  { name: "iOS", href: "/browse?platform=ios", matchParam: ["platform", "ios"] },
  { name: "PS5 & PC", href: "/browse?platform=playstation_5", matchParam: ["platform", "playstation_5"] },
  { name: "Blog & Guides", href: "/news", matchParam: null },
  { name: "Friday Drops", href: "/friday-drops", matchParam: null },
  { name: "Middleman", href: "/middleman", matchParam: null },
  { name: "Tournaments", href: "/tournaments", matchParam: null },
  { name: "Scammer Check", href: "/scammer-check", matchParam: null },
] as const;

function CategoryStripLinks({ pathname }: { pathname: string | null }) {
  const searchParams = useSearchParams();
  const activePlatform = searchParams.get("platform");
  const activeStrength = searchParams.get("minStrength");

  return (
    <>
      {CATEGORY_STRIP.map((item) => {
        const baseHref = item.href.split("?")[0];
        let isActive = false;

        if (item.href === "/browse") {
          isActive =
            pathname === "/browse" &&
            !activePlatform &&
            activeStrength !== "3150";
        } else if (item.matchParam) {
          const [key, val] = item.matchParam;
          isActive =
            pathname === "/browse" && searchParams.get(key) === val;
        } else {
          isActive = Boolean(pathname?.startsWith(baseHref));
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
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
    </>
  );
}

function CategoryStripFallback({ pathname }: { pathname: string | null }) {
  return (
    <>
      {CATEGORY_STRIP.map((item) => {
        const baseHref = item.href.split("?")[0];
        const isActive =
          item.href === "/browse"
            ? pathname === "/browse"
            : baseHref !== "/browse" && Boolean(pathname?.startsWith(baseHref));
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
    </>
  );
}

export function Header() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const { count: compareCount } = useCompareSquads();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [pathname]);

  if (isStandaloneDocPath(pathname) || pathname?.startsWith("/mobile")) {
    return null;
  }

  const isSeller = profile?.role === "seller" || profile?.role === "admin";
  const isAdmin = profile?.role === "admin" || isSuperAdminEmail(user?.email);

  return (
    <header className="sticky top-0 z-50 w-full max-w-full bg-sx-canvas/95 backdrop-blur-md border-b border-sx-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-6 h-14 sm:h-16 min-w-0">
          <div className="min-w-0 shrink">
            <div className="sm:hidden">
              <Logo size="sm" />
            </div>
            <div className="hidden sm:block">
              <Logo size="md" />
            </div>
          </div>

          <div className="hidden lg:block flex-1 max-w-md xl:max-w-lg min-w-0">
            <SmartSearchBar variant="header" />
          </div>

          <div className="hidden lg:flex items-center gap-3 xl:gap-5 shrink-0">
            <nav
              aria-label="Primary"
              className="hidden xl:flex items-center gap-5 text-[13px] font-medium text-sx-muted"
            >
              <Link
                href="/browse"
                className="text-sx-ink font-semibold hover:text-sx-green-text transition-colors"
              >
                Browse Squads
              </Link>
              <Link
                href="/escrow-guarantee"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-sx-ink transition-colors"
              >
                How Escrow Works &nearr;
              </Link>
              <Link href="/news" className="hover:text-sx-ink transition-colors">
                Guides
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              {compareCount > 0 && (
                <Link
                  href="/compare"
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-sx-green-tint border border-sx-green-border text-xs font-bold text-sx-green-text transition-colors"
                  title="Compare selected squads side by side"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Compare ({compareCount})</span>
                </Link>
              )}

              <ThemeToggle />
              <AppDropdownWidget viewportMode="desktop" />

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
                      aria-expanded={profileDropdownOpen}
                      aria-haspopup="menu"
                      className="flex items-center gap-2 h-9 pl-2 pr-3 rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border transition-colors cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-full bg-sx-green flex items-center justify-center text-white font-mono font-bold text-[11px]">
                        {profile?.username
                          ? profile.username.slice(0, 2).toUpperCase()
                          : "ME"}
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
                        <div
                          role="menu"
                          className="absolute right-0 mt-2 w-56 rounded-xl bg-sx-canvas border border-sx-border shadow-xl py-1.5 z-20 text-sm"
                        >
                          <div className="px-4 py-2.5 border-b border-sx-border">
                            <p className="font-bold text-sx-ink text-xs truncate">
                              {profile?.username || user.email}
                            </p>
                            <p className="text-[11px] text-sx-muted capitalize mt-0.5">
                              {isAdmin
                                ? "Administrator"
                                : `${profile?.role || "Verified"} Member`}
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

          {/* Mobile & Tablet (< lg) Top Right Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 lg:hidden shrink-0">
            <div className="hidden sm:block">
              <ThemeToggle compact />
            </div>
            <AppDropdownWidget viewportMode="mobile" />
            {user ? (
              <>
                <NotificationBell />
                <Link
                  href="/dashboard/buyer"
                  aria-label="Open Buyer Account Dashboard"
                  className="hidden min-[390px]:inline-flex items-center justify-center gap-1.5 w-8 h-8 sm:w-auto sm:h-9 sm:px-2.5 rounded-full bg-sx-stone border border-sx-border text-xs font-semibold text-sx-ink shrink-0"
                >
                  <span className="w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-sx-green flex items-center justify-center text-white font-mono font-bold text-[10px] shrink-0">
                    {profile?.username
                      ? profile.username.slice(0, 2).toUpperCase()
                      : "ME"}
                  </span>
                  <span className="hidden sm:inline max-w-[84px] truncate">
                    {profile?.username || "Account"}
                  </span>
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-8 sm:h-9 px-2.5 sm:px-3 rounded-full border border-sx-border-strong text-xs font-semibold text-sx-ink active:bg-sx-stone whitespace-nowrap"
              >
                Log In
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="w-8 h-8 sm:w-9 sm:h-9 inline-flex items-center justify-center rounded-md text-sx-ink hover:bg-sx-stone shrink-0"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Category Strip with Accurate Active Route/Param Highlight */}
      <div className="hidden md:block border-t border-sx-border bg-sx-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Product Categories"
            className="flex items-center lg:justify-between gap-6 lg:gap-4 h-10 overflow-x-auto no-scrollbar"
          >
            <Suspense fallback={<CategoryStripFallback pathname={pathname} />}>
              <CategoryStripLinks pathname={pathname} />
            </Suspense>
          </nav>
        </div>
      </div>

      {/* Mobile & Tablet (< lg) Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-sx-canvas border-t border-sx-border px-4 pt-3 pb-5 space-y-3.5 shadow-lg">
          {/* Account & Theme Bar at Top of Mobile Drawer */}
          <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-sx-subtle border border-sx-border">
            {user ? (
              <Link
                href="/dashboard/buyer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 min-w-0"
              >
                <span className="w-7 h-7 rounded-full bg-sx-green flex items-center justify-center text-white font-mono font-bold text-[11px] shrink-0">
                  {profile?.username
                    ? profile.username.slice(0, 2).toUpperCase()
                    : "ME"}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-sx-ink truncate">
                    {profile?.username || user.email}
                  </p>
                  <p className="text-[10.5px] text-sx-muted capitalize truncate">
                    {isAdmin ? "Administrator" : "Verified Member · Tap for Orders"}
                  </p>
                </div>
              </Link>
            ) : (
              <span className="text-xs font-semibold text-sx-ink-soft">
                Display Theme
              </span>
            )}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-sx-muted sm:hidden">Theme</span>
              <ThemeToggle compact />
            </div>
          </div>

          <SmartSearchBar
            variant="mobile"
            onNavigate={() => setMobileMenuOpen(false)}
          />

          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "Browse Market", href: "/browse", newTab: false },
              { name: "Sell Your Squad", href: "/seller/create-listing", newTab: false },
              { name: "Blog & Guides", href: "/news", newTab: false },
              { name: "Middleman Escrow", href: "/middleman", newTab: false },
              { name: "Scammer Check", href: "/scammer-check", newTab: false },
              { name: "1v1 Tournaments", href: "/tournaments", newTab: false },
              { name: "Buyer Wanted Board", href: "/wanted", newTab: false },
              { name: "Friday Drops", href: "/friday-drops", newTab: false },
              { name: "Download App (APK)", href: "/app", newTab: false },
              { name: "How Escrow Works ↗", href: "/escrow-guarantee", newTab: true },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target={link.newTab ? "_blank" : undefined}
                rel={link.newTab ? "noopener noreferrer" : undefined}
                onClick={() => setMobileMenuOpen(false)}
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
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex items-center justify-center min-h-[42px] px-4 rounded-full border border-sx-border-strong bg-sx-canvas text-sx-ink text-xs font-semibold"
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/dashboard/seller"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex items-center justify-center min-h-[42px] px-4 rounded-full bg-sx-contrast text-sx-contrast-fg text-xs font-semibold"
                  >
                    Selling Hub
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
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
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-full border border-sx-border-strong bg-sx-canvas text-sx-ink text-xs font-bold active:bg-sx-stone"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
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
