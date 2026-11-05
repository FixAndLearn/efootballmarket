"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";
import { formatWhatsAppPhone } from "@/lib/utils/phone";

export interface ChatSellerWhatsAppButtonProps {
  sellerPhone?: string | null;
  sellerUsername?: string | null;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingCurrency?: string;
  overallTeamStrength?: number | null;
  variant?: "primary" | "secondary" | "compact" | "icon";
  className?: string;
  label?: string;
}

/**
 * Official WhatsApp Icon SVG (crisp, recognizable brand icon)
 */
function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="0"
      fill="currentColor"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ChatSellerWhatsAppButton({
  sellerPhone,
  sellerUsername,
  listingId,
  listingTitle,
  listingPrice,
  listingCurrency = "KES",
  overallTeamStrength,
  variant = "primary",
  className = "",
  label,
}: ChatSellerWhatsAppButtonProps) {
  // Normalize destination WhatsApp digits (falls back to platform desk if missing)
  const phone = formatWhatsAppPhone(sellerPhone || "254794400365");

  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : "https://www.efootballmarket.co.ke";
  const listingUrl = `${baseUrl}/listings/${listingId}`;

  const formattedPrice = formatCurrency(listingPrice, listingCurrency);
  const sellerDisplayName = sellerUsername ? `@${sellerUsername}` : "Seller";

  const message =
    `Hello ${sellerDisplayName}, I found your squad on eFootballMarket:\n\n` +
    `🎮 *Squad:* ${listingTitle}${overallTeamStrength ? ` (${overallTeamStrength} OVR)` : ""}\n` +
    `💰 *Price:* ${formattedPrice}\n` +
    `🔗 *Listing Link:* ${listingUrl}\n\n` +
    `I would like to chat about this account. Note: We will complete the payment through eFootballMarket Safaricom Escrow (Till 1572931) for 100% protection.`;

  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  if (variant === "icon") {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title={`Chat with ${sellerDisplayName} on WhatsApp`}
        className={`w-8 h-8 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 flex items-center justify-center transition-all shadow-md hover:scale-105 active:scale-95 shrink-0 ${className}`}
      >
        <WhatsAppIcon className="w-4 h-4 fill-slate-950" />
      </a>
    );
  }

  if (variant === "compact") {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 shrink-0 whitespace-nowrap ${className}`}
      >
        <WhatsAppIcon className="w-3.5 h-3.5 fill-slate-950 shrink-0" />
        <span>{label || "Chat Seller"}</span>
      </a>
    );
  }

  if (variant === "secondary") {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-[#25D366]/40 hover:border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 font-bold text-xs transition-all shadow-sm active:scale-95 ${className}`}
      >
        <WhatsAppIcon className="w-4 h-4 fill-[#25D366] shrink-0" />
        <span>{label || `Chat ${sellerDisplayName} on WhatsApp`}</span>
      </a>
    );
  }

  // Primary variant (high-impact, glowing WhatsApp green)
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/40 border border-emerald-300/40 transition-all active:scale-95 duration-200 group ${className}`}
    >
      <WhatsAppIcon className="w-4 h-4 fill-slate-950 group-hover:rotate-12 transition-transform shrink-0" />
      <span>{label || "Chat Seller on WhatsApp"}</span>
    </a>
  );
}
