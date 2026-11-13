"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Listing, Tournament, WantedRequest } from "@/types/database";
import { useAuth } from "@/hooks/useAuth";
import { calculateEscrowCommission } from "@/lib/utils/commission";
import { formatCurrency, getShortPlatformLabel } from "@/lib/utils";
import {
  ensureNotificationServiceWorker,
  getBrowserNotificationPermission,
  getWatchedOffers,
  getWatchedPings,
  rememberWatchedOffer,
  rememberWatchedPing,
  requestBrowserNotificationPermission,
  updateWatchedOfferStatus,
  updateWatchedPingStatus,
  WatchedOfferEntry,
  WatchedPingEntry,
} from "@/lib/notifications/browserPush";
import { BuildLabTool } from "@/components/app/pro/BuildLabTool";
import { SquadPitchBuilder } from "@/components/app/pro/SquadPitchBuilder";
import { PackSimulatorAndVsLab } from "@/components/app/pro/PackSimulatorAndVsLab";
import {
  Flame,
  Radio,
  Plus,
  ShieldAlert,
  Lock,
  Zap,
  MessageSquare,
  Heart,
  X,
  RotateCcw,
  CheckCircle2,
  BellRing,
  Search,
  Trophy,
  Target,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Layers,
  Loader2,
  Wallet,
  ExternalLink,
  RefreshCw,
  Handshake,
  ShieldCheck,
  AlertTriangle,
  Gamepad2,
  Sliders,
  Swords,
  Gift,
} from "lucide-react";

interface MobileAppShellProps {
  initialListings: Listing[];
  initialTournaments: Tournament[];
  initialWanted: WantedRequest[];
}

type AppTab = "swipe" | "efhub" | "sell" | "radar" | "vault";
type EfHubSubTab = "build" | "pitch" | "pack" | "vs";

const FAVORITES_STORAGE_KEY = "efm_app_saved_squads_v1";

function computeAppValuation(ovr: number, epics: number, coins: number) {
  let base = 900;
  if (ovr >= 3250) base = 6500;
  else if (ovr >= 3220) base = 4800;
  else if (ovr >= 3190) base = 3600;
  else if (ovr >= 3150) base = 2600;
  else if (ovr >= 3100) base = 1800;
  else if (ovr >= 3050) base = 1300;

  const epicVal = Math.min(epics, 35) * 320;
  const coinVal = Math.floor(Math.min(coins, 25000) * 0.65);
  const mid = Math.round((base + epicVal + coinVal) / 100) * 100;
  const low = Math.max(500, Math.round((mid * 0.82) / 100) * 100);
  const high = Math.round((mid * 1.2) / 100) * 100;
  const fee = calculateEscrowCommission(mid);
  const net = Math.max(0, mid - fee);
  return { low, mid, high, fee, net };
}

function computeSquadDealScore(sq: Listing): { score: string; label: string; isHot: boolean } {
  const est = computeAppValuation(
    sq.overall_team_strength || 3080,
    (sq.epic_players_count || 0) + (sq.big_time_players_count || 0),
    sq.coin_balance || 0
  );
  const price = Math.max(100, Number(sq.price) || est.mid);
  const ratio = est.mid / price;
  if (ratio >= 1.15) return { score: "9.6", label: "HOT STEAL", isHot: true };
  if (ratio >= 0.95) return { score: "9.1", label: "GREAT DEAL", isHot: true };
  return { score: "8.5", label: "VERIFIED", isHot: false };
}

export function MobileAppShell({
  initialListings,
  initialTournaments,
  initialWanted,
}: MobileAppShellProps) {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<AppTab>("swipe");
  const [efSubTab, setEfSubTab] = useState<EfHubSubTab>("build");
  const [viewMode, setViewMode] = useState<"deck" | "grid">("deck");
  const [dataSaver, setDataSaver] = useState(false);

  // Feed & Swipe Deck State
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [filterChip, setFilterChip] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deckIndex, setDeckIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [refreshingFeed, setRefreshingFeed] = useState(false);

  // Instant Ping & Bargain Sheet State
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [pingedMap, setPingedMap] = useState<Record<string, string>>({});
  const [bargainListing, setBargainListing] = useState<Listing | null>(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerPhone, setOfferPhone] = useState("");
  const [offerName, setOfferName] = useState("");
  const [sendingOffer, setSendingOffer] = useState(false);
  const [offerFeedback, setOfferFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Radar & Scammer Scanner State
  const [watchedPings, setWatchedPings] = useState<WatchedPingEntry[]>([]);
  const [watchedOffers, setWatchedOffers] = useState<WatchedOfferEntry[]>([]);
  const [sellerPings, setSellerPings] = useState<any[]>([]);
  const [updatingPingId, setUpdatingPingId] = useState<string | null>(null);
  const [alertsGranted, setAlertsGranted] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any[] | null>(null);
  const [scanQueried, setScanQueried] = useState("");

  // Valuator State
  const [valOvr, setValOvr] = useState(3180);
  const [valEpics, setValEpics] = useState(8);
  const [valCoins, setValCoins] = useState(500);
  const [valPlatform, setValPlatform] = useState("android");

  // Vault / Orders State
  const [buyerOrders, setBuyerOrders] = useState<any[]>([]);
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);

  useEffect(() => {
    ensureNotificationServiceWorker().catch(() => {});
    setAlertsGranted(getBrowserNotificationPermission() === "granted");

    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const tabParam = sp.get("tab") as AppTab | null;
      const subParam = sp.get("tool") as EfHubSubTab | null;
      if (tabParam && ["swipe", "efhub", "sell", "radar", "vault"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
      if (subParam && ["build", "pitch", "pack", "vs"].includes(subParam)) {
        setEfSubTab(subParam);
      }
    }

    try {
      const rawSaved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (rawSaved) setSavedIds(JSON.parse(rawSaved));
    } catch {
      // ignore
    }

    const pings = getWatchedPings();
    setWatchedPings(pings);
    const map: Record<string, string> = {};
    pings.forEach((p) => {
      map[p.listingId] = p.lastStatus;
    });
    setPingedMap(map);
    setWatchedOffers(getWatchedOffers());
  }, []);

  useEffect(() => {
    if (profile?.phone_number && !offerPhone) setOfferPhone(profile.phone_number);
    if (profile?.username && !offerName) setOfferName(profile.username);
  }, [profile, offerPhone, offerName]);

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      if (filterChip === "android" && item.platform !== "android") return false;
      if (filterChip === "ios" && item.platform !== "ios") return false;
      if (filterChip === "3150" && (item.overall_team_strength || 0) < 3150) return false;
      if (filterChip === "under5k" && Number(item.price) > 5000) return false;
      if (filterChip === "swaps" && !item.allows_swap) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = (item.title || "").toLowerCase().includes(q);
        const inPlayers = (item.key_players_list || []).some((p) =>
          p.toLowerCase().includes(q)
        );
        const inManager = (item.manager_name || "").toLowerCase().includes(q);
        const inOvr = String(item.overall_team_strength || "").includes(q);
        if (!inTitle && !inPlayers && !inManager && !inOvr) return false;
      }
      return true;
    });
  }, [listings, filterChip, searchQuery]);

  const currentSquad = filteredListings[deckIndex] || null;
  const currentDeal = useMemo(
    () => (currentSquad ? computeSquadDealScore(currentSquad) : null),
    [currentSquad]
  );

  useEffect(() => {
    setDeckIndex(0);
    setPhotoIndex(0);
  }, [filterChip, searchQuery]);

  useEffect(() => {
    setPhotoIndex(0);
  }, [deckIndex]);

  const squadPhotos = useMemo(() => {
    if (!currentSquad) return [];
    return (currentSquad.images || [])
      .map((img: any) => (typeof img === "string" ? img : img?.image_url))
      .filter(Boolean);
  }, [currentSquad]);

  const toggleSaveSquad = (id: string) => {
    try {
      (window as any).EFMNative?.vibrate?.(15);
    } catch {
      // ignore
    }
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleRefreshFeed = async () => {
    setRefreshingFeed(true);
    try {
      const res = await fetch("/api/listings?limit=24");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.listings) && data.listings.length > 0) {
          setListings(data.listings);
          setDeckIndex(0);
        }
      }
    } catch {
      // ignore
    } finally {
      setRefreshingFeed(false);
    }
  };

  const refreshRadar = useCallback(async () => {
    const localPings = getWatchedPings();
    for (const p of localPings.slice(0, 6)) {
      if (p.lastStatus !== "pending") continue;
      try {
        const res = await fetch(
          `/api/listings/availability?pingId=${encodeURIComponent(p.id)}`
        );
        if (res.ok) {
          const d = await res.json();
          if (d.ping?.status && d.ping.status !== "pending") {
            updateWatchedPingStatus(p.id, d.ping.status);
          }
        }
      } catch {
        // ignore
      }
    }

    const localOffers = getWatchedOffers();
    for (const o of localOffers.slice(0, 6)) {
      if (o.lastStatus !== "pending") continue;
      try {
        const res = await fetch(`/api/offers?offerId=${encodeURIComponent(o.id)}`);
        if (res.ok) {
          const d = await res.json();
          if (d.offer?.status && d.offer.status !== "pending") {
            updateWatchedOfferStatus(o.id, d.offer.status);
          }
        }
      } catch {
        // ignore
      }
    }

    const updatedPings = getWatchedPings();
    setWatchedPings(updatedPings);
    const map: Record<string, string> = {};
    updatedPings.forEach((p) => {
      map[p.listingId] = p.lastStatus;
    });
    setPingedMap(map);
    setWatchedOffers(getWatchedOffers());

    if (user) {
      try {
        const sRes = await fetch("/api/listings/availability?role=seller");
        if (sRes.ok) {
          const sData = await sRes.json();
          setSellerPings(sData.pings || []);
        }
      } catch {
        // ignore
      }
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "radar") refreshRadar();
    if (activeTab === "vault" && user) {
      setLoadingVault(true);
      Promise.all([
        fetch("/api/orders?role=buyer").then((r) => (r.ok ? r.json() : { orders: [] })),
        fetch("/api/orders?role=seller").then((r) => (r.ok ? r.json() : { orders: [] })),
      ])
        .then(([b, s]) => {
          setBuyerOrders(b.orders || []);
          setSellerOrders(s.orders || []);
        })
        .catch(() => {})
        .finally(() => setLoadingVault(false));
    }
  }, [activeTab, user, refreshRadar]);

  const handleInstantPing = async (squad: Listing) => {
    if (pingingId) return;
    setPingingId(squad.id);
    try {
      (window as any).EFMNative?.vibrate?.(20);
    } catch {
      // ignore
    }

    if (getBrowserNotificationPermission() === "default") {
      requestBrowserNotificationPermission()
        .then((p) => setAlertsGranted(p === "granted"))
        .catch(() => {});
    }

    try {
      const res = await fetch("/api/listings/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: squad.id,
          buyerName: profile?.username || undefined,
          buyerPhone: profile?.phone_number || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ping?.id) {
        rememberWatchedPing(data.ping.id, squad.id, squad.title);
        setPingedMap((prev) => ({ ...prev, [squad.id]: data.ping.status || "pending" }));
        setWatchedPings(getWatchedPings());
      }
    } catch {
      // ignore
    } finally {
      setPingingId(null);
    }
  };

  const handleSellerPingAction = async (
    pingId: string,
    status: "available" | "unavailable"
  ) => {
    setUpdatingPingId(pingId);
    try {
      const res = await fetch("/api/listings/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pingId, status }),
      });
      if (res.ok) {
        setSellerPings((prev) =>
          prev.map((p) => (p.id === pingId ? { ...p, status } : p))
        );
      }
    } catch {
      // ignore
    } finally {
      setUpdatingPingId(null);
    }
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bargainListing) return;
    const numeric = Number(offerAmount);
    if (!numeric || numeric < 100) {
      setOfferFeedback({ type: "err", text: "Enter a valid KES offer amount." });
      return;
    }
    if (!user && offerPhone.replace(/\D/g, "").length < 9) {
      setOfferFeedback({
        type: "err",
        text: "Enter your Safaricom/WhatsApp number so we can alert you.",
      });
      return;
    }

    setSendingOffer(true);
    setOfferFeedback(null);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: bargainListing.id,
          offeredPrice: numeric,
          buyerPhone: offerPhone || undefined,
          buyerName: offerName || "App Buyer",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOfferFeedback({
          type: "err",
          text: data.error || "Could not send offer right now.",
        });
      } else {
        if (data.offer?.id) {
          rememberWatchedOffer(data.offer.id, bargainListing.id);
          setWatchedOffers(getWatchedOffers());
        }
        setOfferFeedback({
          type: "ok",
          text: "Offer sent to seller's phone! Watch Radar for live reply.",
        });
        setTimeout(() => {
          setBargainListing(null);
          setOfferFeedback(null);
        }, 1400);
      }
    } catch {
      setOfferFeedback({ type: "err", text: "Network error. Check connection." });
    } finally {
      setSendingOffer(false);
    }
  };

  const handleRunScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = scanInput.trim();
    if (q.length < 3) return;
    setScanning(true);
    setScanQueried(q);
    try {
      const res = await fetch(`/api/scammers?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setScanResults(data.scammers || []);
    } catch {
      setScanResults([]);
    } finally {
      setScanning(false);
    }
  };

  const valuation = useMemo(
    () => computeAppValuation(valOvr, valEpics, valCoins),
    [valOvr, valEpics, valCoins]
  );

  const savedSquadsList = useMemo(
    () => listings.filter((l) => savedIds.includes(l.id)),
    [listings, savedIds]
  );

  const radarBadgeCount =
    sellerPings.filter((p) => p.status === "pending").length +
    watchedPings.filter((p) => p.lastStatus === "available").length +
    watchedOffers.filter(
      (o) => o.lastStatus === "accepted" || o.lastStatus === "countered"
    ).length;

  return (
    <div className="min-h-screen bg-[#050912] text-slate-100 flex flex-col select-none">
      {/* NATIVE PRO SUPER-APP TOP BAR */}
      <header className="sticky top-0 z-40 bg-[#050912]/95 backdrop-blur-xl border-b border-slate-800/80 px-3.5 py-2.5">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/25 to-amber-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-sm tracking-tight text-white truncate">
                  eFootball Market
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[9px] font-mono font-extrabold uppercase">
                  PRO v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Market · eFHUB Lab · Till 1572931</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setDataSaver((d) => !d)}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                dataSaver
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Safaricom Data-Saver Lite Mode"
            >
              {dataSaver ? "LITE ON" : "LITE"}
            </button>

            <button
              type="button"
              onClick={async () => {
                const res = await requestBrowserNotificationPermission();
                setAlertsGranted(res === "granted");
              }}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                alertsGranted
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
              aria-label="Phone Push Alerts"
            >
              <BellRing className="w-4 h-4" />
            </button>

            <Link
              href={user ? "/notifications" : "/login"}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-200 hover:border-slate-700"
            >
              {user ? (profile?.username || "Trader").slice(0, 8) : "Sign In"}
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN APP VIEWPORT */}
      <div className="flex-1 max-w-md w-full mx-auto px-3.5 pt-3 pb-24 space-y-3.5">
        {/* ==================== TAB 1: MARKET SWIPE DECK ==================== */}
        {activeTab === "swipe" && (
          <div className="space-y-3">
            {/* Quick Pro Tools Launch Strip right at top of Market */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: "build" as const, label: "Build Lab", icon: Sliders, color: "text-emerald-400" },
                { id: "pitch" as const, label: "11v11 Pitch", icon: Gamepad2, color: "text-amber-400" },
                { id: "pack" as const, label: "150-Box Sim", icon: Gift, color: "text-fuchsia-400" },
                { id: "vs" as const, label: "VS Compare", icon: Swords, color: "text-sky-400" },
              ].map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      setEfSubTab(tool.id);
                      setActiveTab("efhub");
                    }}
                    className="p-2 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                  >
                    <Icon className={`w-4 h-4 ${tool.color}`} />
                    <span className="text-[10px] font-extrabold text-slate-200 truncate">
                      {tool.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search + View Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Gullit, 3200 OVR, Messi..."
                  className="w-full h-9 pl-8 pr-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setViewMode((m) => (m === "deck" ? "grid" : "deck"))}
                className="h-9 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
              >
                {viewMode === "deck" ? (
                  <>
                    <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Grid</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Swipe</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRefreshFeed}
                disabled={refreshingFeed}
                className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
                aria-label="Refresh live squads"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    refreshingFeed ? "animate-spin text-emerald-400" : ""
                  }`}
                />
              </button>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: "all", label: `All (${listings.length})` },
                { id: "android", label: "Android" },
                { id: "ios", label: "iPhone / iOS" },
                { id: "3150", label: "3150+ OVR" },
                { id: "under5k", label: "Under 5K" },
                { id: "swaps", label: "Swaps Open" },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setFilterChip(chip.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all cursor-pointer ${
                    filterChip === chip.id
                      ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm"
                      : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* DECK MODE */}
            {viewMode === "deck" ? (
              currentSquad ? (
                <div className="space-y-3">
                  <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
                    <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                      {!dataSaver && squadPhotos.length > 0 ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={squadPhotos[photoIndex] || squadPhotos[0]}
                            alt={currentSquad.title}
                            className="w-full h-full object-cover"
                          />
                          {squadPhotos.length > 1 && (
                            <>
                              <div className="absolute top-2.5 left-3 right-3 flex gap-1 z-10">
                                {squadPhotos.map((_, idx) => (
                                  <span
                                    key={idx}
                                    className={`h-1 flex-1 rounded-full ${
                                      idx === photoIndex ? "bg-emerald-400" : "bg-white/30"
                                    }`}
                                  />
                                ))}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setPhotoIndex((p) =>
                                    p > 0 ? p - 1 : squadPhotos.length - 1
                                  )
                                }
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
                                aria-label="Previous photo"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setPhotoIndex((p) => (p + 1) % squadPhotos.length)
                                }
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
                                aria-label="Next photo"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-900 via-[#0B1829] to-emerald-950/40">
                          <span className="text-3xl font-mono font-black text-emerald-400">
                            {currentSquad.overall_team_strength || 3100} OVR
                          </span>
                          <span className="text-[11px] text-slate-400 mt-1">
                            {dataSaver
                              ? "Safaricom Data-Saver Lite Mode"
                              : "Verified Konami ID Roster"}
                          </span>
                        </div>
                      )}

                      {/* Top Badges + AI Deal Score */}
                      <div className="absolute top-5 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-[11px] font-mono font-extrabold text-emerald-400">
                          {currentSquad.overall_team_strength || 3100} OVR
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-[10px] font-bold text-white uppercase">
                          {getShortPlatformLabel(currentSquad.platform)}
                        </span>
                        {currentDeal && (
                          <span
                            className={`px-2 py-1 rounded-lg backdrop-blur-md text-[10px] font-extrabold ${
                              currentDeal.isHot
                                ? "bg-amber-400 text-slate-950"
                                : "bg-emerald-500/80 text-slate-950"
                            }`}
                          >
                            ★ {currentDeal.score} {currentDeal.label}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSaveSquad(currentSquad.id)}
                        className={`absolute top-5 right-3 w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center transition-transform active:scale-90 cursor-pointer ${
                          savedIds.includes(currentSquad.id)
                            ? "bg-rose-500 border-rose-400 text-white"
                            : "bg-black/65 border-white/15 text-white"
                        }`}
                        aria-label="Save to Watchlist"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            savedIds.includes(currentSquad.id) ? "fill-current" : ""
                          }`}
                        />
                      </button>

                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pt-8 pb-3 px-4 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                            Till 1572931 Escrow Price
                          </p>
                          <p className="text-2xl font-mono font-black text-white">
                            {formatCurrency(currentSquad.price, currentSquad.currency)}
                          </p>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          #{deckIndex + 1}/{filteredListings.length}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-base font-extrabold text-white leading-snug line-clamp-2">
                          {currentSquad.title}
                        </h2>
                        <Link
                          href={`/listings/${currentSquad.id}`}
                          className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-emerald-300 flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                          <p className="text-[10px] text-slate-400">Epics / BT</p>
                          <p className="text-xs font-mono font-extrabold text-amber-400">
                            {(currentSquad.epic_players_count || 0) +
                              (currentSquad.big_time_players_count || 0)}{" "}
                            Cards
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                          <p className="text-[10px] text-slate-400">Coins</p>
                          <p className="text-xs font-mono font-extrabold text-emerald-400">
                            {(currentSquad.coin_balance || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                          <p className="text-[10px] text-slate-400">Konami ID</p>
                          <p className="text-xs font-bold text-slate-200 truncate">
                            {currentSquad.konami_id_status === "unlinked"
                              ? "Unlinked"
                              : "Ready"}
                          </p>
                        </div>
                      </div>

                      {pingedMap[currentSquad.id] && (
                        <div
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
                            pingedMap[currentSquad.id] === "available"
                              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                              : "bg-amber-500/15 border border-amber-500/30 text-amber-200"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            {pingedMap[currentSquad.id] === "available"
                              ? "Seller Confirmed: Squad Available!"
                              : "Seller Pinged — Live in Radar"}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveTab("radar")}
                            className="underline text-[11px] cursor-pointer"
                          >
                            Radar &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TACTILE DECK CONTROLS */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <button
                      type="button"
                      onClick={() =>
                        setDeckIndex((i) =>
                          i > 0 ? i - 1 : Math.max(0, filteredListings.length - 1)
                        )
                      }
                      className="col-span-2 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                      title="Previous Squad"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setDeckIndex((i) => (i + 1) % Math.max(1, filteredListings.length))
                      }
                      className="col-span-2 h-12 rounded-2xl bg-slate-900 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                      title="Next Squad"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInstantPing(currentSquad)}
                      disabled={pingingId === currentSquad.id}
                      className="col-span-3 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold text-[11px] flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer"
                    >
                      {pingingId === currentSquad.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Available?</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBargainListing(currentSquad);
                        setOfferAmount(
                          String(
                            Math.max(
                              100,
                              Math.round((Number(currentSquad.price) * 0.9) / 50) * 50
                            )
                          )
                        );
                        setOfferFeedback(null);
                      }}
                      className="col-span-2 h-12 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-[11px] flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-sky-400" />
                      <span>Offer</span>
                    </button>

                    <Link
                      href={`/pay/${currentSquad.id}`}
                      className="col-span-3 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Buy Safe</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
                  <p className="text-sm font-bold text-white">No squads match that filter</p>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterChip("all");
                      setSearchQuery("");
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold cursor-pointer"
                  >
                    Reset Deck Filters
                  </button>
                </div>
              )
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {filteredListings.map((sq) => {
                  const thumb = (sq.images || [])
                    .map((i: any) => (typeof i === "string" ? i : i?.image_url))
                    .find(Boolean);
                  return (
                    <Link
                      key={sq.id}
                      href={`/listings/${sq.id}`}
                      className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col hover:border-emerald-500/50 transition-colors"
                    >
                      <div className="relative aspect-[4/3] bg-slate-950">
                        {!dataSaver && thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={sq.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-emerald-400 font-mono font-extrabold text-sm">
                            {sq.overall_team_strength} OVR
                          </div>
                        )}
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono font-bold text-emerald-400">
                          {sq.overall_team_strength}
                        </span>
                      </div>
                      <div className="p-2.5 space-y-1 flex-1 flex flex-col justify-between">
                        <p className="text-xs font-bold text-white line-clamp-2 leading-tight">
                          {sq.title}
                        </p>
                        <p className="text-xs font-mono font-extrabold text-emerald-400 pt-1">
                          {formatCurrency(sq.price, sq.currency)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: eFHUB PRO LAB (APP EXCLUSIVE!) ==================== */}
        {activeTab === "efhub" && (
          <div className="space-y-3.5">
            {/* 4-Tool Sub-Navigation */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-900 border border-slate-800">
              {[
                { id: "build" as const, label: "Build Lab" },
                { id: "pitch" as const, label: "11v11 Pitch" },
                { id: "pack" as const, label: "150-Box" },
                { id: "vs" as const, label: "VS Arena" },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setEfSubTab(sub.id)}
                  className={`py-2 rounded-xl text-[11px] font-extrabold transition-colors cursor-pointer ${
                    efSubTab === sub.id
                      ? "bg-emerald-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {efSubTab === "build" && (
              <BuildLabTool
                onFindPlayerInMarket={(playerName) => {
                  setSearchQuery(playerName);
                  setFilterChip("all");
                  setActiveTab("swipe");
                }}
              />
            )}

            {efSubTab === "pitch" && (
              <SquadPitchBuilder
                onMatchSquadInMarket={() => {
                  setFilterChip("3150");
                  setSearchQuery("");
                  setActiveTab("swipe");
                }}
              />
            )}

            {efSubTab === "pack" && (
              <PackSimulatorAndVsLab mode="pack" listings={listings} />
            )}

            {efSubTab === "vs" && (
              <PackSimulatorAndVsLab mode="vs" listings={listings} />
            )}
          </div>
        )}

        {/* ==================== TAB 3: VALUATOR & EXPRESS SELL ==================== */}
        {activeTab === "sell" && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>App-Exclusive KES Squad Valuator</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-300">Team Collective Strength (OVR)</span>
                    <span className="font-mono text-emerald-400">{valOvr} OVR</span>
                  </div>
                  <input
                    type="range"
                    min={2950}
                    max={3280}
                    step={5}
                    value={valOvr}
                    onChange={(e) => setValOvr(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-300">Epic + Big Time + Booster Cards</span>
                    <span className="font-mono text-amber-400">{valEpics} Cards</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={35}
                    step={1}
                    value={valEpics}
                    onChange={(e) => setValEpics(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-300">eFootball Coins Balance</span>
                    <span className="font-mono text-sky-400">
                      {valCoins.toLocaleString()} Coins
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={15000}
                    step={100}
                    value={valCoins}
                    onChange={(e) => setValCoins(Number(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[
                    { id: "android", label: "Android" },
                    { id: "ios", label: "iPhone" },
                    { id: "playstation_5", label: "PS5" },
                    { id: "pc_steam", label: "PC" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setValPlatform(p.id)}
                      className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        valPlatform === p.id
                          ? "bg-emerald-500 text-slate-950 border-emerald-400"
                          : "bg-slate-950 text-slate-400 border-slate-800"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Recommended Fast-Sale Price</span>
                  <span className="text-xl font-mono font-black text-white">
                    KES {valuation.mid.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Market Range: KES {valuation.low.toLocaleString()} –{" "}
                    {valuation.high.toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-400">Direct M-Pesa Payout to You</span>
                  <span className="font-mono text-emerald-300">
                    KES {valuation.net.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/seller/create-listing?price=${valuation.mid}&ovr=${valOvr}&epics=${valEpics}&coins=${valCoins}&platform=${valPlatform}`
                  )
                }
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <span>List This Squad at KES {valuation.mid.toLocaleString()}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <Link
              href="/middleman"
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 hover:border-emerald-500/40"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <Handshake className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-white">
                    Lock a WhatsApp / TikTok Deal (Middleman)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Create a Till 1572931 Escrow Room in 20 seconds
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            </Link>
          </div>
        )}

        {/* ==================== TAB 4: RADAR & SCAMMER SHIELD ==================== */}
        {activeTab === "radar" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-extrabold text-white font-display">
                  Radar &amp; Trader Shield
                </h1>
                <p className="text-xs text-slate-400">
                  Live pings, bargain replies, watchlist &amp; 07/01 phone scanner
                </p>
              </div>
              <button
                type="button"
                onClick={refreshRadar}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-emerald-400 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync</span>
              </button>
            </div>

            {/* 1-Tap Scammer Phone Scanner */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  Instant Kenyan Trader Phone Scanner
                </h2>
              </div>
              <form onSubmit={handleRunScan} className="flex gap-2">
                <input
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Scan 07XX / 01XX number or @handle..."
                  className="flex-1 h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={scanning}
                  className="px-4 h-10 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs cursor-pointer"
                >
                  {scanning ? "..." : "Scan"}
                </button>
              </form>
              {scanResults !== null && (
                <div>
                  {scanResults.length === 0 ? (
                    <p className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-300">
                      ✓ 0 Verified Scam Reports for &ldquo;{scanQueried}&rdquo; — always pay via Till 1572931.
                    </p>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 space-y-1">
                      <p className="font-extrabold flex items-center gap-1 text-rose-300">
                        <AlertTriangle className="w-4 h-4" />
                        DANGER: {scanResults.length} Scam Report(s) Found!
                      </p>
                      {scanResults.map((r) => (
                        <p key={r.id} className="text-[11px]">
                          <strong>{r.username_alias}:</strong> {r.incident_summary}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {sellerPings.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  Buyers Asking About Your Squads ({sellerPings.length})
                </p>
                {sellerPings.slice(0, 5).map((ping) => (
                  <div
                    key={ping.id}
                    className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2"
                  >
                    <p className="text-xs font-bold text-white">
                      {ping.listing?.title || "Your Squad Listing"}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={updatingPingId === ping.id}
                        onClick={() => handleSellerPingAction(ping.id, "available")}
                        className="flex-1 py-2 rounded-lg bg-emerald-500 text-slate-950 text-xs font-extrabold cursor-pointer"
                      >
                        ✓ Yes, Available
                      </button>
                      <button
                        type="button"
                        disabled={updatingPingId === ping.id}
                        onClick={() => handleSellerPingAction(ping.id, "unavailable")}
                        className="py-2 px-3 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                      >
                        Sold / Hold
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                My Availability Pings ({watchedPings.length}) &amp; Offers ({watchedOffers.length})
              </p>
              {watchedPings.length === 0 && watchedOffers.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Tap <strong>Available?</strong> or <strong>Offer</strong> on any squad in Market to track live seller responses here.
                </p>
              ) : (
                <>
                  {watchedPings.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {p.listingTitle}
                        </p>
                        <p className="text-[11px] font-semibold text-emerald-400">
                          Status: {p.lastStatus.toUpperCase()}
                        </p>
                      </div>
                      {p.lastStatus === "available" && (
                        <Link
                          href={`/pay/${p.listingId}`}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-extrabold shrink-0"
                        >
                          Pay Safe
                        </Link>
                      )}
                    </div>
                  ))}
                  {watchedOffers.map((o) => (
                    <div
                      key={o.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <span className="text-xs font-bold text-white">
                        Offer #{o.id.slice(0, 6)} · {o.lastStatus.toUpperCase()}
                      </span>
                      <Link
                        href={
                          o.lastStatus === "accepted"
                            ? `/pay/${o.listingId}?offer=${o.id}`
                            : `/listings/${o.listingId}`
                        }
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold"
                      >
                        Open &rarr;
                      </Link>
                    </div>
                  ))}
                </>
              )}
            </div>

            {savedSquadsList.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Saved Watchlist ({savedSquadsList.length})
                </p>
                {savedSquadsList.map((sq) => (
                  <Link
                    key={sq.id}
                    href={`/listings/${sq.id}`}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-bold text-white truncate">{sq.title}</span>
                    <span className="text-xs font-mono font-extrabold text-emerald-400 shrink-0">
                      {formatCurrency(sq.price)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 5: ESCROW VAULT & TOURNAMENTS ==================== */}
        {activeTab === "vault" && (
          <div className="space-y-4">
            {!user ? (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-extrabold text-white">
                    Unlock Your Escrow Vault
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sign in to access your private Konami ID Order Rooms, 24-hour login inspection timers, and M-Pesa payouts.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    className="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold text-xs"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-emerald-950/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      Seller M-Pesa Wallet
                    </span>
                    <Link
                      href="/seller/earnings"
                      className="text-xs font-bold text-emerald-400"
                    >
                      Withdraw &rarr;
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                      <p className="text-[10px] text-slate-400">Available KES</p>
                      <p className="text-base font-mono font-extrabold text-emerald-400">
                        {formatCurrency(profile?.available_balance || 0)}
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                      <p className="text-[10px] text-slate-400">In Escrow Hold</p>
                      <p className="text-base font-mono font-extrabold text-amber-300">
                        {formatCurrency(profile?.escrow_balance || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    My Active Escrow Rooms
                  </p>
                  {loadingVault ? (
                    <div className="py-6 flex justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                    </div>
                  ) : buyerOrders.length === 0 && sellerOrders.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No active escrow rooms yet. Any squad you buy or sell appears here.
                    </p>
                  ) : (
                    [...buyerOrders, ...sellerOrders].slice(0, 8).map((ord) => (
                      <Link
                        key={ord.id}
                        href={`/orders/${ord.id}`}
                        className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 hover:border-emerald-500/40"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {ord.order_number || `Order #${String(ord.id).slice(0, 6)}`}
                          </p>
                          <p className="text-[11px] text-emerald-400 uppercase font-semibold">
                            {String(ord.status || "pending").replace(/_/g, " ")} ·{" "}
                            {formatCurrency(ord.total_amount || 0)}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </Link>
                    ))
                  )}
                </div>
              </>
            )}

            {/* Live Cash Tournaments & Buyer Bounties */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-extrabold text-white">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Live 1v1 Cash Tournaments ({initialTournaments.length})
                </span>
                <Link href="/tournaments" className="text-xs font-bold text-emerald-400">
                  Open &rarr;
                </Link>
              </div>
              {initialTournaments.slice(0, 2).map((t) => (
                <Link
                  key={t.id}
                  href={`/tournaments/register?id=${t.id}`}
                  className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                >
                  <span className="text-xs font-bold text-white truncate">{t.title}</span>
                  <span className="text-[11px] font-mono font-extrabold text-emerald-400 shrink-0">
                    KES {Number(t.prize_pool_kes || 0).toLocaleString()}
                  </span>
                </Link>
              ))}
            </div>

            {initialWanted.length > 0 && (
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-extrabold text-white">
                    <Target className="w-4 h-4 text-emerald-400" />
                    Active Buyer Cash Bounties
                  </span>
                  <Link href="/wanted" className="text-xs font-bold text-emerald-400">
                    All &rarr;
                  </Link>
                </div>
                {initialWanted.slice(0, 2).map((w) => (
                  <Link
                    key={w.id}
                    href="/wanted"
                    className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-bold text-white truncate">{w.title}</span>
                    <span className="text-[11px] font-mono font-extrabold text-amber-300 shrink-0">
                      KES {Number(w.budget_kes || 0).toLocaleString()}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SLIDE-UP QUICK BARGAIN SHEET */}
      {bargainListing && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end justify-center p-3">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase text-emerald-400">
                  Instant App Bargain
                </p>
                <h3 className="text-sm font-extrabold text-white line-clamp-1">
                  {bargainListing.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Listed at {formatCurrency(bargainListing.price, bargainListing.currency)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBargainListing(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendOffer} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Your KES Offer
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              {!user && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Your Safaricom / WhatsApp Number (for reply alert)
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="07XX XXX XXX"
                    value={offerPhone}
                    onChange={(e) => setOfferPhone(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>
              )}

              {offerFeedback && (
                <p
                  className={`text-xs font-bold p-2.5 rounded-xl ${
                    offerFeedback.type === "ok"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/20 text-rose-300"
                  }`}
                >
                  {offerFeedback.text}
                </p>
              )}

              <button
                type="submit"
                disabled={sendingOffer}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer"
              >
                {sendingOffer ? "Pinging Seller's Phone..." : "Send Live Bargain Offer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NATIVE 5-TAB SUPER-APP DOCK */}
      <nav
        aria-label="eFootball Market Pro App Dock"
        className="fixed bottom-0 inset-x-0 z-40 bg-[#050912]/95 backdrop-blur-xl border-t border-slate-800/90 px-2 py-1.5"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("swipe")}
            className={`flex flex-col items-center py-1 rounded-xl cursor-pointer ${
              activeTab === "swipe" ? "text-emerald-400" : "text-slate-400"
            }`}
          >
            <Flame className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">Market</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("efhub")}
            className={`relative flex flex-col items-center py-1 rounded-xl cursor-pointer ${
              activeTab === "efhub" ? "text-amber-300" : "text-slate-400"
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
            <span className="text-[10px] font-extrabold mt-0.5">eF Hub</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sell")}
            className="flex flex-col items-center -mt-4 cursor-pointer"
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                activeTab === "sell"
                  ? "bg-emerald-400 text-slate-950 ring-4 ring-emerald-500/25"
                  : "bg-emerald-500 text-slate-950"
              }`}
            >
              <Plus className="w-6 h-6 stroke-[2.75]" />
            </div>
            <span
              className={`text-[10px] font-bold mt-1 ${
                activeTab === "sell" ? "text-emerald-400" : "text-slate-300"
              }`}
            >
              Valuator
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("radar")}
            className={`relative flex flex-col items-center py-1 rounded-xl cursor-pointer ${
              activeTab === "radar" ? "text-emerald-400" : "text-slate-400"
            }`}
          >
            <Radio className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">Radar</span>
            {radarBadgeCount > 0 && (
              <span className="absolute top-0.5 right-4 min-w-[16px] h-4 px-1 rounded-full bg-amber-400 text-slate-950 text-[9px] font-extrabold flex items-center justify-center">
                {radarBadgeCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("vault")}
            className={`flex flex-col items-center py-1 rounded-xl cursor-pointer ${
              activeTab === "vault" ? "text-emerald-400" : "text-slate-400"
            }`}
          >
            <Lock className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">Vault</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
