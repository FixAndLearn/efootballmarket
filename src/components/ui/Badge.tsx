import { cn } from "@/lib/utils";
import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "brand" | "gold" | "outline";
  size?: "sm" | "md";
}

export function Badge({ className, variant = "default", size = "sm", children, ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center justify-center gap-1 leading-none font-semibold rounded";

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  const variantStyles = {
    default: "bg-sx-stone text-sx-ink border border-sx-border",
    success: "bg-sx-green-tint text-sx-green-text border border-sx-green-border",
    warning: "bg-sx-amber-tint text-sx-amber-text border border-sx-amber-border",
    danger: "bg-sx-red-tint text-sx-red-text border border-sx-red-border",
    brand: "bg-sx-green-tint text-sx-green-text border border-sx-green-border",
    gold: "bg-sx-amber-tint text-sx-amber-text border border-sx-amber-border",
    outline: "border border-sx-border-strong text-sx-ink bg-sx-canvas",
  };

  return (
    <span className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)} {...props}>
      {children}
    </span>
  );
}
