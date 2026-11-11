"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import {
  Lock,
  Mail,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Wand2,
  Eye,
  EyeOff,
} from "lucide-react";
import { OtpCodeInput } from "@/components/auth/OtpCodeInput";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

function getSafeRedirectPath(raw: string | null): string {
  const cleaned = (raw || "").trim();
  if (
    cleaned &&
    cleaned.startsWith("/") &&
    !cleaned.startsWith("//") &&
    !cleaned.includes("\\")
  ) {
    return cleaned;
  }
  return "/dashboard/buyer";
}

function getCurrentAppOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "https://www.efootballmarket.co.ke";
}

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = getSafeRedirectPath(searchParams.get("redirect"));
  const messageParam = searchParams.get("message");
  const prefilledEmail = searchParams.get("email") || "";

  const [authMethod, setAuthMethod] = useState<"password" | "magic-link" | "otp">("password");
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  // Restore pending OTP state if mobile browser reloaded the tab while user checked Gmail
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("efm_pending_login_otp");
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.email && Date.now() - Number(saved.ts || 0) < 15 * 60 * 1000) {
          setEmail(saved.email);
          setAuthMethod(saved.method === "magic-link" ? "magic-link" : "otp");
          setOtpSent(true);
        } else {
          sessionStorage.removeItem("efm_pending_login_otp");
        }
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  useEffect(() => {
    if (!otpSent || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpSent, resendCooldown]);

  const completeSignInRedirect = async () => {
    try {
      sessionStorage.removeItem("efm_pending_login_otp");
      await fetch("/api/auth/sync-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch(() => {});
    } catch {
      // Non-blocking
    }
    window.location.assign(redirect);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError("Please enter both your email address and password.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (authError) {
        const lowerMsg = authError.message.toLowerCase();
        if (lowerMsg.includes("email not confirmed") || lowerMsg.includes("unconfirmed")) {
          try {
            const appOrigin = getCurrentAppOrigin();
            await supabase.auth.resend({
              type: "signup",
              email: normalizedEmail,
              options: {
                emailRedirectTo: `${appOrigin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
              },
            });
          } catch {
            // Non-blocking
          }
          setAuthMethod("otp");
          setOtpSent(true);
          setResendCooldown(45);
          try {
            sessionStorage.setItem(
              "efm_pending_login_otp",
              JSON.stringify({ email: normalizedEmail, method: "otp", ts: Date.now() })
            );
          } catch {}
          setInfoMessage(
            "Your email is not verified yet. Enter the 8-digit code sent to your inbox below."
          );
          setLoading(false);
          return;
        }
        if (lowerMsg.includes("invalid login credentials")) {
          throw new Error(
            "Incorrect email or password. Tap 'Show' to check your password, or use 'OTP Code' above to sign in without a password."
          );
        }
        throw new Error(authError.message);
      }

      await completeSignInRedirect();
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
      setLoading(false);
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Please provide your email address to receive the magic link.");
      return;
    }

    setLoading(true);
    setError("");
    setInfoMessage("");

    try {
      const appOrigin = getCurrentAppOrigin();
      const emailRedirectTo = `${appOrigin}/auth/callback?redirect=${encodeURIComponent(redirect)}`;

      const supabase = createClient();
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
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
          throw new Error("No account found with this email. Tap 'Create Account' below to sign up.");
        }
        throw new Error(magicError.message);
      }

      setOtpSent(true);
      setResendCooldown(45);
      try {
        sessionStorage.setItem(
          "efm_pending_login_otp",
          JSON.stringify({ email: normalizedEmail, method: "magic-link", ts: Date.now() })
        );
      } catch {}
      setInfoMessage("Magic link & 8-digit code sent! Tap the link in your inbox or enter the code below.");
    } catch (err: any) {
      setError(err.message || "Could not dispatch magic link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Please provide your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setInfoMessage("");

    try {
      const appOrigin = getCurrentAppOrigin();
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${appOrigin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
        },
      });

      if (otpError) {
        if (
          otpError.message.toLowerCase().includes("user not found") ||
          otpError.message.toLowerCase().includes("signups not allowed")
        ) {
          throw new Error("No account found with this email. Tap 'Create Account' below to register.");
        }
        throw new Error(otpError.message);
      }

      setOtpSent(true);
      setResendCooldown(45);
      try {
        sessionStorage.setItem(
          "efm_pending_login_otp",
          JSON.stringify({ email: normalizedEmail, method: "otp", ts: Date.now() })
        );
      } catch {}
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
      const normalizedEmail = email.trim().toLowerCase();
      const supabase = createClient();
      let { error: verifyErr } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token,
        type: "email",
      });

      if (verifyErr) {
        const signupFallback = await supabase.auth.verifyOtp({
          email: normalizedEmail,
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

      await completeSignInRedirect();
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError("");
    setInfoMessage("");

    try {
      const appOrigin = getCurrentAppOrigin();
      const supabase = createClient();
      const { error: resendErr } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${appOrigin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
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
    window.open("https://mail.google.com", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full max-w-md bg-sx-canvas border border-sx-border rounded-2xl p-5 sm:p-8 shadow-panel space-y-5">
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
            setOtpSent(false);
            setError("");
          }}
          className={`flex items-center justify-center gap-1 py-2.5 font-bold rounded-lg transition-all ${
            authMethod === "password"
              ? "bg-sx-canvas text-sx-ink shadow-card border border-sx-border"
              : "text-sx-muted hover:text-sx-ink"
          }`}
        >
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>Password</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMethod("magic-link");
            setError("");
          }}
          className={`flex items-center justify-center gap-1 py-2.5 font-bold rounded-lg transition-all ${
            authMethod === "magic-link"
              ? "bg-sx-canvas text-sx-green-text shadow-card border border-sx-green-border"
              : "text-sx-muted hover:text-sx-ink"
          }`}
        >
          <Wand2 className="w-3.5 h-3.5 shrink-0" />
          <span>Magic Link</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMethod("otp");
            setError("");
          }}
          className={`flex items-center justify-center gap-1 py-2.5 font-bold rounded-lg transition-all ${
            authMethod === "otp"
              ? "bg-sx-canvas text-sx-amber-text shadow-card border border-sx-amber-border"
              : "text-sx-muted hover:text-sx-ink"
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 shrink-0" />
          <span>OTP Code</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {infoMessage && (
        <div className="p-3 rounded-lg bg-sx-green-tint border border-sx-green-border text-sx-green-text text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{infoMessage}</span>
        </div>
      )}

      {authMethod === "password" ? (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="text-xs font-semibold text-sx-ink">
                Password
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-sx-muted hover:text-sx-ink py-0.5"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? "Hide" : "Show"}</span>
                </button>
                <Link
                  href={`/forgot-password?redirect=${encodeURIComponent(redirect)}`}
                  className="text-xs font-semibold text-sx-green-text hover:underline py-0.5"
                >
                  Forgot?
                </Link>
              </div>
            </div>
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
          </div>

          <label className="flex items-center gap-2.5 py-1 cursor-pointer text-xs text-sx-ink-soft">
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
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
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
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
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
            <p className="text-sx-muted break-all">
              Sent to <span className="text-sx-ink font-mono font-semibold">{email}</span>. Tap the link or enter the code below:
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-sx-ink block text-center">
              Enter Verification Code
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
                className={`font-semibold py-1 ${
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
                className="text-sx-muted hover:text-sx-ink flex items-center gap-1.5 py-1 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Open Gmail in New Tab</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtpCode("");
                  setError("");
                  try {
                    sessionStorage.removeItem("efm_pending_login_otp");
                  } catch {}
                }}
                className="text-sx-muted hover:text-sx-ink py-1 transition-colors"
              >
                Change Email
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-xs text-sx-muted border-t border-sx-border pt-4">
        New to eFootballMarket?{" "}
        <Link
          href={`/register?redirect=${encodeURIComponent(redirect)}`}
          className="inline-block py-1 text-sx-green-text hover:underline font-bold"
        >
          Create Account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-start sm:items-center justify-center px-4 py-6 sm:py-10">
      <Suspense fallback={<div className="text-sx-muted text-sm py-12">Loading sign in...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
