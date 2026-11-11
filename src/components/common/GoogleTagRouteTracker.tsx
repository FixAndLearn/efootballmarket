"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function RouteTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    // Skip duplicate initial load since gtm.js / gtag('js', new Date()) already fires on first load
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    if (typeof window === "undefined") return;
    const query = searchParams?.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({
      event: "page_view",
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

export function GoogleTagRouteTracker() {
  return (
    <Suspense fallback={null}>
      <RouteTrackerInner />
    </Suspense>
  );
}
