"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { normalizePhoneNumber } from "@/lib/utils/phone";
import {
  User,
  Mail,
  Lock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Save,
  ArrowRight,
  Users,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ProfileContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"details" | "email" | "security" | "invites">("details");
  const [copiedLink, setCopiedLink] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [userId, setUserId] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isVerifiedSeller, setIsVerifiedSeller] = useState(false);
  const [createdAt, setCreatedAt] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const [emailError, setEmailError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    async function loadUserData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();

        if (userErr || !user) {
          router.push("/login?redirect=/profile");
          return;
        }

        setUserId(user.id);
        setCurrentEmail(user.email || "");
        setCreatedAt(user.created_at || "");

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          setFirstName(profile.first_name || "");
          setLastName(profile.last_name || "");
          setUsername(profile.username || "");
          setPhoneNumber(profile.phone_number || "");
          setIsVerifiedSeller(profile.is_verified_seller || false);
        } else {
          const meta = user.user_metadata || {};
          setFirstName(meta.first_name || "");
          setLastName(meta.last_name || "");
          setUsername(meta.username || user.email?.split("@")[0] || "");
          setPhoneNumber(meta.phone_number || "");
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      } finally {
        setLoadingUser(false);
      }
    }

    loadUserData();
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess("");
    setProfileError("");

    const normPhone = normalizePhoneNumber(phoneNumber);
    if (phoneNumber && !normPhone.isValid) {
      setProfileError("Please enter a valid phone number (e.g. 0794400365 or +254794400365).");
      setSavingProfile(false);
      return;
    }

    try {
      const supabase = createClient();
      const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");

      const { error: upsertErr } = await supabase.from("profiles").upsert({
        id: userId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: cleanUsername,
        phone_number: normPhone.isValid ? normPhone.international : phoneNumber,
        country: "KEN",
      });

      if (upsertErr) {
        throw new Error(upsertErr.message);
      }

      setUsername(cleanUsername);
      setProfileSuccess("Profile and M-Pesa phone number saved.");
    } catch (err: any) {
      setProfileError(err.message || "Failed to save profile changes.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || newEmail.trim() === currentEmail) {
      setEmailError("Please enter a different email address.");
      return;
    }

    setUpdatingEmail(true);
    setEmailSuccess("");
    setEmailError("");

    try {
      const supabase = createClient();
      const { error: emailErr } = await supabase.auth.updateUser(
        { email: newEmail.trim() },
        { emailRedirectTo: "https://www.efootballmarket.co.ke/auth/callback?redirect=/profile" }
      );

      if (emailErr) {
        throw new Error(emailErr.message);
      }

      setEmailSuccess(
        `Confirmation link sent to ${newEmail.trim()}. Approve it in your new inbox to complete the switch.`
      );
      setNewEmail("");
    } catch (err: any) {
      setEmailError(err.message || "Could not update email address.");
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setUpdatingPassword(true);
    setPasswordSuccess("");
    setPasswordError("");

    try {
      const supabase = createClient();
      const { error: passErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (passErr) {
        throw new Error(passErr.message);
      }

      setPasswordSuccess("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sx-muted">
        <div className="w-8 h-8 border-2 border-sx-green border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Loading account settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sx-border pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sx-green-text">
            Account Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-sx-ink font-display tracking-tight mt-0.5">
            Profile &amp; Security Settings
          </h1>
          <p className="text-xs sm:text-sm text-sx-muted mt-1">
            Manage your storefront username, Safaricom M-Pesa number, email, and password.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {username && (
            <Link href={`/u/${encodeURIComponent(username)}`}>
              <Button variant="secondary" size="sm" className="text-xs">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Storefront</span>
              </Button>
            </Link>
          )}
          <Link href="/dashboard/buyer">
            <Button variant="secondary" size="sm" className="text-xs">
              Buyer Hub
            </Button>
          </Link>
          <Link href="/dashboard/seller">
            <Button variant="secondary" size="sm" className="text-xs">
              Seller Hub
            </Button>
          </Link>
        </div>
      </div>

      {/* Trust & Account Status Card */}
      <div className="p-5 rounded-2xl bg-sx-stone border border-sx-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sx-green-tint border border-sx-green-border flex items-center justify-center text-sx-green-text shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-sx-ink">
                {username ? `@${username}` : "Trader Account"}
              </span>
              {isVerifiedSeller ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sx-green-tint text-sx-green-text border border-sx-green-border">
                  Verified Seller
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sx-canvas text-sx-ink border border-sx-border">
                  Escrow Trader
                </span>
              )}
            </div>
            <p className="text-xs text-sx-muted mt-0.5">
              Protected under Kenyan Data Protection Act (2019) &amp; Till 1572931 Escrow Rules
            </p>
          </div>
        </div>

        <div className="text-xs text-sx-muted sm:text-right shrink-0">
          <p>
            Joined:{" "}
            <strong className="text-sx-ink">
              {createdAt ? new Date(createdAt).toLocaleDateString("en-KE") : "Active"}
            </strong>
          </p>
          <p className="font-mono text-[11px] text-sx-muted mt-0.5">UID: {userId.slice(0, 12)}...</p>
        </div>
      </div>

      {/* Interactive Profile Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 rounded-xl bg-sx-stone border border-sx-border w-fit max-w-full">
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "details"
              ? "bg-sx-canvas text-sx-ink border border-sx-border shadow-sx-card"
              : "text-sx-muted hover:text-sx-ink"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Details &amp; M-Pesa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("email")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "email"
              ? "bg-sx-canvas text-sx-ink border border-sx-border shadow-sx-card"
              : "text-sx-muted hover:text-sx-ink"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "security"
              ? "bg-sx-canvas text-sx-ink border border-sx-border shadow-sx-card"
              : "text-sx-muted hover:text-sx-ink"
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("invites")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "invites"
              ? "bg-sx-canvas text-sx-ink border border-sx-border shadow-sx-card"
              : "text-sx-muted hover:text-sx-ink"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Referrals</span>
        </button>
      </div>

      {/* Tab 1: Personal Details */}
      {activeTab === "details" && (
        <div className="p-6 rounded-2xl bg-sx-canvas border border-sx-border space-y-5">
          <div className="border-b border-sx-border pb-3">
            <h2 className="text-base font-bold text-sx-ink font-display">Personal &amp; Payout Details</h2>
            <p className="text-xs text-sx-muted mt-0.5">
              Your username powers your public catalog link (`/u/{username || "username"}`) and your phone receives M-Pesa payouts.
            </p>
          </div>

          {profileError && (
            <div className="p-3 rounded-lg bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="p-3 rounded-lg bg-sx-green-tint border border-sx-green-border text-sx-green-text text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="First Name"
                placeholder="Brian"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                placeholder="Otieno"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <Input
              label="Storefront Username"
              placeholder="e.g. pesmaster254"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              helperText="Lowercase letters, numbers, and underscores only"
              required
            />

            <Input
              label="Safaricom M-Pesa & WhatsApp Number"
              type="tel"
              placeholder="0794400365 or +254794400365"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              leftIcon={<Phone className="w-4 h-4 text-sx-green-text" />}
              helperText="Used for STK Push prompts and seller escrow withdrawals"
            />

            <Button type="submit" variant="primary" size="md" className="font-bold" isLoading={savingProfile}>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </Button>
          </form>
        </div>
      )}

      {/* Tab 2: Email Management */}
      {activeTab === "email" && (
        <div className="p-6 rounded-2xl bg-sx-canvas border border-sx-border space-y-5">
          <div className="border-b border-sx-border pb-3">
            <h2 className="text-base font-bold text-sx-ink font-display">Email Address</h2>
            <p className="text-xs text-sx-muted mt-0.5">
              Used for sign-in OTPs, magic links, and escrow handover alerts.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-sx-stone border border-sx-border max-w-xl">
            <span className="text-[11px] text-sx-muted block font-semibold uppercase tracking-wider">Current Email</span>
            <div className="flex items-center gap-2 mt-1">
              <strong className="text-sx-ink text-sm font-mono truncate">{currentEmail}</strong>
              <span className="text-[10px] bg-sx-green-tint text-sx-green-text border border-sx-green-border px-2 py-0.5 rounded-full font-bold shrink-0">
                Verified
              </span>
            </div>
          </div>

          {emailError && (
            <div className="p-3 rounded-lg bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs flex items-center gap-2 max-w-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{emailError}</span>
            </div>
          )}

          {emailSuccess && (
            <div className="p-3 rounded-lg bg-sx-green-tint border border-sx-green-border text-sx-green-text text-xs flex items-center gap-2 max-w-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{emailSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-xl">
            <Input
              label="New Email Address"
              type="email"
              inputMode="email"
              placeholder="newaddress@domain.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />

            <Button type="submit" variant="secondary" size="md" className="font-bold" isLoading={updatingEmail}>
              <Mail className="w-4 h-4" />
              <span>Update Email</span>
            </Button>
          </form>
        </div>
      )}

      {/* Tab 3: Password & Security */}
      {activeTab === "security" && (
        <div className="p-6 rounded-2xl bg-sx-canvas border border-sx-border space-y-5">
          <div className="border-b border-sx-border pb-3">
            <h2 className="text-base font-bold text-sx-ink font-display">Change Password</h2>
            <p className="text-xs text-sx-muted mt-0.5">
              Choose a unique password of at least 8 characters.
            </p>
          </div>

          {passwordError && (
            <div className="p-3 rounded-lg bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs flex items-center gap-2 max-w-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 rounded-lg bg-sx-green-tint border border-sx-green-border text-sx-green-text text-xs flex items-center gap-2 max-w-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
            <Input
              label="New Password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button type="submit" variant="primary" size="md" className="font-bold" isLoading={updatingPassword}>
              <KeyRound className="w-4 h-4" />
              <span>Update Password</span>
            </Button>
          </form>
        </div>
      )}

      {/* Tab 4: Referrals & Invites */}
      {activeTab === "invites" && (
        <div className="p-6 rounded-2xl bg-sx-canvas border border-sx-border space-y-5">
          <div className="border-b border-sx-border pb-3">
            <h2 className="text-base font-bold text-sx-ink font-display">Invite Traders</h2>
            <p className="text-xs text-sx-muted mt-0.5">
              Share your personal invite link with fellow Kenyan eFootball players.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-sx-stone border border-sx-border space-y-3 max-w-xl">
            <label className="text-xs font-semibold text-sx-ink block">
              Your Personal Referral Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`https://www.efootballmarket.co.ke/register?ref=${encodeURIComponent(username || "you")}`}
                className="flex-1 bg-sx-canvas border border-sx-border rounded-lg px-3 py-2 text-xs text-sx-ink font-mono select-all focus:outline-none"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `https://www.efootballmarket.co.ke/register?ref=${encodeURIComponent(username || "you")}`
                  );
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-sx-green-text" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Copied" : "Copy"}</span>
              </Button>
            </div>

            <button
              type="button"
              onClick={() => {
                const text = `Join me on eFootballMarket.co.ke to buy and sell verified Konami eFootball squads safely with Safaricom M-Pesa Escrow (Till 1572931): https://www.efootballmarket.co.ke/register?ref=${encodeURIComponent(username || "you")}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-extrabold flex items-center justify-center gap-2 text-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share Invite on WhatsApp</span>
            </button>
          </div>

          <Link href="/invite" className="inline-block">
            <Button variant="secondary" size="sm" className="text-xs">
              <span>Open Email Invitation Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sx-muted text-sm">Loading profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
