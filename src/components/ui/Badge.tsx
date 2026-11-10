import { cn } from "@/lib/utils";
import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "brand" | "gold" | "outline";
  size?: "sm" | "md";
}

export function Badge({ className, variant = "default", size = "sm", children, ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center font-semibold rounded";

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  const variantStyles = {
    default: "bg-[#F4F3F1] text-[#0F0F0F] border border-[#E2E2E0]",
    success: "bg-[#EBF5F0] text-[#006340] border border-[#BFE0CE]",
    warning: "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]",
    danger: "bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]",
    brand: "bg-[#EBF5F0] text-[#006340] border border-[#BFE0CE]",
    gold: "bg-[#F4F3F1] text-[#0F0F0F] border border-[#D4D4D0]",
    outline: "border border-[#C8C8C4] text-[#0F0F0F] bg-white",
  };

  return (
    <span className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)} {...props}>
      {children}
    </span>
  );
}
