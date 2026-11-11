import { cn } from "@/lib/utils";
import React, { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-sx-ink">
            {label}
          </label>
        )}
        <div className="relative rounded-md">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sx-muted">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full min-h-[44px] rounded-md bg-sx-canvas border border-sx-border-strong px-3.5 py-2.5 text-base sm:text-sm text-sx-ink placeholder:text-sx-muted transition-colors focus:border-sx-ink focus:outline-none focus:ring-1 focus:ring-sx-ink disabled:opacity-50",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error && "border-sx-red focus:border-sx-red focus:ring-sx-red",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sx-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-sx-red-text font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-sx-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
