import React from "react";
import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  clickable?: boolean;
}

export function Logo({
  className = "",
  size = "md",
  showText = true,
  clickable = false,
}: LogoProps) {
  const iconDimensions = {
    sm: "w-6 h-6",
    md: "w-7 h-7 sm:w-8 sm:h-8",
    lg: "w-9 h-9",
    xl: "w-11 h-11",
  }[size];

  const titleSizes = {
    sm: "text-sm",
    md: "text-base sm:text-[17px]",
    lg: "text-lg",
    xl: "text-xl",
  }[size];

  const LogoMark = (
    <div className={`relative ${iconDimensions} shrink-0 flex items-center justify-center rounded-lg bg-emerald-500 text-zinc-950`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-4/6 h-4/6"
      >
        <path
          d="M12 2.5L19.5 5.5V11.5C19.5 16.4 16.3 20.6 12 22C7.7 20.6 4.5 16.4 4.5 11.5V5.5L12 2.5Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M9 12L11 14L15.2 9.8"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );

  const Content = (
    <div className={`inline-flex items-center gap-2.5 select-none min-w-0 ${className}`}>
      {LogoMark}
      {showText && (
        <span className={`font-display font-bold tracking-tight text-white whitespace-nowrap leading-none ${titleSizes}`}>
          eFootballMarket
        </span>
      )}
    </div>
  );

  if (clickable) {
    return (
      <Link href="/" className="inline-flex items-center hover:opacity-90 transition-opacity">
        {Content}
      </Link>
    );
  }

  return Content;
}
