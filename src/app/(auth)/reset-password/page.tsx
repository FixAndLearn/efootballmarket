"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { Lock, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordForm() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasMinLength) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: updateErr } = await supabase.auth.updateUser({
        password,
      });

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?message=password-updated");
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please request a fresh reset link.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md bg-sx-canvas border border-sx-green-border rounded-2xl p-6 sm:p-8 shadow-sx-elevated space-y-5 text-center">
        <div className="w-14 h-14 rounded-full bg-sx-green-tint border border-sx-green-border flex items-center justify-center text-sx-green-text mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-sx-ink font-display">Password Updated!</h2>
          <p className="text-xs text-sx-muted mt-1.5 leading-relaxed">
            Your account password has been updated. Redirecting you to sign in...
          </p>
        </div>
        <Link href="/login">
          <Button variant="primary" size="lg" className="w-full font-bold">
            Sign In Now
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-sx-canvas border border-sx-border rounded-2xl p-6 sm:p-8 shadow-sx-elevated space-y-5">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-sx-green-tint border border-sx-green-border flex items-center justify-center text-sx-green-text mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-sx-ink font-display">Set New Password</h1>
        <p className="text-xs text-sx-muted mt-1">
          Choose a strong password to protect your eFootballMarket account.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleUpdatePassword} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          required
        />

        <Input
          label="Confirm New Password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          required
        />

        <div className="p-3.5 rounded-xl bg-sx-stone border border-sx-border text-xs space-y-1.5">
          <p className="font-bold text-sx-ink">Password Requirements:</p>
          <div className={`flex items-center gap-2 ${hasMinLength ? "text-sx-green-text" : "text-sx-muted"}`}>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>At least 8 characters</span>
          </div>
          <div className={`flex items-center gap-2 ${hasNumber ? "text-sx-green-text" : "text-sx-muted"}`}>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Contains at least one number</span>
          </div>
          <div className={`flex items-center gap-2 ${passwordsMatch ? "text-sx-green-text" : "text-sx-muted"}`}>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Passwords match</span>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full font-bold"
          isLoading={loading}
          disabled={!hasMinLength || !passwordsMatch}
        >
          Save New Password
        </Button>

        <div className="text-center pt-1">
          <Link href="/login" className="text-xs font-semibold text-sx-muted hover:text-sx-ink transition-colors">
            Cancel &amp; Return to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 py-10">
      <Suspense fallback={<div className="text-sx-muted text-sm">Loading security...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
