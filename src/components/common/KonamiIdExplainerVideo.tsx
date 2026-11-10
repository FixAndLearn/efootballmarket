import React from "react";
import { PlayCircle, ShieldCheck } from "lucide-react";

interface KonamiIdExplainerVideoProps {
  compact?: boolean;
}

export function KonamiIdExplainerVideo({ compact = false }: KonamiIdExplainerVideoProps) {
  return (
    <div className="rounded-xl border border-sx-border bg-sx-stone overflow-hidden">
      <div className="px-4 sm:px-5 py-3.5 border-b border-sx-border bg-sx-canvas flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PlayCircle className="w-4 h-4 text-sx-green-text shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-sx-ink font-display">
            Watch: Complete Konami ID Escrow Exchange Walkthrough (1:18)
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sx-green-text bg-sx-green-tint px-2.5 py-0.5 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Voiceover + Captions</span>
        </span>
      </div>

      <div className="bg-[#090d13] aspect-video w-full">
        <video
          controls
          playsInline
          preload="metadata"
          poster="/videos/konami-id-escrow-poster.jpg"
          className="w-full h-full object-contain"
        >
          <source src="/videos/konami-id-escrow-guide.mp4" type="video/mp4" />
          Your browser does not support HTML5 video playback.
        </video>
      </div>

      {!compact && (
        <div className="px-4 sm:px-5 py-3 bg-sx-subtle border-t border-sx-border flex flex-wrap items-center justify-between gap-2 text-xs text-sx-muted">
          <span>
            Covers M-Pesa Till <strong className="text-sx-ink font-mono">1572931</strong> custody, Order Vault delivery,{" "}
            <strong className="text-sx-ink">Extras &rarr; Support &rarr; Link Data</strong> check, and{" "}
            <strong className="text-sx-ink font-mono">my.konami.net</strong> 2FA handover.
          </span>
        </div>
      )}
    </div>
  );
}
