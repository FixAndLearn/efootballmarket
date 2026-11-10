import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React, { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "gold";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#090B0E] disabled:opacity-50 disabled:cursor-not-allowed select-none";

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 h-8 gap-1.5",
      md: "text-sm px-4 py-2 h-10 gap-2",
      lg: "text-sm px-5 py-2.5 h-11 gap-2",
    };

    const variantStyles = {
      primary:
        "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 focus:ring-emerald-500",
      secondary:
        "bg-[#171B24] text-slate-100 hover:bg-[#1E2430] border border-[#283040] focus:ring-slate-500",
      outline:
        "border border-[#283040] bg-transparent text-slate-200 hover:bg-[#171B24] hover:text-white focus:ring-slate-500",
      ghost:
        "text-slate-300 hover:bg-[#171B24] hover:text-white focus:ring-slate-500",
      danger:
        "bg-rose-600 text-white hover:bg-rose-500 focus:ring-rose-500",
      gold:
        "bg-amber-400 text-zinc-950 hover:bg-amber-300 focus:ring-amber-400",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
