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
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#0F0F0F]">
            {label}
          </label>
        )}
        <div className="relative rounded-md">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5F5F5F]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full rounded-md bg-white border border-[#C8C8C4] px-3.5 py-2.5 text-sm text-[#0F0F0F] placeholder:text-[#767676] transition-colors focus:border-[#0F0F0F] focus:outline-none focus:ring-1 focus:ring-[#0F0F0F] disabled:opacity-50",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error && "border-[#C92A2A] focus:border-[#C92A2A] focus:ring-[#C92A2A]",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5F5F5F]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-[#C92A2A] font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#5F5F5F]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
