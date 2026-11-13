"use client";

import { Badge } from "@/components/ui/Badge";
import { getPlatformLabel } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Maximize2,
  Minimize2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

export interface GalleryImage {
  id?: string;
  image_url: string;
  is_primary?: boolean;
  display_order?: number;
}

export interface ListingGalleryProps {
  images: GalleryImage[];
  title: string;
  platform: string;
  overallTeamStrength: number;
}

export function ListingGallery({
  images,
  title,
  platform,
  overallTeamStrength,
}: ListingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fitMode, setFitMode] = useState<"contain" | "cover">("contain");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    document.body.style.overflow = isLightboxOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLightboxOpen]);

  const validImages = images.length > 0 ? images : [];
  const activeImage = validImages[activeIndex]?.image_url || "";

  const handleNext = useCallback(() => {
    if (validImages.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % validImages.length);
    setZoomLevel(1);
  }, [validImages.length]);

  const handlePrev = useCallback(() => {
    if (validImages.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    setZoomLevel(1);
  }, [validImages.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (validImages.length <= 1 || zoomLevel > 1) return;
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || validImages.length <= 1 || zoomLevel > 1) {
      return;
    }
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (Math.abs(deltaX) >= 42) {
      if (deltaX < 0) handleNext();
      else handlePrev();
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
        setZoomLevel(1);
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, handleNext, handlePrev]);

  return (
    <>
      <div className="bg-sx-subtle border border-sx-border rounded-2xl overflow-hidden shadow-sm">
        {/* Main Display Container */}
        <div
          className="relative aspect-[16/9] w-full bg-zinc-950 overflow-hidden group select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {activeImage ? (
            <>
              <div
                className="relative z-10 w-full h-full flex items-center justify-center cursor-zoom-in p-1"
                onClick={() => setIsLightboxOpen(true)}
                title="Click to inspect in Full HD / Zoom"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeImage}
                  alt={`${title} — screenshot ${activeIndex + 1}`}
                  loading="eager"
                  fetchPriority={activeIndex === 0 ? "high" : "auto"}
                  decoding="async"
                  className={`w-full h-full transition-all duration-200 ${
                    fitMode === "contain"
                      ? "object-contain"
                      : "object-cover scale-100"
                  }`}
                />
              </div>

              {/* Top Left Badges (Always High-Contrast White/Emerald/Amber over Dark Frame) */}
              <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 pointer-events-none">
                <Badge variant="brand" size="md" className="font-bold shadow-lg backdrop-blur-md">
                  {getPlatformLabel(platform)}
                </Badge>
                {overallTeamStrength >= 3150 ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-amber-400/70 text-xs font-black text-amber-300 shadow-lg">
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span>OVR {overallTeamStrength}</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-400/25 text-[10px] font-black uppercase text-amber-100 tracking-wider">
                      Elite
                    </span>
                  </div>
                ) : overallTeamStrength >= 3100 ? (
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-emerald-400/60 text-xs font-bold text-emerald-300 shadow-lg">
                    <Zap className="w-3.5 h-3.5 text-emerald-300 fill-emerald-300" />
                    <span>OVR {overallTeamStrength}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-xs font-bold text-white shadow-lg">
                    <Zap className="w-3.5 h-3.5 text-zinc-300" />
                    <span>OVR {overallTeamStrength}</span>
                  </div>
                )}
              </div>

              {/* Top Right Presentation Controls */}
              <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFitMode((prev) => (prev === "contain" ? "cover" : "contain"));
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-black/80 hover:bg-black text-zinc-100 hover:text-white backdrop-blur-md border border-white/20 text-xs font-medium transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                  title={
                    fitMode === "contain"
                      ? "Switch to Fill Frame"
                      : "Switch to Fit Entire Screenshot"
                  }
                >
                  {fitMode === "contain" ? (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span className="hidden sm:inline">Fit Screenshot</span>
                    </>
                  ) : (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span className="hidden sm:inline">Fill Frame</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-sx-green hover:bg-sx-green-hover text-white border border-emerald-400/40 text-xs font-semibold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                  title="Open Fullscreen Lightbox & Zoom"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Inspect HD</span>
                </button>
              </div>

              {/* Bottom Guidance Hint & Counter */}
              <div className="absolute bottom-3 left-3.5 z-20 pointer-events-none flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] sm:text-[11px] text-emerald-300 border border-emerald-400/35 font-medium flex items-center gap-1 shadow-lg">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>efootballmarket.co.ke &middot; Escrow Protected</span>
                </span>
              </div>

              <div className="absolute bottom-3 right-3.5 z-20 pointer-events-none flex items-center gap-2">
                {validImages.length > 1 && (
                  <span className="px-2 py-1 rounded-md bg-black/80 backdrop-blur-md text-[11px] text-white border border-white/15 font-mono font-bold">
                    {activeIndex + 1} / {validImages.length}
                  </span>
                )}
                <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-[11px] text-zinc-200 border border-white/15 font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Click to zoom
                </span>
              </div>

              {/* Left / Right Carousel Chevrons */}
              {validImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrev();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/75 hover:bg-black text-white backdrop-blur-md border border-white/20 transition-all shadow-xl cursor-pointer"
                    aria-label="Previous screenshot"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/75 hover:bg-black text-white backdrop-blur-md border border-white/20 transition-all shadow-xl cursor-pointer"
                    aria-label="Next screenshot"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400">
              <Trophy className="w-14 h-14 stroke-[1.5] mb-2" />
              <span className="text-sm font-semibold">Account Squad Preview</span>
            </div>
          )}
        </div>

        {/* Thumbnail Gallery Row */}
        {validImages.length > 1 && (
          <div className="p-3 border-t border-sx-border bg-sx-stone flex items-center gap-2.5 overflow-x-auto no-scrollbar">
            {validImages.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => {
                  setActiveIndex(idx);
                  setZoomLevel(1);
                }}
                aria-label={`View screenshot ${idx + 1}`}
                aria-current={activeIndex === idx ? "true" : undefined}
                className={`relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border transition-all duration-200 bg-zinc-900 cursor-pointer ${
                  activeIndex === idx
                    ? "border-sx-green ring-2 ring-sx-green/40"
                    : "border-sx-border opacity-70 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.image_url}
                  alt={`Screenshot thumbnail ${idx + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen High-Resolution Lightbox & Inspection Modal */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Full resolution squad screenshots for ${title}`}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 select-none"
          onClick={() => {
            setIsLightboxOpen(false);
            setZoomLevel(1);
          }}
        >
          {/* Lightbox Header Bar (Explicit Light-on-Dark Contrast) */}
          <div
            className="flex items-center justify-between z-30 pb-3 border-b border-white/15"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/35 flex items-center justify-center text-emerald-300 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {title}
                </h3>
                <p className="text-xs text-zinc-400">
                  Screenshot {activeIndex + 1} of {validImages.length || 1}
                </p>
              </div>
            </div>

            {/* Zoom & Action Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl bg-zinc-900 border border-white/15">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
                  disabled={zoomLevel <= 1}
                  className="p-1 rounded-lg text-zinc-200 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono px-2 text-white font-semibold min-w-[50px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                  disabled={zoomLevel >= 3}
                  className="p-1 rounded-lg text-zinc-200 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all ml-1 border-l border-white/15 pl-2 cursor-pointer"
                  title="Reset to 100%"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <a
                href={activeImage}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-100 hover:text-white border border-white/15 text-xs font-medium transition-all flex items-center gap-1.5"
                title="Open full resolution in new tab"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden md:inline">Open Raw</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setZoomLevel(1);
                }}
                aria-label="Close lightbox"
                className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-white/20 transition-all shadow-xl cursor-pointer"
                title="Close Lightbox (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Center Image Viewport */}
          <div
            className="flex-1 relative flex items-center justify-center overflow-auto p-2 sm:p-4"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                if (zoomLevel > 1) setZoomLevel(1);
                else setIsLightboxOpen(false);
              }
            }}
          >
            {validImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                aria-label="Previous screenshot"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white border border-white/20 transition-all shadow-2xl cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div
              className="relative max-w-full max-h-full transition-transform duration-200 flex items-center justify-center"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "center center",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setZoomLevel((prev) => (prev > 1 ? 1 : 1.75));
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage}
                alt={title}
                className="w-full max-w-[96vw] max-h-[75vh] sm:max-h-[82vh] object-contain rounded-xl shadow-2xl border border-white/10"
                style={{
                  cursor: zoomLevel > 1 ? "zoom-out" : "zoom-in",
                }}
              />
            </div>

            {validImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="Next screenshot"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white border border-white/20 transition-all shadow-2xl cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Lightbox Footer Bar */}
          <div
            className="flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-white/15 z-30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hidden sm:flex items-center gap-3">
              <span>Shortcuts:</span>
              <kbd className="px-2 py-0.5 rounded bg-zinc-900 border border-white/15 font-mono text-[11px] text-zinc-200">
                ESC
              </kbd>
              <span>to close,</span>
              <kbd className="px-2 py-0.5 rounded bg-zinc-900 border border-white/15 font-mono text-[11px] text-zinc-200">
                &larr; / &rarr;
              </kbd>
              <span>to navigate</span>
            </div>
            <div className="sm:hidden text-[11px] text-zinc-300">
              Swipe to switch &middot; Tap image to zoom
            </div>

            <span className="text-[11px] text-emerald-300 font-medium">
              Full Resolution Squad Screenshot
            </span>
          </div>
        </div>
      )}
    </>
  );
}
