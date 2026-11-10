"use client";

import { Button } from "@/components/ui/Button";
import { AlertTriangle, RotateCcw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors safely without exposing secrets
    console.error("Application error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto py-16">
      <div className="w-16 h-16 rounded-2xl bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center text-[#C92A2A] mb-6 shadow-inner">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-[#0F0F0F] font-display mb-2">
        An Error Occurred
      </h1>
      <p className="text-sm text-[#5F5F5F] mb-6 leading-relaxed">
        Our system encountered an unexpected issue while communicating with backend services. All escrow funds and audit logs remain completely safe.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <Button variant="primary" size="md" onClick={() => reset()}>
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Retry Action
        </Button>
        <Link href="/browse">
          <Button variant="secondary" size="md">
            Browse Accounts
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="md">
            Homepage
          </Button>
        </Link>
      </div>

      <div className="p-3.5 rounded-xl bg-pitch-card/60 border border-pitch-border flex items-center justify-center gap-2 text-xs text-[#5F5F5F]">
        <ShieldCheck className="w-4 h-4 text-[#006340]" />
        <span>Need urgent escrow assistance? WhatsApp Support: +254 794 400 365</span>
      </div>
    </div>
  );
}
