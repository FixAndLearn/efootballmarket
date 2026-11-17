"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DetailTabLink } from "@/components/ui/DetailTabLink";
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
  AlertCircle,
  Lock,
  UserPlus,
  LogIn,
  Share2,
  Copy,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { calculateTournamentFee } from "@/lib/utils/tournamentFee";
import { QuietAlertOptIn } from "@/components/common/QuietAlertOptIn";
import { saveTournamentRegistrationDraft } from "@/lib/tournaments/registrationDraft";

export default function TournamentsPage() {
  const router = useRouter();
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
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "mpesa_stk">("wallet");
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
    const isPaid = (selectedTourney.entry_fee_kes || 0) > 0;
    if (isPaid && paymentMethod === "mpesa_stk") {
      const draftSaved = saveTournamentRegistrationDraft({
        tournament_id: selectedTourney.id,
        gamer_tag: gamerTag,
        friend_id: friendId,
        phone_number: phone,
      });
      if (!draftSaved) {
        setRegError("Your browser could not preserve these details for the payment page. Keep this form open and check your browser storage settings, or continue to the registration page and enter them again.");
        return;
      }
      setIsRegisterOpen(false);
      router.push(`/tournaments/register?id=${encodeURIComponent(selectedTourney.id)}`);
      return;
    }

    setSubmittingReg(true);
    try {
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

      setRegResult({
        remaining_balance: data.remainingBalance,
        paid_via_wallet: isPaid && paymentMethod === "wallet",
      });
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
        alert(`CHAMPION RECORDED! ${data.championName} won the tournament. The desk has been alerted to arrange any published prize manually; this does not confirm payment.`);
      }
    } catch (err: any) {
      setScoreError(err.message || "Failed to post score.");
    } finally {
      setSubmittingScore(false);
    }
  };

  // Handle Tournament Deletion (Admin)
  const handleDeleteTournament = async (tourneyId: string) => {
    if (!confirm("Remove this tournament only if it has no payment or registration activity? Removal does not issue a refund. Tournaments with payment or registration records are blocked; contact support for cancellation or refund review.")) return;
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
      <div className="relative rounded-xl bg-sx-stone border border-sx-border p-6 sm:p-9 overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-block px-2.5 py-0.5 rounded bg-sx-green-tint border border-sx-green-border text-[11px] font-mono font-bold text-sx-green-text uppercase">
              Competitive Tournament Arena
            </span>

            <h1 className="text-2xl sm:text-4xl font-bold text-sx-ink font-display tracking-tight">
              1v1 Matches &amp; Knockout Tournaments
            </h1>

            <p className="text-xs sm:text-sm text-sx-ink-soft leading-relaxed">
              Register with your eFootball Friend ID, compete in tracked match brackets, and submit final scores. After a final result is recorded, the tournament desk is alerted to review and manually arrange any published prize; this page does not confirm payment.
            </p>
          </div>

          {/* Host Actions */}
          <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
            <Link
              href="/tournaments/host?type=1v1"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-sx-green hover:bg-sx-green-hover text-white font-bold text-xs transition-colors"
            >
              <Swords className="w-4 h-4" />
              <span>Create 1v1 Match</span>
            </Link>

            <Link
              href="/tournaments/host?type=tournament"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-sx-stone hover:bg-sx-elevated border border-sx-border text-sx-ink font-semibold text-xs transition-colors"
            >
              <Trophy className="w-4 h-4 text-sx-amber-text" />
              <span>Host 4–16 Player Cup</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Membership Banner for Guests (only shown when active brackets exist) */}
      {!loading && !user && tournaments.length > 0 && (
        <div className="rounded-xl store-panel p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-sx-stone border border-sx-border text-sx-amber-text flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-sx-ink font-display">
                Sign In Required to Enter Brackets
              </h3>
              <p className="text-xs text-sx-muted max-w-2xl leading-relaxed">
                Sign in or create an account to register your Friend ID and M-Pesa contact number. Paid entry is confirmed through STK Push or account balance; the tournament desk arranges any prize payment manually after the result is recorded.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Link
              href="/register?redirect=/tournaments"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-sx-green hover:bg-sx-green-hover text-white font-bold text-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </Link>
            <Link
              href="/login?redirect=/tournaments"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-sx-stone hover:bg-sx-elevated text-sx-ink-soft border border-sx-border font-semibold text-xs transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      )}

      {/* Clean 1-Line Cup Rules Strip (Detailed Fee Table Opens in New Tab) */}
      <div className="rounded-xl bg-sx-subtle border border-sx-border px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-sx-muted">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sx-green-text shrink-0" />
          <span>
            <strong className="text-sx-ink">Free cups: KES 0</strong> · Paid entries require STK Push or account balance · Cancelling does not issue an automatic refund; contact support for review
          </span>
        </span>
        <DetailTabLink href="/escrow-guarantee#fees" variant="pill">
          Cup Rules &amp; Fee Table
        </DetailTabLink>
      </div>

      {/* Tournaments Grid Header */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-sx-border">
          <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
            Active Brackets &amp; Matches
          </h2>
          <span className="text-xs font-mono text-sx-muted">East Africa Time (EAT)</span>
        </div>

        {loading ? (
          <div className="py-14 text-center text-sx-muted flex flex-col items-center gap-2.5">
            <RotateCw className="w-6 h-6 animate-spin text-sx-green-text" />
            <span className="text-xs">Loading brackets...</span>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="rounded-2xl bg-sx-subtle border border-sx-border p-6 sm:p-7 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sx-green-text">
                <Trophy className="w-4 h-4" />
                <span>Quiet between cups</span>
              </span>
              <h3 className="text-base sm:text-lg font-bold text-sx-ink font-display">
                Get notified when the next tournament opens
              </h3>
              <p className="text-xs text-sx-muted leading-relaxed max-w-lg">
                No brackets are taking entries at this moment. Leave your Kenyan mobile number for a WhatsApp alert when the next cup opens—or start a 1v1 match with a friend right now.
              </p>
              <div className="pt-1 max-w-md">
                <QuietAlertOptIn topic="tournament" />
              </div>
            </div>

            <div className="md:col-span-5 md:border-l md:border-sx-border md:pl-6 flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-sx-ink">
                Want to play today?
              </span>
              <Link
                href="/tournaments/host?type=1v1"
                className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-lg bg-sx-canvas hover:bg-sx-stone border border-sx-border-strong text-sx-ink font-bold text-xs transition-colors"
              >
                <Swords className="w-3.5 h-3.5 text-sx-green-text" />
                <span>Create a 1v1 Match</span>
              </Link>
              <Link
                href="/tournaments/host?type=tournament"
                className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-lg bg-sx-canvas hover:bg-sx-stone border border-sx-border text-sx-ink font-semibold text-xs transition-colors"
              >
                <Trophy className="w-3.5 h-3.5 text-sx-amber-text" />
                <span>Host a 4–16 Player Cup</span>
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
                      : "border-pitch-border hover:border-sx-border-strong"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {t.tournament_type === "1v1" || t.max_players <= 2 ? (
                          <span className="text-[10px] font-extrabold text-sx-amber-text bg-sx-amber-tint px-2 py-0.5 rounded-full border border-sx-amber-border flex items-center gap-1">
                            <Swords className="w-3 h-3 text-sx-amber-text" />
                            <span>1v1 SHOWMATCH</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-sx-info-text bg-sx-info-tint px-2 py-0.5 rounded-full border border-sx-info-border flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-sx-info-text" />
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
                          <span className="text-[10px] font-bold text-sx-amber-text bg-sx-amber-tint px-2 py-0.5 rounded-full border border-sx-amber-border">
                            You are Moderator
                          </span>
                        ) : t.created_by ? (
                          <span className="text-[10px] font-medium text-sx-ink-soft bg-sx-stone px-2 py-0.5 rounded-full border border-sx-border-strong">
                            Community Hosted
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-sx-green-text bg-sx-green-tint px-2 py-0.5 rounded-full border border-sx-green-border">
                            Official Cup
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-bold text-sx-green-text font-mono">
                        {t.entry_fee_kes === 0 ? "FREE ENTRY" : `Entry: KES ${t.entry_fee_kes}`}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-sx-ink font-display">{t.title}</h3>
                      {t.subtitle && <p className="text-xs text-sx-muted mt-1">{t.subtitle}</p>}
                    </div>

                    {/* Prize Pool Breakdown */}
                    <div className="p-4 rounded-2xl bg-pitch-card border border-pitch-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-sx-muted font-semibold">
                          {t.status === "registration_open" ? "Projected Prize Pool (if all slots fill)" : t.tournament_type === "1v1" || t.max_players <= 2 ? "Winner Takes All (Net Pool)" : "Total Prize Pool"}
                        </span>
                        <span className="text-lg font-extrabold text-sx-amber-text font-display">
                          {formatCurrency(t.prize_pool_kes, "KES")}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-pitch-border/60 text-[11px] text-sx-ink-soft">
                        {t.tournament_type === "1v1" || t.max_players <= 2 || t.payout_split === "winner_takes_all" ? (
                          <div className="col-span-2 text-sx-green-text font-bold">
                            Champion Takes 100%: <strong>{formatCurrency(t.prize_pool_kes, "KES")}</strong>
                          </div>
                        ) : (
                          <>
                            <div>1st: <strong>{formatCurrency(t.first_place_kes, "KES")}</strong></div>
                            <div>2nd: <strong>{formatCurrency(t.second_place_kes, "KES")}</strong></div>
                          </>
                        )}
                      </div>
                      {t.entry_fee_kes > 0 && (
                        <div className="pt-1 text-[10px] text-sx-muted flex items-center justify-between border-t border-pitch-border/40">
                          <span className="flex items-center gap-1 text-sx-green-text font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Entry Fees Collected for Tournament</span>
                          </span>
                          <span className="text-sx-amber-text/90 font-mono">
                            {t.status === "registration_open" ? "Projected platform fee" : "Platform fee"}: KES {t.admin_fee_kes ?? calculateTournamentFee(t.entry_fee_kes * t.max_players)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Registered Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-sx-ink-soft font-medium">
                        <span>Slots Filled:</span>
                        <strong>{t.registered_count} / {t.max_players} Gamers</strong>
                      </div>
                      <div className="w-full h-2 rounded-full bg-sx-stone overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-sx-muted">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-sx-muted" />
                        <span>{t.start_date}</span>
                      </div>
                      <span className="uppercase text-[10px] font-bold text-sx-muted">
                        {t.platform}
                      </span>
                    </div>

                    {/* Winner Banner if Completed */}
                    {t.status === "completed" && t.winner_name && (
                      <div className="p-3 rounded-2xl bg-sx-amber-tint border border-sx-amber-border text-sx-amber-text text-xs flex items-center gap-2">
                        <Crown className="w-4 h-4 text-sx-amber-text shrink-0" />
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
                              ? "bg-sx-stone text-sx-muted cursor-not-allowed pointer-events-none"
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
                          `Join my eFootball tournament "${t.title}"!\n${t.status === "registration_open" ? "Projected Prize Pool (if all slots fill)" : "Prize Pool"}: KES ${t.prize_pool_kes.toLocaleString()}\nEntry Fee: ${
                            t.entry_fee_kes > 0 ? `KES ${t.entry_fee_kes}` : "FREE"
                          }\nFormat: ${t.format}\n\nRegister now: https://efootballmarket.co.ke/tournaments?join=${t.id}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-sx-green-tint hover:bg-sx-green-tint border border-sx-green-border text-sx-green-text font-bold text-[11px] transition-all shadow-sm cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-sx-green-text fill-emerald-400" />
                        <span>Invite on WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyInvite(t)}
                        className="p-2 rounded-xl bg-pitch-card hover:bg-sx-stone border border-pitch-border text-sx-ink-soft hover:text-sx-ink transition-all text-xs cursor-pointer"
                        title="Copy Tournament Link"
                      >
                        {copiedTourneyId === t.id ? (
                          <Check className="w-3.5 h-3.5 text-sx-green-text" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Moderator / Admin Management Buttons */}
                    {isModerator && (
                      <div className="flex items-center gap-2 pt-1 border-t border-pitch-border/40">
                        {t.status === "registration_open" && (!t.matches || t.matches.length === 0) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTourney(t);
                              handleGenerateBrackets(false);
                            }}
                            disabled={generatingBrackets}
                            className="flex-1 text-[11px] font-bold text-sx-amber-text hover:text-sx-amber-text py-1.5 px-2 rounded-xl bg-sx-amber-tint hover:bg-sx-amber-tint border border-sx-amber-border transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                            <span>Form Brackets</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteTournament(t.id)}
                          className="p-1.5 rounded-xl text-sx-red-text hover:text-sx-red-text hover:bg-sx-red-tint border border-sx-red-border transition-all cursor-pointer"
                          title="Remove tournament with no payment or registration activity"
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
                <span className="text-xs uppercase font-bold text-sx-amber-text tracking-wider">
                  Live Knockout Bracket & Score Center
                </span>
                <Badge
                  variant={selectedTourney.status === "completed" ? "default" : "brand"}
                  size="sm"
                >
                  {selectedTourney.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-sx-ink font-display mt-1">
                {selectedTourney.title}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-sx-ink-soft font-semibold bg-pitch-card px-3 py-1.5 rounded-xl border border-pitch-border">
                {selectedTourney.status === "registration_open" ? "Projected Prize Pool (if all slots fill)" : "Prize Pool"}: <strong className="text-sx-green-text">{formatCurrency(selectedTourney.prize_pool_kes, "KES")}</strong>
              </span>

              {((user && selectedTourney.created_by === user.id) || isAdmin) &&
                selectedTourney.status === "registration_open" &&
                (!selectedTourney.matches || selectedTourney.matches.length === 0) && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="gold"
                      size="sm"
                      className="text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      disabled={generatingBrackets}
                      onClick={() => handleGenerateBrackets(false)}
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>Form Brackets</span>
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
                    <Crown className="w-10 h-10 text-amber-950 fill-white" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-black/70">
                      Champion recorded · prize payment not confirmed
                    </span>
                    <h4 className="text-2xl sm:text-3xl font-black text-black">
                      {selectedTourney.winner_name}
                    </h4>
                    <p className="text-xs font-bold text-black/80 mt-1">
                      Published first-place prize: {formatCurrency(selectedTourney.first_place_kes, "KES")}. The tournament desk must arrange any M-Pesa payment manually; this result banner is not a payout receipt.
                      {selectedTourney.second_place_kes > 0 && ` Runner-up prize: ${formatCurrency(selectedTourney.second_place_kes, "KES")}.`}
                    </p>
                  </div>
                </div>

                <a
                  href={`https://wa.me/254794400365?text=${encodeURIComponent(
                    `Hello, the final result for "${selectedTourney.title}" records ${selectedTourney.winner_name} as champion. Please confirm the status of the manual prize payout. Published first-place prize: KES ${selectedTourney.first_place_kes}${selectedTourney.second_place_kes > 0 ? `; runner-up prize: KES ${selectedTourney.second_place_kes}` : ""}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 font-bold text-xs shadow-lg transition-all flex items-center gap-2 shrink-0"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Ask About Prize Payment</span>
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
                  <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-6 pt-2">
                    {rounds.map((roundName) => {
                      const roundMatches = selectedTourney.matches!.filter((m) => m.round === roundName);

                      return (
                        <div key={roundName} className="space-y-4">
                          <h4 className="text-xs font-bold text-sx-ink-soft uppercase tracking-wider text-center py-1.5 rounded-xl bg-sx-subtle border border-sx-border flex items-center justify-center gap-1.5">
                            <Swords className="w-3.5 h-3.5 text-sx-amber-text" />
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
                                      ? "border-sx-green-border ring-1 ring-emerald-500/20"
                                      : "border-pitch-border hover:border-sx-border-strong"
                                  }`}
                                >
                                  {/* Match Number & Status */}
                                  <div className="flex items-center justify-between text-[11px] text-sx-muted pb-1 border-b border-sx-border">
                                    <span>Match #{m.match_number}</span>
                                    {m.is_completed ? (
                                      <span className="text-sx-green-text font-semibold flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Completed
                                      </span>
                                    ) : (
                                      <span className="text-sx-amber-text font-semibold">Active Match</span>
                                    )}
                                  </div>

                                  {/* Player 1 Row */}
                                  <div className="flex items-center justify-between py-1">
                                    <span
                                      className={`font-semibold ${
                                        m.winner_name === m.player1_name
                                          ? "text-sx-green-text font-bold"
                                          : "text-sx-ink-soft"
                                      }`}
                                    >
                                      {m.player1_name}
                                    </span>
                                    <strong className="text-sx-ink px-2 py-0.5 bg-sx-stone rounded font-mono">
                                      {m.score1 !== undefined && m.score1 !== null ? m.score1 : "-"}
                                    </strong>
                                  </div>

                                  {/* Player 2 Row */}
                                  <div className="flex items-center justify-between border-t border-sx-border pt-1.5 pb-1">
                                    <span
                                      className={`font-semibold ${
                                        m.winner_name === m.player2_name
                                          ? "text-sx-green-text font-bold"
                                          : "text-sx-ink-soft"
                                      }`}
                                    >
                                      {m.player2_name}
                                    </span>
                                    <strong className="text-sx-ink px-2 py-0.5 bg-sx-stone rounded font-mono">
                                      {m.score2 !== undefined && m.score2 !== null ? m.score2 : "-"}
                                    </strong>
                                  </div>

                                  {/* Winner Notification / Advance Note */}
                                  {m.winner_name && (
                                    <div className="text-[10px] text-sx-green-text font-semibold text-right pt-1">
                                      Winner: {m.winner_name}
                                    </div>
                                  )}

                                  {/* Score Submission Button */}
                                  {canPostScore && (
                                    <div className="pt-2 border-t border-sx-border">
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
                                        className="w-full py-1.5 px-3 rounded-xl bg-sx-amber-tint hover:bg-amber-500/25 border border-sx-amber-border text-sx-amber-text font-bold text-[11px] transition-all flex items-center justify-center gap-1.5"
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
              <Swords className="w-10 h-10 text-sx-muted mx-auto" />
              <h4 className="text-base font-bold text-sx-ink">Knockout Brackets Pending Formation</h4>
              <p className="text-xs text-sx-muted max-w-md mx-auto">
                Players are registering. The moderator can form brackets after every slot is filled and each paid entry is confirmed.
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
            <h4 className="text-sm font-bold text-sx-ink flex items-center gap-2">
              <Users className="w-4 h-4 text-sx-amber-text" />
              <span>Registered Gamers ({selectedTourney.participants?.length || 0} / {selectedTourney.max_players})</span>
            </h4>

            {(!selectedTourney.participants || selectedTourney.participants.length === 0) ? (
              <p className="text-xs text-sx-muted italic">No players have registered for this tournament yet. Be the first!</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {selectedTourney.participants.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-2.5 rounded-xl bg-pitch-card border border-pitch-border text-xs flex items-center justify-between"
                  >
                    <div className="truncate">
                      <strong className="text-sx-ink block truncate">{p.gamer_tag}</strong>
                      <span className="text-[10px] text-sx-muted">ID: {p.friend_id}</span>
                    </div>
                    <span className="text-[10px] font-mono text-sx-green-text font-bold ml-1">
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
      <div className="bg-sx-subtle border border-sx-border rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="text-lg font-bold text-sx-ink flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-sx-green-text" />
          <span>eFootball Kenya Fair Play Protocol & Rules</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-sx-ink-soft pt-1">
          <div className="p-4 rounded-xl bg-pitch-card border border-pitch-border space-y-1.5">
            <strong className="text-sx-amber-text block font-bold">1. Match Settings (12-Minute Game)</strong>
            Standard 12-minute match length, Extra Time enabled, PK shootout enabled. Both players set match duration to 12 mins in eFootball Friend Match settings.
          </div>
          <div className="p-4 rounded-xl bg-pitch-card border border-pitch-border space-y-1.5">
            <strong className="text-sx-amber-text block font-bold">2. Score Reporting</strong>
            Players can share final-score screenshots; the tournament host or administrator records the result. Screenshots are not automatically verified by the system.
          </div>
          <div className="p-4 rounded-xl bg-pitch-card border border-pitch-border space-y-1.5">
            <strong className="text-sx-amber-text block font-bold">3. M-Pesa Prize Payouts</strong>
            A final result triggers an alert to the tournament desk. Prize disbursement is manual; timing varies, and a recorded result does not mean funds have been sent.
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
                <div className="w-10 h-10 rounded-2xl bg-sx-amber-tint border border-sx-amber-border text-sx-amber-text flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-sx-ink">Community Registration Required</h3>
                  <p className="text-xs text-sx-amber-text/90 font-medium">Official Tournament Entry Protocol</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthRequiredOpen(false)}
                className="p-1.5 rounded-lg text-sx-muted hover:text-sx-ink hover:bg-sx-stone transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-sx-ink font-display">
                  Only Registered Members Can Join Tournaments
                </h4>
                <p className="text-xs text-sx-ink-soft leading-relaxed">
                  A registered community account ties each entry to a player record and payout contact. The tournament desk reviews and arranges any prize payment manually after the final result.
                </p>
              </div>

              {/* Requirement Checklist */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-pitch-card border border-pitch-border/70 text-xs">
                <div className="flex items-start gap-2.5 text-sx-ink-soft">
                  <ShieldCheck className="w-4 h-4 text-sx-green-text shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-sx-ink">Fair Play & No Multiple Slots:</strong> One slot per registered community account.
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-sx-ink-soft">
                  <Award className="w-4 h-4 text-sx-amber-text shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-sx-ink">Manual Prize Payout:</strong> A recorded winner triggers a desk alert; a staff member must arrange any M-Pesa prize payment. Timing varies, and the bracket page does not show payout completion.
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-sx-ink-soft">
                  <Swords className="w-4 h-4 text-sx-info-text shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-sx-ink">Live Match Rooms:</strong> Direct access to opponents, bracket updates, and score submission.
                  </div>
                </div>
              </div>

              {selectedTourney && (
                <div className="p-3 rounded-xl bg-sx-subtle border border-sx-border flex items-center justify-between text-xs">
                  <span className="text-sx-muted truncate max-w-[200px]">
                    Target: <strong className="text-sx-ink">{selectedTourney.title}</strong>
                  </span>
                  <span className="text-sx-amber-text font-bold shrink-0">
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
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-pitch-card hover:bg-sx-stone border border-pitch-border text-sx-ink font-bold text-xs transition-all text-center"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Already Have an Account? Log In</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsAuthRequiredOpen(false)}
                  className="w-full py-2 text-xs text-sx-muted hover:text-sx-muted text-center transition-all"
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
                <div className="w-9 h-9 rounded-xl bg-sx-amber-tint text-sx-amber-text flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-sx-ink">
                    {selectedTourney.tournament_type === "1v1" ? "Join 1v1 Match" : "Join Tournament"}
                  </h3>
                  <p className="text-xs text-sx-muted">{selectedTourney.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="p-1.5 rounded-lg text-sx-muted hover:text-sx-ink hover:bg-sx-stone transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-6 overflow-y-auto space-y-4">
              {regSuccess ? (
                <div className="p-4 rounded-2xl bg-sx-green-tint border border-emerald-500 text-sx-green-text text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-sx-green-text" />
                  <h4 className="text-base font-bold text-sx-ink">Registration Confirmed!</h4>
                  {regResult?.paid_via_wallet ? (
                    <div className="p-3.5 rounded-2xl bg-sx-green-tint border border-sx-green-border text-xs text-sx-ink-soft space-y-1.5 text-left">
                      <div className="flex items-center gap-2 text-sx-green-text font-bold">
                        <Wallet className="w-4 h-4" />
                        <span>Paid with Account Balance!</span>
                      </div>
                      <p className="text-[11px] text-sx-ink-soft">
                        Entry fee of <strong>KES {selectedTourney.entry_fee_kes.toLocaleString()}</strong> was deducted from your account balance and your entry was recorded.
                      </p>
                      {regResult.remaining_balance !== undefined && (
                        <div className="pt-1 border-t border-sx-green-border flex items-center justify-between text-[11px]">
                          <span className="text-sx-muted">Remaining Balance:</span>
                          <strong className="text-sx-green-text font-mono">
                            KES {regResult.remaining_balance.toLocaleString()}
                          </strong>
                        </div>
                      )}
                    </div>
                  ) : selectedTourney.entry_fee_kes > 0 ? (
                    <div className="p-3.5 rounded-2xl bg-sx-amber-tint border border-sx-amber-border text-xs text-sx-ink-soft space-y-1.5 text-left">
                      <div className="flex items-center gap-2 text-sx-amber-text font-bold">
                        <AlertCircle className="w-4 h-4" />
                        <span>Payment confirmation needs support review</span>
                      </div>
                      <p className="text-[11px] text-sx-ink-soft">
                        This form cannot confirm a paid entry without an account-balance record or provider-confirmed M-Pesa payment. Contact support before sending money or trying again.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-sx-ink-soft">
                      Your free entry is recorded. The moderator will form brackets after registration closes and the field is ready.
                    </p>
                  )}

                  <a
                    href={`https://wa.me/254794400365?text=${encodeURIComponent(
                      `Hello Brian Okibo, I registered for "${selectedTourney.title}"! Gamer Tag: ${gamerTag}, Friend ID: ${friendId}. Phone: ${phone}. Payment: ${
                        regResult?.paid_via_wallet
                          ? `Paid via Account Balance (KES ${selectedTourney.entry_fee_kes})`
                          : selectedTourney.entry_fee_kes > 0
                            ? "Payment confirmation requires support review"
                            : "Free Entry"
                      }. Ready for match room!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sx-green hover:bg-sx-green-hover text-white font-bold text-xs transition-all shadow-lg"
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
                        <div className="w-8 h-8 rounded-xl bg-sx-green-tint text-sx-green-text flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-sx-ink block">
                            Community Member Verified
                          </span>
                          <span className="text-[10px] text-sx-green-text font-mono">
                            {displayName || profile?.username || user?.email}
                          </span>
                        </div>
                      </div>
                      <Badge variant="brand" size="sm">Eligible</Badge>
                    </div>
                  )}

                  {regError && (
                    <div className="p-3 rounded-xl bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs">
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
                    placeholder="e.g. 123-456-789 (Find in Extras → User Details)"
                    value={friendId}
                    onChange={(e) => setFriendId(e.target.value)}
                    required
                  />

                  <Input
                    label="Safaricom Contact Phone (M-Pesa payment or manual prize follow-up)"
                    placeholder="e.g. +254 712 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />

                  {/* Payment Method Selector if Entry Fee > 0 */}
                  {selectedTourney.entry_fee_kes > 0 ? (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-sx-ink-soft">
                          Payment Method
                        </label>
                        <span className="text-xs font-mono font-bold text-sx-amber-text">
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
                                ? "bg-sx-subtle border-sx-border opacity-60 cursor-not-allowed"
                                : paymentMethod === "wallet"
                                ? "bg-sx-green-tint border-emerald-500 ring-1 ring-emerald-500/40 cursor-pointer shadow-md"
                                : "bg-pitch-card border-pitch-border hover:border-sx-border-strong cursor-pointer"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  paymentMethod === "wallet" && hasEnough
                                    ? "border-emerald-400 bg-emerald-500"
                                    : "border-sx-border-strong"
                                }`}
                              >
                                {paymentMethod === "wallet" && hasEnough && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-sx-ink flex items-center gap-1.5">
                                    <Wallet className="w-3.5 h-3.5 text-sx-green-text" />
                                    <span>Pay with Account Balance</span>
                                  </span>
                                  <span
                                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                      hasEnough
                                        ? "bg-sx-green-tint text-sx-green-text border border-sx-green-border"
                                        : "bg-sx-red-tint text-sx-red-text border border-sx-red-border"
                                    }`}
                                  >
                                    KES {balance.toLocaleString()} Available
                                  </span>
                                </div>
                                <p className="text-[11px] text-sx-muted mt-1 leading-relaxed">
                                  {hasEnough
                                    ? `Instant deduction of KES ${selectedTourney.entry_fee_kes.toLocaleString()} from your wallet. Zero SMS waiting.`
                                    : `Insufficient wallet balance (KES ${balance.toLocaleString()} available / KES ${selectedTourney.entry_fee_kes.toLocaleString()} required). Top up or choose M-Pesa STK Push below.`}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Option 2: M-Pesa STK Push */}
                      <div
                        onClick={() => setPaymentMethod("mpesa_stk")}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          paymentMethod === "mpesa_stk"
                            ? "bg-sx-amber-tint border-amber-500 ring-1 ring-amber-500/40 shadow-md"
                            : "bg-pitch-card border-pitch-border hover:border-sx-border-strong"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${
                              paymentMethod === "mpesa_stk"
                                ? "border-amber-400 bg-amber-500"
                                : "border-sx-border-strong"
                            }`}
                          >
                            {paymentMethod === "mpesa_stk" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-xs font-bold text-sx-ink flex items-center gap-1.5">
                                <Smartphone className="w-3.5 h-3.5 text-sx-amber-text" />
                                <span>Pay by M-Pesa STK Push</span>
                              </span>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sx-amber-tint text-sx-amber-text border border-sx-amber-border">
                                Provider confirmation required
                              </span>
                            </div>
                            <p className="text-[11px] text-sx-muted mt-1 leading-relaxed">
                              Continue to the payment page to request an STK prompt and wait for M-Pesa provider confirmation. A manual Till transfer does not register a paid entry through this form.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-sx-green-tint border border-sx-green-border text-xs text-sx-green-text flex items-center justify-between">
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
                      {!selectedTourney.entry_fee_kes
                        ? "Confirm Free Registration"
                        : paymentMethod === "wallet"
                          ? `Pay KES ${selectedTourney.entry_fee_kes.toLocaleString()} from Balance`
                          : "Continue to M-Pesa STK Push"}
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
                <div className="w-9 h-9 rounded-xl bg-sx-amber-tint text-sx-amber-text flex items-center justify-center">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-sx-ink">Post Match Score</h3>
                  <p className="text-xs text-sx-muted">{selectedMatch.round} | Match #{selectedMatch.match_number}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScoreOpen(false)}
                className="p-1.5 rounded-lg text-sx-muted hover:text-sx-ink hover:bg-sx-stone"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitScore} className="p-6 overflow-y-auto space-y-4">
              {scoreError && (
                <div className="p-3 rounded-xl bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs">
                  {scoreError}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-pitch-card border border-pitch-border space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-sx-ink flex-1 truncate">
                    {selectedMatch.player1_name}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={score1}
                    onChange={(e) => setScore1(e.target.value)}
                    className="w-16 px-3 py-2 text-center text-lg font-bold font-mono rounded-xl bg-sx-stone border border-sx-border-strong text-sx-ink focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-sx-border pt-3">
                  <span className="text-xs font-bold text-sx-ink flex-1 truncate">
                    {selectedMatch.player2_name}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={score2}
                    onChange={(e) => setScore2(e.target.value)}
                    className="w-16 px-3 py-2 text-center text-lg font-bold font-mono rounded-xl bg-sx-stone border border-sx-border-strong text-sx-ink focus:outline-none focus:border-amber-500"
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

              <div className="text-[11px] text-sx-muted">
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
