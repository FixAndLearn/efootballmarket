"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DetailTabLink } from "@/components/ui/DetailTabLink";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { watermarkSquadImage } from "@/lib/utils/watermark";
import { calculateEscrowCommission } from "@/lib/utils/commission";
import { getShortPlatformLabel, getShortPlaystyleLabel } from "@/lib/utils";
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
  Sparkles,
  TrendingUp,
  Repeat2,
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

const PHOTO_SLOT_LABELS = [
  {
    slot: "Slot 1",
    title: "Starting XI & Collective OVR",
    hint: "Game Plan view showing Team Strength & Playstyle",
  },
  {
    slot: "Slot 2",
    title: "Reserve Epics & Booster Managers",
    hint: "My Team → Players / Managers sorted by Card Type",
  },
  {
    slot: "Slot 3",
    title: "Link Data = Not Linked",
    hint: "Extras → Support → Link Data (Google Play / Apple = Not Linked)",
  },
];

function estimateKenyanSquadRange(opts: {
  ovr: number;
  epics: number;
  coins: number;
}): { low: number; mid: number; high: number } | null {
  const { ovr, epics, coins } = opts;
  if (!ovr || ovr < 2000) return null;

  let base = 900;
  if (ovr >= 3250) base = 6500;
  else if (ovr >= 3220) base = 4800;
  else if (ovr >= 3190) base = 3600;
  else if (ovr >= 3150) base = 2600;
  else if (ovr >= 3100) base = 1800;
  else if (ovr >= 3050) base = 1300;

  const epicValue = Math.min(epics, 35) * 320;
  const coinValue = Math.floor(Math.min(coins, 25000) * 0.65);

  const midRaw = base + epicValue + coinValue;
  const mid = Math.round(midRaw / 100) * 100;
  const low = Math.max(500, Math.round((mid * 0.82) / 100) * 100);
  const high = Math.round((mid * 1.2) / 100) * 100;

  return { low, mid, high };
}

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
  const [formation, setFormation] = useState("4-2-1-3");
  const [playstyle, setPlaystyle] = useState("quick_counter");
  const [keyPlayersInput, setKeyPlayersInput] = useState("");
  const [sellerNotes, setSellerNotes] = useState("");
  const [allowsSwap, setAllowsSwap] = useState(false);
  const [swapPreferences, setSwapPreferences] = useState("");
  const [cleanIdConfirmed, setCleanIdConfirmed] = useState(true);

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const numericPrice = Number(price) || 0;
  const platformFee = numericPrice >= 100 ? calculateEscrowCommission(numericPrice) : 0;
  const sellerNet = Math.max(0, numericPrice - platformFee);

  const valuationHint = useMemo(
    () =>
      estimateKenyanSquadRange({
        ovr: Number(overallStrength) || 0,
        epics: Number(epicCount) || 0,
        coins: Number(coinBalance) || 0,
      }),
    [overallStrength, epicCount, coinBalance]
  );

  const buildSuggestedHeadline = () => {
    const ovr = Number(overallStrength) || 3150;
    const epics = Number(epicCount) || 0;
    const coins = Number(coinBalance) || 0;
    const shortPlat = getShortPlatformLabel(platform);
    const styleLabel = getShortPlaystyleLabel(playstyle);
    const topPlayers = keyPlayersInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 2);

    const parts: string[] = [`${ovr} OVR`];
    if (epics > 0) {
      parts.push(`${epics}-Epic`);
    } else if (styleLabel) {
      parts.push(styleLabel);
    }

    if (topPlayers.length > 0) {
      parts.push(`(${topPlayers.join(" & ")})`);
    } else if (managerName.trim()) {
      parts.push(`· ${managerName.trim()}`);
    } else if (coins >= 1000) {
      parts.push(`+ ${coins.toLocaleString()} Coins`);
    }

    parts.push(`${shortPlat} Squad`);
    return parts.join(" ").replace(/\s+/g, " ").trim();
  };

  const isBareNumericTitle =
    title.trim().length > 0 &&
    (/^\d{3,4}(\s*\+?\s*(ovr|strength))?$/i.test(title.trim()) ||
      title.trim().length <= 5);

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
    setError("");

    const ovr = Number(overallStrength);
    if (!ovr || ovr < 2000) {
      setError("Enter your squad's Collective Strength (minimum 2000 OVR).");
      return;
    }

    let finalTitle = title.trim();
    if (
      !finalTitle ||
      /^\d{3,4}(\s*\+?\s*(ovr|strength))?$/i.test(finalTitle) ||
      finalTitle.length <= 5
    ) {
      finalTitle = buildSuggestedHeadline();
      setTitle(finalTitle);
    }

    if (numericPrice < 100) {
      setError("Ask price must be at least KES 100.");
      return;
    }

    if (!cleanIdConfirmed) {
      setError(
        "Confirm that your squad uses a Clean Konami ID with Google Play / Apple Game Center unlinked."
      );
      return;
    }

    if (images.length === 0) {
      setError("Upload at least 1 squad screenshot so buyers can verify your team.");
      return;
    }

    setLoading(true);

    try {
      const keyPlayersArray = keyPlayersInput
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const autoDescription =
        sellerNotes.trim() ||
        `Verified ${ovr} OVR eFootball squad on ${
          PLATFORMS.find((p) => p.id === platform)?.label || platform
        }${Number(epicCount) > 0 ? ` featuring ${epicCount} Epic/Booster cards` : ""}${
          keyPlayersArray.length > 0 ? ` (${keyPlayersArray.slice(0, 5).join(", ")})` : ""
        }. Ready for instant Konami ID transfer via M-Pesa escrow.`;

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: finalTitle,
          description: autoDescription,
          price: numericPrice,
          currency: "KES",
          platform,
          overall_team_strength: ovr,
          coin_balance: Number(coinBalance) || 0,
          epic_players_count: Number(epicCount) || 0,
          primary_playstyle: playstyle,
          formation: formation.trim() || null,
          manager_name: managerName.trim() || null,
          key_players_list: keyPlayersArray,
          konami_id_status: "unlinked",
          linked_email_status: "transferable_full_access",
          allows_swap: allowsSwap,
          swap_preferences: allowsSwap ? swapPreferences.trim() || null : null,
          status: "published",
          image_urls: images.map((img) => img.url),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to publish listing");
      }

      if (data.listing?.id) {
        router.push(`/listings/${data.listing.id}?created=1`);
      } else {
        router.push("/dashboard/seller");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong while publishing.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-sx-green-text animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-12 h-12 rounded-full bg-sx-green-tint border border-sx-green-border text-sx-green-text flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-sx-ink font-display">
          Sign in to List Your Squad
        </h1>
        <p className="text-sm text-sx-muted leading-relaxed">
          Create a free account in 20 seconds so we can send instant M-Pesa payouts when your squad sells.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/login?redirect=/seller/create-listing"
            className="inline-flex items-center justify-center min-h-11 px-6 py-2.5 rounded-full bg-sx-green hover:bg-sx-green-hover text-white text-sm font-bold transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register?redirect=/seller/create-listing"
            className="inline-flex items-center justify-center min-h-11 px-6 py-2.5 rounded-full border border-sx-border-strong bg-sx-canvas hover:bg-sx-stone text-sx-ink text-sm font-bold transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10 w-full space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Link
            href="/dashboard/seller"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sx-muted hover:text-sx-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Seller Hub</span>
          </Link>
          <DetailTabLink href="/policies#seller-standards" variant="pill">
            Seller Rules &amp; Payouts
          </DetailTabLink>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-sx-ink font-display tracking-tight">
          Sell Your eFootball Squad
        </h1>
        <p className="text-sm text-sx-muted">
          Upload 3 clear squad screenshots, enter your OVR &amp; Epic count, and receive automated KES pricing guidance.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-sx-red-tint border border-sx-red-border flex items-start gap-2.5 text-xs sm:text-sm text-sx-red-text">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Guided 3-Slot Screenshots */}
        <section className="rounded-xl bg-sx-subtle border border-sx-border p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-sx-ink font-display flex items-center gap-2">
                <Camera className="w-4 h-4 text-sx-green-text" />
                <span>1. Squad Verification Screenshots</span>
              </h2>
              <p className="text-xs text-sx-muted mt-0.5">
                Listings with all 3 recommended proof shots sell up to 3× faster. Auto-watermarked on upload.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-sx-canvas border border-sx-border text-sx-ink shrink-0">
              {images.length}/5
            </span>
          </div>

          <div className="px-3.5 py-2.5 rounded-lg bg-sx-amber-tint border border-sx-amber-border text-[11px] text-sx-amber-text flex flex-wrap items-center justify-between gap-2">
            <span>
              <strong>Privacy tip:</strong> Mask or crop out personal emails, phone numbers, and passwords before uploading.
            </span>
            <DetailTabLink href="/policies#seller-standards" className="text-sx-ink">
              Screenshot Standards
            </DetailTabLink>
          </div>

          {/* 3-Slot Guided Proof Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {PHOTO_SLOT_LABELS.map((item, idx) => {
              const isUploaded = images.length > idx;
              return (
                <div
                  key={item.slot}
                  className={`p-3 rounded-lg border text-xs transition-colors ${
                    isUploaded
                      ? "bg-sx-green-tint border-sx-green-border"
                      : "bg-sx-canvas border-sx-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isUploaded ? "text-sx-green-text" : "text-sx-muted"
                      }`}
                    >
                      {item.slot}
                    </span>
                    {isUploaded && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-sx-green-text shrink-0" />
                    )}
                  </div>
                  <p className="font-bold text-sx-ink leading-snug">{item.title}</p>
                  <p className="text-[11px] text-sx-muted mt-0.5 leading-snug">
                    {item.hint}
                  </p>
                </div>
              );
            })}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFilesUpload(e.target.files);
            }}
          />

          {images.length < 5 && (
            <div
              onClick={() => !uploadingImages && fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (!uploadingImages && e.dataTransfer.files?.length) {
                  handleFilesUpload(e.dataTransfer.files);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? "border-sx-green bg-sx-green-tint"
                  : "border-sx-border-strong hover:border-sx-green bg-sx-canvas"
              } ${uploadingImages ? "opacity-60 pointer-events-none" : ""}`}
            >
              {uploadingImages ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <Loader2 className="w-6 h-6 text-sx-green-text animate-spin" />
                  <p className="text-xs font-semibold text-sx-ink">
                    Uploading &amp; watermarking screenshots...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <UploadCloud className="w-7 h-7 text-sx-green-text" />
                  <p className="text-sm font-bold text-sx-ink">
                    Tap to choose screenshots or drag &amp; drop
                  </p>
                  <p className="text-xs text-sx-muted">
                    PNG, JPG or WebP · Up to 10MB each
                  </p>
                </div>
              )}
            </div>
          )}

          {uploadError && (
            <p className="text-xs text-sx-red-text font-medium">{uploadError}</p>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              {images.map((img, idx) => (
                <div
                  key={img.url}
                  className={`relative group rounded-lg overflow-hidden border aspect-video bg-sx-stone ${
                    idx === 0
                      ? "border-sx-green ring-2 ring-sx-green/20"
                      : "border-sx-border"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`Squad photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {idx === 0 ? (
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-sx-green text-white text-[10px] font-bold flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>Cover · XI</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryCover(idx)}
                      className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      Set Cover
                    </button>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono">
                    {idx === 0
                      ? "Slot 1 · XI"
                      : idx === 1
                      ? "Slot 2 · Reserves"
                      : idx === 2
                      ? "Slot 3 · Link Data"
                      : `Photo ${idx + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1.5 rounded bg-black/70 hover:bg-red-600 text-white transition-colors cursor-pointer"
                    aria-label="Remove screenshot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Step 2: Squad Specs First (Powers Smart Title + KES Valuation) */}
        <section className="rounded-xl bg-sx-subtle border border-sx-border p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-sx-ink font-display">
              2. Squad Strength, Platform &amp; Headline
            </h2>
            <p className="text-xs text-sx-muted mt-0.5">
              Enter your stats first, then tap <strong>Auto-Generate Headline</strong> for a clean marketplace title.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-sx-ink mb-2">
              Platform
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    platform === p.id
                      ? "bg-sx-green text-white border-sx-green"
                      : "bg-sx-canvas border-sx-border text-sx-ink hover:border-sx-border-strong"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Collective Strength (OVR)"
              type="number"
              placeholder="e.g. 3210"
              value={overallStrength}
              onChange={(e) => setOverallStrength(e.target.value)}
              required
            />
            <Input
              label="Epic / Big Time Cards"
              type="number"
              placeholder="e.g. 12"
              value={epicCount}
              onChange={(e) => setEpicCount(e.target.value)}
            />
            <Input
              label="eFootball Coins"
              type="number"
              placeholder="e.g. 850"
              value={coinBalance}
              onChange={(e) => setCoinBalance(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-sx-ink mb-1.5">
                Primary Playstyle
              </label>
              <select
                value={playstyle}
                onChange={(e) => setPlaystyle(e.target.value)}
                className="w-full h-10 bg-sx-canvas border border-sx-border-strong rounded-md px-3 text-sm text-sx-ink focus:outline-none focus:border-sx-green"
              >
                {PLAYSTYLES.map((ps) => (
                  <option key={ps.id} value={ps.id}>
                    {ps.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-sx-ink mb-1.5">
                Squad Formation
              </label>
              <select
                value={formation}
                onChange={(e) => setFormation(e.target.value)}
                className="w-full h-10 bg-sx-canvas border border-sx-border-strong rounded-md px-3 text-sm text-sx-ink focus:outline-none focus:border-sx-green"
              >
                {["4-2-1-3", "4-1-2-3", "4-2-2-2", "4-3-3", "4-4-2", "3-2-4-1", "5-2-1-2", "Custom XI"].map(
                  (fmt) => (
                    <option key={fmt} value={fmt}>
                      {fmt}
                    </option>
                  )
                )}
              </select>
            </div>
            <Input
              label="Booster Manager (Optional)"
              placeholder="e.g. Xabi Alonso 88"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
            />
          </div>

          <Input
            label="Notable Players (comma-separated)"
            placeholder="e.g. Double Booster Gullit, Vieira, Blitz Curler Salah, Maldini"
            value={keyPlayersInput}
            onChange={(e) => setKeyPlayersInput(e.target.value)}
          />

          {/* Smart Headline with 1-Tap Generator */}
          <div className="pt-2 border-t border-sx-border space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-semibold text-sx-ink">
                Squad Headline
              </label>
              <button
                type="button"
                onClick={() => setTitle(buildSuggestedHeadline())}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sx-green-tint border border-sx-green-border text-sx-green-text text-[11px] font-bold hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-Generate Headline</span>
              </button>
            </div>
            <input
              type="text"
              placeholder={buildSuggestedHeadline()}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 bg-sx-canvas border border-sx-border-strong rounded-md px-3 text-sm text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-green"
            />
            {isBareNumericTitle ? (
              <p className="text-[11px] text-sx-amber-text flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Tip: Bare OVR numbers get fewer clicks — we&apos;ll enrich{" "}
                  <strong>&ldquo;{title.trim()}&rdquo;</strong> into{" "}
                  <strong>&ldquo;{buildSuggestedHeadline()}&rdquo;</strong> automatically unless you write a custom title.
                </span>
              </p>
            ) : (
              <p className="text-[11px] text-sx-muted">
                Leave blank or tap <strong>Auto-Generate Headline</strong> and we&apos;ll craft a clean title from your OVR &amp; Epics.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-sx-ink mb-1.5">
              Extra Notes for Buyers (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Any extra boosters, division badges, or transfer availability notes..."
              value={sellerNotes}
              onChange={(e) => setSellerNotes(e.target.value)}
              className="w-full bg-sx-canvas border border-sx-border-strong rounded-md p-3 text-sm text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-green"
            />
          </div>
        </section>

        {/* Step 3: Pricing + Live KES Valuation Hint + Swap Option */}
        <section className="rounded-xl bg-sx-subtle border border-sx-border p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-bold text-sx-ink font-display">
            3. Ask Price, Swap Option &amp; M-Pesa Payout
          </h2>

          {/* Live Kenyan KES Market Valuation Hint */}
          {valuationHint && (
            <div className="p-3.5 rounded-xl bg-sx-canvas border border-sx-green-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sx-green-text">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>
                    Estimated Kenyan Market Value: KES {valuationHint.low.toLocaleString()} – KES{" "}
                    {valuationHint.high.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-sx-muted">
                  Based on {overallStrength} OVR
                  {Number(epicCount) > 0 ? `, ${epicCount} Epic/Big Time cards` : ""}
                  {Number(coinBalance) > 0
                    ? `, & ${Number(coinBalance).toLocaleString()} Coins`
                    : ""}
                  . Squads priced near midpoint sell fastest.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPrice(String(valuationHint.mid))}
                className="px-3 py-1.5 rounded-lg bg-sx-green-tint border border-sx-green-border text-sx-green-text text-xs font-bold shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
              >
                Use KES {valuationHint.mid.toLocaleString()}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <Input
              label="Your Ask Price (KES)"
              type="number"
              placeholder="e.g. 3500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />

            <div className="p-3.5 rounded-lg bg-sx-canvas border border-sx-border space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-sx-muted">
                <span>Buyer Pays to Till 1572931 (KES 0 buyer fee)</span>
                <span className="font-mono text-sx-ink">
                  {numericPrice >= 100 ? `KES ${numericPrice.toLocaleString()}` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sx-muted">
                <span>Seller Service Fee (5%, min 50 / max 500)</span>
                <span className="font-mono">
                  {numericPrice >= 100 ? `- KES ${platformFee.toLocaleString()}` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between font-bold text-sm text-sx-ink pt-1 border-t border-sx-border">
                <span>Your Net M-Pesa Payout</span>
                <span className="font-mono text-sx-green-text">
                  {numericPrice >= 100 ? `KES ${sellerNet.toLocaleString()}` : "KES 0"}
                </span>
              </div>
            </div>
          </div>

          {/* Squad Swap + Cash Top-Up Toggle */}
          <div className="p-3.5 rounded-lg bg-sx-canvas border border-sx-border space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowsSwap}
                onChange={(e) => setAllowsSwap(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs text-sx-ink leading-relaxed">
                <strong className="inline-flex items-center gap-1.5">
                  <Repeat2 className="w-3.5 h-3.5 text-sx-green-text" />
                  <span>Open to Squad Swap + Cash Top-Up</span>
                </strong>{" "}
                — Allow verified buyers to propose trading their squad plus an M-Pesa Till 1572931 cash top-up.
              </span>
            </label>

            {allowsSwap && (
              <Input
                label="What kind of Swap + Top-Up do you prefer? (Optional)"
                placeholder="e.g. 3150+ OVR Android squad + KES 1,500 cash top-up"
                value={swapPreferences}
                onChange={(e) => setSwapPreferences(e.target.value)}
              />
            )}
          </div>

          {/* Clean Konami ID Confirmation */}
          <label className="flex items-start gap-3 p-3.5 rounded-lg bg-sx-green-tint border border-sx-green-border cursor-pointer">
            <input
              type="checkbox"
              checked={cleanIdConfirmed}
              onChange={(e) => setCleanIdConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-emerald-600 cursor-pointer"
            />
            <span className="text-xs text-sx-ink leading-relaxed">
              <strong>Clean Konami ID Confirmed:</strong> Google Play Games and Apple Game Center are{" "}
              <strong>Not Linked</strong>, and I can submit the login + email-change OTP within 12 hours once the buyer pays into Till 1572931.{" "}
              <Link
                href="/news/how-to-verify-clean-konami-id-before-releasing-escrow"
                className="text-sx-green-text underline font-semibold"
              >
                How to check Link Data
              </Link>
            </span>
          </label>

          {/* Plain-Language Publisher Rules Notice */}
          <div className="p-3 rounded-lg bg-sx-canvas border border-sx-border text-[11px] text-sx-muted leading-relaxed">
            <strong className="text-sx-ink">Publisher rules notice:</strong> Konami&apos;s Terms of Use restrict account transfers, and Konami can modify game features or restrict accounts under its own rules. Do not attempt to reclaim a squad after payout — verified post-sale recovery attempts result in permanent ban and fraud reporting.
          </div>
        </section>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <p className="text-xs text-sx-muted flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-sx-green-text shrink-0" />
            <span>Goes live immediately · Protected by Till 1572931 Escrow</span>
          </p>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            disabled={uploadingImages}
            className="w-full sm:w-auto min-w-[220px]"
          >
            Publish Squad Now
          </Button>
        </div>
      </form>
    </div>
  );
}
