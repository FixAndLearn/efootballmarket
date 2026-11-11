"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Listing } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import { BuyNowButton } from "@/components/marketplace/BuyNowButton";
import { MakeOfferButton } from "@/components/marketplace/MakeOfferButton";
import { Button } from "@/components/ui/Button";

interface ListingStickyBottomBarProps {
  listing: Listing;
  isOwner: boolean;
  isFlashSale: boolean;
  targetElementId?: string;
}

/**
 * Mobile sticky action bar that automatically hides whenever the main inline
 * Purchase Card (`#listing-inline-cta`) is visible on screen — preventing
 * duplicate Buy / Bargain buttons in the viewport.
 */
export function ListingStickyBottomBar({
  listing,
  isOwner,
  isFlashSale,
  targetElementId = "listing-inline-cta",
}: ListingStickyBottomBarProps) {
  const [inlineVisible, setInlineVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const target = document.getElementById(targetElementId);
    if (!target || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setInlineVisible(entry.isIntersecting);
        }
      },
      {
        threshold: 0.15,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [targetElementId]);

  return (
    <div
      aria-hidden={inlineVisible}
      className={`fixed bottom-0 left-0 right-0 z-40 bg-sx-canvas/95 backdrop-blur-md border-t border-sx-border px-4 py-2.5 lg:hidden flex items-center justify-between gap-2.5 safe-area-pb transition-all duration-200 ${
        inlineVisible
          ? "translate-y-full opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100"
      }`}
    >
      <div className="min-w-0 shrink-0">
        <p className="text-[9px] font-mono uppercase text-sx-muted leading-tight">
          Price
        </p>
        <p className="text-base font-bold font-mono text-sx-ink leading-tight whitespace-nowrap">
          {formatCurrency(listing.price, listing.currency)}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isOwner ? (
          listing.status === "published" ? (
            <Link href={`/seller/edit-listing/${listing.id}`}>
              <Button variant="gold" size="sm">
                Edit Listing
              </Button>
            </Link>
          ) : (
            <span className="px-3 py-1.5 rounded-lg bg-sx-stone border border-sx-border text-xs font-mono text-sx-muted">
              {listing.status === "sold" ? "Sold" : "In Escrow"}
            </span>
          )
        ) : listing.status !== "published" ? (
          <span className="px-3 py-1.5 rounded-lg bg-sx-stone border border-sx-border text-xs font-mono text-sx-muted">
            {listing.status === "sold" ? "Sold" : "In Escrow"}
          </span>
        ) : isFlashSale ? (
          <BuyNowButton
            listingId={listing.id}
            priceFormatted={formatCurrency(listing.price, listing.currency)}
            compact={true}
          />
        ) : (
          <>
            <MakeOfferButton listing={listing} size="sm" />
            <BuyNowButton
              listingId={listing.id}
              priceFormatted={formatCurrency(listing.price, listing.currency)}
              compact={true}
            />
          </>
        )}
      </div>
    </div>
  );
}
