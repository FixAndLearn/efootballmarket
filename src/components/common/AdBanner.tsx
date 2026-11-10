"use client";

import React, { useEffect, useState } from "react";

export interface AdBannerProps {
  slot?: string;
  format?: "horizontal" | "rectangle" | "badge" | "in-feed";
  className?: string;
  hasContent?: boolean;
}

const DEFAULT_ADSENSE_CLIENT_ID = "ca-pub-5924764989915276";

/**
 * Google AdSense compliant ad unit container.
 * - Renders ONLY when a valid numeric Google AdSense slot ID is configured AND `hasContent` is true.
 * - Never renders empty placeholder frames, never renders on zero-result pages or loading screens.
 */
export function AdBanner({
  slot = "",
  format = "horizontal",
  className = "",
  hasContent = true,
}: AdBannerProps) {
  const [adsenseReady, setAdsenseReady] = useState(false);
  const adsenseClientId =
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || DEFAULT_ADSENSE_CLIENT_ID;
  const isNumericSlot = Boolean(slot && /^\d+$/.test(slot));

  useEffect(() => {
    if (!hasContent || !adsenseClientId || !isNumericSlot || typeof window === "undefined") {
      return;
    }
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      setAdsenseReady(true);
    } catch {
      setAdsenseReady(false);
    }
  }, [adsenseClientId, isNumericSlot, hasContent]);

  if (!hasContent || !adsenseClientId || !adsenseReady || !isNumericSlot) {
    return null;
  }

  return (
    <div className={`w-full text-center overflow-hidden my-6 ${className}`}>
      <span className="block text-[10px] uppercase tracking-wider text-[#767676] mb-2">
        Advertisement
      </span>
      <div className="min-h-[90px] w-full flex items-center justify-center rounded-lg bg-[#F9F9F8] border border-[#E2E2E0] p-2">
        <ins
          className="adsbygoogle block w-full overflow-hidden"
          style={{ display: "block" }}
          data-ad-client={adsenseClientId}
          data-ad-slot={slot}
          data-ad-format={format === "rectangle" ? "rectangle" : "auto"}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
