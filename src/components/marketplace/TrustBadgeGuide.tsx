import React from "react";
import { Lock, Shield, ShieldCheck } from "lucide-react";
import { DetailTabLink } from "@/components/ui/DetailTabLink";

export function TrustBadgeGuide() {
  return (
    <div className="rounded-xl bg-sx-subtle border border-sx-border px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
      <div className="flex flex-wrap items-center gap-2 text-sx-muted">
        <span className="font-semibold text-sx-ink">Badges:</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sx-canvas border border-sx-border text-[11px] font-medium text-sx-muted">
          <Shield className="w-3 h-3" />
          <span>New</span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sx-info-tint border border-sx-info-border text-[11px] font-semibold text-sx-info-text">
          <ShieldCheck className="w-3 h-3" />
          <span>Proven · 1+ Sales</span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sx-green-tint border border-sx-green-border text-[11px] font-semibold text-sx-green-text">
          <ShieldCheck className="w-3 h-3" />
          <span>ID-Verified</span>
        </span>
        <span className="hidden md:inline-flex items-center gap-1 text-sx-muted pl-1">
          <Lock className="w-3 h-3 text-sx-green-text" />
          <span>Every order held 24h on Till 1572931</span>
        </span>
      </div>

      <DetailTabLink href="/escrow-guarantee">
        Badge &amp; Escrow Details
      </DetailTabLink>
    </div>
  );
}
