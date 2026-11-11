import React, { useId } from "react";
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
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");
  const shieldGradId = `efm-shield-${uid}`;
  const goldGradId = `efm-gold-${uid}`;
  const accentGradId = `efm-accent-${uid}`;

  const iconDimensions = {
    sm: "w-7 h-7 sm:w-8 sm:h-8",
    md: "w-8 h-8 sm:w-9 sm:h-9",
    lg: "w-10 h-10 sm:w-11 sm:h-11",
    xl: "w-12 h-12 sm:w-14 sm:h-14",
  }[size];

  const titleSizes = {
    sm: "text-sm sm:text-base",
    md: "text-[15px] sm:text-lg",
    lg: "text-lg sm:text-xl",
    xl: "text-xl sm:text-2xl",
  }[size];

  const subtitleSizes = {
    sm: "text-[7px] sm:text-[8.5px]",
    md: "text-[7.5px] sm:text-[9px]",
    lg: "text-[9px] sm:text-[10.5px]",
    xl: "text-[10px] sm:text-xs",
  }[size];

  const LogoIcon = (
    <div
      className={cn(
        "relative shrink-0 group-hover:scale-105 group-hover:-rotate-2 transition-all duration-300 drop-shadow-[0_3px_10px_rgba(37,99,235,0.25)]",
        iconDimensions
      )}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={shieldGradId} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <linearGradient id={goldGradId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          <linearGradient id={accentGradId} x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* Outer Hex-Shield Crest */}
        <path
          d="M24 4L42 10V22C42 33.2 34.3 43.1 24 46C13.7 43.1 6 33.2 6 22V10L24 4Z"
          fill={`url(#${shieldGradId})`}
          stroke={`url(#${goldGradId})`}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Inner Deep Pitch Field */}
        <path
          d="M24 7.5L39 12.5V22C39 31.5 32.5 39.8 24 42.5C15.5 39.8 9 31.5 9 22V12.5L24 7.5Z"
          fill="#0a1226"
          fillOpacity="0.9"
        />

        {/* Football Geometry */}
        <circle cx="24" cy="22" r="10" stroke={`url(#${accentGradId})`} strokeWidth="1.8" fill="#0e1b38" />

        {/* Central Gold Football Pentagram */}
        <polygon points="24,17 28,20 26.5,25 21.5,25 20,20" fill={`url(#${goldGradId})`} />

        {/* Ball Seam Lines */}
        <line x1="24" y1="17" x2="24" y2="12" stroke="#38bdf8" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="28" y1="20" x2="32.5" y2="18.5" stroke="#38bdf8" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="26.5" y1="25" x2="31" y2="28" stroke="#38bdf8" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="21.5" y1="25" x2="17" y2="28" stroke="#38bdf8" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="20" y1="20" x2="15.5" y2="18.5" stroke="#38bdf8" strokeWidth="1.3" strokeLinecap="round" />

        {/* Escrow Vault Lock at Bottom of Crest */}
        <g transform="translate(19, 32)">
          <rect x="1.5" y="4" width="7" height="5" rx="1.5" fill="#f59e0b" />
          <path
            d="M3 4V2.5C3 1.67 3.67 1 4.5 1H5.5C6.33 1 7 1.67 7 2.5V4"
            stroke="#fbbf24"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <circle cx="5" cy="6.5" r="0.8" fill="#090d16" />
        </g>
      </svg>
    </div>
  );

  const content = (
    <div className={cn("inline-flex items-center gap-2 sm:gap-2.5 select-none min-w-0 shrink-0", className)}>
      {LogoIcon}
      {showText && (
        <div className="flex flex-col justify-center leading-none min-w-0">
          <span
            className={cn(
              "font-display font-black tracking-tight text-sx-ink whitespace-nowrap leading-tight",
              titleSizes
            )}
          >
            eFootball<span className="text-amber-600 dark:text-amber-400">Market</span>
          </span>
          <span
            className={cn(
              "uppercase tracking-wider text-sx-green-text font-bold leading-none mt-0.5 whitespace-nowrap",
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
      <Link href={href} className="group inline-flex items-center focus:outline-none" aria-label="eFootballMarket Home">
        {content}
      </Link>
    );
  }

  return content;
}
