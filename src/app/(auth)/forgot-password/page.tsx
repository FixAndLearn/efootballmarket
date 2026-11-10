"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { Mail, KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { OtpCodeInput } from "@/components/auth/OtpCodeInput";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard/buyer";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(45);
  const [resending, setResending] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

  useEffect(() => {
    if (!codeSent || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [codeSent, resendCooldown]);

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please provide your account email address.");
      return;
    }

    setLoading(true);
    setError("");
    setInfoMessage("");

    try {
      const canonicalAppUrl =
        process.env.NEXT_PUBLIC_APP_URL || window.location.origin || "https://www.efootballmarket.co.ke";
      const redirectTo = `${canonicalAppUrl}/auth/callback?redirect=/reset-password`;

      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (resetError) {
        throw new Error(resetError.message);
      }

      setCodeSent(true);
      setResendCooldown(45);
      setInfoMessage("A password reset link and recovery code have been sent to your email!");
    } catch (err: any) {
      setError(err.message || "Failed to dispatch recovery email.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRecoveryCode = async (codeToVerify?: string) => {
    const token = (codeToVerify || recoveryCode).trim();
    if (token.length < 6 || token.length > 8) {
      setError("Please enter the complete recovery code from your email.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: "recovery",
      });

      if (verifyErr) {
        throw new Error(verifyErr.message || "Invalid or expired recovery code.");
      }

      router.push("/reset-password");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Recovery code verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError("");
    setInfoMessage("");

    try {
      const canonicalAppUrl =
        process.env.NEXT_PUBLIC_APP_URL || window.location.origin || "https://www.efootballmarket.co.ke";
      const redirectTo = `${canonicalAppUrl}/auth/callback?redirect=/reset-password`;

      const supabase = createClient();
      const { error: resendErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (resendErr) {
        throw new Error(resendErr.message);
      }

      setInfoMessage("A fresh recovery code has been sent to your email!");
      setResendCooldown(45);
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-sx-canvas border border-sx-border rounded-2xl p-6 sm:p-8 shadow-sx-elevated space-y-5">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-sx-amber-tint border border-sx-amber-border flex items-center justify-center text-sx-amber-text mx-auto mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-sx-ink font-display">Reset Your Password</h1>
        <p className="text-xs text-sx-muted mt-1">
          Enter your registered email to receive a recovery link or code.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {infoMessage && (
        <div className="p-3 rounded-lg bg-sx-green-tint border border-sx-green-border text-sx-green-text text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{infoMessage}</span>
        </div>
      )}

      {!codeSent ? (
        <form onSubmit={handleSendResetEmail} className="space-y-4">
          <Input
            label="Registered Email Address"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Button type="submit" variant="primary" size="lg" className="w-full font-bold" isLoading={loading}>
            Send Recovery Link
          </Button>

          <div className="text-center pt-1">
            <Link
              href={`/login?redirect=${encodeURIComponent(redirect)}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sx-muted hover:text-sx-ink transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="p-3.5 rounded-xl bg-sx-stone border border-sx-border text-xs text-sx-ink-soft space-y-1">
            <p className="font-bold text-sx-ink">Check Your Inbox</p>
            <p className="text-sx-muted">
              Sent to <span className="text-sx-ink font-mono font-semibold">{email}</span>. Tap the link or enter the code below:
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-sx-ink block text-center">
              Enter Recovery Code
            </label>
            <OtpCodeInput
              value={recoveryCode}
              onChange={(val) => {
                setRecoveryCode(val);
                setError("");
              }}
              onComplete={(completedCode) => handleVerifyRecoveryCode(completedCode)}
              length={8}
              disabled={verifying}
            />
          </div>

          <Button
            type="button"
            onClick={() => handleVerifyRecoveryCode()}
            variant="primary"
            size="lg"
            className="w-full font-bold"
            isLoading={verifying}
            disabled={recoveryCode.length < 6}
          >
            Verify Code &amp; Change Password
          </Button>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-sx-border">
            <button
              type="button"
              onClick={() => {
                setCodeSent(false);
                setRecoveryCode("");
                setError("");
              }}
              className="text-sx-muted hover:text-sx-ink"
            >
              Change Email
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendCooldown > 0 || resending}
              className={`font-bold ${
                resendCooldown > 0 || resending
                  ? "text-sx-muted cursor-not-allowed"
                  : "text-sx-green-text hover:underline"
              }`}
            >
              {resending
                ? "Sending..."
                : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend Code"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 py-10">
      <Suspense fallback={<div className="text-sx-muted text-sm">Loading recovery...</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
