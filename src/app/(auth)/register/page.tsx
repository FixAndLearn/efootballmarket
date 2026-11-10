"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { Lock, Mail, Phone, User, AlertCircle, KeyRound, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { OtpCodeInput } from "@/components/auth/OtpCodeInput";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { normalizePhoneNumber } from "@/lib/utils/phone";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard/buyer";
  const refParam = searchParams.get("ref");

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(45);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (!emailConfirmationSent || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailConfirmationSent, resendCooldown]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    if (!termsAccepted) {
      setError("Please accept the Terms of Service and Escrow Rules.");
      setLoading(false);
      return;
    }

    const normalized = normalizePhoneNumber(phoneNumber);
    if (!normalized.isValid) {
      setError("Please enter a valid Safaricom/Kenyan number (e.g. 0794400365).");
      setLoading(false);
      return;
    }

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "Trader";
    const lastName = nameParts.slice(1).join(" ") || "";
    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");

    if (cleanUsername.length < 3) {
      setError("Username must be at least 3 characters (letters, numbers, underscores).");
      setLoading(false);
      return;
    }

    const internationalPhone = normalized.international;

    try {
      const canonicalAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.efootballmarket.co.ke";
      const emailRedirectTo = `${canonicalAppUrl}/auth/callback?redirect=${encodeURIComponent(redirect)}`;

      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo,
          data: {
            first_name: firstName,
            last_name: lastName,
            username: cleanUsername,
            phone_number: internationalPhone,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (authData.user) {
        await supabase.from("profiles").upsert({
          id: authData.user.id,
          username: cleanUsername,
          first_name: firstName,
          last_name: lastName,
          phone_number: internationalPhone,
          country: "KEN",
          is_verified_seller: false,
          available_balance: 0.0,
          escrow_balance: 0.0,
        });

        await supabase.from("user_roles").upsert({
          user_id: authData.user.id,
          role_id: "buyer",
        });

        try {
          fetch("/api/auth/register-alert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: cleanUsername,
              email: email.trim(),
              phoneNumber: internationalPhone,
            }),
          }).catch(() => {});
        } catch {
          // Non-blocking
        }
      }

      setEmailConfirmationSent(true);
      setLoading(false);
      return;
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (codeToVerify?: string) => {
    const token = (codeToVerify || code).trim();
    if (token.length < 6 || token.length > 8) {
      setError("Please enter the complete verification code from your email.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const supabase = createClient();
      let { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: "signup",
      });

      if (verifyErr) {
        const fallback = await supabase.auth.verifyOtp({
          email: email.trim(),
          token,
          type: "email",
        });
        data = fallback.data;
        verifyErr = fallback.error;
      }

      if (verifyErr) {
        throw new Error(verifyErr.message || "Invalid or expired verification code.");
      }

      if (data?.session) {
        router.push(redirect);
        router.refresh();
      } else {
        await supabase.auth.signInWithPassword({ email: email.trim(), password });
        router.push(redirect);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Code verification failed. Please check the code and try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError("");
    setResendMessage("");

    try {
      const supabase = createClient();
      const { error: resendErr } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: "https://www.efootballmarket.co.ke/auth/callback",
        },
      });

      if (resendErr) {
        throw new Error(resendErr.message);
      }

      setResendMessage("A fresh verification code has been sent to your email!");
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

  if (emailConfirmationSent) {
    return (
      <div className="w-full max-w-md bg-sx-canvas border border-sx-border rounded-2xl p-6 sm:p-8 shadow-sx-elevated space-y-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-sx-green-tint border border-sx-green-border flex items-center justify-center text-sx-green-text mx-auto">
          <KeyRound className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-sx-ink font-display">Verify Your Email</h2>
          <p className="text-xs text-sx-muted leading-relaxed">
            Enter the 8-digit code sent to <strong className="text-sx-ink font-mono">{email}</strong>
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resendMessage && (
          <div className="p-3 rounded-lg bg-sx-green-tint border border-sx-green-border text-sx-green-text text-xs flex items-center gap-2 text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{resendMessage}</span>
          </div>
        )}

        <div className="py-1">
          <OtpCodeInput
            value={code}
            length={8}
            onChange={(val) => {
              setCode(val);
              setError("");
            }}
            onComplete={handleVerifyCode}
            disabled={verifying}
            autoFocus={true}
          />
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={() => handleVerifyCode()}
          isLoading={verifying}
          disabled={code.length < 6 || verifying}
          className="w-full font-bold"
        >
          Verify &amp; Start Trading
        </Button>

        <div className="flex flex-col gap-2.5 pt-2 text-xs border-t border-sx-border">
          <div className="flex items-center justify-between text-sx-muted">
            <span>Didn&apos;t get the code?</span>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendCooldown > 0 || resending}
              className="text-sx-green-text hover:underline font-bold disabled:text-sx-muted disabled:cursor-not-allowed"
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
                setEmailConfirmationSent(false);
                setCode("");
                setError("");
              }}
              className="text-sx-muted hover:text-sx-ink transition-colors"
            >
              Edit Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-sx-canvas border border-sx-border rounded-2xl p-6 sm:p-8 shadow-sx-elevated space-y-5">
      <div className="space-y-1">
        <span className="text-[11px] font-mono uppercase tracking-wider text-sx-green-text font-bold">
          New Trader Account
        </span>
        <h1 className="text-2xl font-extrabold text-sx-ink font-display tracking-tight">
          Create Your Account
        </h1>
        <p className="text-xs text-sx-muted">
          Trade verified Konami eFootball squads with Safaricom M-Pesa Escrow (Till 1572931).
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {refParam && (
        <div className="p-3 rounded-xl bg-sx-green-tint border border-sx-green-border text-xs text-sx-green-text">
          Invited by verified trader <strong className="font-bold">@{refParam}</strong>
        </div>
      )}

      {/* 1-Tap Google Registration */}
      <GoogleSignInButton redirect={redirect} label="Sign up with Google" />

      <div className="relative flex items-center justify-center">
        <div className="border-t border-sx-border w-full" />
        <span className="bg-sx-canvas px-3 text-[11px] font-semibold text-sx-muted uppercase tracking-wider shrink-0">
          Or register with email
        </span>
        <div className="border-t border-sx-border w-full" />
      </div>

      <form onSubmit={handleRegister} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Full Name"
            autoComplete="name"
            placeholder="e.g. Brian Otieno"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Username"
            autoComplete="username"
            placeholder="e.g. pesmaster254"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
          />
        </div>

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

        <Input
          label="M-Pesa / WhatsApp Phone Number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0794400365"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          leftIcon={<Phone className="w-4 h-4 text-sx-green-text" />}
          required
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-sx-ink">Password (8+ characters)</label>
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-sx-muted hover:text-sx-ink"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPassword ? "Hide" : "Show"}</span>
            </button>
          </div>
          <Input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />
        </div>

        <label className="flex items-start gap-2 pt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded bg-sx-canvas border-sx-border-strong text-sx-green focus:ring-sx-green"
          />
          <span className="text-xs text-sx-muted leading-relaxed">
            I agree to the{" "}
            <Link href="/terms" className="text-sx-green-text font-semibold hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/escrow-guarantee" className="text-sx-green-text font-semibold hover:underline">
              Escrow Rules
            </Link>
            .
          </span>
        </label>

        <Button type="submit" variant="primary" size="lg" className="w-full font-bold" isLoading={loading}>
          Create Account
        </Button>
      </form>

      <div className="text-center text-xs text-sx-muted border-t border-sx-border pt-4">
        Already have an account?{" "}
        <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-sx-green-text hover:underline font-bold">
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 py-10">
      <Suspense fallback={<div className="text-sx-muted text-sm">Loading registration...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
