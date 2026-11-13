import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
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
  const iconHeights = {
    sm: "h-8 sm:h-9",
    md: "h-9 sm:h-11",
    lg: "h-12 sm:h-14",
    xl: "h-16 sm:h-20",
  }[size];

  const titleSizes = {
    sm: "text-sm sm:text-base",
    md: "text-[15px] sm:text-lg",
    lg: "text-lg sm:text-xl",
    xl: "text-xl sm:text-2xl",
  }[size];

  const subtitleSizes = {
    sm: "text-[7.5px] sm:text-[8.5px]",
    md: "text-[8px] sm:text-[9px]",
    lg: "text-[9px] sm:text-[10.5px]",
    xl: "text-[10px] sm:text-xs",
  }[size];

  const LogoIcon = (
    <div className="relative shrink-0 inline-flex items-center group-hover:scale-105 transition-transform duration-200 drop-shadow-[0_2px_8px_rgba(16,185,129,0.24)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/efm-logo-header.webp"
        alt="eFootballMarket Crowned Lion Crest"
        width={149}
        height={192}
        decoding="async"
        className={cn("w-auto object-contain select-none block", iconHeights)}
      />
    </div>
  );

  const content = (
    <div
      className={cn(
        "inline-flex items-center gap-2 sm:gap-2.5 select-none min-w-0 shrink-0",
        className
      )}
    >
      {LogoIcon}
      {showText && (
        <div className="flex flex-col justify-center leading-none min-w-0">
          <span
            className={cn(
              "font-display font-black tracking-tight text-sx-ink whitespace-nowrap leading-tight",
              titleSizes
            )}
          >
            eFootball<span className="text-sx-amber-text">Market</span>
          </span>
          <span
            className={cn(
              "uppercase tracking-wider text-sx-green-text font-extrabold leading-none mt-0.5 whitespace-nowrap",
              subtitleSizes
            )}
          >
            Escrow Protected
          </span>
        </div>
      )}
    </div>
  );

  if (clickable && href) {
    return (
      <Link
        href={href}
        className="group inline-flex items-center focus:outline-none"
        aria-label="eFootballMarket Home"
      >
        {content}
      </Link>
    );
  }

  return content;
}
