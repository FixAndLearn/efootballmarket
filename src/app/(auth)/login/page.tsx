"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { Lock, Mail, AlertCircle, KeyRound, CheckCircle2, Wand2 } from "lucide-react";
import { OtpCodeInput } from "@/components/auth/OtpCodeInput";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard/buyer";
  const messageParam = searchParams.get("message");

  const [authMethod, setAuthMethod] = useState<"password" | "magic-link" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState(
    messageParam === "password-updated"
      ? "Password updated successfully. Please sign in with your new password."
      : ""
  );

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(45);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!otpSent || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpSent, resendCooldown]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        if (
          authError.message.toLowerCase().includes("email not confirmed") ||
          authError.message.toLowerCase().includes("unconfirmed")
        ) {
          try {
            const canonicalAppUrl =
              process.env.NEXT_PUBLIC_APP_URL || window.location.origin || "https://www.efootballmarket.co.ke";
            await supabase.auth.resend({
              type: "signup",
              email: email.trim(),
              options: {
                emailRedirectTo: `${canonicalAppUrl}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
              },
            });
          } catch {
            // Non-blocking
          }
          setAuthMethod("otp");
          setOtpSent(true);
          setResendCooldown(45);
          setInfoMessage("Your email is not verified yet. Enter the 8-digit code dispatched to your inbox below.");
          return;
        }
        throw new Error(authError.message);
      }

      router.push(redirect);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please provide your email address to receive the magic link.");
      return;
    }

    setLoading(true);
    setError("");
    setInfoMessage("");

    try {
      const canonicalAppUrl =
        process.env.NEXT_PUBLIC_APP_URL || window.location.origin || "https://www.efootballmarket.co.ke";
      const emailRedirectTo = `${canonicalAppUrl}/auth/callback?redirect=${encodeURIComponent(redirect)}`;

      const supabase = createClient();
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo,
        },
      });

      if (magicError) {
        if (
          magicError.message.toLowerCase().includes("user not found") ||
          magicError.message.toLowerCase().includes("signups not allowed")
        ) {
          throw new Error("No account found with this email. Please create an account first.");
        }
        throw new Error(magicError.message);
      }

      setOtpSent(true);
      setResendCooldown(45);
      setInfoMessage("Magic link & 8-digit code sent! Tap the link in your inbox or enter the code below.");
    } catch (err: any) {
      setError(err.message || "Could not dispatch magic link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please provide your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setInfoMessage("");

    try {
      const canonicalAppUrl =
        process.env.NEXT_PUBLIC_APP_URL || window.location.origin || "https://www.efootballmarket.co.ke";
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${canonicalAppUrl}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
        },
      });

      if (otpError) {
        if (
          otpError.message.toLowerCase().includes("user not found") ||
          otpError.message.toLowerCase().includes("signups not allowed")
        ) {
          throw new Error("No account found with this email. Please register first.");
        }
        throw new Error(otpError.message);
      }

      setOtpSent(true);
      setResendCooldown(45);
      setInfoMessage("An 8-digit login code has been sent to your email!");
    } catch (err: any) {
      setError(err.message || "Could not dispatch code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const token = (codeToVerify || otpCode).trim();
    if (token.length < 6 || token.length > 8) {
      setError("Please enter the complete verification code from your email.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const supabase = createClient();
      let { error: verifyErr } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: "email",
      });

      if (verifyErr) {
        const signupFallback = await supabase.auth.verifyOtp({
          email: email.trim(),
          token,
          type: "signup",
        });

        if (!signupFallback.error) {
          verifyErr = null;
        }
      }

      if (verifyErr) {
        throw new Error(verifyErr.message || "Invalid or expired code. Please check your email and try again.");
      }

      router.push(redirect);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError("");
    setInfoMessage("");

    try {
      const canonicalAppUrl =
        process.env.NEXT_PUBLIC_APP_URL || window.location.origin || "https://www.efootballmarket.co.ke";
      const supabase = createClient();
      const { error: resendErr } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${canonicalAppUrl}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
        },
      });

      if (resendErr) {
        throw new Error(resendErr.message);
      }

      setInfoMessage("A fresh code and login link have been sent to your email!");
      setResendCooldown(45);
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  const handleOpenEmailApp = () => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);

    if (isAndroid) {
      window.location.href = "intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_EMAIL;end";
    } else if (isIOS) {
      window.location.href = "message://";
      setTimeout(() => {
        window.location.href = "https://mail.google.com";
      }, 1000);
    } else {
      window.open("https://mail.google.com", "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="w-full max-w-md bg-sx-canvas border border-sx-border rounded-2xl p-6 sm:p-8 shadow-sx-elevated space-y-5">
      <div className="space-y-1">
        <span className="text-[11px] font-mono uppercase tracking-wider text-sx-green-text font-bold">
          Trader Sign In
        </span>
        <h1 className="text-2xl font-extrabold text-sx-ink font-display tracking-tight">
          Sign in to eFootballMarket
        </h1>
        <p className="text-xs text-sx-muted">
          Access your escrow orders, watchlist, and M-Pesa payouts.
        </p>
      </div>

      {/* 1-Tap Google Sign-In */}
      <GoogleSignInButton redirect={redirect} label="Continue with Google" />

      <div className="relative flex items-center justify-center">
        <div className="border-t border-sx-border w-full" />
        <span className="bg-sx-canvas px-3 text-[11px] font-semibold text-sx-muted uppercase tracking-wider shrink-0">
          Or email
        </span>
        <div className="border-t border-sx-border w-full" />
      </div>

      {/* Auth Method Selector Tabs */}
      <div className="grid grid-cols-3 p-1 bg-sx-stone rounded-xl border border-sx-border text-xs">
        <button
          type="button"
          onClick={() => {
            setAuthMethod("password");
            setError("");
          }}
          className={`flex items-center justify-center gap-1.5 py-2 font-bold rounded-lg transition-all ${
            authMethod === "password"
              ? "bg-sx-canvas text-sx-ink shadow-sx-card border border-sx-border"
              : "text-sx-muted hover:text-sx-ink"
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Password</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMethod("magic-link");
            setError("");
          }}
          className={`flex items-center justify-center gap-1.5 py-2 font-bold rounded-lg transition-all ${
            authMethod === "magic-link"
              ? "bg-sx-canvas text-sx-green-text shadow-sx-card border border-sx-green-border"
              : "text-sx-muted hover:text-sx-ink"
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Magic Link</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMethod("otp");
            setError("");
          }}
          className={`flex items-center justify-center gap-1.5 py-2 font-bold rounded-lg transition-all ${
            authMethod === "otp"
              ? "bg-sx-canvas text-sx-amber-text shadow-sx-card border border-sx-amber-border"
              : "text-sx-muted hover:text-sx-ink"
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>OTP Code</span>
        </button>
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

      {authMethod === "password" ? (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-sx-ink">Password</label>
              <Link
                href={`/forgot-password?redirect=${encodeURIComponent(redirect)}`}
                className="text-xs font-semibold text-sx-green-text hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-sx-ink-soft">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-sx-border-strong bg-sx-canvas text-sx-green focus:ring-sx-green"
            />
            <span>Stay signed in on this device</span>
          </label>

          <Button type="submit" variant="primary" size="lg" className="w-full font-bold" isLoading={loading}>
            Sign In
          </Button>
        </form>
      ) : authMethod === "magic-link" && !otpSent ? (
        <form onSubmit={handleSendMagicLink} className="space-y-4">
          <div className="p-3 rounded-xl bg-sx-green-tint border border-sx-green-border text-xs text-sx-green-text leading-relaxed">
            No password required. Enter your email and we will send a 1-click sign-in link directly to your inbox.
          </div>

          <Input
            label="Account Email Address"
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
            Send 1-Click Magic Link
          </Button>
        </form>
      ) : authMethod === "otp" && !otpSent ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="p-3 rounded-xl bg-sx-amber-tint border border-sx-amber-border text-xs text-sx-amber-text leading-relaxed">
            We will send an 8-digit numeric verification code to your email so you can sign in without a password.
          </div>

          <Input
            label="Account Email Address"
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
            Send 8-Digit Code
          </Button>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="p-3.5 rounded-xl bg-sx-stone border border-sx-border text-xs text-sx-ink-soft space-y-1.5">
            <p className="font-bold text-sx-ink">Check Your Inbox</p>
            <p className="text-sx-muted">
              Sent to <span className="text-sx-ink font-mono font-semibold">{email}</span>. Tap the link or enter the 8-digit code below:
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-sx-ink block text-center">
              Enter 8-Digit Code
            </label>
            <OtpCodeInput
              value={otpCode}
              onChange={(val) => {
                setOtpCode(val);
                setError("");
              }}
              onComplete={(completedCode) => handleVerifyOtp(completedCode)}
              length={8}
              disabled={verifying}
            />
          </div>

          <Button
            type="button"
            onClick={() => handleVerifyOtp()}
            variant="primary"
            size="lg"
            className="w-full font-bold"
            isLoading={verifying}
            disabled={otpCode.length < 6}
          >
            Verify &amp; Sign In
          </Button>

          <div className="space-y-2.5 pt-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-sx-muted">Didn&apos;t receive it?</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || resending}
                className={`font-semibold ${
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

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleOpenEmailApp}
                className="text-sx-muted hover:text-sx-ink flex items-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Launch Mail App</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtpCode("");
                  setError("");
                }}
                className="text-sx-muted hover:text-sx-ink transition-colors"
              >
                Change Email
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-xs text-sx-muted border-t border-sx-border pt-4">
        New to eFootballMarket?{" "}
        <Link href={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-sx-green-text hover:underline font-bold">
          Create Account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 py-10">
      <Suspense fallback={<div className="text-sx-muted text-sm">Loading sign in...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
