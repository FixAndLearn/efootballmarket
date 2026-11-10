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
  const iconDimensions = {
    sm: "w-7 h-7",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-[18px]",
    lg: "text-2xl",
  };

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 group select-none shrink-0", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-lg bg-[#111722] border border-emerald-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] group-hover:border-emerald-400 transition-colors",
          iconDimensions[size]
        )}
      >
        <svg
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path
            d="M14 2.5L23.5 7.2V14.8C23.5 20.1 19.4 24.1 14 25.7C8.6 24.1 4.5 20.1 4.5 14.8V7.2L14 2.5Z"
            fill="#10B981"
            fillOpacity="0.16"
            stroke="#10B981"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M9.8 14.2L12.6 17L18.4 11.2"
            stroke="#34D399"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={cn(
              "font-display font-bold tracking-[-0.03em] text-white",
              textSizes[size]
            )}
          >
            eFootball<span className="text-emerald-400">Market</span>
          </span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-[#131923] border border-[#232D3F] text-[9px] font-mono font-bold text-slate-400 uppercase">
            KE
          </span>
        </div>
      )}
    </div>
  );

  if (clickable && href) {
    return (
      <Link href={href} className="focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
