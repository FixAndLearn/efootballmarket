import React from "react";
import { CheckCircle2, MessageSquareQuote, ShieldCheck, Star } from "lucide-react";
import { VerifiedSellerReview } from "@/services/reviewService";

interface SellerReviewsSectionProps {
  sellerUsername: string;
  sellerRating?: number | null;
  totalReviewsCount?: number | null;
  completedSalesCount?: number | null;
  reviews: VerifiedSellerReview[];
  compact?: boolean;
}

export function SellerReviewsSection({
  sellerUsername,
  sellerRating,
  totalReviewsCount,
  completedSalesCount,
  reviews,
  compact = false,
}: SellerReviewsSectionProps) {
  const avgRating = Number(sellerRating || 0);
  const reviewTotal = Math.max(Number(totalReviewsCount || 0), reviews.length);
  const salesTotal = Number(completedSalesCount || 0);

  if (reviews.length === 0 && salesTotal === 0 && reviewTotal === 0) {
    return (
      <section className="rounded-2xl bg-sx-subtle border border-sx-border p-5 sm:p-6 space-y-2.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-bold text-sx-ink uppercase tracking-wider flex items-center gap-2">
            <MessageSquareQuote className="w-4 h-4 text-sx-green-text" />
            <span>Verified Buyer Reviews</span>
          </h2>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sx-green-text bg-sx-green-tint border border-sx-green-border px-2.5 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            <span>Till 1572931 Hold</span>
          </span>
        </div>
        <p className="text-xs text-sx-muted leading-relaxed">
          @{sellerUsername} hasn&apos;t received written buyer reviews yet. Every purchase on eFootballMarket uses Buy Goods Till <strong>1572931</strong> payment holding and a 24-hour buyer login check before seller payout.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-sx-subtle border border-sx-border p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sx-border pb-4">
        <div className="space-y-1">
          <h2 className="text-sm sm:text-base font-bold text-sx-ink font-display flex items-center gap-2">
            <MessageSquareQuote className="w-4 h-4 text-sx-green-text" />
            <span>Verified Escrow Buyer Feedback</span>
          </h2>
          <p className="text-xs text-sx-muted">
            Only buyers who completed a verified Konami ID handover via Till 1572931 can rate @{sellerUsername}.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {avgRating > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sx-canvas border border-sx-border">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-extrabold font-mono text-sx-ink">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-xs text-sx-muted">
                ({reviewTotal} {reviewTotal === 1 ? "rating" : "ratings"})
              </span>
            </div>
          )}
          {salesTotal > 0 && (
            <span className="px-2.5 py-1.5 rounded-xl bg-sx-green-tint border border-sx-green-border text-sx-green-text text-xs font-bold">
              {salesTotal} Escrow {salesTotal === 1 ? "Sale" : "Sales"}
            </span>
          )}
        </div>
      </div>

      {reviews.length > 0 ? (
        <div
          className={`grid grid-cols-1 ${
            compact ? "gap-3" : "md:grid-cols-2 gap-3.5"
          }`}
        >
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-xl bg-sx-canvas border border-sx-border p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-sx-border-strong"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-sx-ink font-mono">
                    {rev.buyerLabel}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sx-green-text bg-sx-green-tint px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>{rev.orderNumber}</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-sx-ink leading-relaxed">
                {rev.comment
                  ? `“${rev.comment}”`
                  : "Smooth Clean Konami ID transfer — verified via M-Pesa Escrow."}
              </p>

              <p className="text-[11px] text-sx-muted">
                Completed{" "}
                {new Date(rev.createdAt).toLocaleDateString("en-KE", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-sx-muted">
          Buyers left star ratings on completed escrow transfers without additional written notes.
        </p>
      )}
    </section>
  );
}
