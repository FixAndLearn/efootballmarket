"use client";

import { Button } from "@/components/ui/Button";
import { AlertTriangle, Camera, ShieldAlert, ShieldCheck, Upload, X } from "lucide-react";
import { useState } from "react";

export interface DisputeModalProps {
  orderId: string;
  isOpen: boolean;
  isCompleted?: boolean;
  onClose: () => void;
  onDisputeSubmitted: () => void;
}

export function DisputeModal({
  orderId,
  isOpen,
  isCompleted = false,
  onClose,
  onDisputeSubmitted,
}: DisputeModalProps) {
  const [reason, setReason] = useState(
    isCompleted ? "account_recovered_by_seller" : "credentials_invalid"
  );
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid screenshot image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size exceeds 10MB limit.");
      return;
    }

    setError("");
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let uploadedUrl: string | null = null;

      // Upload screenshot if provided
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.url) {
          uploadedUrl = uploadData.url;
        }
      }

      const res = await fetch("/api/escrow/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          reason,
          description,
          evidenceUrls: uploadedUrl ? [uploadedUrl] : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit dispute");

      onDisputeSubmitted();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-pitch-surface border border-pitch-border rounded-2xl shadow-2xl p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5F5F5F] hover:text-[#1F1F1F] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-pitch-border/60 pb-4">
          <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center text-[#C92A2A] shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0F0F0F]">
              {isCompleted ? "Raise Post-Release Dispute" : "Open Escrow Dispute"}
            </h3>
            <p className="text-xs text-[#5F5F5F]">
              {isCompleted
                ? "Seller Payout Frozen Pending Investigation"
                : "Order Funds Frozen Until Resolution"}
            </p>
          </div>
        </div>

        {isCompleted && (
          <div className="p-3 mb-4 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#92400E]">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#B45309]" />
              <span>Post-Release Protection Guarantee</span>
            </div>
            <p className="text-[11px] text-[#92400E]/90 leading-relaxed">
              If the seller attempted Konami ID recovery, linked an unmentioned Google Play Games ID, or caused coin deductions, submit your claim below. The seller wallet balance is frozen and administrators will arbitrate directly.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#3D3D3D] mb-1.5">Primary Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-pitch-card border border-pitch-border rounded-lg px-3 py-2 text-xs text-[#1F1F1F] focus:outline-none focus:border-brand-500"
            >
              <option value="account_recovered_by_seller">Account Password Changed or Recovered by Seller</option>
              <option value="google_linked_breach">Google Play Link Found / Anti-Googling Policy Breach</option>
              <option value="account_banned_or_deducted">Account Banned or Coins Deducted Due to Past Seller Actions</option>
              <option value="credentials_invalid">Credentials Stopped Working / Cannot Log In</option>
              <option value="wrong_account_details">Account Details Do Not Match Listing</option>
              <option value="missing_players_or_coins">Missing Listed Epic Players or Coins</option>
              <option value="seller_unresponsive">Seller Unresponsive Post-Release</option>
              <option value="other">Other Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#3D3D3D] mb-1.5">Detailed Explanation</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isCompleted
                  ? "Detail how and when the account was compromised or what breach was discovered..."
                  : "Explain clearly what went wrong so platform moderators can review..."
              }
              className="w-full rounded-lg bg-pitch-card border border-pitch-border p-3 text-xs text-[#0F0F0F] placeholder:text-[#767676] focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#3D3D3D] mb-1.5">
              Attach Proof Screenshot (Konami error / Google Play link / In-game status)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-xs text-[#5F5F5F] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F4F3F1] file:text-[#1F1F1F] hover:file:bg-slate-700"
            />
            {previewUrl && (
              <div className="relative w-24 aspect-[4/3] rounded-lg overflow-hidden border border-pitch-border mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-1 right-1 p-0.5 rounded bg-black/80 text-[#C92A2A]"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <Button type="submit" variant="danger" size="md" className="w-full" isLoading={loading}>
            {isCompleted ? "Submit Post-Release Dispute (Freeze Payout)" : "Submit Dispute with Evidence"}
          </Button>
        </form>
      </div>
    </div>
  );
}
