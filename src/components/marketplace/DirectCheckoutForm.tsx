"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DetailTabLink } from "@/components/ui/DetailTabLink";
import { formatCurrency, formatSmartListingTitle, getPlatformLabel } from "@/lib/utils";
import { normalizePhoneNumber } from "@/lib/utils/phone";
import { isListingOnFlashSale } from "@/lib/utils/flashSale";
import { calculateEscrowCommission } from "@/lib/utils/commission";
import { Listing, ListingOffer } from "@/types/database";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Lock,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Clock,
  Tag,
  MessageCircle,
  Share2,
} from "lucide-react";

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
  const offerId = searchParams.get("offerId") || searchParams.get("offer");

  const [paymentMethod, setPaymentMethod] = useState<"stk" | "manual">("stk");
  const [phoneNumber, setPhoneNumber] = useState(currentUserPhone);
  const [buyerName, setBuyerName] = useState(currentUserName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<"" | "link" | "till" | "amount">("");

  const [activeOffer, setActiveOffer] = useState<ListingOffer | null>(null);

  const [stkStatus, setStkStatus] = useState<"idle" | "polling" | "confirmed" | "failed">("idle");
  const [checkoutRequestId, setCheckoutRequestId] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState("");
  const [countdown, setCountdown] = useState(60);

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
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [offerId]);

  useEffect(() => {
    if (stkStatus !== "polling" || !checkoutRequestId) return;

    const timerInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          clearInterval(pollInterval);
          setStkStatus("failed");
          setError("M-Pesa prompt timed out. Retry STK Push or switch to Manual Till 1572931.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/payments/status?checkoutRequestId=${encodeURIComponent(checkoutRequestId)}`
        );
        const data = await res.json();

        if (data.status === "completed" || data.status === "success") {
          clearInterval(pollInterval);
          clearInterval(timerInterval);
          setStkStatus("confirmed");
          setTimeout(() => {
            if (createdOrderId) {
              router.push(`/orders/${createdOrderId}`);
            }
          }, 2000);
        } else if (data.status === "failed") {
          clearInterval(pollInterval);
          clearInterval(timerInterval);
          setStkStatus("failed");
          setError(data.message || "Payment prompt was cancelled or declined.");
        }
      } catch {
        // continue polling
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [stkStatus, checkoutRequestId, createdOrderId, router]);

  const isFlashDrop = isListingOnFlashSale(listing);
  const isOwner = Boolean(currentUserId && currentUserId === listing.seller_id);
  const isAvailable = listing.status === "published";

  const payablePrice = (!isFlashDrop && activeOffer?.offered_price) || Number(listing.price);
  const isDiscounted = Boolean(!isFlashDrop && activeOffer && activeOffer.status === "accepted");
  const sellerFee = calculateEscrowCommission(payablePrice);

  const primaryImage =
    listing.images?.find((img) => img.is_primary)?.image_url || listing.images?.[0]?.image_url;

  const copyValue = (value: string, key: "link" | "till" | "amount") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(value);
      setCopiedField(key);
      setTimeout(() => setCopiedField(""), 2200);
    }
  };

  if (isOwner) {
    const isSold = listing.status === "sold";
    const isInEscrow = listing.status === "in_escrow";

    return (
      <div className="w-full max-w-lg mx-auto p-7 rounded-2xl bg-sx-canvas border border-sx-border text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-sx-amber-tint border border-sx-amber-border text-sx-amber-text flex items-center justify-center mx-auto">
          <Lock className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-sx-ink font-display">
          {isSold
            ? "Squad Sold & Delivered"
            : isInEscrow
            ? "Squad Locked in Active Escrow"
            : "This Is Your Own Listing"}
        </h2>
        <p className="text-xs sm:text-sm text-sx-muted max-w-sm mx-auto leading-relaxed">
          {isSold
            ? "This squad has already been transferred to a buyer."
            : isInEscrow
            ? "This squad is currently locked in an active escrow order."
            : "You can share this page's link with buyers on WhatsApp so they can pay directly into Till 1572931."}
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-2.5">
          {!isSold && !isInEscrow && (
            <>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() =>
                  copyValue(
                    typeof window !== "undefined" ? window.location.href : `/pay/${listing.id}`,
                    "link"
                  )
                }
              >
                {copiedField === "link" ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Checkout Link Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Buyer Checkout Link</span>
                  </>
                )}
              </Button>
              <Link href={`/seller/edit-listing/${listing.id}`}>
                <Button variant="outline" size="md">
                  Edit Listing
                </Button>
              </Link>
            </>
          )}
          <Link href="/dashboard/seller">
            <Button variant="ghost" size="md">
              Seller Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isAvailable) {
    return (
      <div className="w-full max-w-lg mx-auto p-7 rounded-2xl bg-sx-canvas border border-sx-border text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-sx-stone border border-sx-border text-sx-muted flex items-center justify-center mx-auto">
          <Lock className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-sx-ink font-display">
          {listing.status === "sold" ? "Squad Already Sold" : "Locked in Active Escrow"}
        </h2>
        <p className="text-xs sm:text-sm text-sx-muted max-w-sm mx-auto leading-relaxed">
          {listing.status === "sold"
            ? "This squad has already been purchased and verified by another buyer."
            : "Another buyer has funded Till 1572931 and is currently in the 24-hour inspection window."}
        </p>
        <div className="pt-2">
          <Link href="/browse">
            <Button variant="primary" size="md">
              Browse Available Squads
              <ArrowRight className="w-4 h-4" />
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
      setError("Enter a valid Kenyan mobile number (e.g. 0712 345 678 or 0110 123 456).");
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
          buyerName: buyerName.trim() || "Verified Buyer",
          offerId: isFlashDrop ? undefined : activeOffer?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not initiate M-Pesa STK Push.");
      }

      setCreatedOrderId(data.orderId);
      setCheckoutRequestId(data.checkoutRequestId || "");
      setCountdown(60);
      setStkStatus("polling");
    } catch (err: any) {
      setError(err.message || "Payment request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const displayTitle = formatSmartListingTitle(listing);

  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://www.efootballmarket.co.ke/pay/${listing.id}`;

  const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(
    `${displayTitle} (${listing.overall_team_strength} OVR) — ${formatCurrency(
      payablePrice,
      listing.currency
    )} via M-Pesa Till 1572931 Escrow: ${shareUrl}`
  )}`;

  const whatsappSupportHref = `https://wa.me/254794400365?text=${encodeURIComponent(
    `Hello eFootballMarket Support, I need assistance checking out "${displayTitle}" (KES ${payablePrice.toLocaleString()}) via Till 1572931.`
  )}`;

  return (
    <div className="w-full max-w-xl mx-auto space-y-5">
      {/* Header */}
      <div className="space-y-1.5">
        <Link
          href={`/listings/${listing.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-sx-muted hover:text-sx-ink transition-colors"
        >
          <span>&larr; Back to Squad Details</span>
        </Link>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-sx-ink font-display tracking-tight">
            Verified Escrow Checkout
          </h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sx-green-tint border border-sx-green-border text-sx-green-text text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Till 1572931</span>
          </span>
        </div>
        <p className="text-xs sm:text-sm text-sx-muted">
          Your payment stays locked in escrow until you inspect the squad in-game and rebind the Konami ID to your own email.
        </p>
      </div>

      {isFlashDrop && (
        <div className="p-3.5 rounded-xl bg-sx-amber-tint border border-sx-amber-border text-xs text-sx-amber-text flex items-start gap-2.5">
          <Tag className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Friday Drop Promotional Price Active</strong>
            <span>Locked at {formatCurrency(payablePrice, listing.currency)} — custom offers are paused during drops.</span>
          </div>
        </div>
      )}

      {isDiscounted && activeOffer && (
        <div className="p-3.5 rounded-xl bg-sx-green-tint border border-sx-green-border text-xs text-sx-green-text flex items-start gap-2.5">
          <Tag className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">
              Accepted Offer Locked ({activeOffer.discount_percentage}% Off)
            </strong>
            <span>
              Seller accepted your offer of KES {activeOffer.offered_price.toLocaleString()}.
            </span>
          </div>
        </div>
      )}

      {/* Card 1: Squad & Clear Fee Breakdown */}
      <div className="rounded-xl bg-sx-canvas border border-sx-border p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="relative w-20 h-16 rounded-lg bg-sx-stone border border-sx-border overflow-hidden shrink-0">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={displayTitle}
                fill
                sizes="80px"
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sx-green-text">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-sx-stone border border-sx-border text-[10px] font-bold uppercase text-sx-ink">
                {getPlatformLabel(listing.platform)}
              </span>
              <span className="px-2 py-0.5 rounded bg-sx-green-tint text-sx-green-text text-[10px] font-mono font-bold">
                {listing.overall_team_strength} OVR
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-sx-ink line-clamp-1 font-display">
              {displayTitle}
            </h2>
          </div>
          <Link
            href={`/listings/${listing.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-sx-green-text hover:underline shrink-0 inline-flex items-center gap-1"
          >
            <span>Inspect</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="rounded-lg bg-sx-stone border border-sx-border p-3.5 space-y-2 text-xs">
          <div className="flex justify-between text-sx-muted">
            <span>Squad Ask Price</span>
            <span
              className={
                isDiscounted
                  ? "line-through text-sx-muted font-mono"
                  : "text-sx-ink font-semibold font-mono"
              }
            >
              {formatCurrency(listing.price, listing.currency)}
            </span>
          </div>

          {isDiscounted && activeOffer && (
            <div className="flex justify-between text-sx-green-text font-semibold">
              <span>Accepted Offer Savings</span>
              <span className="font-mono">
                - {formatCurrency(Number(listing.price) - activeOffer.offered_price, listing.currency)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-sx-muted">
            <span>Buyer Escrow Fee (24h Inspection)</span>
            <span className="text-sx-green-text font-bold font-mono">KES 0 (Free)</span>
          </div>

          <div className="pt-2.5 border-t border-sx-border flex justify-between items-baseline">
            <span className="text-xs font-bold uppercase tracking-wider text-sx-ink">
              Total You Pay
            </span>
            <span className="text-2xl font-extrabold text-sx-ink font-display font-mono">
              {formatCurrency(payablePrice, listing.currency)}
            </span>
          </div>
          <p className="text-[11px] text-sx-muted pt-0.5">
            Note: The {formatCurrency(sellerFee, "KES")} platform commission (5%, capped KES 50–500) is deducted from the seller&apos;s payout—never added to your bill.
          </p>
        </div>
      </div>

      {/* Card 2: Mobile Payment Method Tabs OR Live Polling */}
      {stkStatus === "idle" || stkStatus === "failed" ? (
        <div className="rounded-xl bg-sx-canvas border border-sx-border overflow-hidden">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 border-b border-sx-border bg-sx-stone p-1 gap-1">
            <button
              type="button"
              onClick={() => setPaymentMethod("stk")}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                paymentMethod === "stk"
                  ? "bg-sx-canvas text-sx-ink shadow-sm border border-sx-border"
                  : "text-sx-muted hover:text-sx-ink"
              }`}
            >
              Instant STK Push
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("manual")}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                paymentMethod === "manual"
                  ? "bg-sx-canvas text-sx-ink shadow-sm border border-sx-border"
                  : "text-sx-muted hover:text-sx-ink"
              }`}
            >
              Manual Till 1572931
            </button>
          </div>

          {paymentMethod === "stk" ? (
            <form onSubmit={handleTriggerPayment} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-sx-ink mb-1.5">
                  Safaricom M-Pesa Phone Number <span className="text-sx-red-text">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0712 345 678 or 0110 123 456"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-lg bg-sx-stone border border-sx-border-strong focus:bg-sx-canvas focus:border-sx-ink text-sx-ink placeholder:text-sx-muted text-base font-mono focus:outline-none transition-colors"
                />
                <div className="mt-1.5 text-[11px]">
                  {phoneNumber.trim().length >= 9 ? (
                    normalizePhoneNumber(phoneNumber).isValid ? (
                      <span className="text-sx-green-text font-semibold inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Ready for STK Push: {normalizePhoneNumber(phoneNumber).international}
                      </span>
                    ) : (
                      <span className="text-sx-amber-text">
                        Enter a 10-digit 07... or 01... Kenyan mobile number
                      </span>
                    )
                  ) : (
                    <span className="text-sx-muted">
                      An automatic PIN prompt for Till 1572931 will pop up on this phone.
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-sx-ink mb-1.5">
                  Your Name or WhatsApp Handle <span className="text-sx-muted font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Kevin M."
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg bg-sx-stone border border-sx-border-strong focus:bg-sx-canvas focus:border-sx-ink text-sx-ink placeholder:text-sx-muted text-sm focus:outline-none transition-colors"
                />
              </div>

              {error && (
                <div className="p-3.5 rounded-lg bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full h-12 text-sm sm:text-base font-bold rounded-lg"
                isLoading={loading}
              >
                <Smartphone className="w-4 h-4" />
                <span>Pay {formatCurrency(payablePrice, listing.currency)} via M-Pesa</span>
              </Button>
            </form>
          ) : (
            <div className="p-5 sm:p-6 space-y-4 text-xs">
              <p className="text-sx-ink-soft leading-relaxed">
                Paying from another phone or SIM Toolkit? Send the exact amount to our verified Buy Goods Till and message support with your M-Pesa code to lock the order immediately:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-sx-stone border border-sx-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-sx-muted block">
                      Buy Goods Till Number
                    </span>
                    <span className="text-lg font-extrabold font-mono text-sx-ink">1572931</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyValue("1572931", "till")}
                    className="px-3 py-1.5 rounded-md bg-sx-canvas border border-sx-border-strong text-sx-ink font-semibold hover:border-sx-ink inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === "till" ? <Check className="w-3.5 h-3.5 text-sx-green-text" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === "till" ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-lg bg-sx-stone border border-sx-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-sx-muted block">
                      Exact Amount (KES)
                    </span>
                    <span className="text-lg font-extrabold font-mono text-sx-green-text">
                      {payablePrice.toLocaleString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyValue(String(payablePrice), "amount")}
                    className="px-3 py-1.5 rounded-md bg-sx-canvas border border-sx-border-strong text-sx-ink font-semibold hover:border-sx-ink inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === "amount" ? <Check className="w-3.5 h-3.5 text-sx-green-text" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === "amount" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <ol className="list-decimal pl-5 space-y-1 text-sx-muted leading-relaxed">
                <li>Open <strong>M-Pesa</strong> &rarr; <strong>Lipa Na M-Pesa</strong> &rarr; <strong>Buy Goods and Services</strong>.</li>
                <li>Enter Till Number <strong className="text-sx-ink">1572931</strong> and Amount <strong className="text-sx-ink">KES {payablePrice.toLocaleString()}</strong>.</li>
                <li>Tap below to send your M-Pesa receipt code on WhatsApp if paying without STK Push.</li>
              </ol>

              <a
                href={`https://wa.me/254794400365?text=${encodeURIComponent(
                  `Hello eFootballMarket Support, I have paid KES ${payablePrice.toLocaleString()} to Buy Goods Till 1572931 for "${listing.title}" (ID: ${listing.id.slice(0, 8)}). My M-Pesa receipt code is: `
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 rounded-lg bg-sx-green hover:bg-sx-green-hover text-white font-bold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Confirm Manual Till Receipt on WhatsApp</span>
              </a>
            </div>
          )}

          {/* Share & Help Footer Bar */}
          <div className="px-5 py-3.5 bg-sx-subtle border-t border-sx-border flex flex-wrap items-center justify-between gap-2 text-xs">
            <a
              href={whatsappSupportHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-sx-green-text hover:underline"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Checkout Help (0794 400 365)</span>
            </a>

            <div className="flex items-center gap-3">
              <a
                href={whatsappShareHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sx-muted hover:text-sx-ink font-medium"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => copyValue(shareUrl, "link")}
                className="inline-flex items-center gap-1 text-sx-muted hover:text-sx-ink font-medium cursor-pointer"
              >
                {copiedField === "link" ? (
                  <Check className="w-3.5 h-3.5 text-sx-green-text" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedField === "link" ? "Copied" : "Copy Link"}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Live STK Push Polling State */
        <div className="p-6 sm:p-8 rounded-xl bg-sx-canvas border border-sx-green-border space-y-5 text-center">
          {stkStatus === "confirmed" ? (
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-full bg-sx-green-tint border border-sx-green-border text-sx-green-text flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-sx-ink font-display">
                  M-Pesa Escrow Funded
                </h3>
                <p className="text-xs text-sx-muted">
                  Secured in Safaricom Till 1572931. Opening your Order Room...
                </p>
              </div>
              {createdOrderId && (
                <Link href={`/orders/${createdOrderId}`}>
                  <Button variant="primary" size="lg" className="w-full mt-2">
                    <span>Open Order Room</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="w-14 h-14 rounded-full bg-sx-amber-tint border border-sx-amber-border text-sx-amber-text flex items-center justify-center mx-auto animate-pulse">
                <Smartphone className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-sx-ink font-display">
                  Check Your Phone ({countdown}s)
                </h3>
                <p className="text-xs text-sx-muted">
                  STK prompt sent to <strong className="text-sx-ink font-mono">{phoneNumber}</strong> for{" "}
                  <strong className="text-sx-green-text font-mono">
                    {formatCurrency(payablePrice, listing.currency)}
                  </strong>
                  .
                </p>
              </div>

              <div className="p-4 rounded-lg bg-sx-stone border border-sx-border text-xs text-left space-y-1.5">
                <div className="flex items-center gap-1.5 text-sx-ink font-bold">
                  <Clock className="w-3.5 h-3.5 text-sx-green-text" />
                  <span>Confirm on handset:</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-sx-ink-soft">
                  <li>Unlock your Safaricom phone screen.</li>
                  <li>Confirm Buy Goods Till <strong>1572931</strong> and amount <strong>KES {payablePrice.toLocaleString()}</strong>.</li>
                  <li>Enter your M-Pesa PIN and press OK.</li>
                </ol>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-sx-muted">
                <Loader2 className="w-4 h-4 animate-spin text-sx-green-text" />
                <span>Waiting for M-Pesa callback...</span>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStkStatus("idle");
                    setPaymentMethod("manual");
                  }}
                  className="text-sx-green-text font-semibold hover:underline cursor-pointer"
                >
                  Didn&apos;t get prompt? Pay Manually via Till 1572931
                </button>
                <button
                  type="button"
                  onClick={() => setStkStatus("idle")}
                  className="text-sx-muted hover:text-sx-ink underline cursor-pointer"
                >
                  Change Number
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Crisp 1-Line Protection Summary (Detailed Rules Open in New Tab) */}
      <div className="px-4 py-3 rounded-xl bg-sx-subtle border border-sx-border text-xs text-sx-muted flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-sx-green-text shrink-0" />
          <span>
            <strong className="text-sx-ink">24h Buyer Check:</strong> Seller paid only after you verify Clean ID in-game.
          </span>
        </span>
        <DetailTabLink href="/policies#disputes">
          Refund &amp; Publisher Rules
        </DetailTabLink>
      </div>
    </div>
  );
}
