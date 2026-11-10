import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-lg border border-[#E2E2E0] bg-[#F9F9F8]",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-[#EBF5F0] flex items-center justify-center text-[#006340] mb-4">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-base font-bold text-[#0F0F0F] mb-1.5">{title}</h3>
      <p className="text-sm text-[#5F5F5F] max-w-md mb-6 leading-relaxed">{description}</p>
      {actionLabel && (
        <>
          {actionHref ? (
            <a href={actionHref}>
              <Button variant="primary" size="md">
                {actionLabel}
              </Button>
            </a>
          ) : (
            <Button variant="primary" size="md" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
