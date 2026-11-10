import { cn } from "@/lib/utils";
import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "brand" | "gold" | "outline";
  size?: "sm" | "md";
}

export function Badge({ className, variant = "default", size = "sm", children, ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center font-medium rounded-md";

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  const variantStyles = {
    default: "bg-[#171B24] text-slate-300 border border-[#283040]",
    success: "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60",
    warning: "bg-amber-950/60 text-amber-400 border border-amber-800/60",
    danger: "bg-rose-950/60 text-rose-400 border border-rose-800/60",
    brand: "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60",
    gold: "bg-amber-950/60 text-amber-300 border border-amber-800/60",
    outline: "border border-[#283040] text-slate-300",
  };

  return (
    <span className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)} {...props}>
      {children}
    </span>
  );
}
