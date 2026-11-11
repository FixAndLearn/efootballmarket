"use client";

import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, Circle, AlertTriangle, ExternalLink, X, Lock, Key, Smartphone, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ChecklistStep {
  id: string;
  title: string;
  instruction: string;
  criticalTip: string;
}

const CHECKLIST_STEPS: ChecklistStep[] = [
  {
    id: "step_login",
    title: "1. Log in to my.konami.net in Incognito",
    instruction: "Open a private/incognito browser window and log in to the official Konami ID portal (my.konami.net) using the email and password provided by the seller (via vault or chat).",
    criticalTip: "Ensure the URL begins strictly with https://my.konami.net to prevent phishing clones.",
  },
  {
    id: "step_email",
    title: "2. Change Konami ID Email to Your Own",
    instruction: "Navigate to Account Management → 'View / Edit Email Address'. Enter your personal email address. Konami sends a 6-digit confirmation code to your new inbox. Ask seller for the old email OTP in chat if prompted.",
    criticalTip: "Once you enter the 6-digit confirmation code, the seller permanently loses login capability through their previous email.",
  },
  {
    id: "step_password",
    title: "3. Change Password & Security Question",
    instruction: "Update the password to a strong new combination (12+ characters with symbols) and update the secret security question.",
    criticalTip: "Do not use the same password that the seller originally provided.",
  },
  {
    id: "step_2fa",
    title: "4. Enable Two-Factor Authentication (2FA)",
    instruction: "Go to Security → Two-Step Verification. Link your email or an Authenticator App (Google Authenticator / Authy).",
    criticalTip: "2FA ensures that even if anyone knew the past password, nobody can log in without your phone.",
  },
  {
    id: "step_unlink",
    title: "5. Verify Google Play is NOT Linked (STRICT RULE)",
    instruction: "Open eFootball Mobile on your phone → Extras → Support → Link Data. Check Google Play Games. It MUST state 'Not Linked'. If Google Play is linked ('Googling'), STOP IMMEDIATELY! Never accept the account—open a dispute right away.",
    criticalTip: "CRITICAL: In eFootball, Google Play links cannot be transferred. A Google-linked account allows the seller to pull back the account at any time. Zero Google-linked accounts are permitted.",
  },
  {
    id: "step_ingame",
    title: "6. Launch Game & Confirm Squad In-App",
    instruction: "Open eFootball Mobile on your phone → Extras → Support → Data Transfer → Transfer using Konami ID. Log in and verify all Epic Boosters, Division status, and Coin balances match the listing.",
    criticalTip: "If any player or currency is missing or if Google Play was linked, click 'Report Problem / Dispute' immediately before releasing funds.",
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function KonamiTransferChecklistModal({ isOpen, onClose }: Props) {
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const toggleStep = (id: string) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const completedCount = Object.values(checkedSteps).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / CHECKLIST_STEPS.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-pitch-surface border border-pitch-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-pitch-border/80 bg-pitch-card/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sx-green-tint border border-sx-green-border flex items-center justify-center text-sx-green-text">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-sx-ink font-display">
                Konami ID Account Transfer Checklist
              </h3>
              <p className="text-xs text-sx-muted">
                Follow these 6 steps in order to verify and secure account access before releasing escrow.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-sx-muted hover:text-sx-ink hover:bg-sx-stone transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-pitch-card/30 border-b border-pitch-border/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sx-ink-soft">
              Security Progress: {completedCount} / {CHECKLIST_STEPS.length}
            </span>
            {progressPercent === 100 && (
              <span className="px-2 py-0.5 rounded-full bg-sx-green-tint text-sx-green-text text-[10px] font-bold border border-sx-green-border">
                Checklist Complete!
              </span>
            )}
          </div>
          <div className="w-36 h-2 bg-sx-stone rounded-full overflow-hidden p-0.5 border border-sx-border-strong">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Steps List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Strict Zero Google-Link Alert Box */}
          <div className="p-4 rounded-2xl bg-sx-red-tint border-2 border-sx-red-border text-sx-red-text text-xs space-y-2">
            <div className="flex items-center gap-2 text-sx-red-text font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 text-sx-red-text" />
              <span>STRICT ESCROW RULE: NEVER ACCEPT A GOOGLE-LINKED ACCOUNT (&quot;GOOGLING&quot;)</span>
            </div>
            <p className="leading-relaxed text-sx-ink-soft text-xs">
              In eFootball Mobile, Google Play accounts cannot be transferred cleanly. If an account has ever been linked to Google Play, the previous owner can <strong>log back in and pull back the account at any time</strong> using Google sign-in, even after you change the Konami ID email and password!
            </p>
            <div className="p-2.5 rounded-xl bg-black/40 border border-sx-red-border text-[11px] font-mono text-sx-red-text">
              <strong>How to check in eFootball Mobile:</strong> Go to Extras &rarr; Support &rarr; Link Data &rarr; Look at &quot;Google Play Games&quot;. It MUST say <strong>&quot;Not Linked&quot;</strong>. If it says &quot;Linked&quot;, <strong>DO NOT ACCEPT IT</strong> and open a dispute immediately for escrow refund investigation.
            </div>
          </div>

          {/* Konami Publisher Notice */}
          <div className="p-3.5 rounded-2xl bg-sx-subtle border border-sx-border-strong text-xs text-sx-ink-soft">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-sx-amber-text shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Konami’s current rules prohibit selling or transferring eFootball accounts and sharing account IDs or passwords. Trading may result in loss of account access or support.{" "}
                <a
                  href="https://www.konami.com/efootball/en-us/topic/news/5174"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sx-amber-text hover:text-sx-amber-text underline font-medium inline-flex items-center gap-1"
                >
                  Read Konami’s official notice
                  <ExternalLink className="w-3 h-3 inline" />
                </a>.
              </p>
            </div>
          </div>

          {CHECKLIST_STEPS.map((step) => {
            const isDone = Boolean(checkedSteps[step.id]);
            return (
              <div
                key={step.id}
                onClick={() => toggleStep(step.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isDone
                    ? "bg-sx-green-tint border-sx-green-border"
                    : "bg-pitch-card/50 border-pitch-border hover:border-slate-500"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    className="mt-0.5 shrink-0 text-sx-muted transition-colors"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-sx-green-text" />
                    ) : (
                      <Circle className="w-5 h-5 text-sx-muted" />
                    )}
                  </button>
                  <div className="space-y-1 flex-1">
                    <h4
                      className={`text-sm font-bold transition-colors ${
                        isDone ? "text-sx-green-text line-through opacity-80" : "text-sx-ink"
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-xs text-sx-ink-soft leading-relaxed">{step.instruction}</p>
                    <div className="flex items-start gap-1.5 pt-1 text-[11px] text-sx-amber-text/90 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-sx-amber-text" />
                      <span>{step.criticalTip}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-5 border-t border-pitch-border/80 bg-pitch-card/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href="https://my.konami.net"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-sx-stone text-sx-ink-soft hover:text-sx-ink border border-sx-border-strong text-xs font-semibold transition-colors"
          >
            <span>Open Official my.konami.net</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto font-bold"
          >
            {progressPercent === 100 ? "I'm Fully Secured (Close Checklist)" : "Got It, Continue Transfer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline Trigger Button that can be placed in any banner or navigation
 */
export function KonamiTransferChecklistTrigger({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sx-green-tint border border-sx-green-border text-sx-green-text hover:text-sx-green-text hover:border-emerald-700 text-xs font-semibold transition-all shadow-md ${className}`}
      >
        <ShieldCheck className="w-4 h-4 text-sx-green-text" />
        <span>Buyer Security Checklist</span>
      </button>

      <KonamiTransferChecklistModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}

/**
 * Prominent Escrow Exchange Guide Card with trigger button
 */
export function EscrowHandoverGuideCard({ onOpenGuide }: { onOpenGuide: () => void }) {
  return (
    <div className="bg-sx-stone border border-sx-green-border rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sx-green-tint border border-sx-green-border flex items-center justify-center text-sx-green-text shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-sx-ink font-display">
                Official Escrow Exchange &amp; Handover Protocol
              </h4>
              <span className="text-[10px] font-bold text-sx-green-text bg-sx-green-tint px-2 py-0.5 rounded-full border border-sx-green-border">
                Available At All Stages
              </span>
            </div>
            <p className="text-xs text-sx-ink-soft mt-1 leading-relaxed">
              New to eFootball account exchanges? Follow our verified 6-step protocol to inspect and secure Konami ID email, password, and 2FA before completing your trade.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenGuide}
          className="text-xs font-bold border-sx-green-border text-sx-green-text hover:bg-sx-green-tint shrink-0"
        >
          <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-sx-green-text" />
          <span>Open Handover Guide</span>
        </Button>
      </div>

      {/* Critical Anti-Googling Alert */}
      <div className="p-3 rounded-xl bg-sx-red-tint border border-sx-red-border flex items-start gap-2.5 text-xs text-sx-red-text">
        <AlertTriangle className="w-4 h-4 text-sx-red-text shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-sx-red-text">
            STRICT SECURITY RULE: Never accept an account linked to Google Play (&quot;Googling&quot;)
          </span>
          <p className="text-[11px] text-sx-red-text/90 leading-relaxed">
            Google Play links can never be transferred and allow the seller to reclaim the account at any time via Google login. When you log in, check <em>Support &rarr; Link Data</em>. If Google Play is linked, <strong>STOP IMMEDIATELY</strong> and dispute the order for a full refund.
          </p>
        </div>
      </div>
    </div>
  );
}
