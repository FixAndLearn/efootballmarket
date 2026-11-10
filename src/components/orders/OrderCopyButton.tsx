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
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F4F3F1] hover:bg-slate-700/80 border border-[#C8C8C4] text-[#3D3D3D] hover:text-[#0F0F0F] text-xs font-mono transition-all cursor-pointer"
      title="Copy order number"
    >
      <span>#{orderNumber}</span>
      {copied ? (
        <Check className="w-3.5 h-3.5 text-[#006340] shrink-0" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-[#5F5F5F] hover:text-[#1F1F1F] shrink-0" />
      )}
    </button>
  );
}
