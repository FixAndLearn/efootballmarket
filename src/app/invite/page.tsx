"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Copy,
  Check,
  Share2,
  Mail,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Clock,
  BadgeCheck,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function InviteContent() {
  const { user, profile, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";

  // Share state
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const userCode = profile?.username || user?.id?.slice(0, 8) || "EFOOTBALL2026";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.efootballmarket.co.ke";
  const shareLink = `${origin}/register?ref=${encodeURIComponent(userCode)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = `Join me on eFootballMarket.co.ke - Kenya's premier verified platform to safely buy and sell eFootball accounts with Safaricom Till 1572931 escrow. Sign up here: ${shareLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleSendEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      setStatusMessage({ type: "error", text: "Please enter a valid recipient email address." });
      return;
    }

    setSending(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: inviteEmail.trim(),
          personalMessage: personalMessage.trim(),
          inviteCode: userCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch email invite.");
      }

      setStatusMessage({
        type: "success",
        text: `Invitation successfully sent to ${inviteEmail}! They will receive an email shortly.`,
      });
      setInviteEmail("");
      setPersonalMessage("");
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Could not send invitation." });
    } finally {
      setSending(false);
    }
  };

  // View A: Guest who arrived with an invite link
  if (!isAuthenticated && refCode) {
    return (
      <div className="w-full max-w-lg bg-pitch-surface border border-pitch-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-sx-amber-tint border border-sx-amber-border flex items-center justify-center text-sx-amber-text mx-auto mb-3 shadow-inner">
            <Sparkles className="w-7 h-7" />
          </div>
          <span className="px-3 py-1 rounded-full bg-sx-amber-tint border border-sx-amber-border text-[11px] font-bold text-sx-amber-text uppercase tracking-wider">
            VIP Invitation
          </span>
          <h1 className="text-2xl font-bold text-sx-ink font-display mt-2">
            You&apos;re Invited to eFootballMarket
          </h1>
          <p className="text-xs text-sx-ink-soft mt-1">
            Invited by <strong className="text-sx-amber-text font-mono">@{refCode}</strong>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-sx-subtle border border-pitch-border/80 space-y-3">
          <p className="text-xs font-semibold text-sx-ink-soft">
            Why join Kenya&apos;s #1 Escrow Gaming Network?
          </p>
          <div className="space-y-2 text-xs text-sx-ink-soft">
            <div className="flex items-start gap-2">
              <BadgeCheck className="w-4 h-4 text-sx-green-text shrink-0 mt-0.5" />
              <span>
                <strong>Safaricom Till 1572931:</strong> Funds stay protected until you verify Konami ID credentials.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-sx-amber-text shrink-0 mt-0.5" />
              <span>
                <strong>24H Inspection Window:</strong> Full money-back guarantee if the squad does not match.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                <strong>Anti-Scam Protection:</strong> Zero Google-link guarantee &amp; Konami ID transfer checklist.
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href={`/register?ref=${encodeURIComponent(refCode)}`}
            className="w-full inline-flex items-center justify-center gap-1.5 min-h-11 px-6 py-2.5 rounded-full bg-sx-green hover:bg-sx-green-hover text-white text-sm font-bold transition-colors"
          >
            <span>Accept Invitation &amp; Register</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login?redirect=/browse"
            className="w-full inline-flex items-center justify-center min-h-11 px-6 py-2.5 rounded-full bg-sx-subtle border border-sx-border text-sx-ink-soft hover:text-sx-ink text-sm font-semibold transition-colors"
          >
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    );
  }

  // View B: Member inviting others OR general invite hub
  return (
    <div className="w-full max-w-xl bg-pitch-surface border border-pitch-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-sx-green-text mx-auto mb-3 shadow-inner">
          <Users className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-sx-ink font-display">Invite Friends &amp; Traders</h1>
        <p className="text-xs text-sx-muted mt-1">
          Bring trusted buyers and sellers to eFootballMarket and trade with 100% escrow protection
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
            statusMessage.type === "success"
              ? "bg-sx-green-tint border-sx-green-border text-sx-green-text"
              : "bg-sx-red-tint border-sx-red-border text-sx-red-text"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Shareable Link Box */}
      <div className="p-4 rounded-xl bg-sx-subtle border border-pitch-border/80 space-y-3">
        <label className="text-xs font-semibold text-sx-ink-soft block">
          Your Personal Invitation Link
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareLink}
            className="flex-1 bg-pitch-card border border-pitch-border rounded-xl px-3 py-2 text-xs text-sx-ink-soft font-mono select-all focus:outline-none"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            className="bg-sx-stone border-pitch-border text-sx-ink-soft hover:text-sx-ink px-3 py-2 text-xs shrink-0 flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-sx-green-text" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </Button>
        </div>

        <div className="pt-2">
          <Button
            type="button"
            onClick={handleWhatsAppShare}
            variant="primary"
            size="md"
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold flex items-center justify-center gap-2 text-xs py-2.5 shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Share directly on WhatsApp</span>
          </Button>
        </div>
      </div>

      {/* Send Email Invitation Form */}
      <form onSubmit={handleSendEmailInvite} className="p-4 rounded-xl bg-pitch-card border border-pitch-border/80 space-y-4">
        <div>
          <h2 className="text-xs font-bold text-sx-ink uppercase tracking-wider flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-sx-green-text" />
            <span>Send Branded Email Invitation</span>
          </h2>
          <p className="text-[11px] text-sx-muted mt-0.5">
            We will dispatch an official eFootballMarket invitation with your username &amp; verified escrow badge.
          </p>
        </div>

        <Input
          label="Friend's Email Address"
          type="email"
          placeholder="friend@domain.com"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <div>
          <label className="text-xs font-semibold text-sx-ink-soft block mb-1">
            Personal Note (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Hey bro, check out this verified eFootball account marketplace..."
            value={personalMessage}
            onChange={(e) => setPersonalMessage(e.target.value)}
            className="w-full bg-sx-subtle border border-pitch-border rounded-xl px-3 py-2 text-xs text-sx-ink-soft placeholder:text-sx-muted focus:outline-none focus:border-brand-500"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full font-bold text-xs"
          isLoading={sending}
        >
          <Send className="w-3.5 h-3.5 mr-1.5" />
          Dispatch Invitation Email
        </Button>
      </form>

      {/* Benefits info */}
      <div className="p-3.5 rounded-xl bg-sx-subtle border border-pitch-border text-xs text-sx-muted space-y-1.5">
        <p className="font-semibold text-sx-ink-soft">Invite Benefits:</p>
        <p>1. Strengthen your trader reputation score across the platform.</p>
        <p>2. Safeguard your gaming friends from Telegram and Facebook scammers.</p>
        <p>3. Every trade made by your invites is backed by Safaricom Till 1572931 escrow.</p>
      </div>

      <div className="text-center pt-1">
        <Link href="/" className="text-xs text-sx-muted hover:text-sx-ink transition-colors">
          Return to Marketplace
        </Link>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <div className="flex-1 w-full flex items-center justify-center px-4 py-8 sm:py-12">
      <Suspense fallback={<div className="text-sx-muted text-sm">Loading invitation...</div>}>
        <InviteContent />
      </Suspense>
    </div>
  );
}
