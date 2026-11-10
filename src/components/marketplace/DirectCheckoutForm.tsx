"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatCurrency, getPlatformLabel } from "@/lib/utils";
import { normalizePhoneNumber, formatDisplayPhone } from "@/lib/utils/phone";
import { Listing, ListingOffer } from "@/types/database";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Lock,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Clock,
  Tag,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { isListingOnFlashSale } from "@/lib/utils/flashSale";
import { calculateEscrowCommission } from "@/lib/utils/commission";
import { MessageCircle } from "lucide-react";

interface DirectCheckoutFormProps {
  listing: Listing;
  currentUserId?: string;
  currentUserPhone?: string;
  currentUserName?: string;
}

export function DirectCheckoutForm({
  listing,
  currentUserId,
  currentUserPhone = "",
  currentUserName = "",
}: DirectCheckoutFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerId = searchParams.get("offer");

  const [phoneNumber, setPhoneNumber] = useState(currentUserPhone);
  const [buyerName, setBuyerName] = useState(currentUserName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Offer verification state
  const [activeOffer, setActiveOffer] = useState<ListingOffer | null>(null);
  const [loadingOffer, setLoadingOffer] = useState(Boolean(offerId));

  // Payment progress states
  const [stkStatus, setStkStatus] = useState<"idle" | "prompt_sent" | "polling" | "confirmed" | "failed">("idle");
  const [checkoutRequestId, setCheckoutRequestId] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState("");
  const [countdown, setCountdown] = useState(60);

  // Fetch offer details if offerId is present
  useEffect(() => {
    if (!offerId) return;

    let isMounted = true;
    fetch(`/api/offers?offerId=${encodeURIComponent(offerId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.offer && data.offer.status === "accepted") {
          setActiveOffer(data.offer);
          if (data.offer.buyer_name && !buyerName) setBuyerName(data.offer.buyer_name);
          if (data.offer.buyer_phone && !phoneNumber) setPhoneNumber(data.offer.buyer_phone);
        }
      })
      .catch((err) => console.warn("Offer fetch note:", err))
      .finally(() => {
        if (isMounted) setLoadingOffer(false);
      });

    return () => {
      isMounted = false;
    };
  }, [offerId]);

  // Polling STK Push status
  useEffect(() => {
    if (stkStatus !== "polling" || !checkoutRequestId) return;

    let pollInterval: NodeJS.Timeout;
    let timerInterval: NodeJS.Timeout;

    timerInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          clearInterval(pollInterval);
          setStkStatus("failed");
          setError("M-Pesa payment prompt timed out. Please retry or verify you have sufficient funds.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status?checkoutRequestId=${encodeURIComponent(checkoutRequestId)}`);
        const data = await res.json();

        if (data.status === "completed" || data.status === "success") {
          clearInterval(pollInterval);
          clearInterval(timerInterval);
          setStkStatus("confirmed");
          setTimeout(() => {
            if (createdOrderId) {
              router.push(`/orders/${createdOrderId}`);
            }
          }, 2500);
        } else if (data.status === "failed") {
          clearInterval(pollInterval);
          clearInterval(timerInterval);
          setStkStatus("failed");
          setError(data.message || "Payment cancelled or rejected by user.");
        }
      } catch {
        // Continue polling
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [stkStatus, checkoutRequestId, createdOrderId, router]);

  const isFlashDrop = isListingOnFlashSale(listing);
  const isOwner = currentUserId && currentUserId === listing.seller_id;
  const isAvailable = listing.status === "published";

  // Mutually exclusive commerce rule: during Flash Drops, bargaining is withdrawn; price is locked to flash price.
  const payablePrice = (!isFlashDrop && activeOffer?.offered_price) || Number(listing.price);
  const isDiscounted = !isFlashDrop && activeOffer && activeOffer.status === "accepted";

  // 1. Guardrail: Seller cannot purchase their own listing
  if (isOwner) {
    const isSold = listing.status === "sold";
    const isInEscrow = listing.status === "in_escrow";

    return (
      <div className="w-full max-w-xl mx-auto p-8 rounded-3xl bg-[#111827] border border-[#E2E2E0] text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-[#B45309]" />
        </div>
        <h2 className="text-xl font-bold text-[#0F0F0F] font-display">
          {isSold
            ? "Account Sold & Delivered"
            : isInEscrow
            ? "Account Under Active Escrow"
            : "You Own This Listing"}
        </h2>
        <p className="text-xs text-[#5F5F5F] max-w-sm mx-auto leading-relaxed">
          {isSold
            ? "This account has already been sold and transferred. Sold accounts cannot be edited or purchased."
            : isInEscrow
            ? "This account is currently locked in an active escrow transaction."
            : "Sellers cannot initiate M-Pesa STK push payments or buy their own listed eFootball accounts."}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          {!isSold && !isInEscrow ? (
            <Link href={`/seller/edit-listing/${listing.id}`}>
              <Button variant="gold" size="md">
                Edit in Seller Hub
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard/seller">
              <Button variant="secondary" size="md">
                Back to Seller Dashboard
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // 2. Guardrail: Account is already locked in escrow or sold
  if (!isAvailable) {
    return (
      <div className="w-full max-w-xl mx-auto p-8 rounded-3xl bg-[#111827] border border-[#E2E2E0] text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#F4F3F1] border border-[#C8C8C4] text-[#B45309] flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-[#B45309]" />
        </div>
        <h2 className="text-xl font-bold text-[#0F0F0F] font-display">
          {listing.status === "sold" ? "Account Sold & Delivered" : "Account Under Active Escrow Lock"}
        </h2>
        <p className="text-xs text-[#5F5F5F] max-w-sm mx-auto leading-relaxed">
          {listing.status === "sold"
            ? "This eFootball squad has already been purchased and transferred to a verified buyer."
            : "Another trader has deposited funds into Till 1572931 and is currently completing the 24-hour verification inspection."}
        </p>
        <div className="pt-2">
          <Link href="/browse">
            <Button variant="secondary" size="md">
              Browse Available Squads &rarr;
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleTriggerPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const norm = normalizePhoneNumber(phoneNumber);
    if (!norm.isValid) {
      setError("Please enter a valid Safaricom phone number (e.g. 0794400365 or +254 794 400 365).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/payments/direct-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          phoneNumber: norm.digits,
          buyerName: buyerName || "eFootball Trader",
          offerId: isFlashDrop ? undefined : activeOffer?.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger M-Pesa STK Push");
      }

      setCreatedOrderId(data.orderId);
      setCheckoutRequestId(data.checkoutRequestId || "");
      setCountdown(60);
      setStkStatus("polling");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Top Escrow Guarantee Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF5F0] border border-[#BFE0CE] text-[#006340] text-xs font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Till 1572931 Verified Escrow Checkout</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F0F0F] font-display">
          Instant M-Pesa Checkout
        </h1>
        <p className="text-xs sm:text-sm text-[#5F5F5F] max-w-md mx-auto">
          Funds are locked in escrow and released to the seller only after you test and bind Konami ID credentials.
        </p>
      </div>

      {/* Friday Flash Drop Banner */}
      {isFlashDrop && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-rose-950/40 to-amber-950/60 border border-[#FDE68A] flex items-start gap-3 shadow-lg">
          <Flame className="w-5 h-5 text-[#B45309] fill-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-0.5 text-xs">
            <span className="font-bold text-[#92400E] block text-sm">
              ⚡ Friday Flash Drop Checkout
            </span>
            <p className="text-[#3D3D3D]">
              This squad is locked at the promotional flash price of <strong>{formatCurrency(payablePrice, listing.currency)}</strong>. Further bargaining is withdrawn during flash sales.
            </p>
          </div>
        </div>
      )}

      {/* Accepted Offer Banner */}
      {isDiscounted && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/60 to-emerald-950/60 border border-[#FDE68A] flex items-start gap-3 shadow-lg">
          <Tag className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <span className="font-bold text-[#92400E] block text-sm">
              🎉 Accepted Offer Applied ({activeOffer.discount_percentage}% OFF)
            </span>
            <p className="text-[#3D3D3D]">
              The seller accepted your custom price of <strong>KES {activeOffer.offered_price.toLocaleString()}</strong>.
              This discounted rate is locked for checkout.
            </p>
          </div>
        </div>
      )}

      {/* Squad Summary Card */}
      <div className="p-5 rounded-2xl bg-pitch-surface border border-pitch-border shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B45309] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-full">
                {getPlatformLabel(listing.platform)}
              </span>
              <span className="text-[10px] font-bold text-[#006340] bg-[#EBF5F0] border border-[#BFE0CE] px-2 py-0.5 rounded-full">
                OVR {listing.overall_team_strength}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#0F0F0F] font-display">
              {listing.title}
            </h2>
            <p className="text-xs text-[#5F5F5F] mt-0.5">
              Manager: {listing.manager_name || "Custom"} <span className="text-slate-600">/</span> Playstyle: {listing.primary_playstyle?.replace("_", " ") || "Quick Counter"}
            </p>
          </div>

          <Link
            href={`/listings/${listing.id}`}
            className="text-xs font-semibold text-[#006340] hover:text-[#006340] flex items-center gap-1 shrink-0 pt-1"
          >
            <span>View Squad</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Pricing Breakdown */}
        <div className="p-4 rounded-xl bg-pitch-card border border-pitch-border/80 space-y-2 text-xs">
          <div className="flex justify-between text-[#5F5F5F]">
            <span>Listing Price</span>
            <span className={isDiscounted ? "line-through text-[#767676] font-mono" : "text-[#1F1F1F] font-mono"}>
              {formatCurrency(listing.price)}
            </span>
          </div>

          {isDiscounted && (
            <div className="flex justify-between text-[#B45309] font-semibold">
              <span>Accepted Offer Discount</span>
              <span className="font-mono">
                - {formatCurrency(Number(listing.price) - activeOffer.offered_price)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-[#5F5F5F]">
            <span>Escrow Protection Fee</span>
            <span className="text-[#006340] font-semibold font-mono">
              KES {calculateEscrowCommission(payablePrice)} (5% Tiered: KES 50 - 500)
            </span>
          </div>

          <div className="border-t border-pitch-border/60 pt-2 flex justify-between items-baseline font-bold text-sm">
            <span className="text-[#1F1F1F]">Total Payable via M-Pesa:</span>
            <span className="text-2xl text-[#006340] font-mono font-extrabold">
              {formatCurrency(payablePrice)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Checkout Form OR Polling State */}
      {stkStatus === "idle" || stkStatus === "failed" ? (
        <form onSubmit={handleTriggerPayment} className="p-6 rounded-2xl bg-pitch-surface border border-pitch-border shadow-2xl space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-pitch-border/60">
            <Smartphone className="w-5 h-5 text-[#006340]" />
            <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider">
              Enter Safaricom Details
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#3D3D3D] mb-1.5">
                M-Pesa Phone Number (Auto International Format) <span className="text-[#C92A2A]">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="e.g. 0794400365 or +254 794 400 365"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-pitch-card border border-pitch-border text-[#0F0F0F] placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                {phoneNumber.trim().length >= 9 ? (
                  normalizePhoneNumber(phoneNumber).isValid ? (
                    <span className="text-[#006340] font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3 text-[#006340]" />
                      Verified format: {normalizePhoneNumber(phoneNumber).international}
                    </span>
                  ) : (
                    <span className="text-[#B45309]">
                      Format: 07XX XXX XXX or 01XX XXX XXX
                    </span>
                  )
                ) : (
                  <span className="text-[#5F5F5F]">
                    Safaricom Till 1572931 STK Prompt
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D3D3D] mb-1.5">
                Your Name / WhatsApp Handle <span className="text-[#767676]">(Optional)</span>
              </label>
              <input
                type="text"
                autoComplete="name"
                placeholder="e.g. Brian O."
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-pitch-card border border-pitch-border text-[#0F0F0F] placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-xs flex items-start gap-2.5 shadow-md">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#C92A2A] mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">Payment Notice</span>
                <p className="leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="w-full text-base font-extrabold shadow-xl shadow-amber-500/10 py-6"
            isLoading={loading}
          >
            <Smartphone className="w-5 h-5 mr-2" />
            Pay {formatCurrency(payablePrice)} via M-Pesa
          </Button>

          
          {/* Instant WhatsApp Support Trigger */}
          <div className="pt-1">
            <a
              href={`https://wa.me/254794400365?text=${encodeURIComponent(
                `Hello Brian Okibo (eFootballMarket Admin), I am checking out squad "${listing.title}" (KES ${payablePrice}). Please confirm M-Pesa Till 1572931 escrow availability.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#F9F9F8] border border-[#C8C8C4] hover:border-[#BFE0CE] hover:bg-[#F4F3F1] transition-all text-xs font-semibold text-[#0F0F0F]"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#006340] fill-emerald-400" />
              <span>Instant WhatsApp Escrow Support (0794400365)</span>
            </a>
          </div>
<div className="pt-2 flex items-center justify-between text-xs text-[#5F5F5F]">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#006340]" />
              <span>Safaricom Daraja API Protected</span>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="hover:text-[#1F1F1F] transition-colors flex items-center gap-1"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-[#006340]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Link Copied!" : "Share Buy Link"}</span>
            </button>
          </div>
        </form>
      ) : (
        /* Live Polling & Prompt Status Screen */
        <div className="p-8 rounded-2xl bg-pitch-surface border border-[#BFE0CE] shadow-2xl space-y-6 text-center animate-fade-in">
          {stkStatus === "confirmed" ? (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#EBF5F0] border-2 border-emerald-400 text-[#006340] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[#006340] font-display">
                  Payment Confirmed via M-Pesa!
                </h3>
                <p className="text-xs text-[#3D3D3D]">
                  Funds safely secured in escrow under <strong>Till 1572931</strong>.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-pitch-card border border-pitch-border text-xs text-[#3D3D3D]">
                Redirecting you to view credentials & start the Konami ID takeover checklist...
              </div>
              {createdOrderId && (
                <Link href={`/orders/${createdOrderId}`}>
                  <Button variant="gold" size="lg" className="w-full mt-2 font-bold">
                    View Credentials & Order #{createdOrderId.slice(0, 8)}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="w-16 h-16 rounded-full bg-[#FEF3C7] border-2 border-amber-400/80 text-[#B45309] flex items-center justify-center mx-auto animate-pulse">
                <Smartphone className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-[#0F0F0F] font-display">
                  M-Pesa STK Prompt Sent!
                </h3>
                <p className="text-xs text-[#3D3D3D] max-w-sm mx-auto">
                  A prompt was sent to <strong className="text-[#006340] font-mono">{phoneNumber}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-pitch-card border border-pitch-border text-xs text-left space-y-2 text-[#3D3D3D]">
                <div className="flex items-center gap-2 text-[#92400E] font-semibold">
                  <Clock className="w-4 h-4" />
                  <span>Next Steps on your phone ({countdown}s):</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-[#3D3D3D]">
                  <li>Unlock your Safaricom phone.</li>
                  <li>Verify Till: <strong>1572931 (EFootballMarket)</strong>.</li>
                  <li>Verify Amount: <strong>KES {payablePrice.toLocaleString()}</strong>.</li>
                  <li>Enter your Secret M-Pesa PIN and press OK.</li>
                </ol>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-[#5F5F5F]">
                <Loader2 className="w-4 h-4 animate-spin text-[#006340]" />
                <span>Waiting for Safaricom confirmation...</span>
              </div>

              {/* Manual Till 1572931 Fallback Option */}
              <div className="p-3.5 rounded-xl bg-pitch-surface border border-dashed border-[#FDE68A] text-left text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#92400E] flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#B45309]" />
                    Didn't receive the STK prompt?
                  </span>
                  <span className="text-[10px] text-[#5F5F5F] bg-pitch-card px-2 py-0.5 rounded border border-pitch-border font-mono">
                    Till 1572931
                  </span>
                </div>
                <p className="text-[11px] text-[#3D3D3D] leading-relaxed">
                  Pay directly: <strong>M-Pesa</strong> &rarr; <strong>Lipa Na M-Pesa</strong> &rarr; <strong>Buy Goods</strong> &rarr; Till <strong>1572931</strong> (Brian Okibo) &rarr; Amount: <strong>KES {payablePrice.toLocaleString()}</strong>.
                </p>
                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span className="text-[#5F5F5F]">Instant Escrow Lock</span>
                  <a
                    href="https://wa.me/254794400365"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#006340] hover:text-[#006340] font-semibold underline"
                  >
                    WhatsApp Support: 0794400365 &rarr;
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setStkStatus("idle")}
                  className="text-xs text-[#5F5F5F] hover:text-[#1F1F1F] underline"
                >
                  Change Phone Number or Retry STK
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Footer Guarantee */}
      <div className="p-4 rounded-xl bg-pitch-card/60 border border-pitch-border/60 text-xs text-[#5F5F5F] space-y-2">
        <div className="flex items-center gap-2 text-[#1F1F1F] font-semibold">
          <ShieldCheck className="w-4 h-4 text-[#006340]" />
          <span>How our escrow checkout protects your payment:</span>
        </div>
        <ul className="space-y-1 text-[11px] text-[#5F5F5F] pl-6 list-disc">
          <li>The seller DOES NOT receive your money until you confirm Konami ID access.</li>
          <li>If credentials do not work, you can open an instant dispute for a full refund.</li>
          <li>Executive oversight by Brian Okibo, CEO (Helpline: 0794400365).</li>
        </ul>
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
              className="text-[#B45309] hover:text-[#92400E] underline font-medium inline-flex items-center gap-1"
            >
              Read Konami’s official notice
              <ExternalLink className="w-3 h-3 inline" />
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
