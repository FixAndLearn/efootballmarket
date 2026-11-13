"use client";

import React, { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

interface ShareStorefrontBarProps {
  username: string;
  activeCount: number;
}

export function ShareStorefrontBar({
  username,
  activeCount,
}: ShareStorefrontBarProps) {
  const [copied, setCopied] = useState(false);
  const storeUrl = `https://efootballmarket.co.ke/u/${encodeURIComponent(username)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const waMessage = `Check out @${username}'s verified eFootball squads (${activeCount} active) with Safaricom M-Pesa Escrow protection:\n${storeUrl}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border text-xs font-bold text-sx-ink transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-sx-green-text" />
            <span>Link Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 text-sx-muted" />
            <span>Copy Storefront Link</span>
          </>
        )}
      </button>

      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 text-xs font-extrabold transition-colors"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>Share on WhatsApp</span>
      </a>
    </div>
  );
}
