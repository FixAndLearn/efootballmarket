"use client";

import React, { useEffect, useState } from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SellerRatingBoxProps {
  orderId: string;
  sellerName?: string | null;
  isBuyer: boolean;
}

export function SellerRatingBox({
  orderId,
  sellerName,
  isBuyer,
}: SellerRatingBoxProps) {
  const [loaded, setLoaded] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/orders/${orderId}/rate`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data?.rated) {
          setAlreadyRated(true);
          setRating(Number(data.rating || 5));
          setComment(data.comment || "");
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not save rating");
      }
      setAlreadyRated(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!loaded) return null;

  if (alreadyRated) {
    return (
      <div className="p-4 rounded-xl bg-sx-green-tint border border-sx-green-border flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sx-green-text">
            <CheckCircle2 className="w-4 h-4" />
            <span>Verified Order Rating Recorded</span>
          </div>
          {comment && (
            <p className="text-xs text-sx-ink-soft italic">&ldquo;{comment}&rdquo;</p>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= rating
                  ? "text-sx-amber-text fill-current"
                  : "text-sx-border-strong"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!isBuyer) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-xl bg-sx-stone border border-sx-border space-y-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-sx-ink block">
            Rate Your Handover with {sellerName || "Seller"}
          </span>
          <span className="text-[11px] text-sx-muted">
            Verified buyers build trusted seller rankings on eFootballMarket.
          </span>
        </div>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= (hoverRating || rating);
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-110"
                aria-label={`Rate ${star} out of 5 stars`}
              >
                <Star
                  className={`w-5 h-5 ${
                    active ? "text-sx-amber-text fill-current" : "text-sx-muted"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="text"
          maxLength={220}
          placeholder="Optional note (e.g. Fast Konami OTP response & clean squad)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="flex-1 h-9 px-3 rounded-lg bg-sx-canvas border border-sx-border text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-green"
        />
        <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
          Submit {rating}★ Rating
        </Button>
      </div>

      {error && <p className="text-xs text-sx-red-text font-medium">{error}</p>}
    </form>
  );
}
