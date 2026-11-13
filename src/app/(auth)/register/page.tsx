"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import {
  Lock,
  Mail,
  Phone,
  User,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { OtpCodeInput } from "@/components/auth/OtpCodeInput";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { normalizePhoneNumber } from "@/lib/utils/phone";
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

function RegisterForm() {
  const searchParams = useSearchParams();
  const redirect = getSafeRedirectPath(searchParams.get("redirect"));
  const refParam = searchParams.get("ref");

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(45);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // Restore pending OTP state if mobile browser reloaded the tab while user checked Gmail
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("efm_pending_signup");
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.email && Date.now() - Number(saved.ts || 0) < 20 * 60 * 1000) {
          setEmail(saved.email);
          if (saved.username) setUsername(saved.username);
          if (saved.fullName) setFullName(saved.fullName);
          if (saved.phoneNumber) setPhoneNumber(saved.phoneNumber);
          setEmailConfirmationSent(true);
        } else {
          sessionStorage.removeItem("efm_pending_signup");
        }
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  useEffect(() => {
    if (!emailConfirmationSent || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailConfirmationSent, resendCooldown]);

  const syncProfileAndNavigate = async (payload?: {
    username?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }) => {
    try {
      sessionStorage.removeItem("efm_pending_signup");
      await fetch("/api/auth/sync-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {}),
      }).catch(() => {});
    } catch {
      // Non-blocking
    }
    window.location.assign(redirect);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

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
      setError("Please enter a valid Kenyan number (e.g. 0712345678 or +254712345678).");
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
      const appOrigin = getCurrentAppOrigin();
      const emailRedirectTo = `${appOrigin}/auth/callback?redirect=${encodeURIComponent(redirect)}`;

      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
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
        if (authError.message.toLowerCase().includes("already registered")) {
          throw new Error(
            "An account with this email already exists. Tap 'Sign In' at the bottom of the form."
          );
        }
        throw new Error(authError.message);
      }

      // Detect Supabase existing-email response (identities === []) where no new code is emailed
      if (
        authData.user &&
        Array.isArray(authData.user.identities) &&
        authData.user.identities.length === 0
      ) {
        setError(
          "This email is already registered on eFootballMarket. Please tap 'Sign In' below to access your account."
        );
        setLoading(false);
        return;
      }

      try {
        fetch("/api/auth/register-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: cleanUsername,
            email: normalizedEmail,
            phoneNumber: internationalPhone,
          }),
        }).catch(() => {});
      } catch {
        // Non-blocking
      }

      // Case A: Supabase returned an active session immediately (email auto-confirm enabled)
      if (authData.session) {
        await syncProfileAndNavigate({
          username: cleanUsername,
          firstName,
          lastName,
          phoneNumber: internationalPhone,
        });
        return;
      }

      // Case B: Email verification code required — persist pending state across mobile app-switches
      try {
        sessionStorage.setItem(
          "efm_pending_signup",
          JSON.stringify({
            email: normalizedEmail,
            username: cleanUsername,
            fullName: fullName.trim(),
            phoneNumber: internationalPhone,
            ts: Date.now(),
          })
        );
      } catch {}

      setEmailConfirmationSent(true);
      setResendCooldown(45);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
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
      const normalizedEmail = email.trim().toLowerCase();
      const supabase = createClient();
      let { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token,
        type: "signup",
      });

      if (verifyErr) {
        const fallback = await supabase.auth.verifyOtp({
          email: normalizedEmail,
          token,
          type: "email",
        });
        data = fallback.data;
        verifyErr = fallback.error;
      }

      if (verifyErr) {
        throw new Error(verifyErr.message || "Invalid or expired verification code.");
      }

      if (!data?.session && password) {
        await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      }

      const nameParts = fullName.trim().split(/\s+/);
      const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
      const normPhone = phoneNumber ? normalizePhoneNumber(phoneNumber) : null;

      await syncProfileAndNavigate({
        username: cleanUsername.length >= 3 ? cleanUsername : undefined,
        firstName: nameParts[0] || undefined,
        lastName: nameParts.slice(1).join(" ") || undefined,
        phoneNumber: normPhone?.isValid ? normPhone.international : phoneNumber || undefined,
      });
    } catch (err: any) {
      setError(err.message || "Code verification failed. Please check the code and try again.");
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError("");
    setResendMessage("");

    try {
      const appOrigin = getCurrentAppOrigin();
      const supabase = createClient();
      const { error: resendErr } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${appOrigin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
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
    window.open("https://mail.google.com", "_blank", "noopener,noreferrer");
  };

  if (emailConfirmationSent) {
    return (
      <div className="w-full max-w-md bg-sx-canvas border border-sx-border rounded-2xl p-5 sm:p-8 shadow-panel space-y-5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-sx-green-tint border border-sx-green-border flex items-center justify-center text-sx-green-text mx-auto">
          <KeyRound className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-sx-ink font-display">Verify Your Email</h2>
          <p className="text-xs text-sx-muted leading-relaxed break-all">
            Enter the verification code or tap the link sent to{" "}
            <strong className="text-sx-ink font-mono">{email}</strong>
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {resendMessage && (
          <div className="p-3 rounded-lg bg-sx-green-tint border border-sx-green-border text-sx-green-text text-xs flex items-start gap-2 text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{resendMessage}</span>
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
              className="text-sx-green-text hover:underline font-bold py-1 disabled:text-sx-muted disabled:cursor-not-allowed"
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
                setEmailConfirmationSent(false);
                setCode("");
                setError("");
                try {
                  sessionStorage.removeItem("efm_pending_signup");
                } catch {}
              }}
              className="text-sx-muted hover:text-sx-ink py-1 transition-colors"
            >
              Edit Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-sx-canvas border border-sx-border rounded-2xl p-5 sm:p-8 shadow-panel space-y-5">
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
        <div className="p-3 rounded-lg bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
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
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
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
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
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
          placeholder="0712345678"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          leftIcon={<Phone className="w-4 h-4 text-sx-green-text" />}
          required
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="register-password" className="text-xs font-semibold text-sx-ink">
              Password (8+ characters)
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-sx-muted hover:text-sx-ink py-0.5"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPassword ? "Hide" : "Show"}</span>
            </button>
          </div>
          <Input
            id="register-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />
        </div>

        <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 shrink-0 rounded bg-sx-canvas border-sx-border-strong text-sx-green focus:ring-sx-green"
          />
          <span className="text-xs text-sx-muted leading-relaxed">
            I agree to the{" "}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sx-green-text font-semibold hover:underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/escrow-guarantee"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sx-green-text font-semibold hover:underline"
            >
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
        <Link
          href={`/login?redirect=${encodeURIComponent(redirect)}${
            email ? `&email=${encodeURIComponent(email.trim())}` : ""
          }`}
          className="inline-block py-1 text-sx-green-text hover:underline font-bold"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex-1 w-full flex items-center justify-center px-4 py-8 sm:py-12">
      <Suspense fallback={<div className="text-sx-muted text-sm py-12">Loading registration...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
