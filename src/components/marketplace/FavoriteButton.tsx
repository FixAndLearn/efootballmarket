"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

interface FavoriteButtonProps {
  listingId: string;
  initialFavorited?: boolean;
  initialCount?: number;
  variant?: "icon" | "pill";
}

export function FavoriteButton({
  listingId,
  initialFavorited = false,
  initialCount = 0,
  variant = "icon",
}: FavoriteButtonProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [count, setCount] = useState(Math.max(0, initialCount));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (variant !== "pill") return;
    let active = true;
    fetch(`/api/favorites?listingId=${listingId}`)
      .then((r) => r.json())
      .then((data) => {
        if (active && typeof data?.isFavorited === "boolean") {
          setFavorited(data.isFavorited);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [listingId, variant]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    const nextState = !favorited;
    setFavorited(nextState);
    setCount((prev) => Math.max(0, prev + (nextState ? 1 : -1)));

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      if (res.status === 401) {
        setFavorited(!nextState);
        setCount((prev) => Math.max(0, prev + (nextState ? -1 : 1)));
        router.push(`/login?redirect=/listings/${listingId}`);
        return;
      }

      if (!res.ok) {
        throw new Error("Failed");
      }

      const data = await res.json();
      setFavorited(Boolean(data.isFavorited));
    } catch {
      setFavorited(!nextState);
      setCount((prev) => Math.max(0, prev + (nextState ? -1 : 1)));
    } finally {
      setLoading(false);
    }
  };

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
          favorited
            ? "bg-sx-red-tint border-sx-red-border text-sx-red-text"
            : "bg-sx-stone hover:bg-sx-elevated border-sx-border text-sx-ink"
        }`}
        aria-label={favorited ? "Remove from Watchlist" : "Save to Watchlist"}
      >
        <Heart className={`w-3.5 h-3.5 ${favorited ? "fill-current" : ""}`} />
        <span>{favorited ? "Saved" : "Watchlist"}</span>
        {count > 0 && <span className="font-mono text-[11px] opacity-80">({count})</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={favorited ? "Remove from Watchlist" : "Save to Watchlist"}
      title={favorited ? "Saved in Watchlist" : "Save Squad to Watchlist"}
      className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
        favorited
          ? "bg-sx-canvas border-sx-red-border text-sx-red-text"
          : "bg-sx-canvas/90 hover:bg-sx-canvas border-sx-border text-sx-muted hover:text-sx-ink"
      }`}
    >
      <Heart className={`w-3.5 h-3.5 ${favorited ? "fill-current" : ""}`} />
    </button>
  );
}
