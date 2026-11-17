import { EarningsWithdrawSection } from "@/components/seller/EarningsWithdrawSection";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils";
import { formatDisplayPhone } from "@/lib/utils/phone";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AlertCircle, ArrowLeft, Building2, CheckCircle2, Clock, Smartphone } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function SellerEarningsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/seller/earnings");
  }

  const adminSupabase = createAdminClient();
  const serviceRoleConfigured = hasServiceRoleKey();
  const primaryClient = serviceRoleConfigured ? adminSupabase : supabase;

  // Fetch seller profile balances
  const { data: profile } = await primaryClient
    .from("profiles")
    .select("available_balance, escrow_balance, completed_sales_count, phone_number")
    .eq("id", user.id)
    .single();

  // Fetch past withdrawals
  const { data: withdrawals } = await primaryClient
    .from("seller_withdrawals")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const availableBalance = Number(profile?.available_balance || 0);
  const escrowBalance = Number(profile?.escrow_balance || 0);
  const completedSales = profile?.completed_sales_count || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full space-y-8">
      <div>
        <Link
          href="/dashboard/seller"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-sx-muted hover:text-sx-ink transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Seller Dashboard</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-sx-ink font-display">
              Seller Earnings &amp; M-Pesa Withdrawals
            </h1>
            <p className="text-xs sm:text-sm text-sx-muted mt-1">
              Withdrawal requests are reviewed and arranged manually; processing time varies.
            </p>
          </div>
          <Link href="/dashboard/seller">
            <Button variant="primary" size="md">
              Manage Listings &amp; Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* Prominent Active Withdrawal Banner & Action */}
      <EarningsWithdrawSection
        availableBalance={availableBalance}
        escrowBalance={escrowBalance}
      />

      {/* Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-pitch-surface border border-pitch-border shadow-xl">
          <span className="block text-xs uppercase font-bold text-sx-muted tracking-wider">
            Available Balance
          </span>
          <span className="text-3xl font-extrabold text-sx-green-text font-display mt-2 block font-mono">
            {formatCurrency(availableBalance)}
          </span>
          <p className="text-[11px] text-sx-muted mt-2">
            Cleared funds available to request for M-Pesa payout. Requests are processed manually; timing varies.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-pitch-surface border border-pitch-border shadow-xl">
          <span className="block text-xs uppercase font-bold text-sx-amber-text tracking-wider">
            Locked in Escrow
          </span>
          <span className="text-3xl font-extrabold text-sx-amber-text font-display mt-2 block font-mono">
            {formatCurrency(escrowBalance)}
          </span>
          <p className="text-[11px] text-sx-muted mt-2">
            Awaiting buyer inspection or order completion.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-pitch-surface border border-pitch-border shadow-xl">
          <span className="block text-xs uppercase font-bold text-sx-info-text tracking-wider">
            Completed Sales
          </span>
          <span className="text-3xl font-extrabold text-sx-ink font-display mt-2 block">
            {completedSales}
          </span>
          <p className="text-[11px] text-sx-muted mt-2">
            Count of completed marketplace orders on your seller profile.
          </p>
        </div>
      </div>

      {/* Clear Explanation: What does "Pending" mean? */}
      <div className="p-5 rounded-2xl bg-pitch-surface border border-sx-amber-border shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-sx-amber-text font-bold text-sm">
          <Clock className="w-4 h-4" />
          <span>Understanding Withdrawal Status &amp; Processing</span>
        </div>
        <p className="text-xs text-sx-ink-soft leading-relaxed">
          When you submit a withdrawal, it is marked <strong className="text-sx-amber-text">PENDING</strong> and placed in a manual review queue. Submitting a request does not itself send an M-Pesa transfer; the status changes after an administrator records the outcome.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-pitch-card border border-pitch-border space-y-1">
            <span className="font-bold text-sx-ink-soft block text-[11px]">1. Balance Reserved</span>
            <p className="text-[11px] text-sx-muted leading-normal">
              Your available balance is deducted instantly to prevent double-spending.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-pitch-card border border-pitch-border space-y-1">
            <span className="font-bold text-sx-amber-text block text-[11px]">2. Payout Queued (Pending)</span>
            <p className="text-[11px] text-sx-muted leading-normal">
              An administrator reviews the request and arranges any M-Pesa disbursement manually. Timing varies; follow the status shown in this list.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-pitch-card border border-pitch-border space-y-1">
            <span className="font-bold text-sx-green-text block text-[11px]">3. Status Completed</span>
            <p className="text-[11px] text-sx-muted leading-normal">
              An administrator marks a request paid after arranging the transfer manually. This platform does not independently verify M-Pesa completion; check your provider receipt or SMS. A rejection restores the reserved amount to your available balance.
            </p>
          </div>
        </div>
      </div>

      {/* Withdrawal History Table */}
      <div className="bg-pitch-surface border border-pitch-border rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-sx-ink font-display">
          M-Pesa Payout History
        </h2>

        {withdrawals && withdrawals.length > 0 ? (
          <div className="divide-y divide-pitch-border/60">
            {withdrawals.map((w: any) => {
              const isPending = w.status === "pending" || w.status === "processing";
              const isProcessing = w.status === "processing";
              const isCompleted = w.status === "completed";
              const isRejected = w.status === "rejected";

              return (
                <div key={w.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-sx-ink-soft">
                        To: {formatDisplayPhone(w.phone_number)}
                      </span>
                      {isPending && (
                        <Badge variant="warning" size="sm" className="font-bold">
                          {isProcessing ? "PROCESSING · MANUAL REVIEW" : "PENDING REVIEW"}
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge variant="success" size="sm" className="font-bold">
                          MARKED PAID · MANUAL CONFIRMATION
                        </Badge>
                      )}
                      {isRejected && (
                        <Badge variant="danger" size="sm" className="font-bold">
                          REJECTED
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-sx-muted">
                      <span>{new Date(w.created_at).toLocaleString()}</span>
                      <span>/</span>
                      {isPending && (
                        <span className="text-sx-amber-text/90 font-medium">
                          {isProcessing ? "Being reviewed or arranged manually; timing varies" : "Awaiting manual review; timing varies"}
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-sx-green-text/90 font-medium">
                          Admin marked it paid; this system does not verify provider transfer
                        </span>
                      )}
                      {isRejected && (
                        <span className="text-sx-red-text/90 font-medium">
                          {w.failure_reason ? `Reason: ${w.failure_reason}` : "Check available balance; contact support if it is not restored"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-base font-bold text-sx-green-text font-mono">
                      {formatCurrency(w.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Smartphone}
            title="No withdrawals yet"
            description="You have not requested any balance payouts yet. When buyers complete orders, your cleared earnings appear in your available balance."
          />
        )}
      </div>
    </div>
  );
}
