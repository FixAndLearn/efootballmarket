"use client";

import { Button } from "@/components/ui/Button";
import { AdminBloggerStudio } from "@/components/admin/AdminBloggerStudio";
import { AdminPaymentsAndMiddlemanTab } from "@/components/admin/AdminPaymentsAndMiddlemanTab";
import { AdminAvailabilityPingsPanel } from "@/components/admin/AdminAvailabilityPingsPanel";
import { useAuth } from "@/hooks/useAuth";
import { isSuperAdminEmail, isUserAdmin } from "@/lib/security/adminAuth";
import { formatCurrency } from "@/lib/utils";
import { formatDisplayPhone, formatWhatsAppPhone } from "@/lib/utils/phone";
import { Listing, NewsArticle, NewsCategory } from "@/types/database";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Banknote,
  Bell,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Crown,
  Eye,
  FileText,
  KeyRound,
  Layers,
  Lock,
  Megaphone,
  MessageCircle,
  Newspaper,
  PlusCircle,
  RefreshCw,
  Scale,
  Search,
  Send,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Trophy,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";

function AdminControlCenterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"listings" | "disputes" | "users" | "news" | "withdrawals" | "payments">(
    ["listings", "disputes", "users", "withdrawals", "news", "payments"].includes(tabParam || "")
      ? (tabParam as any)
      : "listings"
  );

  // Synchronize active tab whenever URL ?tab= updates from sidebar clicks
  useEffect(() => {
    if (tabParam && ["listings", "disputes", "users", "withdrawals", "news", "payments"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  const switchTab = (tab: "listings" | "disputes" | "users" | "news" | "withdrawals" | "payments") => {
    setActiveTab(tab);
    router.push(`/admin?tab=${tab}`, { scroll: false });
  };

  // Data states
  const [listings, setListings] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Dispute Arbitration State
  const [disputeFilter, setDisputeFilter] = useState<"all" | "open" | "resolved">("open");
  const [resolvingDisputeId, setResolvingDisputeId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [adminZoomImage, setAdminZoomImage] = useState<string | null>(null);

  // Search filters
  const [listingSearch, setListingSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [withdrawalSearch, setWithdrawalSearch] = useState("");
  const [withdrawalFilter, setWithdrawalFilter] = useState<"all" | "pending" | "completed" | "rejected">("pending");
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Post News Form state
  const [newsTitle, setNewsTitle] = useState("");
  const [newsCategory, setNewsCategory] = useState<NewsCategory>("scammer_alert");
  const [newsSummary, setNewsSummary] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsCoverImage, setNewsCoverImage] = useState("");
  const [broadcastNotif, setBroadcastNotif] = useState(true);

  // Modal for Takedown Reason
  const [takedownTarget, setTakedownTarget] = useState<any | null>(null);
  const [takedownReason, setTakedownReason] = useState("");

  // Modal for Withdrawal Rejection
  const [rejectModalTarget, setRejectModalTarget] = useState<any | null>(null);
  const [rejectModalReason, setRejectModalReason] = useState("");

  const isSuperAdmin = isSuperAdminEmail(user?.email);
  const isAdmin = isUserAdmin(user?.email, profile?.role);

  // Auth gate check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/admin");
    }
  }, [authLoading, isAuthenticated, router]);

  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setFeedback(null);

    try {
      // 1. Load Listings
      const listingsRes = await fetch("/api/admin/listings");
      if (listingsRes.ok) {
        const data = await listingsRes.json();
        setListings(data.listings || []);
      }

      // 2. Load Users
      const usersRes = await fetch("/api/admin/users");
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      // 3. Load News Articles
      const newsRes = await fetch("/api/news");
      if (newsRes.ok) {
        const data = await newsRes.json();
        setArticles(data.articles || []);
      }

      // 4. Load Withdrawals
      const withdrawalsRes = await fetch("/api/admin/withdrawals");
      if (withdrawalsRes.ok) {
        const data = await withdrawalsRes.json();
        setWithdrawals(data.withdrawals || []);
      } else {
        const err = await withdrawalsRes.json().catch(() => ({}));
        console.warn("Withdrawals fetch note:", err);
      }

      // 5. Load Disputes
      const disputesRes = await fetch("/api/admin/disputes");
      if (disputesRes.ok) {
        const data = await disputesRes.json();
        setDisputes(data.disputes || []);
      }
    } catch (err: any) {
      console.warn("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const reloadWithdrawals = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/withdrawals");
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch {
      // non-blocking
    }
  }, []);

  // Realtime withdrawal updates & polling
  useEffect(() => {
    if (!isAdmin) return;

    // Fast 6s background poll when viewing withdrawals
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        reloadWithdrawals();
      }
    }, 6000);

    // Supabase Realtime WebSocket listener for instant push
    let supabaseClient: any = null;
    let channel: any = null;

    try {
      import("@/lib/supabase/client").then(({ createClient }) => {
        supabaseClient = createClient();
        channel = supabaseClient
          .channel(`admin:seller_withdrawals:${Math.random().toString(36).slice(2, 6)}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "seller_withdrawals",
            },
            () => {
              reloadWithdrawals();
            }
          )
          .subscribe();
      });
    } catch {
      // non-blocking
    }

    return () => {
      clearInterval(interval);
      if (channel && supabaseClient) {
        supabaseClient.removeChannel(channel).catch(() => {});
      }
    };
  }, [isAdmin, reloadWithdrawals]);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, loadAdminData]);

  const handleModerateListing = async (listingId: string, action: "take_down" | "reinstate", reason?: string) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, action, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to moderate listing");

      setFeedback({ type: "success", message: data.message || "Listing updated." });
      setTakedownTarget(null);
      setTakedownReason("");
      loadAdminData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle User Privilege / Ban Actions
  const handleUserAction = async (targetUserId: string, action: "grant_admin" | "dismiss_admin" | "ban_user" | "unban_user") => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to execute action");

      setFeedback({ type: "success", message: data.message });
      loadAdminData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Create News
  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newsTitle,
          category: newsCategory,
          summary: newsSummary,
          content: newsContent,
          cover_image_url: newsCoverImage || undefined,
          broadcastNotification: broadcastNotif,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish news bulletin");

      setFeedback({
        type: "success",
        message: "Bulletin published successfully and alerts broadcasted!",
      });

      // Reset form
      setNewsTitle("");
      setNewsSummary("");
      setNewsContent("");
      setNewsCoverImage("");
      loadAdminData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete News
  const handleDeleteNews = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bulletin?")) return;
    try {
      const res = await fetch(`/api/news?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setFeedback({ type: "success", message: "Article removed." });
        loadAdminData();
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  // Handle Withdrawal Approval / Rejection
  const handleWithdrawalAction = async (
    withdrawalId: string,
    status: "completed" | "rejected",
    failureReason?: string
  ) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId, status, failureReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update withdrawal status");

      setFeedback({
        type: "success",
        message: data.message || `Withdrawal marked as ${status}.`,
      });
      setRejectModalTarget(null);
      setRejectModalReason("");
      loadAdminData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleResolveDispute = async (
    disputeId: string,
    orderId: string,
    action: "release_to_seller" | "refund_buyer" | "dismiss",
    notes: string
  ) => {
    if (!notes || notes.trim().length < 3) {
      alert("Please provide arbitration rationale notes before submitting a ruling.");
      return;
    }
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/disputes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disputeId, orderId, action, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to arbitrate dispute");
      setFeedback({ type: "success", message: data.message || "Dispute ruling executed successfully!" });
      setResolvingDisputeId(null);
      setResolutionNotes("");
      loadAdminData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Arbitration error" });
    } finally {
      setActionLoading(false);
    }
  };


  if (authLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand-400 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-sx-muted">Verifying administrative credentials...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-3xl bg-pitch-surface border border-sx-red-border text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-sx-red-tint border border-sx-red-border flex items-center justify-center text-sx-red-text mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-sx-ink">Administrative Access Restricted</h2>
        <p className="text-xs text-sx-muted leading-relaxed">
          This portal is reserved strictly for verified eFootballMarket Kenya administrators and escrow moderators.
        </p>
        <Link href="/">
          <Button variant="secondary" size="sm" className="w-full mt-2">
            Return to Marketplace Home
          </Button>
        </Link>
      </div>
    );
  }

  const filteredListings = listings.filter((l) => {
    if (!listingSearch.trim()) return true;
    const q = listingSearch.toLowerCase();
    return (
      l.title?.toLowerCase().includes(q) ||
      l.seller?.username?.toLowerCase().includes(q) ||
      l.platform?.toLowerCase().includes(q)
    );
  });

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone_number?.toLowerCase().includes(q)
    );
  });

  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");
  const pendingWithdrawalsCount = pendingWithdrawals.length;
  const pendingWithdrawalsSum = pendingWithdrawals.reduce(
    (sum, w) => sum + Number(w.amount || 0),
    0
  );

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (withdrawalFilter !== "all" && w.status !== withdrawalFilter) {
      return false;
    }
    if (!withdrawalSearch.trim()) return true;
    const q = withdrawalSearch.toLowerCase();
    return (
      w.phone_number?.toLowerCase().includes(q) ||
      w.seller?.username?.toLowerCase().includes(q) ||
      w.seller?.email?.toLowerCase().includes(q) ||
      String(w.amount).includes(q)
    );
  });

  const openDisputesCount = disputes.filter((d) => d.status === "open").length;
  const filteredDisputes = disputes.filter((d) => {
    if (disputeFilter === "open") return d.status === "open";
    if (disputeFilter === "resolved") return d.status !== "open";
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Super Admin Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-pitch-border/80 pb-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sx-amber-tint border border-sx-amber-border text-sx-amber-text text-xs font-bold mb-2">
            <Crown className="w-3.5 h-3.5 text-sx-amber-text" />
            <span>
              {isSuperAdmin
                ? "Primary Super Administrator Active"
                : "Platform Administrator Active"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-sx-ink font-display">
            Admin Console
          </h1>
          <p className="text-xs text-sx-muted mt-1">
            Signed in as: <strong className="text-sx-ink-soft">{user?.email || "Platform Administrator"}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadAdminData}
            disabled={loading}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
          <Link href="/seller/create-listing">
            <button
              type="button"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-yellow-500 hover:bg-yellow-400 text-slate-900 transition-colors shadow-md active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              Direct Post
            </button>
          </Link>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in mb-8 ${
            feedback.type === "success"
              ? "bg-sx-green-tint border-sx-green-border text-sx-green-text"
              : "bg-sx-red-tint border-sx-red-border text-sx-red-text"
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-sx-green-text shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-sx-red-text shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-sx-muted hover:text-sx-ink"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Key Metric Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <button
          type="button"
          onClick={() => switchTab("users")}
          className="text-left p-6 rounded-2xl bg-pitch-surface border border-pitch-border space-y-2 shadow-sm hover:border-cyan-500/50 hover:bg-pitch-surface/80 transition-all cursor-pointer group"
        >
          <span className="text-xs font-semibold text-sx-muted uppercase tracking-wider block group-hover:text-sx-ink-soft transition-colors">
            TOTAL ACCOUNTS
          </span>
          <p className="text-3xl font-black text-sx-ink font-display">{users.length}</p>
          <span className="text-xs text-sx-muted block font-mono">
            Registered platform members
          </span>
        </button>

        <button
          type="button"
          onClick={() => switchTab("listings")}
          className="text-left p-6 rounded-2xl bg-pitch-surface border border-pitch-border space-y-2 shadow-sm hover:border-cyan-500/50 hover:bg-pitch-surface/80 transition-all cursor-pointer group"
        >
          <span className="text-xs font-semibold text-sx-muted uppercase tracking-wider block group-hover:text-sx-ink-soft transition-colors">
            TOTAL LISTINGS
          </span>
          <p className="text-3xl font-black text-sx-ink font-display">{listings.length}</p>
          <span className="text-xs text-sx-green-text block font-mono">
            Active in catalog
          </span>
        </button>

        <button
          type="button"
          onClick={() => switchTab("disputes")}
          className="text-left p-6 rounded-2xl bg-pitch-surface border border-pitch-border space-y-2 shadow-sm hover:border-sx-red-border hover:bg-pitch-surface/80 transition-all cursor-pointer group"
        >
          <span className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true"></span>
              <span>ESCROW DISPUTES</span>
            </span>
            {openDisputesCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
            )}
          </span>
          <p className="text-3xl font-black text-sx-ink font-display">{openDisputesCount}</p>
          <span className="text-xs text-sx-muted block font-mono">
            {disputes.length} total cases
          </span>
        </button>

        <button
          type="button"
          onClick={() => switchTab("withdrawals")}
          className="text-left p-6 rounded-2xl bg-pitch-surface border border-pitch-border space-y-2 shadow-sm hover:border-sx-amber-border hover:bg-pitch-surface/80 transition-all cursor-pointer group"
        >
          <span className="text-xs font-semibold text-sx-amber-text uppercase tracking-wider flex items-center justify-between">
            <span>PENDING PAYOUTS</span>
            {pendingWithdrawalsCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </span>
          <p className="text-3xl font-black text-sx-ink font-display">
            {pendingWithdrawalsCount}
          </p>
          <span className="text-xs text-sx-muted block font-mono">
            {formatCurrency(pendingWithdrawalsSum)} queued
          </span>
        </button>

        <button
          type="button"
          onClick={() => switchTab("users")}
          className="text-left p-6 rounded-2xl bg-pitch-surface border border-pitch-border space-y-2 shadow-sm hover:border-sx-red-border hover:bg-pitch-surface/80 transition-all cursor-pointer group"
        >
          <span className="text-xs font-semibold text-sx-muted uppercase tracking-wider block group-hover:text-sx-ink-soft transition-colors">
            ACTIVE BANS
          </span>
          <p className="text-3xl font-black text-sx-ink font-display">
            {users.filter((u) => u.is_suspended).length}
          </p>
          <span className="text-xs text-sx-muted block font-mono">
            Suspended user accounts
          </span>
        </button>

        <button
          type="button"
          onClick={() => switchTab("news")}
          className="text-left p-6 rounded-2xl bg-pitch-surface border border-pitch-border space-y-2 shadow-sm hover:border-cyan-500/50 hover:bg-pitch-surface/80 transition-all cursor-pointer group"
        >
          <span className="text-xs font-semibold text-sx-muted uppercase tracking-wider block group-hover:text-sx-ink-soft transition-colors">
            NEWS &amp; ALERTS
          </span>
          <p className="text-3xl font-black text-sx-ink font-display">{articles.length}</p>
          <span className="text-xs text-sx-muted block font-mono">
            Community broadcasts
          </span>
        </button>
      </div>

      {/* SECTION 1: SQUAD LISTINGS */}
      {activeTab === "listings" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pitch-border/80 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Squad Inventory Moderation</span>
              </div>
              <h2 className="text-2xl font-bold text-sx-ink font-display flex items-center gap-2.5">
                <span>Squad Listings</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                  {filteredListings.length} Active
                </span>
              </h2>
              <p className="text-xs text-sx-muted mt-0.5">
                Moderate active squad listings and enforce Clean Konami ID marketplace rules.
              </p>
            </div>
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-sx-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={listingSearch}
                onChange={(e) => setListingSearch(e.target.value)}
                placeholder="Search listing or seller..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-pitch-surface border border-pitch-border text-xs text-sx-ink-soft placeholder:text-sx-muted focus:outline-none focus:border-cyan-400 shadow-sm"
              />
            </div>
          </div>

          <AdminAvailabilityPingsPanel />

          <div className="bg-pitch-surface border border-pitch-border rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-pitch-card border-b border-pitch-border text-sx-muted text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Listing Title</th>
                    <th className="p-3.5">Seller</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Platform & OVR</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pitch-border/60">
                  {filteredListings.length > 0 ? (
                    filteredListings.map((l) => (
                      <tr key={l.id} className="hover:bg-pitch-card/40 transition-colors">
                        <td className="p-3.5">
                          <Link
                            href={`/listings/${l.id}`}
                            className="font-bold text-sx-ink hover:text-sx-amber-text transition-colors block max-w-xs truncate"
                          >
                            {l.title}
                          </Link>
                          <span className="text-[10px] text-sx-muted">ID: {l.id.slice(0, 8)}...</span>
                        </td>
                        <td className="p-3.5 text-sx-ink-soft">
                          <span className="font-semibold block">@{l.seller?.username || "Unknown"}</span>
                          {l.seller?.phone_number && (
                            <span className="block text-[10px] font-mono text-sx-muted">
                              {formatDisplayPhone(l.seller.phone_number)}
                            </span>
                          )}
                          {l.seller?.is_suspended && (
                            <span className="block text-[10px] text-sx-red-text font-bold">Banned Seller</span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold text-sx-green-text">
                          {formatCurrency(l.price, l.currency || "KES")}
                        </td>
                        <td className="p-3.5 text-sx-muted">
                          <span>{l.platform}</span> <span className="text-sx-muted">/</span> <span>OVR {l.overall_team_strength}</span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              l.status === "published" || l.status === "active"
                                ? "bg-sx-green-tint text-sx-green-text border border-sx-green-border"
                                : l.status === "in_escrow"
                                ? "bg-sx-amber-tint text-sx-amber-text border border-sx-amber-border"
                                : l.status === "sold"
                                ? "bg-sx-info-tint text-sx-info-text border border-sx-info-border"
                                : l.status === "suspended" || l.status === "archived"
                                ? "bg-sx-red-tint text-sx-red-text border border-sx-red-border"
                                : "bg-sx-stone text-sx-muted"
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {l.seller?.phone_number && (
                              <a
                                href={`https://wa.me/${formatWhatsAppPhone(
                                  l.seller.phone_number
                                )}?text=${encodeURIComponent(
                                  `Hello @${
                                    l.seller.username || "Trader"
                                  }, this is eFootballMarket Admin regarding your listed squad "${
                                    l.title
                                  }" (${formatCurrency(l.price, l.currency || "KES")}).`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Reach seller on WhatsApp directly"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366]/15 border border-[#25D366]/40 text-sx-green-text hover:bg-[#25D366]/25 text-[11px] font-bold transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                            {l.status === "published" || l.status === "active" ? (
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={() => setTakedownTarget(l)}
                                className="text-xs font-semibold py-1 px-2.5"
                              >
                                <Ban className="w-3.5 h-3.5 mr-1" />
                                Bring Down
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => handleModerateListing(l.id, "reinstate")}
                                disabled={actionLoading}
                                className="text-xs py-1 px-2.5 text-sx-green-text"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                Reinstate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-sx-muted">
                        No listings match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ESCROW DISPUTES & ARBITRATION EVIDENCE LOCKER */}
      {activeTab === "disputes" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-pitch-surface border border-sx-red-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sx-red-tint border border-sx-red-border text-sx-red-text text-[11px] font-bold mb-1">
                <Scale className="w-3.5 h-3.5" />
                <span>Safeguarded Escrow Arbitration Court</span>
              </div>
              <h2 className="text-xl font-bold text-sx-ink font-display">
                Dispute Evidence Locker &amp; Binding Rulings
              </h2>
              <p className="text-xs text-sx-muted mt-0.5 max-w-2xl">
                Inspect Konami credentials verification claims, 2FA screenshot proofs, and chat evidence. Issue binding arbitration: release escrow to seller or refund buyer balance.
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2 bg-pitch-card p-1 rounded-xl border border-pitch-border shrink-0">
              <button
                type="button"
                onClick={() => setDisputeFilter("open")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  disputeFilter === "open"
                    ? "bg-rose-500 text-white shadow"
                    : "text-sx-muted hover:text-sx-ink"
                }`}
              >
                Needs Action ({openDisputesCount})
              </button>
              <button
                type="button"
                onClick={() => setDisputeFilter("all")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  disputeFilter === "all"
                    ? "bg-slate-700 text-sx-ink shadow"
                    : "text-sx-muted hover:text-sx-ink"
                }`}
              >
                All ({disputes.length})
              </button>
              <button
                type="button"
                onClick={() => setDisputeFilter("resolved")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  disputeFilter === "resolved"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-sx-muted hover:text-sx-ink"
                }`}
              >
                Resolved ({disputes.filter((d) => d.status !== "open").length})
              </button>
            </div>
          </div>

          {filteredDisputes.length === 0 ? (
            <div className="bg-pitch-surface border border-pitch-border rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sx-green-tint border border-sx-green-border flex items-center justify-center text-sx-green-text mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-sx-ink">No Disputes In This View</h3>
              <p className="text-xs text-sx-muted max-w-sm mx-auto">
                {disputeFilter === "open"
                  ? "All escrow orders are trading peacefully without active disputes."
                  : "No dispute records match the selected filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredDisputes.map((disp: any) => {
                const order = disp.order;
                const buyer = order?.buyer;
                const seller = order?.seller;
                const listing = order?.listing;
                const isOpen = disp.status === "open";
                const evidenceList: any[] = Array.isArray(disp.evidenceList) ? disp.evidenceList : [];

                return (
                  <div
                    key={disp.id}
                    className={`p-6 rounded-3xl bg-pitch-surface border transition-all shadow-xl space-y-5 ${
                      isOpen ? "border-sx-red-border ring-1 ring-rose-500/20" : "border-pitch-border"
                    }`}
                  >
                    {/* Top Row: Case info, Order info, Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pitch-border/60 pb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-sx-ink-soft">
                            Case #{disp.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-sx-stone text-sx-muted font-mono">
                            Order {order?.order_number || disp.order_id.slice(0, 8)}
                          </span>
                          <span className="text-xs text-sx-muted">
                            {new Date(disp.created_at).toLocaleString("en-KE", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {listing && (
                          <p className="text-xs font-semibold text-sx-ink mt-1">
                            Listing: {listing.title} ({listing.platform})
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-sx-muted uppercase font-semibold block">
                            In Escrow
                          </span>
                          <span className="text-sm font-black text-sx-amber-text font-mono">
                            {formatCurrency(order?.total_amount || 0)}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${
                            isOpen
                              ? "bg-sx-red-tint text-sx-red-text border-sx-red-border animate-pulse"
                              : disp.status === "resolved_seller_release"
                              ? "bg-sx-green-tint text-sx-green-text border-sx-green-border"
                              : disp.status === "resolved_buyer_refund"
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                              : "bg-sx-stone text-sx-ink-soft border-sx-border-strong"
                          }`}
                        >
                          {disp.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    {/* Dispute Claims & Stated Reason */}
                    <div className="p-4 rounded-2xl bg-rose-500/5 border border-sx-red-border space-y-1.5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-sx-red-text shrink-0" />
                        <span className="text-xs font-bold text-sx-red-text">
                          Dispute Claim: {disp.reason || "Account Credentials / Access Discrepancy"}
                        </span>
                      </div>
                      <p className="text-xs text-sx-ink-soft leading-relaxed pl-6">
                        {disp.description || "No dispute description text provided."}
                      </p>
                    </div>

                    {/* Counterparties Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Buyer */}
                      <div className="p-4 rounded-2xl bg-pitch-card border border-pitch-border space-y-2">
                        <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>Buyer Counterparty</span>
                        </span>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-sx-ink">
                              {buyer?.username || "Buyer"}
                            </p>
                            <p className="text-[11px] font-mono text-sx-muted">
                              {formatDisplayPhone(buyer?.phone_number || "")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {buyer?.phone_number && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleCopyPhone(buyer.phone_number)}
                                  className="p-1.5 rounded-lg bg-sx-stone hover:bg-slate-700 text-sx-ink-soft text-[11px]"
                                  title="Copy phone"
                                >
                                  {copiedPhone === buyer.phone_number ? (
                                    <Check className="w-3.5 h-3.5 text-sx-green-text" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <a
                                  href={`https://wa.me/${formatWhatsAppPhone(buyer.phone_number)}?text=${encodeURIComponent(`Hello ${buyer.username || ""}, this is the eFootballMarket Support & Escrow Desk regarding Escrow Dispute #${disp.id.slice(0, 8)} on Order ${order?.order_number || ""}.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-sx-green-text border border-sx-green-border text-[11px] flex items-center gap-1"
                                  title="Chat on WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-bold">WhatsApp</span>
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Seller */}
                      <div className="p-4 rounded-2xl bg-pitch-card border border-pitch-border space-y-2">
                        <span className="text-[10px] uppercase font-bold text-sx-green-text tracking-wider flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>Seller Counterparty</span>
                        </span>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-sx-ink">
                              {seller?.username || "Seller"}
                            </p>
                            <p className="text-[11px] font-mono text-sx-muted">
                              {formatDisplayPhone(seller?.phone_number || "")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {seller?.phone_number && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleCopyPhone(seller.phone_number)}
                                  className="p-1.5 rounded-lg bg-sx-stone hover:bg-slate-700 text-sx-ink-soft text-[11px]"
                                  title="Copy phone"
                                >
                                  {copiedPhone === seller.phone_number ? (
                                    <Check className="w-3.5 h-3.5 text-sx-green-text" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <a
                                  href={`https://wa.me/${formatWhatsAppPhone(seller.phone_number)}?text=${encodeURIComponent(`Hello ${seller.username || ""}, this is the eFootballMarket Support & Escrow Desk regarding Escrow Dispute #${disp.id.slice(0, 8)} on Order ${order?.order_number || ""}.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-sx-green-text border border-sx-green-border text-[11px] flex items-center gap-1"
                                  title="Chat on WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-bold">WhatsApp</span>
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Evidence Locker Screenshots */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sx-ink-soft flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-sx-info-text" />
                          <span>Submitted Proof Evidence ({evidenceList.length})</span>
                        </span>
                        <span className="text-[11px] text-sx-muted">
                          Click image to inspect in full-screen lightbox
                        </span>
                      </div>

                      {evidenceList.length === 0 ? (
                        <div className="p-3 rounded-xl bg-pitch-card border border-pitch-border text-center text-xs text-sx-muted">
                          No screenshot evidence uploaded to the locker yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {evidenceList.map((ev: any, idx: number) => (
                            <div
                              key={idx}
                              onClick={() => setAdminZoomImage(ev.url)}
                              className="group relative rounded-xl overflow-hidden bg-sx-subtle border border-pitch-border hover:border-brand-400 transition-all cursor-pointer aspect-video"
                            >
                              <img
                                src={ev.url}
                                alt={ev.note || "Dispute evidence"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-90 p-2 flex flex-col justify-end">
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded w-fit mb-0.5 ${
                                    ev.role === "buyer"
                                      ? "bg-blue-500/80 text-sx-ink"
                                      : "bg-emerald-500/80 text-sx-ink"
                                  }`}
                                >
                                  {ev.role || "Proof"}
                                </span>
                                {ev.note && (
                                  <p className="text-[10px] text-sx-ink-soft truncate font-sans">
                                    {ev.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Arbitration Decision Action Box */}
                    {isOpen ? (
                      <div className="p-4 rounded-2xl bg-pitch-card border border-sx-amber-border space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-sx-amber-text flex items-center gap-1.5">
                            <Scale className="w-4 h-4 text-sx-amber-text" />
                            <span>Escrow Arbitration Ruling</span>
                          </span>
                          <span className="text-[10px] text-sx-muted font-mono">
                            Final &amp; Binding
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-semibold text-sx-ink-soft">
                            Arbitration Rationale &amp; Notes
                          </label>
                          <textarea
                            value={resolvingDisputeId === disp.id ? resolutionNotes : ""}
                            onChange={(e) => {
                              setResolvingDisputeId(disp.id);
                              setResolutionNotes(e.target.value);
                            }}
                            placeholder="Explain the verified evidence and decision (e.g. 'Seller provided authentic Konami credentials. Buyer successfully received access token. Escrow released to seller.')"
                            rows={2}
                            className="w-full rounded-xl bg-pitch-surface border border-pitch-border p-2.5 text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 flex-wrap pt-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() =>
                              handleResolveDispute(
                                disp.id,
                                disp.order_id,
                                "dismiss",
                                resolvingDisputeId === disp.id && resolutionNotes.trim()
                                  ? resolutionNotes
                                  : "Dispute dismissed following amicable agreement."
                              )
                            }
                            className="text-xs"
                          >
                            Dismiss Dispute
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() =>
                              handleResolveDispute(
                                disp.id,
                                disp.order_id,
                                "refund_buyer",
                                resolvingDisputeId === disp.id ? resolutionNotes : ""
                              )
                            }
                            className="text-xs font-bold"
                          >
                            <UserMinus className="w-3.5 h-3.5 mr-1" />
                            Refund Buyer (Fraud / Bad Credentials)
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() =>
                              handleResolveDispute(
                                disp.id,
                                disp.order_id,
                                "release_to_seller",
                                resolvingDisputeId === disp.id ? resolutionNotes : ""
                              )
                            }
                            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Release {formatCurrency(order?.total_amount || 0)} to Seller
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-pitch-card border border-pitch-border text-xs space-y-1">
                        <span className="text-[10px] uppercase font-bold text-sx-muted tracking-wider block">
                          Official Arbitration Ruling Notes
                        </span>
                        <p className="text-sx-ink-soft">
                          {disp.resolution_notes && !disp.resolution_notes.startsWith("[")
                            ? disp.resolution_notes
                            : "Case concluded and archived."}
                        </p>
                        {disp.resolved_at && (
                          <span className="text-[10px] text-sx-muted font-mono block">
                            Resolved on {new Date(disp.resolved_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: USER DIRECTORY & ACCESS */}
      {activeTab === "users" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pitch-border/80 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-sx-amber-text text-xs font-bold uppercase tracking-wider mb-1">
                <Users className="w-3.5 h-3.5" />
                <span>RBAC &amp; Access Control</span>
              </div>
              <h2 className="text-2xl font-bold text-sx-ink font-display flex items-center gap-2.5">
                <span>User Directory</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sx-amber-tint text-sx-amber-text border border-sx-amber-border font-mono font-bold">
                  {filteredUsers.length} accounts
                </span>
              </h2>
              <p className="text-xs text-sx-muted mt-0.5">
                Grant or dismiss administrator privileges, ban scam accounts, and manage trader access.
              </p>
            </div>
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-sx-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user or email..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-pitch-surface border border-pitch-border text-xs text-sx-ink-soft placeholder:text-sx-muted focus:outline-none focus:border-amber-400 shadow-sm"
              />
            </div>
          </div>

          <div className="bg-pitch-surface border border-pitch-border rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-pitch-card border-b border-pitch-border text-sx-muted text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">User Profile</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Platform Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Sales / Rating</th>
                    <th className="p-3.5 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pitch-border/60">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => {
                      const isTargetSuperAdmin = isSuperAdminEmail(u.email);
                      const isTargetAdmin = u.role === "admin" || isTargetSuperAdmin;

                      return (
                        <tr key={u.id} className="hover:bg-pitch-card/40 transition-colors">
                          <td className="p-3.5">
                            <span className="font-bold text-sx-ink block">@{u.username}</span>
                            {u.phone_number && (
                              <span className="text-[10px] font-mono text-sx-ink-soft block">
                                {formatDisplayPhone(u.phone_number)}
                              </span>
                            )}
                            <span className="text-[10px] text-sx-muted">ID: {u.id.slice(0, 8)}...</span>
                          </td>
                          <td className="p-3.5 text-sx-ink-soft font-mono text-[11px]">
                            {u.email || "No email on record"}
                          </td>
                          <td className="p-3.5">
                            {isTargetSuperAdmin ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sx-amber-tint border border-sx-amber-border text-sx-amber-text font-extrabold text-[10px] uppercase">
                                <Crown className="w-3 h-3 text-sx-amber-text" />
                                Super Admin
                              </span>
                            ) : isTargetAdmin ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-500/20 border border-brand-500/40 text-sx-green-text font-bold text-[10px] uppercase">
                                <Shield className="w-3 h-3 text-sx-green-text" />
                                Administrator
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-sx-stone text-sx-muted text-[10px]">
                                Trader
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {u.is_suspended ? (
                              <span className="px-2 py-0.5 rounded-full bg-sx-red-tint text-sx-red-text border border-sx-red-border text-[10px] font-bold">
                                Banned / Suspended
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-sx-green-tint text-sx-green-text border border-sx-green-border text-[10px] font-bold">
                                Active & Good Standing
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-sx-muted">
                            <span>{u.completed_sales_count || 0} sales</span> / <span>{u.seller_rating ? `⭐ ${u.seller_rating}` : "No reviews yet"}</span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {u.phone_number && (
                                <a
                                  href={`https://wa.me/${formatWhatsAppPhone(
                                    u.phone_number
                                  )}?text=${encodeURIComponent(
                                    `Hello @${u.username || "Trader"}, this is eFootballMarket Admin.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Reach user on WhatsApp directly"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#25D366]/15 border border-[#25D366]/40 text-sx-green-text hover:bg-[#25D366]/25 text-[11px] font-bold transition-colors"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                              {/* Cannot alter Super Admin */}
                              {isTargetSuperAdmin ? (
                                <span className="text-[10px] font-bold text-sx-muted italic">
                                  Immutable Super Admin
                                </span>
                              ) : (
                                <>
                                  {/* Role Promotion / Dismissal (Only Super Admin can execute) */}
                                  {isSuperAdmin && (
                                    <>
                                      {isTargetAdmin ? (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleUserAction(u.id, "dismiss_admin")}
                                          disabled={actionLoading}
                                          className="text-[11px] py-1 px-2 text-sx-amber-text hover:text-sx-red-text"
                                          title="Dismiss Administrator privileges"
                                        >
                                          <UserMinus className="w-3.5 h-3.5 mr-1" />
                                          Dismiss Admin
                                        </Button>
                                      ) : (
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => handleUserAction(u.id, "grant_admin")}
                                          disabled={actionLoading}
                                          className="text-[11px] py-1 px-2 text-sx-green-text"
                                          title="Grant Administrator privileges"
                                        >
                                          <UserPlus className="w-3.5 h-3.5 mr-1" />
                                          Make Admin
                                        </Button>
                                      )}
                                    </>
                                  )}

                                  {/* Ban / Unban User */}
                                  {u.is_suspended ? (
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleUserAction(u.id, "unban_user")}
                                      disabled={actionLoading}
                                      className="text-[11px] py-1 px-2 text-sx-green-text"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                      Lift Ban
                                    </Button>
                                  ) : (
                                    <Button
                                      type="button"
                                      variant="danger"
                                      size="sm"
                                      onClick={() => handleUserAction(u.id, "ban_user")}
                                      disabled={actionLoading}
                                      className="text-[11px] py-1 px-2 font-semibold"
                                    >
                                      <Ban className="w-3.5 h-3.5 mr-1" />
                                      Ban User
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-sx-muted">
                        No users match your search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BLOGGER & GUIDES STUDIO */}
      {activeTab === "news" && (
        <AdminBloggerStudio
          articles={articles}
          onRefresh={loadAdminData}
          onFeedback={setFeedback}
        />
      )}

      {/* SECTION 4: SELLER WITHDRAWALS (M-PESA PAYOUTS) */}
      {activeTab === "withdrawals" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pitch-border/80 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-sx-amber-text text-xs font-bold uppercase tracking-wider mb-1">
                <Banknote className="w-3.5 h-3.5" />
                <span>Safaricom Daraja B2C</span>
              </div>
              <h2 className="text-2xl font-bold text-sx-ink font-display flex items-center gap-2.5">
                <span>M-Pesa Payouts</span>
                {pendingWithdrawalsCount > 0 ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-sx-amber-tint text-sx-amber-text border border-sx-amber-border font-mono font-bold animate-pulse">
                    {pendingWithdrawalsCount} pending
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-sx-stone text-sx-ink-soft font-mono font-bold">
                    All processed
                  </span>
                )}
              </h2>
              <p className="text-xs text-sx-muted mt-0.5">
                Review and disburse seller wallet balance withdrawals or reject suspicious requests.
              </p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-pitch-surface border border-pitch-border text-xs overflow-x-auto">
              {(["all", "pending", "completed", "rejected"] as const).map((filter) => {
                const count =
                  filter === "all"
                    ? withdrawals.length
                    : withdrawals.filter((w) => w.status === filter).length;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setWithdrawalFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all capitalize flex items-center gap-1.5 shrink-0 ${
                      withdrawalFilter === filter
                        ? "bg-amber-500 text-pitch-dark font-bold shadow"
                        : "text-sx-muted hover:text-sx-ink"
                    }`}
                  >
                    <span>{filter}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        withdrawalFilter === filter
                          ? "bg-black/20 text-pitch-dark font-bold"
                          : "bg-pitch-card text-sx-muted"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sx-green-tint border border-sx-green-border text-[11px] font-medium text-sx-green-text">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Live Realtime Sync</span>
              </div>
              <button
                type="button"
                onClick={reloadWithdrawals}
                className="p-2 rounded-xl bg-pitch-surface border border-pitch-border text-sx-muted hover:text-sx-ink hover:bg-pitch-card transition-colors"
                title="Refresh withdrawals"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-sx-muted" />
                <input
                  type="text"
                  placeholder="Search phone, seller, amount..."
                  value={withdrawalSearch}
                  onChange={(e) => setWithdrawalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-pitch-surface border border-pitch-border text-xs text-sx-ink-soft placeholder:text-sx-muted focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Table / List */}
          {filteredWithdrawals.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-pitch-surface border border-pitch-border text-sx-muted space-y-2">
              <Banknote className="w-8 h-8 mx-auto text-sx-muted" />
              <p className="text-xs font-semibold text-sx-ink-soft">No withdrawal requests found</p>
              <p className="text-[11px] text-sx-muted">
                {withdrawalFilter !== "all"
                  ? `There are no withdrawals with status "${withdrawalFilter}".`
                  : "No sellers have requested withdrawals yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-pitch-surface border border-pitch-border shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-sx-ink-soft">
                  <thead className="bg-pitch-card/60 border-b border-pitch-border text-[11px] text-sx-muted uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3">Seller</th>
                      <th className="px-4 py-3">M-Pesa Phone</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Requested Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pitch-border/50">
                    {filteredWithdrawals.map((w) => {
                      const isPending = w.status === "pending";
                      const isCompleted = w.status === "completed";
                      const isRejected = w.status === "rejected";

                      return (
                        <tr key={w.id} className="hover:bg-pitch-card/30 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-sx-ink">
                              {w.seller?.username || "Unknown Seller"}
                            </div>
                            <div className="text-[10px] text-sx-muted font-mono">
                              {w.seller?.email || w.seller_id}
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2 font-mono text-sx-ink-soft">
                              <span>{formatDisplayPhone(w.phone_number)}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyPhone(w.phone_number)}
                                className="p-1 rounded hover:bg-pitch-card text-sx-muted hover:text-sx-ink transition-colors"
                                title="Copy phone number"
                              >
                                {copiedPhone === w.phone_number ? (
                                  <Check className="w-3.5 h-3.5 text-sx-green-text" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <a
                                href={`https://wa.me/${formatWhatsAppPhone(w.phone_number)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded hover:bg-sx-green-tint text-sx-green-text hover:text-sx-green-text transition-colors"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 font-mono font-bold text-sx-green-text text-sm">
                            {formatCurrency(w.amount)}
                          </td>

                          <td className="px-4 py-3.5">
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sx-amber-tint border border-sx-amber-border text-sx-amber-text">
                                <Clock className="w-3 h-3 animate-spin text-sx-amber-text" />
                                Pending Payout
                              </span>
                            )}
                            {isCompleted && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sx-green-tint border border-sx-green-border text-sx-green-text">
                                <CheckCircle2 className="w-3 h-3 text-sx-green-text" />
                                Completed / Paid
                              </span>
                            )}
                            {isRejected && (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sx-red-tint border border-sx-red-border text-sx-red-text">
                                <XCircle className="w-3 h-3 text-sx-red-text" />
                                Rejected &amp; Refunded
                              </span>
                                {w.failure_reason && (
                                  <p className="text-[10px] text-sx-muted italic max-w-xs truncate">
                                    Reason: {w.failure_reason}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-[11px] text-sx-muted">
                            {new Date(w.created_at).toLocaleString()}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => {
                                    setRejectModalTarget(w);
                                    setRejectModalReason("");
                                  }}
                                  disabled={actionLoading}
                                  className="text-xs"
                                >
                                  Reject &amp; Refund
                                </Button>
                                <Button
                                  variant="gold"
                                  size="sm"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Confirm that you have sent ${formatCurrency(w.amount)} to M-Pesa line ${w.phone_number}?`
                                      )
                                    ) {
                                      handleWithdrawalAction(w.id, "completed");
                                    }
                                  }}
                                  disabled={actionLoading}
                                  className="text-xs font-bold"
                                >
                                  <Check className="w-3.5 h-3.5 mr-1" />
                                  Mark Paid
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-sx-muted italic">No action needed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: TILL 1572931 RECEIPTS & MIDDLEMAN DESK */}
      {activeTab === "payments" && (
        <AdminPaymentsAndMiddlemanTab onFeedback={setFeedback} />
      )}

      {/* Modal: Takedown Listing with Reason */}
      {takedownTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-pitch-surface border border-pitch-border rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sx-red-text">
                <Ban className="w-5 h-5" />
                <h3 className="text-base font-bold text-sx-ink">Bring Down Listing</h3>
              </div>
              <button
                type="button"
                onClick={() => setTakedownTarget(null)}
                className="text-sx-muted hover:text-sx-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-sx-ink-soft">
              You are taking down <strong className="text-sx-ink">&quot;{takedownTarget.title}&quot;</strong>.
              The seller will be notified with your explanation.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-sx-ink-soft">
                Violation Explanation (Sent to Seller)
              </label>
              <textarea
                value={takedownReason}
                onChange={(e) => setTakedownReason(e.target.value)}
                placeholder="e.g. Listing removed: Inaccurate player card proof or suspected circumvention attempt."
                rows={3}
                className="w-full rounded-xl bg-pitch-card border border-pitch-border p-3 text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTakedownTarget(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleModerateListing(takedownTarget.id, "take_down", takedownReason)}
                isLoading={actionLoading}
                className="text-xs font-bold"
              >
                Confirm Takedown
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reject Withdrawal with Reason */}
      {rejectModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-pitch-surface border border-pitch-border rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sx-red-text">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-sx-ink">Reject Withdrawal &amp; Refund</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalTarget(null)}
                className="text-sx-muted hover:text-sx-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-sx-ink-soft">
              You are rejecting the withdrawal of{" "}
              <strong className="text-sx-green-text font-mono">
                {formatCurrency(rejectModalTarget.amount)}
              </strong>{" "}
              for{" "}
              <strong className="text-sx-ink">
                {rejectModalTarget.seller?.username || rejectModalTarget.phone_number}
              </strong>
              . The funds will be automatically credited back to their Available Balance.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-sx-ink-soft">
                Rejection Reason (Sent to Seller)
              </label>
              <textarea
                value={rejectModalReason}
                onChange={(e) => setRejectModalReason(e.target.value)}
                placeholder="e.g. Invalid phone number format, M-Pesa name mismatch, or network bounce."
                rows={3}
                className="w-full rounded-xl bg-pitch-card border border-pitch-border p-3 text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectModalTarget(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() =>
                  handleWithdrawalAction(
                    rejectModalTarget.id,
                    "rejected",
                    rejectModalReason || "Declined by platform administrator. Funds refunded."
                  )
                }
                isLoading={actionLoading}
                className="text-xs font-bold"
              >
                Confirm Rejection &amp; Refund
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal for Dispute Evidence Locker */}
      {adminZoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setAdminZoomImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 text-sx-ink">
              <span className="text-xs font-bold text-sx-ink-soft">
                Dispute Evidence Inspection Lightbox
              </span>
              <div className="flex items-center gap-3">
                <a
                  href={adminZoomImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sx-green-text hover:underline"
                >
                  Open Original
                </a>
                <button
                  type="button"
                  onClick={() => setAdminZoomImage(null)}
                  className="p-1 rounded-lg bg-sx-stone hover:bg-slate-700 text-sx-ink-soft"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <img
              src={adminZoomImage}
              alt="Evidence high resolution"
              className="max-w-full max-h-[80vh] object-contain rounded-xl border border-pitch-border shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminControlCenterPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-xs text-sx-muted">
          Loading Admin Console...
        </div>
      }
    >
      <AdminControlCenterContent />
    </Suspense>
  );
}
