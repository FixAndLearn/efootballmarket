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
    console.error("Application error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto py-16">
      <div className="w-16 h-16 rounded-2xl bg-sx-red-tint border border-sx-red-border flex items-center justify-center text-sx-red-text mb-6">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-sx-ink font-display mb-2">
        Something Went Wrong
      </h1>
      <p className="text-sm text-sx-muted mb-6 leading-relaxed">
        We encountered a temporary error loading this page. Your account and any active escrow funds remain safe.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <Button variant="primary" size="md" onClick={() => reset()}>
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Retry
        </Button>
        <Link href="/browse">
          <Button variant="secondary" size="md">
            Browse Market
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="md">
            Homepage
          </Button>
        </Link>
      </div>

      <div className="p-3.5 rounded-xl bg-sx-stone border border-sx-border flex items-center justify-center gap-2 text-xs text-sx-muted">
        <ShieldCheck className="w-4 h-4 text-sx-green-text" />
        <span>Need urgent escrow assistance? WhatsApp Support: +254 794 400 365</span>
      </div>
    </div>
  );
}
