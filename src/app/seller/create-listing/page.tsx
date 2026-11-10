"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { watermarkSquadImage } from "@/lib/utils/watermark";
import { calculateEscrowCommission } from "@/lib/utils/commission";
import {
  ArrowLeft,
  ShieldCheck,
  UploadCloud,
  AlertCircle,
  Trash2,
  Loader2,
  Camera,
  Star,
  CheckCircle2,
} from "lucide-react";

interface UploadedImage {
  url: string;
  fileName: string;
  size: number;
}

const PLATFORMS = [
  { id: "android", label: "Android" },
  { id: "ios", label: "iOS (iPhone)" },
  { id: "playstation_5", label: "PS5" },
  { id: "playstation_4", label: "PS4" },
  { id: "pc_steam", label: "PC / Steam" },
  { id: "xbox_series_x", label: "Xbox" },
];

const PLAYSTYLES = [
  { id: "quick_counter", label: "Quick Counter" },
  { id: "long_ball_counter", label: "Long Ball Counter" },
  { id: "possession", label: "Possession" },
  { id: "out_wide", label: "Out Wide" },
  { id: "long_ball", label: "Long Ball" },
];

export default function CreateListingPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, displayName } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [platform, setPlatform] = useState("android");
  const [overallStrength, setOverallStrength] = useState("");
  const [epicCount, setEpicCount] = useState("");
  const [coinBalance, setCoinBalance] = useState("");
  const [managerName, setManagerName] = useState("");
  const [playstyle, setPlaystyle] = useState("quick_counter");
  const [keyPlayersInput, setKeyPlayersInput] = useState("");
  const [sellerNotes, setSellerNotes] = useState("");
  const [cleanIdConfirmed, setCleanIdConfirmed] = useState(true);

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const numericPrice = Number(price) || 0;
  const platformFee = numericPrice >= 100 ? calculateEscrowCommission(numericPrice) : 0;
  const sellerNet = Math.max(0, numericPrice - platformFee);

  const handleFilesUpload = async (fileList: FileList | File[]) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError("");

    const remainingSlots = 5 - images.length;
    if (remainingSlots <= 0) {
      setUploadError("Maximum 5 screenshots reached. Remove one first to replace it.");
      return;
    }

    const filesToUpload = Array.from(fileList).slice(0, remainingSlots);
    setUploadingImages(true);

    try {
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      const newUploaded: UploadedImage[] = [];

      for (const file of filesToUpload) {
        if (!validTypes.includes(file.type.toLowerCase())) {
          throw new Error(`"${file.name}" is unsupported. Upload PNG, JPG, or WebP.`);
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`"${file.name}" exceeds the 10MB limit.`);
        }

        let processedFile = file;
        try {
          processedFile = await watermarkSquadImage(file, {
            sellerUsername: displayName || "Trader",
            websiteUrl: "efootballmarket.co.ke",
          });
        } catch {
          // proceed with original if canvas watermark unavailable
        }

        const formData = new FormData();
        formData.append("file", processedFile);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }

        newUploaded.push({
          url: data.url,
          fileName: file.name,
          size: file.size,
        });
      }

      setImages((prev) => [...prev, ...newUploaded]);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload screenshots. Please try again.");
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setUploadError("");
  };

  const handleSetPrimaryCover = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const selected = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [selected, ...rest];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!isAuthenticated && !authLoading) {
        router.push("/login?redirect=/seller/create-listing");
        return;
      }
      if (!title.trim() || title.trim().length < 4) {
        throw new Error("Enter a clear squad title (at least 4 characters).");
      }
      if (!price || Number(price) < 100) {
        throw new Error("Ask Price must be at least KES 100.");
      }
      if (!overallStrength || Number(overallStrength) < 2000) {
        throw new Error("Permanent Collective Strength (OVR) must be at least 2000 (e.g. 3150).");
      }
      if (images.length === 0) {
        throw new Error("Upload at least 1 real squad screenshot (Starting XI recommended).");
      }
      if (!cleanIdConfirmed) {
        throw new Error("Please confirm Clean Konami ID status (Google Play & Apple ID Not Linked).");
      }

      const coins = coinBalance ? Number(coinBalance) : 0;
      const epics = epicCount ? Number(epicCount) : 0;
      const coach = managerName.trim();
      const parsedPlayers = keyPlayersInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12);

      const autoSummary = `${title.trim()} — Verified ${platform.replace(/_/g, " ")} eFootball squad (${overallStrength} OVR${
        epics > 0 ? `, ${epics} Epic/Booster cards` : ""
      }, ${coins.toLocaleString()} coins${coach ? `, manager ${coach}` : ""}). Protected by Safaricom M-Pesa Till 1572931 escrow and 24-hour Clean Konami ID inspection.`;

      const finalDescription = sellerNotes.trim()
        ? `${sellerNotes.trim()}\n\n${autoSummary}`
        : autoSummary;

      const payload = {
        title: title.trim(),
        description: finalDescription,
        price: Number(price),
        platform,
        game_version: "v4.0.0",
        region: "Global",
        account_level: 1,
        overall_team_strength: Number(overallStrength),
        gp_balance: 0,
        coin_balance: coins,
        efootball_points: 0,
        contract_renewal_tickets: 0,
        epic_players_count: epics,
        big_time_players_count: 0,
        highlight_players_count: 0,
        featured_players_count: 0,
        legend_players_count: 0,
        key_players_list: parsedPlayers,
        manager_name: coach || undefined,
        formation: null,
        primary_playstyle: playstyle,
        current_division: 3,
        highest_division: 1,
        konami_id_status: "linked_changeable",
        linked_email_status: "transferable_full_access",
        image_urls: images.map((img) => img.url),
      };

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?redirect=/seller/create-listing");
          return;
        }
        throw new Error(data.error || "Could not publish listing. Check your fields and try again.");
      }

      router.push(`/listings/${data.listing.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full space-y-6">
      {/* Header */}
      <div className="space-y-1.5 border-b border-sx-border pb-5">
        <Link
          href="/dashboard/seller"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sx-muted hover:text-sx-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Seller Dashboard</span>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-sx-ink font-display tracking-tight">
            List Your Squad for Sale
          </h1>
          <Link
            href="/seller/guidelines"
            className="text-xs font-semibold text-sx-green-text hover:underline"
          >
            Seller Rules &amp; Fees &rarr;
          </Link>
        </div>
        <p className="text-xs sm:text-sm text-sx-muted">
          Free to list. Get paid directly to your M-Pesa number once the buyer verifies Clean Konami ID handover.
        </p>
      </div>

      {!isAuthenticated && !authLoading && (
        <div className="p-4 rounded-xl bg-sx-amber-tint border border-sx-amber-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-sx-amber-text shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="font-bold text-sx-ink block">
                Sign in required to publish &amp; receive M-Pesa payouts
              </strong>
              <span className="text-sx-ink-soft">
                Log in or register a free account so buyers can send offers and escrow payouts reach your wallet.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/login?redirect=/seller/create-listing">
              <Button variant="outline" size="sm">
                Log In
              </Button>
            </Link>
            <Link href="/register?redirect=/seller/create-listing">
              <Button variant="primary" size="sm">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Platform & Ask Price with Live Net Payout */}
        <section className="rounded-xl bg-sx-canvas border border-sx-border p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-sx-border pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-sx-ink">
              1. Platform &amp; Ask Price
            </h2>
            <span className="text-[11px] text-sx-muted font-mono">KES Settlement</span>
          </div>

          {/* Mobile-Friendly Platform Pills */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-sx-ink">
              Native Platform (Where Coins &amp; Squad Reside)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    platform === p.id
                      ? "bg-sx-contrast text-sx-contrast-fg border-sx-contrast"
                      : "bg-sx-stone text-sx-ink border-sx-border hover:border-sx-ink"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Squad Headline *"
            placeholder="e.g. 3195 OVR Quick Counter | Double-Booster Gullit, Vieira & Messi"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {/* Price + Live Payout Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <div className="md:col-span-6 space-y-2">
              <Input
                label="Ask Price (KES) *"
                type="number"
                inputMode="numeric"
                placeholder="e.g. 3500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-sx-muted">Quick:</span>
                {["1500", "2500", "4500", "8000"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPrice(preset)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full border font-mono cursor-pointer transition-colors ${
                      price === preset
                        ? "bg-sx-contrast text-sx-contrast-fg border-sx-contrast font-bold"
                        : "bg-sx-stone border-sx-border text-sx-ink hover:border-sx-ink"
                    }`}
                  >
                    {Number(preset).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-6 rounded-lg bg-sx-stone border border-sx-border p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between text-sx-muted">
                <span>Buyer Pays (Till 1572931)</span>
                <span className="font-mono text-sx-ink font-semibold">
                  KES {numericPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sx-muted">
                <span>5% Escrow Fee (KES 50–500)</span>
                <span className="font-mono text-sx-muted">
                  - KES {platformFee.toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-sx-border flex justify-between items-baseline">
                <span className="font-bold text-sx-ink">Your M-Pesa Payout</span>
                <span className="text-lg font-extrabold font-mono text-sx-green-text">
                  KES {sellerNet.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Step 2: Squad Strength, Epics & Playstyle */}
        <section className="rounded-xl bg-sx-canvas border border-sx-border p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-sx-border pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-sx-ink">
              2. Permanent Squad Stats
            </h2>
            <span className="text-[11px] text-sx-muted">No My League loan inflation</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="space-y-1.5">
              <Input
                label="Permanent OVR *"
                type="number"
                inputMode="numeric"
                placeholder="3150"
                value={overallStrength}
                onChange={(e) => setOverallStrength(e.target.value)}
                required
              />
              <div className="flex gap-1 text-[10px]">
                {["3100", "3160", "3210"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setOverallStrength(v)}
                    className="px-2 py-0.5 rounded bg-sx-stone border border-sx-border text-sx-ink-soft hover:border-sx-ink font-mono cursor-pointer"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Epic / Booster Cards"
              type="number"
              inputMode="numeric"
              placeholder="e.g. 6"
              value={epicCount}
              onChange={(e) => setEpicCount(e.target.value)}
            />

            <Input
              label="eFootball Coins"
              type="number"
              inputMode="numeric"
              placeholder="e.g. 850"
              value={coinBalance}
              onChange={(e) => setCoinBalance(e.target.value)}
            />

            <Input
              label="Top Manager"
              placeholder="e.g. Xabi Alonso 88"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-sx-ink">
              Primary Team Playstyle
            </label>
            <div className="flex flex-wrap gap-2">
              {PLAYSTYLES.map((ps) => (
                <button
                  key={ps.id}
                  type="button"
                  onClick={() => setPlaystyle(ps.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                    playstyle === ps.id
                      ? "bg-sx-contrast text-sx-contrast-fg border-sx-contrast"
                      : "bg-sx-stone text-sx-ink border-sx-border hover:border-sx-ink"
                  }`}
                >
                  {ps.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Key Star Players (Comma-Separated, Optional)"
            placeholder="e.g. Gullit, Patrick Vieira, 106 Messi, Maldini, Schmeichel"
            value={keyPlayersInput}
            onChange={(e) => setKeyPlayersInput(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-sx-ink">
              Additional Squad Notes <span className="text-sx-muted font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Mention extra booster managers, skill tokens, remaining monthly Data Transfers, etc. (Do not include phone numbers)."
              value={sellerNotes}
              onChange={(e) => setSellerNotes(e.target.value)}
              className="w-full rounded-md bg-sx-canvas border border-sx-border-strong px-3.5 py-2.5 text-sm text-sx-ink placeholder:text-sx-muted focus:border-sx-ink focus:outline-none focus:ring-1 focus:ring-sx-ink"
            />
          </div>
        </section>

        {/* Step 3: Screenshots */}
        <section className="rounded-xl bg-sx-canvas border border-sx-border p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-sx-border pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-sx-ink flex items-center gap-2">
                <Camera className="w-4 h-4 text-sx-green-text" />
                <span>3. Squad Screenshots *</span>
              </h2>
              <p className="text-xs text-sx-muted mt-0.5">
                Upload 1 to 5 real screenshots (Starting XI, Reserves, Managers, Link Data). Auto-watermarked to prevent photo theft.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-sx-stone border border-sx-border text-[11px] font-mono font-bold text-sx-ink shrink-0">
              {images.length}/5
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
          />

          {images.length < 5 && (
            <div
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files) handleFilesUpload(e.dataTransfer.files);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragOver(false);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 sm:p-8 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${
                isDragOver
                  ? "border-sx-green bg-sx-green-tint"
                  : "border-sx-border-strong bg-sx-stone hover:border-sx-ink"
              }`}
            >
              {uploadingImages ? (
                <div className="flex flex-col items-center gap-2 py-3">
                  <Loader2 className="w-7 h-7 text-sx-green-text animate-spin" />
                  <p className="text-xs text-sx-ink font-semibold">Uploading &amp; watermarking HD screenshots...</p>
                </div>
              ) : (
                <>
                  <div className="w-11 h-11 rounded-full bg-sx-canvas border border-sx-border flex items-center justify-center text-sx-green-text">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-sx-ink">
                    Tap to select screenshots from gallery (or drag &amp; drop)
                  </p>
                  <p className="text-[11px] text-sx-muted">
                    PNG, JPG, or WebP · Max 10MB per image
                  </p>
                </>
              )}
            </div>
          )}

          {uploadError && (
            <div className="p-3 rounded-lg bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              {images.map((img, idx) => (
                <div
                  key={img.url}
                  className={`group relative rounded-lg overflow-hidden aspect-[4/3] bg-sx-stone border ${
                    idx === 0 ? "border-sx-green ring-2 ring-sx-green/20" : "border-sx-border"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Squad screenshot ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {idx === 0 ? (
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-sx-green text-white font-bold text-[10px] flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>Cover</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryCover(idx)}
                      className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-sx-contrast text-sx-contrast-fg font-bold text-[10px] cursor-pointer"
                    >
                      Make Cover
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded bg-sx-red text-white hover:opacity-90 cursor-pointer"
                    title="Remove screenshot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Step 4: Clean ID Attestation & Publish */}
        <section className="rounded-xl bg-sx-stone border border-sx-border p-5 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={cleanIdConfirmed}
              onChange={(e) => setCleanIdConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-sx-border-strong accent-[#006340]"
            />
            <span className="text-xs text-sx-ink-soft leading-relaxed">
              <strong className="text-sx-ink">Clean Konami ID &amp; 12h Handover Attestation:</strong> I confirm Google Play Games and Apple ID are <strong>Not Linked</strong> on this account, my OVR excludes temporary My League loans, and I can provide the <code>my.konami.net</code> email-change code within 12 hours of escrow funding.
            </span>
          </label>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading || uploadingImages}
            isLoading={loading}
            className="w-full h-12 rounded-lg text-sm sm:text-base font-bold"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? "Publishing Squad..." : "Publish Verified Listing"}</span>
          </Button>
        </section>
      </form>
    </div>
  );
}
