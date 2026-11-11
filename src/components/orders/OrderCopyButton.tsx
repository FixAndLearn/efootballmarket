"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function OrderCopyButton({ orderNumber }: { orderNumber: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // quiet fallback
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sx-stone hover:bg-sx-elevated border border-sx-border-strong text-sx-ink-soft hover:text-sx-ink text-xs font-mono transition-all cursor-pointer"
      title="Copy order number"
    >
      <span>#{orderNumber}</span>
      {copied ? (
        <Check className="w-3.5 h-3.5 text-sx-green-text shrink-0" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-sx-muted hover:text-sx-ink shrink-0" />
      )}
    </button>
  );
}
