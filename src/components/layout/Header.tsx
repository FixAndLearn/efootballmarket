"use client";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { isUserAdmin } from "@/lib/security/adminAuth";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Crown,
  Handshake,
  Info,
  LogOut,
  Menu,
  MessageCircle,
  Phone,
  Plus,
  PlusCircle,
  ShieldCheck,
  ShoppingCart,
  Target,
  Trophy,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import { NotificationBell } from "@/components/layout/NotificationBell";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const { user, profile, loading, signOut, isAuthenticated, displayName } = useAuth();
  const isAdminUser = isUserAdmin(user?.email, profile?.role);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [moreNavOpen, setMoreNavOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreNavRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (moreNavRef.current && !moreNavRef.current.contains(event.target as Node)) {
        setMoreNavOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/auth");

  const isHighIntentRoute =
    pathname.startsWith("/orders/") ||
    pathname.startsWith("/pay/") ||
    pathname === "/seller/verification" ||
    pathname === "/seller/create-listing";

  if (isAuthRoute) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-[#242A36] bg-[#090B0E]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo clickable={true} size="md" />
          <Link
            href="/"
            className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-[#242A36] hover:border-slate-600 bg-[#11141B] transition-colors"
          >
            Back to Marketplace
          </Link>
        </div>
      </header>
    );
  }

  if (isHighIntentRoute) {
    let contextTitle = "Order Protection";
    let backHref = "/";
    let backLabel = "Back";

    if (pathname.startsWith("/orders/")) {
      contextTitle = "Order Handover (Till 1572931)";
      backHref = "/dashboard/buyer";
      backLabel = "My Orders";
    } else if (pathname.startsWith("/pay/")) {
      contextTitle = "M-Pesa Checkout";
      backHref = "/browse";
      backLabel = "Cancel";
    } else if (pathname === "/seller/create-listing") {
      contextTitle = "New Listing";
      backHref = "/dashboard/seller";
      backLabel = "Seller Hub";
    } else if (pathname === "/seller/verification") {
      contextTitle = "Seller Verification";
      backHref = "/dashboard/seller";
      backLabel = "Seller Hub";
    }

    return (
      <header className="sticky top-0 z-50 w-full border-b border-[#242A36] bg-[#090B0E]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo clickable={true} size="md" />
            <div className="h-4 w-px bg-[#242A36] hidden sm:block" />
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{contextTitle}</span>
            </span>
          </div>
          <Link
            href={backHref}
            className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-[#242A36] hover:border-slate-600 bg-[#11141B] transition-colors"
          >
            {backLabel}
          </Link>
        </div>
      </header>
    );
  }

  const isMoreActive =
    pathname.startsWith("/friday-drops") ||
    pathname.startsWith("/wanted") ||
    pathname.startsWith("/tournaments") ||
    pathname.startsWith("/escrow-guarantee") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/contact");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#242A36] bg-[#090B0E]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Primary Navigation */}
          <div className="flex items-center gap-6 shrink-0">
            <Logo clickable={true} size="md" />

            <nav role="navigation" aria-label="Main Navigation" className="hidden lg:block shrink-0">
              <ul role="menubar" className="flex items-center gap-1 text-sm font-medium">
                <li role="none">
                  <Link
                    href="/browse"
                    role="menuitem"
                    className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                      pathname.startsWith("/browse")
                        ? "text-white bg-[#171B24]"
                        : "text-slate-400 hover:text-white hover:bg-[#141821]"
                    }`}
                  >
                    Browse
                  </Link>
                </li>
                <li role="none">
                  <Link
                    href="/middleman"
                    role="menuitem"
                    className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                      pathname.startsWith("/middleman")
                        ? "text-white bg-[#171B24]"
                        : "text-slate-400 hover:text-white hover:bg-[#141821]"
                    }`}
                  >
                    Middleman
                  </Link>
                </li>
                <li role="none">
                  <Link
                    href="/news"
                    role="menuitem"
                    className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                      pathname.startsWith("/news")
                        ? "text-white bg-[#171B24]"
                        : "text-slate-400 hover:text-white hover:bg-[#141821]"
                    }`}
                  >
                    Guides
                  </Link>
                </li>
                <li role="none">
                  <Link
                    href="/scammer-check"
                    role="menuitem"
                    className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                      pathname.startsWith("/scammer-check")
                        ? "text-white bg-[#171B24]"
                        : "text-slate-400 hover:text-white hover:bg-[#141821]"
                    }`}
                  >
                    Scammer Check
                  </Link>
                </li>

                <li
                  role="none"
                  className="relative"
                  ref={moreNavRef}
                  onMouseEnter={() => setMoreNavOpen(true)}
                  onMouseLeave={() => setMoreNavOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setMoreNavOpen(!moreNavOpen)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                      isMoreActive || moreNavOpen
                        ? "text-white bg-[#171B24]"
                        : "text-slate-400 hover:text-white hover:bg-[#141821]"
                    }`}
                  >
                    <span>More</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-150 ${moreNavOpen ? "rotate-180 text-white" : ""}`} />
                  </button>

                  {moreNavOpen && (
                    <div className="absolute left-0 mt-1.5 w-52 rounded-xl bg-[#11141B] border border-[#242A36] shadow-2xl py-1.5 z-50 text-xs font-medium">
                      <Link
                        href="/escrow-guarantee"
                        onClick={() => setMoreNavOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-[#171B24] transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>How Protection Works</span>
                      </Link>
                      <Link
                        href="/wanted"
                        onClick={() => setMoreNavOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-[#171B24] transition-colors"
                      >
                        <Target className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Wanted Board</span>
                      </Link>
                      <Link
                        href="/tournaments"
                        onClick={() => setMoreNavOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-[#171B24] transition-colors"
                      >
                        <Trophy className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Tournaments</span>
                      </Link>
                      <Link
                        href="/friday-drops"
                        onClick={() => setMoreNavOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-[#171B24] transition-colors"
                      >
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Friday Drops</span>
                      </Link>
                      <div className="my-1 border-t border-[#242A36]" />
                      <Link
                        href="/about"
                        onClick={() => setMoreNavOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-[#171B24] transition-colors"
                      >
                        <Info className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>About Us</span>
                      </Link>
                      <Link
                        href="/contact"
                        onClick={() => setMoreNavOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-[#171B24] transition-colors"
                      >
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Contact Support</span>
                      </Link>
                    </div>
                  )}
                </li>
              </ul>
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/seller/create-listing" className="hidden sm:inline-flex shrink-0">
              <Button variant="primary" size="sm" className="px-3.5">
                <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                <span>Sell Account</span>
              </Button>
            </Link>

            <NotificationBell />

            <div className="h-4 w-px bg-[#242A36] mx-1 hidden sm:block shrink-0" />

            {loading ? (
              <div className="h-8 w-20 bg-[#141821] animate-pulse rounded-lg hidden sm:block shrink-0" />
            ) : isAuthenticated ? (
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 pr-2.5 rounded-lg bg-[#11141B] border border-[#242A36] hover:border-slate-600 transition-colors whitespace-nowrap"
                >
                  <div className="w-6 h-6 rounded-md bg-emerald-500 text-zinc-950 font-bold text-[11px] flex items-center justify-center shrink-0">
                    {getInitials(displayName)}
                  </div>
                  <span className="text-xs font-medium text-slate-200 max-w-[110px] truncate hidden sm:inline-block">
                    {displayName}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-500 hidden sm:block shrink-0" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-[#11141B] border border-[#242A36] shadow-2xl p-1.5 z-50">
                    <div className="px-3 py-2 border-b border-[#242A36]">
                      <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                      {profile?.is_verified_seller && (
                        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified Seller</span>
                        </div>
                      )}
                    </div>

                    <div className="py-1 text-xs">
                      <Link
                        href="/dashboard/buyer"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#171B24] transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4 text-slate-400" />
                        <span>Buyer Orders</span>
                      </Link>
                      <Link
                        href="/dashboard/seller"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#171B24] transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                        <span>Seller Dashboard</span>
                      </Link>
                      <Link
                        href="/seller/create-listing"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#171B24] transition-colors"
                      >
                        <PlusCircle className="w-4 h-4 text-slate-400" />
                        <span>New Listing</span>
                      </Link>
                      {isAdminUser && (
                        <Link
                          href="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 font-medium transition-colors my-0.5"
                        >
                          <Crown className="w-4 h-4 text-amber-400" />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                      <Link
                        href="/seller/verification"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#171B24] transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4 text-slate-400" />
                        <span>Seller Verification</span>
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#171B24] transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Account Settings</span>
                      </Link>
                      <Link
                        href="/invite"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#171B24] transition-colors"
                      >
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>Invite Friends</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-[#242A36]">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-950/30 text-xs font-medium transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary" size="sm">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#171B24] transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-black/75 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {mobileMenuOpen && (
        <div
          style={{ backgroundColor: "#090B0E" }}
          className="lg:hidden absolute top-full inset-x-0 z-50 border-b border-[#242A36] bg-[#090B0E] shadow-2xl px-4 py-4 space-y-3 max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
          {isAuthenticated ? (
            <div className="p-3 rounded-xl bg-[#11141B] border border-[#242A36] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center justify-center shrink-0">
                    {getInitials(displayName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>
                {isAdminUser && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-2 py-1 rounded-md bg-amber-500/15 text-amber-300 text-[11px] font-medium"
                  >
                    Admin
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#242A36]">
                <Link
                  href="/dashboard/buyer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center text-xs py-2 rounded-lg bg-[#171B24] border border-[#283040] text-slate-200 font-medium"
                >
                  Buyer Orders
                </Link>
                <Link
                  href="/dashboard/seller"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center text-xs py-2 rounded-lg bg-[#171B24] border border-[#283040] text-slate-200 font-medium"
                >
                  Seller Hub
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" size="sm" className="w-full">
                  Log in
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="sm" className="w-full">
                  Sign up
                </Button>
              </Link>
            </div>
          )}

          <div className="space-y-0.5 pt-1 border-t border-[#242A36] text-xs font-medium">
            <Link
              href="/middleman"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-[#141821]"
            >
              <Handshake className="w-4 h-4 text-slate-400" />
              <span>Middleman Service</span>
            </Link>
            <Link
              href="/news"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-[#141821]"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Trading Guides &amp; Alerts</span>
            </Link>
            <Link
              href="/tournaments"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-[#141821]"
            >
              <Trophy className="w-4 h-4 text-slate-400" />
              <span>Tournaments</span>
            </Link>
            <Link
              href="/wanted"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-[#141821]"
            >
              <Target className="w-4 h-4 text-slate-400" />
              <span>Wanted Board</span>
            </Link>
            <Link
              href="/friday-drops"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-[#141821]"
            >
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Friday Drops</span>
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-[#141821]"
            >
              <Info className="w-4 h-4 text-slate-400" />
              <span>About eFootballMarket</span>
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-[#141821]"
            >
              <Phone className="w-4 h-4 text-slate-400" />
              <span>Contact Support</span>
            </Link>
          </div>

          <div className="pt-2.5 border-t border-[#242A36] flex items-center justify-between text-xs text-slate-400">
            <a
              href="https://wa.me/254794400365"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-1.5 text-emerald-400 font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp: 0794 400 365</span>
            </a>

            {isAuthenticated && (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-300 hover:text-white"
                >
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-rose-400 hover:text-rose-300 font-medium"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
