import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailTabLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: "inline" | "pill";
  className?: string;
}

/**
 * Opens detailed rules, guides, fees, or policy chapters in a clean new tab
 * so primary marketplace, form, and checkout screens stay uncluttered.
 */
export function DetailTabLink({
  href,
  children,
  variant = "inline",
  className,
}: DetailTabLinkProps) {
  if (variant === "pill") {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-sx-canvas hover:bg-sx-stone border border-sx-border hover:border-sx-green-border text-xs font-semibold text-sx-ink hover:text-sx-green-text transition-colors whitespace-nowrap",
          className
        )}
      >
        <span>{children}</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-sx-green-text shrink-0" />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-0.5 font-semibold text-sx-green-text hover:underline whitespace-nowrap",
        className
      )}
    >
      <span>{children}</span>
      <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
    </Link>
  );
}
