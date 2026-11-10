import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  clickable?: boolean;
  href?: string | null;
}

export function Logo({
  className,
  size = "md",
  showText = true,
  clickable = true,
  href = "/",
}: LogoProps) {
  const textSizes = {
    sm: "text-lg",
    md: "text-[21px]",
    lg: "text-2xl",
  };

  const badgeSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
  };

  const content = (
    <div className={cn("inline-flex items-center gap-2 group select-none shrink-0", className)}>
      {/* StockX-inspired Verified X-Check Emblem */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full bg-[#006340] text-white transition-transform group-hover:scale-105",
          badgeSizes[size]
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5"
          aria-hidden="true"
        >
          <path
            d="M5.5 12.5L10 17L18.5 7.5"
            stroke="#FFFFFF"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex items-baseline gap-1 leading-none">
          <span
            className={cn(
              "font-display font-extrabold tracking-[-0.045em] text-[#0F0F0F]",
              textSizes[size]
            )}
          >
            eFootball<span className="text-[#006340]">X</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] font-bold tracking-wider uppercase text-[#5F5F5F] ml-0.5">
            Market
          </span>
        </div>
      )}
    </div>
  );

  if (clickable && href) {
    return (
      <Link href={href} className="focus:outline-none" aria-label="eFootballMarket Home">
        {content}
      </Link>
    );
  }

  return content;
}
