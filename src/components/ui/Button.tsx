import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React, { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "gold";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, type = "button", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center text-center leading-snug font-semibold rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sx-canvas disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

    const sizeStyles = {
      sm: "text-xs px-4 py-1.5 min-h-8 gap-1.5",
      md: "text-sm px-5 py-2 min-h-10 gap-2",
      lg: "text-sm px-6 py-2.5 min-h-11 gap-2",
    };

    const variantStyles = {
      primary:
        "bg-sx-green text-white hover:bg-sx-green-hover focus:ring-sx-green",
      secondary:
        "bg-sx-contrast text-sx-contrast-fg hover:bg-sx-contrast-hover focus:ring-sx-ink",
      outline:
        "border border-sx-border-strong bg-sx-canvas text-sx-ink hover:bg-sx-stone hover:border-sx-ink focus:ring-sx-ink",
      ghost:
        "text-sx-ink hover:bg-sx-stone focus:ring-sx-ink",
      danger:
        "bg-sx-red text-white hover:opacity-90 focus:ring-sx-red",
      gold:
        "bg-sx-green text-white hover:bg-sx-green-hover focus:ring-sx-green",
    };

    return (
      <button
        ref={ref}
        type={type}
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
