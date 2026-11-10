"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertTriangle, AlertCircle, CheckCircle2, Lock, ShieldAlert } from "lucide-react";
import { useState } from "react";

export interface CredentialsDeliveryFormProps {
  orderId: string;
  onDelivered: () => void;
}

export function CredentialsDeliveryForm({ orderId, onDelivered }: CredentialsDeliveryFormProps) {
  const [konamiEmail, setKonamiEmail] = useState("");
  const [konamiPassword, setKonamiPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState("");
  const [instructions, setInstructions] = useState("");
  const [certifyNoGoogleLink, setCertifyNoGoogleLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certifyNoGoogleLink) {
      setError("You must certify that this account is NOT linked to Google Play ('Googling') before delivering.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/escrow/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          konamiEmail: konamiEmail.trim(),
          konamiPassword: konamiPassword.trim(),
          backupCodes: backupCodes.trim() || undefined,
          transferInstructions: instructions.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to deliver credentials");
      }

      setSuccess(true);
      setTimeout(() => {
        onDelivered();
      }, 700);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-pitch-surface border border-pitch-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3 border-b border-pitch-border/60 pb-4">
        <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#B45309]">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#0F0F0F]">Deliver Account Credentials</h3>
          <p className="text-xs text-[#5F5F5F]">
            Credentials are encrypted with AES-256-GCM before entering the database.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-[#EBF5F0] border border-[#BFE0CE] text-[#006340] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Credentials encrypted & saved successfully! Updating order status...</span>
        </div>
      )}

      {/* Strict Anti-Googling Alert */}
      <div className="p-3.5 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-xs text-[#B91C1C] space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-[#B91C1C]">
          <AlertTriangle className="w-4 h-4 text-[#C92A2A] shrink-0" />
          <span>STRICT SELLER POLICY: Never Deliver a Google-Linked Account</span>
        </div>
        <p className="text-[11px] text-[#3D3D3D] leading-relaxed">
          eFootball accounts linked to Google Play Games cannot be transferred cleanly and permit account pull-backs. Delivering an account with Google Play linked will trigger an instant buyer dispute, freezing of your payout, and permanent seller suspension.
        </p>
      </div>

      <Input
        label="Konami ID Email / Username"
        type="text"
        placeholder="konami-account@example.com or Username"
        value={konamiEmail}
        onChange={(e) => setKonamiEmail(e.target.value)}
        required
      />

      <Input
        label="Konami ID Password"
        type="password"
        placeholder="Enter Konami password"
        value={konamiPassword}
        onChange={(e) => setKonamiPassword(e.target.value)}
        required
      />

      <Input
        label="2-Step Verification Backup Codes (Optional)"
        type="text"
        placeholder="e.g. 123456, 789012"
        value={backupCodes}
        onChange={(e) => setBackupCodes(e.target.value)}
        helperText="Provide if 2-Step Verification was enabled on the Konami ID."
      />

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-[#3D3D3D]">
          Special Transfer Instructions (Optional)
        </label>
        <textarea
          rows={3}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g. Please log in on Android/iOS, check Link Data, and bind your own email in Konami settings."
          className="w-full rounded-lg bg-pitch-card border border-pitch-border p-3 text-xs text-[#0F0F0F] placeholder:text-[#767676] focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Certification Checkbox */}
      <div className="p-3.5 rounded-xl bg-pitch-card border border-pitch-border space-y-2">
        <label className="flex items-start gap-2.5 cursor-pointer text-[#1F1F1F] select-none">
          <input
            type="checkbox"
            checked={certifyNoGoogleLink}
            onChange={(e) => setCertifyNoGoogleLink(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-pitch-border text-brand-500 focus:ring-brand-500/20"
            required
          />
          <span className="text-xs text-[#1F1F1F] font-medium leading-relaxed">
            I certify under penalty of permanent ban and escrow fund forfeiture that this account is <strong>NOT linked to Google Play Games (&quot;Googling&quot;)</strong>. Handover is purely Konami ID linked without active Google links.
          </span>
        </label>
      </div>

      {/* Konami Publisher Notice */}
      <div className="p-3.5 rounded-xl bg-[#F9F9F8] border border-[#C8C8C4] text-xs text-[#3D3D3D]">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Konami’s current rules prohibit selling or transferring eFootball accounts and sharing account IDs or passwords. Trading may result in loss of account access or support.{" "}
            <a
              href="https://www.konami.com/efootball/en-us/topic/news/5174"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#B45309] hover:text-[#92400E] underline font-medium"
            >
              Read Konami’s official notice
            </a>.
          </p>
        </div>
      </div>

      <Button
        type="submit"
        variant="gold"
        size="md"
        className="w-full"
        isLoading={loading || success}
        disabled={!certifyNoGoogleLink}
      >
        {success ? "Delivered!" : "Encrypt & Deliver to Buyer"}
      </Button>
    </form>
  );
}
