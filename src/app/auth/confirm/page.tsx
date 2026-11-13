"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard/buyer";
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    const supabase = createClient();

    // Listen for auth state change from hash fragment or session
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setStatus("success");
        setTimeout(() => {
          router.push(redirect);
          router.refresh();
        }, 1200);
      }
    });

    // Check if session is already active
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus("success");
        setTimeout(() => {
          router.push(redirect);
          router.refresh();
        }, 1200);
      } else {
        // If after 3 seconds no session found, route to login with verified notice
        setTimeout(() => {
          router.push(`/login?redirect=${encodeURIComponent(redirect)}&verified=1`);
        }, 3000);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [redirect, router]);

  return (
    <div className="w-full max-w-md bg-pitch-surface border border-pitch-border rounded-2xl p-8 shadow-2xl text-center space-y-4">
      {status === "verifying" ? (
        <>
          <div className="w-12 h-12 rounded-2xl bg-sx-amber-tint border border-sx-amber-border flex items-center justify-center text-sx-amber-text mx-auto animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin text-sx-amber-text" />
          </div>
          <h2 className="text-xl font-bold text-sx-ink font-display">Verifying Your Email</h2>
          <p className="text-xs text-sx-muted">
            Confirming your registration credentials. You will be redirected to your dashboard in a moment...
          </p>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-2xl bg-sx-green-tint border border-sx-green-border flex items-center justify-center text-sx-green-text mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-sx-ink font-display">Email Verified!</h2>
          <p className="text-xs text-sx-muted">
            Welcome to eFootballMarket! Redirecting you now...
          </p>
        </>
      )}
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <div className="flex-1 w-full flex items-center justify-center px-4 py-8 sm:py-12">
      <Suspense fallback={<div className="text-sx-muted text-sm">Verifying confirmation...</div>}>
        <AuthConfirmContent />
      </Suspense>
    </div>
  );
}
