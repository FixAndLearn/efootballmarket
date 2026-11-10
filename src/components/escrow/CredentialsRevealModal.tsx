"use client";

import { Button } from "@/components/ui/Button";
import { Check, Copy, Eye, KeyRound, MessageSquare, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

export interface CredentialsRevealModalProps {
  orderId: string;
  isOpen: boolean;
  isSeller?: boolean;
  onClose: () => void;
  onConfirmedRelease?: () => void;
  onOpenDispute: () => void;
}

export function CredentialsRevealModal({
  orderId,
  isOpen,
  isSeller = false,
  onClose,
  onConfirmedRelease,
  onOpenDispute,
}: CredentialsRevealModalProps) {
  const [credentials, setCredentials] = useState<{
    konamiEmail: string;
    konamiPassword: string;
    backupCodes: string | null;
    transferInstructions: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchCredentials = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/escrow/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reveal credentials");
      setCredentials(data.credentials);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-pitch-surface border border-pitch-border rounded-2xl shadow-2xl p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5F5F5F] hover:text-[#1F1F1F] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-pitch-border/60 pb-4">
          <div className="w-10 h-10 rounded-xl bg-[#EBF5F0] border border-[#BFE0CE] flex items-center justify-center text-[#006340] shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0F0F0F]">
              {isSeller ? "Delivered Opening Credentials" : "Initial Konami ID Opening Credentials"}
            </h3>
            <p className="text-xs text-[#5F5F5F]">
              {isSeller ? "AES-256-GCM Vault Record" : "Step 1 of 4: Initial Login Information"}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!credentials && (
          <div className="text-center py-6">
            <p className="text-xs text-[#3D3D3D] mb-4">
              {isSeller
                ? "Click below to review the opening credentials you delivered for this order."
                : "Click below to decrypt and retrieve the initial Konami ID credentials for login."}
            </p>
            <Button variant="primary" size="md" onClick={fetchCredentials} isLoading={loading}>
              <Eye className="w-4 h-4 mr-1.5" />
              {isSeller ? "View Delivered Credentials" : "Decrypt & Reveal Opening Credentials"}
            </Button>
          </div>
        )}

        {credentials && (
          <div className="space-y-4">
            {/* Konami Email / Username */}
            <div className="p-3 rounded-xl bg-pitch-card border border-pitch-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-[#5F5F5F] uppercase">Konami ID / Email</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(credentials.konamiEmail, "email")}
                  className="text-xs text-[#006340] hover:text-[#006340] flex items-center gap-1"
                >
                  {copiedField === "email" ? <Check className="w-3.5 h-3.5 text-[#006340]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === "email" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <p className="text-sm font-mono text-[#0F0F0F] font-semibold select-all">{credentials.konamiEmail}</p>
            </div>

            {/* Konami Password */}
            <div className="p-3 rounded-xl bg-pitch-card border border-pitch-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-[#5F5F5F] uppercase">Opening Password</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(credentials.konamiPassword, "password")}
                  className="text-xs text-[#006340] hover:text-[#006340] flex items-center gap-1"
                >
                  {copiedField === "password" ? <Check className="w-3.5 h-3.5 text-[#006340]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === "password" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <p className="text-sm font-mono text-[#0F0F0F] font-semibold select-all">{credentials.konamiPassword}</p>
            </div>

            {/* Backup Codes */}
            {credentials.backupCodes && (
              <div className="p-3 rounded-xl bg-pitch-card border border-pitch-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-[#5F5F5F] uppercase">2FA Backup Codes</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(credentials.backupCodes!, "backup")}
                    className="text-xs text-[#006340] hover:text-[#006340] flex items-center gap-1"
                  >
                    {copiedField === "backup" ? <Check className="w-3.5 h-3.5 text-[#006340]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === "backup" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-xs font-mono text-[#3D3D3D] select-all">{credentials.backupCodes}</p>
              </div>
            )}

            {/* Instructions */}
            {credentials.transferInstructions && (
              <div className="p-3 rounded-xl bg-pitch-card/60 border border-pitch-border text-xs text-[#3D3D3D]">
                <span className="font-semibold block text-[#1F1F1F] mb-1">Seller Instructions:</span>
                <p className="whitespace-pre-line">{credentials.transferInstructions}</p>
              </div>
            )}

            {/* Two-Way Handover Caution Box for Buyer */}
            {!isSeller && (
              <div className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-xs text-[#92400E] space-y-1.5">
                <span className="font-bold block text-[#92400E]">⚠️ Important: 2-Way Handover in Progress</span>
                <p>
                  These are <strong>opening credentials</strong> only. Please attempt login now. If Konami asks for a 2-Step verification code, request it from the seller in the <strong>Order Chat</strong>.
                </p>
                <p className="text-[11px] text-[#92400E]/80">
                  Ensure you change <strong>BOTH</strong> the password and registered email address to your own before releasing funds!
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex flex-col gap-2">
              {!isSeller ? (
                <>
                  <Button variant="gold" size="md" className="w-full font-bold" onClick={onClose}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Got Credentials — Go to Chat for 2FA Codes
                  </Button>
                  <button
                    type="button"
                    onClick={onOpenDispute}
                    className="text-xs text-[#C92A2A] hover:text-[#B91C1C] py-1 text-center font-medium"
                  >
                    Wrong details or cannot login? Open an Escrow Dispute
                  </button>
                </>
              ) : (
                <Button variant="outline" size="md" className="w-full" onClick={onClose}>
                  Close Vault
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
