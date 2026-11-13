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
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const goldBevelId = `efm-gold-${uid}`;
  const emeraldFieldId = `efm-field-${uid}`;
  const ballBodyId = `efm-ball-${uid}`;
  const glassSheenId = `efm-sheen-${uid}`;
  const ballClipId = `efm-clip-${uid}`;

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
    sm: "text-[7.5px] sm:text-[8.5px]",
    md: "text-[8px] sm:text-[9px]",
    lg: "text-[9px] sm:text-[10.5px]",
    xl: "text-[10px] sm:text-xs",
  }[size];

  const LogoIcon = (
    <div
      className={cn(
        "relative shrink-0 group-hover:scale-105 transition-transform duration-200",
        iconDimensions
      )}
    >
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={goldBevelId}
            x1="76"
            y1="36"
            x2="436"
            y2="476"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="32%" stopColor="#FBBF24" />
            <stop offset="72%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          <linearGradient
            id={emeraldFieldId}
            x1="128"
            y1="68"
            x2="384"
            y2="452"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="45%" stopColor="#059669" />
            <stop offset="100%" stopColor="#022C22" />
          </linearGradient>

          <linearGradient
            id={ballBodyId}
            x1="168"
            y1="168"
            x2="348"
            y2="368"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          <linearGradient
            id={glassSheenId}
            x1="96"
            y1="64"
            x2="288"
            y2="260"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          <clipPath id={ballClipId}>
            <circle cx="256" cy="264" r="100" />
          </clipPath>
        </defs>

        {/* Crisp Dark Emerald Outer Contour (High contrast on both White & Dark surfaces) */}
        <path
          d="M256 26L442 92V238C442 356 362 449 256 486C150 449 70 356 70 238V92L256 26Z"
          fill="#03261B"
        />

        {/* Metallic Championship Gold Shield Frame */}
        <path
          d="M256 38L430 100V237C430 349 354 437 256 473C158 437 82 349 82 237V100L256 38Z"
          fill={`url(#${goldBevelId})`}
        />

        {/* Deep Stadium Emerald Interior */}
        <path
          d="M256 64L406 117V236C406 334 340 412 256 445C172 412 106 334 106 236V117L256 64Z"
          fill={`url(#${emeraldFieldId})`}
        />

        {/* Diagonal Stadium Light Sheen */}
        <path
          d="M256 64L406 117V206L114 296C108 277 106 257 106 236V117L256 64Z"
          fill={`url(#${glassSheenId})`}
        />

        {/* Top Epic 4-Point Championship Star */}
        <path
          d="M256 88L265 110L287 119L265 128L256 150L247 128L225 119L247 110Z"
          fill="#FEF08A"
        />

        {/* Classic 3D Telstar Football */}
        <circle cx="256" cy="276" r="106" fill="#022C22" fillOpacity="0.45" />
        <g clipPath={`url(#${ballClipId})`} transform="translate(0, 8)">
          <circle cx="256" cy="264" r="100" fill={`url(#${ballBodyId})`} />
          <g stroke="#042F22" strokeWidth="7" strokeLinecap="round">
            <line x1="256" y1="216" x2="256" y2="176" />
            <line x1="302" y1="249" x2="340" y2="237" />
            <line x1="284" y1="303" x2="309" y2="337" />
            <line x1="228" y1="303" x2="203" y2="337" />
            <line x1="210" y1="249" x2="172" y2="237" />
          </g>
          <polygon points="256,214 304,249 285,305 227,305 208,249" fill="#042F22" />
          <polygon points="256,180 292,154 278,130 234,130 220,154" fill="#042F22" />
          <polygon points="336,238 368,266 382,232 362,196 344,206" fill="#042F22" />
          <polygon points="306,333 348,334 332,370 288,376 286,354" fill="#042F22" />
          <polygon points="206,333 164,334 180,370 224,376 226,354" fill="#042F22" />
          <polygon points="176,238 144,266 130,232 150,196 168,206" fill="#042F22" />
        </g>
        <circle
          cx="256"
          cy="272"
          r="100"
          stroke={`url(#${goldBevelId})`}
          strokeWidth="8"
        />

        {/* Verified Escrow Seal */}
        <circle cx="332" cy="348" r="38" fill="#03261B" />
        <circle cx="332" cy="348" r="32" fill={`url(#${goldBevelId})`} />
        <path
          d="M316 348L327 359L350 336"
          stroke="#03261B"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
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
