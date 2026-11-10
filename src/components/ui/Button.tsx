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
      "inline-flex items-center justify-center font-semibold rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

    const sizeStyles = {
      sm: "text-xs px-4 py-1.5 h-8 gap-1.5",
      md: "text-sm px-5 py-2 h-10 gap-2",
      lg: "text-sm px-6 py-2.5 h-11 gap-2",
    };

    const variantStyles = {
      primary:
        "bg-[#006340] text-white hover:bg-[#004D32] focus:ring-[#006340]",
      secondary:
        "bg-[#0F0F0F] text-white hover:bg-[#262626] focus:ring-[#0F0F0F]",
      outline:
        "border border-[#0F0F0F] bg-white text-[#0F0F0F] hover:bg-[#F4F3F1] focus:ring-[#0F0F0F]",
      ghost:
        "text-[#0F0F0F] hover:bg-[#F4F3F1] focus:ring-[#0F0F0F]",
      danger:
        "bg-[#C92A2A] text-white hover:bg-[#A61E1E] focus:ring-[#C92A2A]",
      gold:
        "bg-[#006340] text-white hover:bg-[#004D32] focus:ring-[#006340]",
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
