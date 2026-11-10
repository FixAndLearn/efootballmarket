"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AdBanner } from "@/components/common/AdBanner";
import { useAuth } from "@/hooks/useAuth";
import { isSuperAdminEmail, isUserAdmin } from "@/lib/security/adminAuth";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { normalizePhoneNumber } from "@/lib/utils/phone";
import { Tournament, TournamentMatch, TournamentParticipant } from "@/types/database";
import {
  Trophy,
  Zap,
  Users,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  X,
  Smartphone,
  ExternalLink,
  MessageCircle,
  Clock,
  Swords,
  Award,
  Sparkles,
  PlusCircle,
  Shuffle,
  Trash2,
  Medal,
  Check,
  Crown,
  Play,
  RotateCw,
  Lock,
  UserPlus,
  LogIn,
  Share2,
  Copy,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { calculateTournamentFee } from "@/lib/utils/tournamentFee";

export default function TournamentsPage() {
  const { user, profile, displayName } = useAuth();
  const isAdmin = isSuperAdminEmail(user?.email) || isUserAdmin(user?.email, profile?.role);

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTourney, setSelectedTourney] = useState<Tournament | null>(null);

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAuthRequiredOpen, setIsAuthRequiredOpen] = useState(false);
  const [isScoreOpen, setIsScoreOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);

  // Registration Form State
  const [gamerTag, setGamerTag] = useState("");
  const [friendId, setFriendId] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "mpesa_till">("wallet");
  const [regResult, setRegResult] = useState<{ remaining_balance?: number; paid_via_wallet?: boolean } | null>(null);
  const [submittingReg, setSubmittingReg] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState("");
  const [copiedTourneyId, setCopiedTourneyId] = useState<string | null>(null);

  // Handle URL join parameter (e.g. ?join=tourney-id)
  useEffect(() => {
    if (typeof window !== "undefined" && tournaments.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const joinId = urlParams.get("join");
      if (joinId) {
        const found = tournaments.find((t) => t.id === joinId);
        if (found) {
          setSelectedTourney(found);
        }
      }
    }
  }, [tournaments]);

  const handleCopyInvite = async (t: Tournament) => {
    try {
      const inviteUrl = `${window.location.origin}/tournaments?join=${t.id}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedTourneyId(t.id);
      setTimeout(() => setCopiedTourneyId(null), 2000);
    } catch {
      // quiet fallback
    }
  };

  // Score Post Form State
  const [score1, setScore1] = useState("0");
  const [score2, setScore2] = useState("0");
  const [matchCode, setMatchCode] = useState("");
  const [submittingScore, setSubmittingScore] = useState(false);
  const [scoreError, setScoreError] = useState("");

  // Bracket Generation State
  const [generatingBrackets, setGeneratingBrackets] = useState(false);

  const fetchTourneys = useCallback(async () => {
    try {
      const res = await fetch("/api/tournaments");
      const data = await res.json();
      if (data.tournaments) {
        setTournaments(data.tournaments);
        if (data.tournaments.length > 0) {
          // If we currently have a selected tourney, keep it updated
          setSelectedTourney((prev) => {
            if (!prev) return data.tournaments[0];
            const updated = data.tournaments.find((t: Tournament) => t.id === prev.id);
            return updated || data.tournaments[0];
          });
        } else {
          setSelectedTourney(null);
        }
      }
    } catch (err) {
      console.warn("Failed to load tournaments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTourneys();

    // Set up Realtime listener for tournaments and brackets
    const supabase = createClient();
    const channel = supabase
      .channel("tournaments-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournaments" },
        () => fetchTourneys()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournament_matches" },
        () => fetchTourneys()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournament_participants" },
        () => fetchTourneys()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTourneys]);

  // Handle Player Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTourney) return;

    if (!user) {
      setIsRegisterOpen(false);
      setIsAuthRequiredOpen(true);
      return;
    }

    setRegError("");
    setSubmittingReg(true);
    try {
      const isPaid = (selectedTourney.entry_fee_kes || 0) > 0;
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          tournament_id: selectedTourney.id,
          gamer_tag: gamerTag,
          friend_id: friendId,
          phone_number: normalizePhoneNumber(phone).international,
          user_id: user?.id,
          payment_method: isPaid ? paymentMethod : "free",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register");
      }

      setRegResult(data);
      setRegSuccess(true);
      await fetchTourneys();
    } catch (err: any) {
      setRegError(err.message || "Failed to register.");
    } finally {
      setSubmittingReg(false);
    }
  };

  // Handle Bracket Generation
  const handleGenerateBrackets = async (shuffle: boolean = false) => {
    if (!selectedTourney) return;
    setGeneratingBrackets(true);
    try {
      const res = await fetch("/api/tournaments/brackets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournament_id: selectedTourney.id,
          shuffle,
          admin_email: user?.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to form brackets.");
        return;
      }

      await fetchTourneys();
    } catch (err: any) {
      alert(err.message || "Error generating brackets.");
    } finally {
      setGeneratingBrackets(false);
    }
  };

  // Handle Match Score Submission & Progression
  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTourney || !selectedMatch) return;
    setScoreError("");
    setSubmittingScore(true);

    const s1 = parseInt(score1, 10);
    const s2 = parseInt(score2, 10);

    if (isNaN(s1) || isNaN(s2)) {
      setScoreError("Please enter valid numerical scores.");
      setSubmittingScore(false);
      return;
    }

    if (s1 === s2) {
      setScoreError("Knockout matches cannot end in a draw! Extra Time or Penalties must decide the winner.");
      setSubmittingScore(false);
      return;
    }

    const winnerName = s1 > s2 ? selectedMatch.player1_name : selectedMatch.player2_name;

    try {
      const res = await fetch("/api/tournaments/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournament_id: selectedTourney.id,
          match_id: selectedMatch.id,
          score1: s1,
          score2: s2,
          winner_name: winnerName,
          match_code: matchCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit match score.");
      }

      setIsScoreOpen(false);
      setSelectedMatch(null);
      await fetchTourneys();

      if (data.isChampionCrowned) {
        alert(`🏆 CHAMPION CROWNED! ${data.championName} has won the tournament! Prize money dispatched via Till 1572931.`);
      }
    } catch (err: any) {
      setScoreError(err.message || "Failed to post score.");
    } finally {
      setSubmittingScore(false);
    }
  };

  // Handle Tournament Deletion (Admin)
  const handleDeleteTournament = async (tourneyId: string) => {
    if (!confirm("Are you sure you want to delete this tournament? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/tournaments?id=${tourneyId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchTourneys();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete tournament.");
      }
    } catch (e: any) {
      alert(e.message || "Error deleting tournament.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Hero Header */}
      <div className="relative rounded-2xl store-panel p-6 sm:p-9 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none"
          style={{ backgroundImage: "url('/images/hero-stadium.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D1117] via-[#0D1117]/90 to-[#0D1117]/55 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-block px-2.5 py-0.5 rounded bg-[#FEF3C7] border border-amber-500/35 text-[11px] font-mono font-bold text-[#92400E] uppercase">
              Competitive Arena &middot; Till 1572931
            </span>

            <h1 className="text-2xl sm:text-4xl font-bold text-[#0F0F0F] font-display tracking-tight">
              1v1 Matches &amp; Knockout Tournaments
            </h1>

            <p className="text-xs sm:text-sm text-[#3D3D3D] leading-relaxed">
              Register with your eFootball Friend ID, compete in tracked Konami Match Rooms, submit final score screenshots, and receive M-Pesa prize payouts via Till <strong className="text-[#006340]">1572931</strong>.
            </p>
          </div>

          {/* Host Actions */}
          <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
            <Link
              href="/tournaments/host?type=1v1"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#006340] hover:bg-[#004D32] text-[#0F0F0F] font-bold text-xs transition-colors"
            >
              <Swords className="w-4 h-4" />
              <span>Create 1v1 Match</span>
            </Link>

            <Link
              href="/tournaments/host?type=tournament"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#F4F3F1] hover:bg-[#19212E] border border-[#DCDCD8] text-[#0F0F0F] font-semibold text-xs transition-colors"
            >
              <Trophy className="w-4 h-4 text-[#B45309]" />
              <span>Host 4–16 Player Cup</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Membership Banner for Guests */}
      {!loading && !user && (
        <div className="rounded-xl store-panel p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#F4F3F1] border border-[#DCDCD8] text-[#B45309] flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-[#0F0F0F] font-display">
                Sign In Required to Enter Brackets
              </h3>
              <p className="text-xs text-[#5F5F5F] max-w-2xl leading-relaxed">
                Tournaments pay out real M-Pesa prize pools via Till 1572931. Sign in or create an account so your Friend ID and payout number are verified.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Link
              href="/register?redirect=/tournaments"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#006340] hover:bg-[#004D32] text-[#0F0F0F] font-bold text-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </Link>
            <Link
              href="/login?redirect=/tournaments"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#F4F3F1] hover:bg-[#19212E] text-[#1F1F1F] border border-[#DCDCD8] font-semibold text-xs transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      )}

      {/* Tournaments Grid Header */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E2E2E0]">
          <h2 className="text-lg sm:text-xl font-bold text-[#0F0F0F] font-display">
            Active Brackets &amp; Matches
          </h2>
          <span className="text-xs font-mono text-[#5F5F5F]">East Africa Time (EAT)</span>
        </div>

        {loading ? (
          <div className="py-14 text-center text-[#5F5F5F] flex flex-col items-center gap-2.5">
            <RotateCw className="w-6 h-6 animate-spin text-[#006340]" />
            <span className="text-xs">Loading brackets...</span>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-12 store-panel rounded-2xl p-8 space-y-3">
            <Trophy className="w-10 h-10 text-[#767676] mx-auto stroke-[1.5]" />
            <h3 className="text-base font-bold text-[#0F0F0F] font-display">No Open Brackets Right Now</h3>
            <p className="text-xs text-[#5F5F5F] max-w-md mx-auto leading-relaxed">
              No scheduled cups are currently open for registration. You can challenge another player to a 1v1 match or host a 4–16 player knockout cup.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/tournaments/host?type=1v1"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#006340] hover:bg-[#004D32] text-[#0F0F0F] font-bold text-xs transition-colors"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Create 1v1 Match</span>
              </Link>
              <Link
                href="/tournaments/host?type=tournament"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F4F3F1] hover:bg-[#19212E] border border-[#DCDCD8] text-[#0F0F0F] font-semibold text-xs transition-colors"
              >
                <Trophy className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Host Knockout Cup</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tournaments.map((t) => {
              const isFull = t.registered_count >= t.max_players;
              const progressPercent = Math.min(100, Math.round((t.registered_count / t.max_players) * 100));
              const isSelected = selectedTourney?.id === t.id;
              const isModerator = (user && t.created_by === user.id) || isAdmin;
              const isMyTournament = user && t.created_by === user.id;

              return (
                <div
                  key={t.id}
                  className={`bg-pitch-surface border rounded-3xl p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 ${
                    isSelected
                      ? "border-amber-500 shadow-amber-500/10 ring-1 ring-amber-500/50"
                      : "border-pitch-border hover:border-[#9E9E99]"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {t.tournament_type === "1v1" || t.max_players <= 2 ? (
                          <span className="text-[10px] font-extrabold text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded-full border border-[#FDE68A] flex items-center gap-1">
                            <Swords className="w-3 h-3 text-[#B45309]" />
                            <span>1v1 SHOWMATCH</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#3730A3] bg-[#EEF2FF] px-2 py-0.5 rounded-full border border-[#C7D2FE] flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-[#4338CA]" />
                            <span>{t.max_players}-PLAYER CUP</span>
                          </span>
                        )}
                        <Badge
                          variant={
                            t.status === "completed"
                              ? "default"
                              : t.status === "in_progress"
                              ? "brand"
                              : "gold"
                          }
                          size="sm"
                        >
                          {t.status === "registration_open"
                            ? "REGISTRATION OPEN"
                            : t.status === "in_progress"
                            ? "BRACKETS LIVE"
                            : "COMPLETED"}
                        </Badge>
                        {isMyTournament ? (
                          <span className="text-[10px] font-bold text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                            👑 You are Moderator
                          </span>
                        ) : t.created_by ? (
                          <span className="text-[10px] font-medium text-[#3D3D3D] bg-[#F4F3F1] px-2 py-0.5 rounded-full border border-[#C8C8C4]">
                            Community Hosted
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#006340] bg-[#EBF5F0] px-2 py-0.5 rounded-full border border-[#BFE0CE]">
                            Official Cup
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-bold text-[#006340] font-mono">
                        {t.entry_fee_kes === 0 ? "FREE ENTRY" : `Entry: KES ${t.entry_fee_kes}`}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[#0F0F0F] font-display">{t.title}</h3>
                      {t.subtitle && <p className="text-xs text-[#5F5F5F] mt-1">{t.subtitle}</p>}
                    </div>

                    {/* Prize Pool Breakdown */}
                    <div className="p-4 rounded-2xl bg-pitch-card border border-pitch-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#5F5F5F] font-semibold">
                          {t.tournament_type === "1v1" || t.max_players <= 2 ? "Winner Takes All (Net Pool)" : "Total Prize Pool"}
                        </span>
                        <span className="text-lg font-extrabold text-[#92400E] font-display">
                          {formatCurrency(t.prize_pool_kes, "KES")}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-pitch-border/60 text-[11px] text-[#3D3D3D]">
                        {t.tournament_type === "1v1" || t.max_players <= 2 || t.payout_split === "winner_takes_all" ? (
                          <div className="col-span-2 text-[#006340] font-bold">
                            👑 Champion Takes 100%: <strong>{formatCurrency(t.prize_pool_kes, "KES")}</strong>
                          </div>
                        ) : (
                          <>
                            <div>🥇 1st: <strong>{formatCurrency(t.first_place_kes, "KES")}</strong></div>
                            <div>🥈 2nd: <strong>{formatCurrency(t.second_place_kes, "KES")}</strong></div>
                          </>
                        )}
                      </div>
                      {t.entry_fee_kes > 0 && (
                        <div className="pt-1 text-[10px] text-[#5F5F5F] flex items-center justify-between border-t border-pitch-border/40">
                          <span className="flex items-center gap-1 text-[#006340] font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Escrow Protected</span>
                          </span>
                          <span className="text-[#B45309]/90 font-mono">
                            Platform Deal: KES {t.admin_fee_kes ?? calculateTournamentFee(t.entry_fee_kes * t.max_players)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Registered Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-[#3D3D3D] font-medium">
                        <span>Slots Filled:</span>
                        <strong>{t.registered_count} / {t.max_players} Gamers</strong>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#F4F3F1] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#5F5F5F]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#767676]" />
                        <span>{t.start_date}</span>
                      </div>
                      <span className="uppercase text-[10px] font-bold text-[#5F5F5F]">
                        {t.platform}
                      </span>
                    </div>

                    {/* Winner Banner if Completed */}
                    {t.status === "completed" && t.winner_name && (
                      <div className="p-3 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs flex items-center gap-2">
                        <Crown className="w-4 h-4 text-[#B45309] shrink-0" />
                        <span><strong>Champion:</strong> {t.winner_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="mt-6 pt-4 border-t border-pitch-border/60 space-y-2">
                    <div className="flex items-center gap-2">
                      {t.status === "registration_open" && (
                        <Link
                          href={isFull ? "#" : `/tournaments/register?id=${t.id}`}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                            isFull
                              ? "bg-[#F4F3F1] text-[#767676] cursor-not-allowed pointer-events-none"
                              : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-md shadow-amber-500/10 cursor-pointer"
                          }`}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{isFull ? "Tournament Full" : "Register Slot"}</span>
                        </Link>
                      )}

                      <Button
                        variant={isSelected ? "gold" : "secondary"}
                        size="md"
                        className="flex-1 text-xs font-semibold cursor-pointer"
                        onClick={() => setSelectedTourney(t)}
                      >
                        {isSelected ? "Viewing Bracket" : "View Bracket"}
                      </Button>
                    </div>

                    {/* Invite Players Trigger */}
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `🎮 Join my eFootball tournament "${t.title}"!\n🏆 Prize Pool: KES ${t.prize_pool_kes.toLocaleString()}\n🎟️ Entry Fee: ${
                            t.entry_fee_kes > 0 ? `KES ${t.entry_fee_kes}` : "FREE"
                          }\n⚡ Format: ${t.format}\n\n👉 Register now: https://efootballmarket.co.ke/tournaments?join=${t.id}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#EBF5F0] hover:bg-[#EBF5F0] border border-[#BFE0CE] text-[#006340] font-bold text-[11px] transition-all shadow-sm cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#006340] fill-emerald-400" />
                        <span>Invite on WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyInvite(t)}
                        className="p-2 rounded-xl bg-pitch-card hover:bg-[#F4F3F1] border border-pitch-border text-[#3D3D3D] hover:text-[#0F0F0F] transition-all text-xs cursor-pointer"
                        title="Copy Tournament Link"
                      >
                        {copiedTourneyId === t.id ? (
                          <Check className="w-3.5 h-3.5 text-[#006340]" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Moderator / Admin Management Buttons */}
                    {isModerator && (
                      <div className="flex items-center gap-2 pt-1 border-t border-pitch-border/40">
                        {t.status === "registration_open" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTourney(t);
                              handleGenerateBrackets(false);
                            }}
                            disabled={generatingBrackets}
                            className="flex-1 text-[11px] font-bold text-[#B45309] hover:text-[#92400E] py-1.5 px-2 rounded-xl bg-[#FEF3C7] hover:bg-[#FEF3C7] border border-[#FDE68A] transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                            <span>Form Brackets</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteTournament(t.id)}
                          className="p-1.5 rounded-xl text-[#C92A2A] hover:text-[#B91C1C] hover:bg-[#FEE2E2] border border-[#FECACA] transition-all cursor-pointer"
                          title="Delete / cancel tournament"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Tournament Live Bracket & Match Room Center */}
      {selectedTourney && (
        <div className="bg-pitch-surface border border-pitch-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pitch-border pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-[#B45309] tracking-wider">
                  Live Knockout Bracket & Score Center
                </span>
                <Badge
                  variant={selectedTourney.status === "completed" ? "default" : "brand"}
                  size="sm"
                >
                  {selectedTourney.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-[#0F0F0F] font-display mt-1">
                {selectedTourney.title}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-[#3D3D3D] font-semibold bg-pitch-card px-3 py-1.5 rounded-xl border border-pitch-border">
                Prize Pool: <strong className="text-[#006340]">{formatCurrency(selectedTourney.prize_pool_kes, "KES")}</strong>
              </span>

              {((user && selectedTourney.created_by === user.id) || isAdmin) && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="gold"
                    size="sm"
                    className="text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    disabled={generatingBrackets}
                    onClick={() => handleGenerateBrackets(false)}
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>{selectedTourney.matches && selectedTourney.matches.length > 0 ? "Re-form Brackets" : "Form Brackets"}</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Champion Crowned Celebration Banner */}
          {selectedTourney.status === "completed" && selectedTourney.winner_name && (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 p-6 sm:p-8 text-black shadow-2xl border border-amber-300">
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-black/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <Crown className="w-10 h-10 text-[#0F0F0F] fill-white" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-black/70">
                      Official Tournament Champion Crowned
                    </span>
                    <h4 className="text-2xl sm:text-3xl font-black text-black">
                      {selectedTourney.winner_name}
                    </h4>
                    <p className="text-xs font-bold text-black/80 mt-1">
                      Awarded 1st Place Champion Reward of {formatCurrency(selectedTourney.first_place_kes, "KES")} via Till 1572931!
                    </p>
                  </div>
                </div>

                <a
                  href={`https://wa.me/254794400365?text=${encodeURIComponent(
                    `Congratulations to Champion ${selectedTourney.winner_name} for winning "${selectedTourney.title}"! Prize of KES ${selectedTourney.first_place_kes} confirmed.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-xl bg-black text-white hover:bg-[#F9F9F8] font-bold text-xs shadow-lg transition-all flex items-center gap-2 shrink-0"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Verify Payout Receipt</span>
                </a>
              </div>
            </div>
          )}

          {/* Bracket Tree Display */}
          {selectedTourney.matches && selectedTourney.matches.length > 0 ? (
            <div className="space-y-6">
              {/* Filter rounds */}
              {(() => {
                const rounds = Array.from(new Set(selectedTourney.matches!.map((m) => m.round)));

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    {rounds.map((roundName) => {
                      const roundMatches = selectedTourney.matches!.filter((m) => m.round === roundName);

                      return (
                        <div key={roundName} className="space-y-4">
                          <h4 className="text-xs font-bold text-[#3D3D3D] uppercase tracking-wider text-center py-1.5 rounded-xl bg-[#F9F9F8] border border-[#E2E2E0] flex items-center justify-center gap-1.5">
                            <Swords className="w-3.5 h-3.5 text-[#B45309]" />
                            <span>{roundName}</span>
                          </h4>

                          <div className="space-y-3">
                            {roundMatches.map((m) => {
                              const isModerator = (user && selectedTourney?.created_by === user.id) || isAdmin;
                              const canPostScore = !m.is_completed || isModerator;

                              return (
                                <div
                                  key={m.id}
                                  className={`p-4 rounded-2xl bg-pitch-card border space-y-2 text-xs shadow-md transition-all ${
                                    m.is_completed
                                      ? "border-[#BFE0CE] ring-1 ring-emerald-500/20"
                                      : "border-pitch-border hover:border-[#9E9E99]"
                                  }`}
                                >
                                  {/* Match Number & Status */}
                                  <div className="flex items-center justify-between text-[11px] text-[#5F5F5F] pb-1 border-b border-[#E2E2E0]">
                                    <span>Match #{m.match_number}</span>
                                    {m.is_completed ? (
                                      <span className="text-[#006340] font-semibold flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Completed
                                      </span>
                                    ) : (
                                      <span className="text-[#B45309] font-semibold">Active Match</span>
                                    )}
                                  </div>

                                  {/* Player 1 Row */}
                                  <div className="flex items-center justify-between py-1">
                                    <span
                                      className={`font-semibold ${
                                        m.winner_name === m.player1_name
                                          ? "text-[#006340] font-bold"
                                          : "text-[#1F1F1F]"
                                      }`}
                                    >
                                      {m.player1_name}
                                    </span>
                                    <strong className="text-[#0F0F0F] px-2 py-0.5 bg-[#F4F3F1] rounded font-mono">
                                      {m.score1 !== undefined && m.score1 !== null ? m.score1 : "-"}
                                    </strong>
                                  </div>

                                  {/* Player 2 Row */}
                                  <div className="flex items-center justify-between border-t border-[#E2E2E0] pt-1.5 pb-1">
                                    <span
                                      className={`font-semibold ${
                                        m.winner_name === m.player2_name
                                          ? "text-[#006340] font-bold"
                                          : "text-[#1F1F1F]"
                                      }`}
                                    >
                                      {m.player2_name}
                                    </span>
                                    <strong className="text-[#0F0F0F] px-2 py-0.5 bg-[#F4F3F1] rounded font-mono">
                                      {m.score2 !== undefined && m.score2 !== null ? m.score2 : "-"}
                                    </strong>
                                  </div>

                                  {/* Winner Notification / Advance Note */}
                                  {m.winner_name && (
                                    <div className="text-[10px] text-[#006340] font-semibold text-right pt-1">
                                      ✓ Winner: {m.winner_name}
                                    </div>
                                  )}

                                  {/* Score Submission Button */}
                                  {canPostScore && (
                                    <div className="pt-2 border-t border-[#E2E2E0]">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedMatch(m);
                                          setScore1(String(m.score1 || 0));
                                          setScore2(String(m.score2 || 0));
                                          setMatchCode(m.match_code || "");
                                          setIsScoreOpen(true);
                                          setScoreError("");
                                        }}
                                        className="w-full py-1.5 px-3 rounded-xl bg-[#FEF3C7] hover:bg-amber-500/25 border border-[#FDE68A] text-[#92400E] font-bold text-[11px] transition-all flex items-center justify-center gap-1.5"
                                      >
                                        <Award className="w-3.5 h-3.5" />
                                        <span>{m.is_completed ? "Update Score (Moderator)" : "Post Match Result"}</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Brackets not generated yet */
            <div className="p-8 rounded-2xl bg-pitch-card border border-pitch-border text-center space-y-4">
              <Swords className="w-10 h-10 text-[#767676] mx-auto" />
              <h4 className="text-base font-bold text-[#0F0F0F]">Knockout Brackets Pending Formation</h4>
              <p className="text-xs text-[#5F5F5F] max-w-md mx-auto">
                Players are currently registering for this tournament. Once slots are filled or registration ends, the administrator will form the official pairings!
              </p>
              {isAdmin && (
                <Button
                  variant="gold"
                  size="md"
                  onClick={() => handleGenerateBrackets(false)}
                  disabled={generatingBrackets}
                  className="font-bold inline-flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Form / Generate Brackets Now</span>
                </Button>
              )}
            </div>
          )}

          {/* Registered Participants Roster */}
          <div className="border-t border-pitch-border pt-6 space-y-3">
            <h4 className="text-sm font-bold text-[#0F0F0F] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#B45309]" />
              <span>Registered Gamers ({selectedTourney.participants?.length || 0} / {selectedTourney.max_players})</span>
            </h4>

            {(!selectedTourney.participants || selectedTourney.participants.length === 0) ? (
              <p className="text-xs text-[#767676] italic">No players have registered for this tournament yet. Be the first!</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {selectedTourney.participants.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-2.5 rounded-xl bg-pitch-card border border-pitch-border text-xs flex items-center justify-between"
                  >
                    <div className="truncate">
                      <strong className="text-[#0F0F0F] block truncate">{p.gamer_tag}</strong>
                      <span className="text-[10px] text-[#5F5F5F]">ID: {p.friend_id}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#006340] font-bold ml-1">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Official Fair Play Rules */}
      <div className="bg-[#F9F9F8] border border-[#E2E2E0] rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="text-lg font-bold text-[#0F0F0F] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#006340]" />
          <span>eFootball Kenya Fair Play Protocol & Rules</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#3D3D3D] pt-1">
          <div className="p-4 rounded-xl bg-pitch-card border border-pitch-border space-y-1.5">
            <strong className="text-[#B45309] block font-bold">1. Match Settings (12-Minute Game)</strong>
            Standard 12-minute match length, Extra Time enabled, PK shootout enabled. Both players set match duration to 12 mins in eFootball Friend Match settings.
          </div>
          <div className="p-4 rounded-xl bg-pitch-card border border-pitch-border space-y-1.5">
            <strong className="text-[#B45309] block font-bold">2. Score Verification</strong>
            Both players post final match screenshot in the Match Room or submit scores directly on this page.
          </div>
          <div className="p-4 rounded-xl bg-pitch-card border border-pitch-border space-y-1.5">
            <strong className="text-[#B45309] block font-bold">3. Verified Payouts</strong>
            Winnings are sent to Safaricom M-Pesa after final score verification (Support: 0794 400 365).
          </div>
        </div>
      </div>

      {/* Tournament bracket utility screen — ads disabled */}
      <AdBanner
        slot="tournaments_bottom"
        format="horizontal"
        hasContent={false}
      />

      {/* MODAL 0: Community Membership Required Guard Modal */}
      {isAuthRequiredOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-pitch-surface border border-pitch-border rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-pitch-border bg-gradient-to-r from-amber-950/60 via-pitch-card to-pitch-surface flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F0F0F]">Community Registration Required</h3>
                  <p className="text-xs text-[#B45309]/90 font-medium">Official Tournament Entry Protocol</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthRequiredOpen(false)}
                className="p-1.5 rounded-lg text-[#5F5F5F] hover:text-[#0F0F0F] hover:bg-[#F4F3F1] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-[#0F0F0F] font-display">
                  Only Registered Members Can Join Tournaments
                </h4>
                <p className="text-xs text-[#3D3D3D] leading-relaxed">
                  To ensure competitive integrity, prevent bracket abandonment, and guarantee secure M-Pesa prize payouts, all players must be registered members of our eFootball Kenya community.
                </p>
              </div>

              {/* Requirement Checklist */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-pitch-card border border-pitch-border/70 text-xs">
                <div className="flex items-start gap-2.5 text-[#3D3D3D]">
                  <ShieldCheck className="w-4 h-4 text-[#006340] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#0F0F0F]">Fair Play & No Multiple Slots:</strong> One slot per verified community member account.
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-[#3D3D3D]">
                  <Award className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#0F0F0F]">Instant M-Pesa Payout:</strong> Winnings sent via Safaricom Till 1572931 directly to your phone.
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-[#3D3D3D]">
                  <Swords className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#0F0F0F]">Live Match Rooms:</strong> Direct access to opponents, bracket updates, and score submission.
                  </div>
                </div>
              </div>

              {selectedTourney && (
                <div className="p-3 rounded-xl bg-[#F9F9F8] border border-[#E2E2E0] flex items-center justify-between text-xs">
                  <span className="text-[#5F5F5F] truncate max-w-[200px]">
                    Target: <strong className="text-[#0F0F0F]">{selectedTourney.title}</strong>
                  </span>
                  <span className="text-[#B45309] font-bold shrink-0">
                    Prize: {formatCurrency(selectedTourney.prize_pool_kes, "KES")}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <Link
                  href="/register?redirect=/tournaments"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all text-center"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Free Account & Join Tournament</span>
                </Link>

                <Link
                  href="/login?redirect=/tournaments"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-pitch-card hover:bg-[#F4F3F1] border border-pitch-border text-[#0F0F0F] font-bold text-xs transition-all text-center"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Already Have an Account? Log In</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsAuthRequiredOpen(false)}
                  className="w-full py-2 text-xs text-[#767676] hover:text-[#5F5F5F] text-center transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Registration Modal */}
      {isRegisterOpen && selectedTourney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-pitch-surface border border-pitch-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-pitch-border bg-pitch-card/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F0F0F]">
                    {selectedTourney.tournament_type === "1v1" ? "Join 1v1 Match" : "Join Tournament"}
                  </h3>
                  <p className="text-xs text-[#5F5F5F]">{selectedTourney.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="p-1.5 rounded-lg text-[#5F5F5F] hover:text-[#0F0F0F] hover:bg-[#F4F3F1] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-6 overflow-y-auto space-y-4">
              {regSuccess ? (
                <div className="p-4 rounded-2xl bg-[#EBF5F0] border border-emerald-500 text-[#006340] text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-[#006340]" />
                  <h4 className="text-base font-bold text-[#0F0F0F]">Registration Confirmed!</h4>
                  {regResult?.paid_via_wallet ? (
                    <div className="p-3.5 rounded-2xl bg-[#EBF5F0] border border-[#BFE0CE] text-xs text-[#1F1F1F] space-y-1.5 text-left">
                      <div className="flex items-center gap-2 text-[#006340] font-bold">
                        <Wallet className="w-4 h-4" />
                        <span>Paid with Account Balance!</span>
                      </div>
                      <p className="text-[11px] text-[#3D3D3D]">
                        Entry fee of <strong>KES {selectedTourney.entry_fee_kes.toLocaleString()}</strong> has been deducted directly from your account balance. Your slot is guaranteed immediately!
                      </p>
                      {regResult.remaining_balance !== undefined && (
                        <div className="pt-1 border-t border-[#BFE0CE] flex items-center justify-between text-[11px]">
                          <span className="text-[#5F5F5F]">Remaining Balance:</span>
                          <strong className="text-[#006340] font-mono">
                            KES {regResult.remaining_balance.toLocaleString()}
                          </strong>
                        </div>
                      )}
                    </div>
                  ) : selectedTourney.entry_fee_kes > 0 ? (
                    <div className="p-3.5 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-xs text-[#1F1F1F] space-y-1.5 text-left">
                      <div className="flex items-center gap-2 text-[#92400E] font-bold">
                        <Smartphone className="w-4 h-4" />
                        <span>Slot Reserved — Pay via Till 1572931</span>
                      </div>
                      <p className="text-[11px] text-[#3D3D3D]">
                        Please send <strong>KES {selectedTourney.entry_fee_kes.toLocaleString()}</strong> to Safaricom Buy Goods Till <strong className="text-[#92400E] font-mono">1572931</strong> (EFootballMarket). Moderator Brian Okibo will verify and approve your slot.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#1F1F1F]">
                      Free slot locked in! Get your eFootball squad ready.
                    </p>
                  )}

                  <a
                    href={`https://wa.me/254794400365?text=${encodeURIComponent(
                      `Hello Brian Okibo, I registered for "${selectedTourney.title}"! Gamer Tag: ${gamerTag}, Friend ID: ${friendId}. Phone: ${phone}. Payment: ${
                        regResult?.paid_via_wallet
                          ? `Paid via Account Balance (KES ${selectedTourney.entry_fee_kes})`
                          : selectedTourney.entry_fee_kes > 0
                          ? `Paying KES ${selectedTourney.entry_fee_kes} via Till 1572931`
                          : "Free Entry"
                      }. Ready for match room!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Join Tournament WhatsApp Room</span>
                  </a>
                </div>
              ) : (
                <>
                  {/* Verified Member Badge */}
                  {user && (
                    <div className="p-3 rounded-2xl bg-pitch-card border border-pitch-border/80 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#EBF5F0] text-[#006340] flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-[#0F0F0F] block">
                            Community Member Verified
                          </span>
                          <span className="text-[10px] text-[#006340] font-mono">
                            {displayName || profile?.username || user?.email}
                          </span>
                        </div>
                      </div>
                      <Badge variant="brand" size="sm">Eligible</Badge>
                    </div>
                  )}

                  {regError && (
                    <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-xs">
                      {regError}
                    </div>
                  )}

                  <Input
                    label="Gamer Tag / In-game Name"
                    placeholder="e.g. Otieno_Striker"
                    value={gamerTag}
                    onChange={(e) => setGamerTag(e.target.value)}
                    required
                  />

                  <Input
                    label="eFootball Mobile Friend ID"
                    placeholder="e.g. 123-456-789 (Find in Extras -> User Details)"
                    value={friendId}
                    onChange={(e) => setFriendId(e.target.value)}
                    required
                  />

                  <Input
                    label="Safaricom Phone Number (For M-Pesa Payout)"
                    placeholder="e.g. +254 712 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />

                  {/* Payment Method Selector if Entry Fee > 0 */}
                  {selectedTourney.entry_fee_kes > 0 ? (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-[#3D3D3D]">
                          Payment Method
                        </label>
                        <span className="text-xs font-mono font-bold text-[#B45309]">
                          Entry: KES {selectedTourney.entry_fee_kes.toLocaleString()}
                        </span>
                      </div>

                      {/* Option 1: Account Wallet Balance */}
                      {(() => {
                        const balance = profile?.available_balance || 0;
                        const hasEnough = balance >= selectedTourney.entry_fee_kes;

                        return (
                          <div
                            onClick={() => {
                              if (hasEnough) setPaymentMethod("wallet");
                            }}
                            className={`p-3.5 rounded-2xl border transition-all ${
                              !hasEnough
                                ? "bg-[#F9F9F8] border-[#E2E2E0] opacity-60 cursor-not-allowed"
                                : paymentMethod === "wallet"
                                ? "bg-[#EBF5F0] border-emerald-500 ring-1 ring-emerald-500/40 cursor-pointer shadow-md"
                                : "bg-pitch-card border-pitch-border hover:border-[#C8C8C4] cursor-pointer"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  paymentMethod === "wallet" && hasEnough
                                    ? "border-emerald-400 bg-emerald-500"
                                    : "border-[#9E9E99]"
                                }`}
                              >
                                {paymentMethod === "wallet" && hasEnough && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-black" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-[#0F0F0F] flex items-center gap-1.5">
                                    <Wallet className="w-3.5 h-3.5 text-[#006340]" />
                                    <span>Pay with Account Balance</span>
                                  </span>
                                  <span
                                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                      hasEnough
                                        ? "bg-[#EBF5F0] text-[#006340] border border-[#BFE0CE]"
                                        : "bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]"
                                    }`}
                                  >
                                    KES {balance.toLocaleString()} Available
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#5F5F5F] mt-1 leading-relaxed">
                                  {hasEnough
                                    ? `Instant deduction of KES ${selectedTourney.entry_fee_kes.toLocaleString()} from your wallet. Zero SMS waiting.`
                                    : `Insufficient wallet balance (KES ${balance.toLocaleString()} available / KES ${selectedTourney.entry_fee_kes.toLocaleString()} required). Top up or choose Till payment below.`}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Option 2: Safaricom Till 1572931 */}
                      <div
                        onClick={() => setPaymentMethod("mpesa_till")}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          paymentMethod === "mpesa_till"
                            ? "bg-[#FEF3C7] border-amber-500 ring-1 ring-amber-500/40 shadow-md"
                            : "bg-pitch-card border-pitch-border hover:border-[#C8C8C4]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${
                              paymentMethod === "mpesa_till"
                                ? "border-amber-400 bg-amber-500"
                                : "border-[#9E9E99]"
                            }`}
                          >
                            {paymentMethod === "mpesa_till" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-black" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-xs font-bold text-[#0F0F0F] flex items-center gap-1.5">
                                <Smartphone className="w-3.5 h-3.5 text-[#B45309]" />
                                <span>Pay via Safaricom Till</span>
                              </span>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-mono">
                                Till 1572931
                              </span>
                            </div>
                            <p className="text-[11px] text-[#5F5F5F] mt-1 leading-relaxed">
                              Send KES {selectedTourney.entry_fee_kes.toLocaleString()} to Buy Goods Till{" "}
                              <strong className="text-[#92400E] font-mono">1572931</strong> (EFootballMarket). Moderator verifies M-Pesa ref.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-[#EBF5F0] border border-[#BFE0CE] text-xs text-[#006340] flex items-center justify-between">
                      <span>Entry Fee:</span>
                      <strong className="font-bold">FREE ENTRY</strong>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="gold"
                      size="lg"
                      className="w-full font-bold cursor-pointer"
                      isLoading={submittingReg}
                    >
                      Confirm Registration
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Submit / Post Match Score */}
      {isScoreOpen && selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-pitch-surface border border-pitch-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-pitch-border bg-pitch-card/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F0F0F]">Post Match Score</h3>
                  <p className="text-xs text-[#5F5F5F]">{selectedMatch.round} | Match #{selectedMatch.match_number}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScoreOpen(false)}
                className="p-1.5 rounded-lg text-[#5F5F5F] hover:text-[#0F0F0F] hover:bg-[#F4F3F1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitScore} className="p-6 overflow-y-auto space-y-4">
              {scoreError && (
                <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-xs">
                  {scoreError}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-pitch-card border border-pitch-border space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-[#0F0F0F] flex-1 truncate">
                    {selectedMatch.player1_name}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={score1}
                    onChange={(e) => setScore1(e.target.value)}
                    className="w-16 px-3 py-2 text-center text-lg font-bold font-mono rounded-xl bg-[#F4F3F1] border border-[#C8C8C4] text-[#0F0F0F] focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[#E2E2E0] pt-3">
                  <span className="text-xs font-bold text-[#0F0F0F] flex-1 truncate">
                    {selectedMatch.player2_name}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={score2}
                    onChange={(e) => setScore2(e.target.value)}
                    className="w-16 px-3 py-2 text-center text-lg font-bold font-mono rounded-xl bg-[#F4F3F1] border border-[#C8C8C4] text-[#0F0F0F] focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <Input
                label="Konami In-game Match Room Code (Optional)"
                placeholder="e.g. 9812-4512"
                value={matchCode}
                onChange={(e) => setMatchCode(e.target.value)}
              />

              <div className="text-[11px] text-[#5F5F5F]">
                Note: Submitting this score will automatically advance the winner into the next bracket match. If this is the Grand Final, the winner will be crowned Tournament Champion!
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  className="w-full font-bold"
                  isLoading={submittingScore}
                >
                  Confirm & Advance Winner
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
