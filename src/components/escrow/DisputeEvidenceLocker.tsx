"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Order } from "@/types/database";
import { Button } from "@/components/ui/Button";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Maximize2,
  MessageCircle,
  Plus,
  RefreshCw,
  ShieldAlert,
  Upload,
  X,
} from "lucide-react";

export interface DisputeEvidenceLockerProps {
  order: Order;
  currentUserId: string;
}

interface EvidenceItem {
  url: string;
  title: string;
  description?: string;
  uploaderId: string;
  uploaderRole: "Buyer" | "Seller";
  uploadedAt: string;
}

export function DisputeEvidenceLocker({ order, currentUserId }: DisputeEvidenceLockerProps) {
  const [dispute, setDispute] = useState<any>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const isBuyer = currentUserId === order.buyer_id;
  const userRole = isBuyer ? "Buyer" : "Seller";

  const fetchDisputeData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/escrow/dispute?orderId=${order.id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setDispute(data.dispute);
        setEvidenceList(data.evidenceList || []);
      }
    } catch (err: any) {
      console.warn("Failed to load dispute evidence:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputeData();
  }, [order.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, or WebP).");
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

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a screenshot or photo to upload.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccessMsg("");

    try {
      // 1. Upload image to /api/upload
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || "Failed to upload image file.");
      }

      // 2. Register evidence via /api/escrow/dispute/evidence
      const registerRes = await fetch("/api/escrow/dispute/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          evidenceUrl: uploadData.url,
          title: evidenceTitle.trim() || `${userRole} Screenshot Proof`,
          description: `Uploaded by ${userRole} on ${new Date().toLocaleDateString()}`,
        }),
      });

      const registerData = await registerRes.json();
      if (!registerRes.ok) {
        throw new Error(registerData.error || "Failed to attach evidence.");
      }

      setSuccessMsg("Evidence registered successfully in the escrow locker.");
      setSelectedFile(null);
      setPreviewUrl(null);
      setEvidenceTitle("");
      await fetchDisputeData();
    } catch (err: any) {
      setError(err.message || "Failed to submit evidence.");
    } finally {
      setUploading(false);
    }
  };

  const isPostRelease = Boolean(
    dispute?.description?.includes("[POST-RELEASE DISPUTE]") ||
    dispute?.reason === "google_linked_breach" ||
    dispute?.reason === "account_banned_or_deducted"
  );

  return (
    <div className="bg-pitch-surface border border-pitch-border rounded-2xl p-6 shadow-xl space-y-6">
      {/* Dispute Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pitch-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sx-red-tint border border-sx-red-border flex items-center justify-center text-sx-red-text shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-sx-ink">Escrow Dispute Evidence Locker</h3>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                isPostRelease
                  ? "bg-sx-amber-tint border-amber-700 text-sx-amber-text"
                  : "bg-sx-red-tint border-sx-red-border text-sx-red-text"
              }`}>
                {isPostRelease ? "Post-Release Freeze Active" : "Audit Active"}
              </span>
            </div>
            <p className="text-xs text-sx-muted mt-0.5">
              Both parties must provide photographic verification for administrator review.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchDisputeData}
          className="text-xs text-sx-muted hover:text-sx-ink flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Locker</span>
        </button>
      </div>

      {/* Post-Release Dispute Notice */}
      {isPostRelease && (
        <div className="p-3.5 rounded-xl bg-sx-amber-tint border border-sx-amber-border text-xs text-sx-amber-text space-y-1">
          <div className="flex items-center gap-2 font-bold text-sx-amber-text">
            <ShieldAlert className="w-4 h-4 text-sx-amber-text shrink-0" />
            <span>Post-Release Breach Arbitration (Seller Payout Frozen)</span>
          </div>
          <p className="text-[11px] text-sx-amber-text/90 leading-relaxed">
            This dispute was raised after order funds were initially released. The seller available balance is frozen until platform administration verifies Konami account recovery logs, Google Play link status, or game integrity records.
          </p>
        </div>
      )}

      {/* Primary Dispute Summary */}
      {dispute && (
        <div className="p-4 rounded-xl bg-pitch-card/70 border border-pitch-border space-y-2 text-xs">
          <div className="flex items-center justify-between text-sx-muted">
            <span>
              Dispute Reason:{" "}
              <strong className="text-sx-amber-text capitalize">
                {dispute.reason === "google_linked_breach"
                  ? "Google Play Link Found (Anti-Googling Breach)"
                  : dispute.reason === "account_banned_or_deducted"
                  ? "Account Banned or Coins Deducted"
                  : String(dispute.reason).replace(/_/g, " ")}
              </strong>
            </span>
            <span className="text-[11px]">
              Opened {new Date(dispute.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sx-ink-soft bg-sx-subtle p-3 rounded-lg border border-sx-border leading-relaxed">
            &ldquo;{dispute.description}&rdquo;
          </p>
        </div>
      )}

      {/* Evidence Gallery */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs uppercase font-bold text-sx-ink-soft tracking-wider">
            Uploaded Evidence Screenshots ({evidenceList.length})
          </h4>
          <span className="text-[11px] text-sx-muted">Tap to expand full screen</span>
        </div>

        {evidenceList.length === 0 ? (
          <div className="p-8 rounded-xl bg-pitch-card/40 border border-pitch-border/60 text-center text-xs text-sx-muted">
            <ImageIcon className="w-8 h-8 text-sx-muted mx-auto mb-2" />
            <p>No proof screenshots attached yet.</p>
            <p className="text-[11px] text-sx-muted mt-1">
              Upload Konami ID error prompts, security emails, or in-game verification below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {evidenceList.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setZoomImage(item.url)}
                className="group relative rounded-xl overflow-hidden border border-pitch-border bg-sx-subtle cursor-zoom-in aspect-[4/3] transition-all hover:border-amber-400/80 shadow-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                <div className="absolute top-2 left-2">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.uploaderRole === "Buyer"
                        ? "bg-sky-950/90 text-sky-300 border border-sky-600/50"
                        : "bg-sx-green-tint text-sx-green-text border border-emerald-600/50"
                    }`}
                  >
                    {item.uploaderRole} Evidence
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-sx-ink truncate max-w-[85%]">
                    {item.title}
                  </span>
                  <Maximize2 className="w-3 h-3 text-sx-muted group-hover:text-sx-ink shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Additional Proof Box */}
      <form onSubmit={handleUploadEvidence} className="p-4 rounded-xl bg-pitch-card/80 border border-pitch-border space-y-3">
        <h4 className="text-xs font-bold text-sx-ink flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5 text-sx-amber-text" />
          <span>Upload Your Evidence ({userRole})</span>
        </h4>

        {error && (
          <div className="p-2.5 rounded-lg bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 rounded-lg bg-sx-green-tint border border-sx-green-border text-sx-green-text text-xs">
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-sx-ink-soft mb-1">
              Evidence Label / Context
            </label>
            <input
              type="text"
              value={evidenceTitle}
              onChange={(e) => setEvidenceTitle(e.target.value)}
              placeholder="e.g. Konami Login Error Screen"
              className="w-full bg-sx-subtle border border-sx-border-strong rounded-lg px-3 py-2 text-xs text-sx-ink-soft focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-sx-ink-soft mb-1">
              Select Screenshot (PNG/JPG up to 10MB)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full text-xs text-sx-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sx-stone file:text-sx-ink-soft hover:file:bg-slate-700"
            />
          </div>
        </div>

        {previewUrl && (
          <div className="relative w-32 aspect-[4/3] rounded-lg overflow-hidden border border-pitch-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="absolute top-1 right-1 p-0.5 rounded bg-black/80 text-sx-red-text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={uploading}
            disabled={!selectedFile}
          >
            Submit to Evidence Locker
          </Button>
        </div>
      </form>

      {/* WhatsApp Escalation Action */}
      <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-sx-muted border-t border-pitch-border/60">
        <p>
          Need urgent mediation? Escrow Director Brian Okibo inspects evidence directly on WhatsApp.
        </p>
        <a
          href={`https://wa.me/254794400365?text=${encodeURIComponent(
            `Hello Brian Okibo, I have uploaded evidence for Order #${order.order_number} (${order.listing?.title || "eFootball Squad"}). Please review the Dispute Evidence Locker.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sx-green-tint hover:bg-sx-green-tint border border-sx-green-border text-sx-green-text font-bold text-xs transition-colors shrink-0"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-emerald-400" />
          <span>Notify Brian on WhatsApp</span>
        </a>
      </div>

      {/* Full-Screen Zoom Lightbox */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md cursor-zoom-out animate-in fade-in"
        >
          <button
            type="button"
            onClick={() => setZoomImage(null)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-sx-stone text-sx-ink-soft hover:text-sx-ink"
          >
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomImage}
            alt="Dispute Evidence Zoom"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
