"use client";

import { Button } from "@/components/ui/Button";
import { WithdrawModal } from "@/components/seller/WithdrawModal";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface EarningsWithdrawSectionProps {
  availableBalance: number;
  escrowBalance: number;
}

export function EarningsWithdrawSection({
  availableBalance,
  escrowBalance,
}: EarningsWithdrawSectionProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-sx-canvas border border-sx-green-border">
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs uppercase font-bold text-sx-muted tracking-wider">
            Withdrawable Available Balance
          </span>
          {escrowBalance > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sx-amber-tint text-sx-amber-text border border-sx-amber-border">
              {formatCurrency(escrowBalance)} Locked in Escrow
            </span>
          )}
        </div>
        <div className="text-3xl font-extrabold text-sx-green-text font-display font-mono">
          {formatCurrency(availableBalance)}
        </div>
        <p className="text-xs text-sx-muted">
          Instant disbursement to your registered Safaricom M-Pesa mobile line.
        </p>
      </div>

      <div>
        <Button
          variant="gold"
          size="lg"
          onClick={() => setIsOpen(true)}
          className="w-full sm:w-auto font-bold"
          disabled={availableBalance < 10 && escrowBalance <= 0}
        >
          <ArrowUpRight className="w-5 h-5 mr-1.5" />
          Withdraw Funds to M-Pesa
        </Button>
      </div>

      <WithdrawModal
        availableBalance={availableBalance}
        escrowBalance={escrowBalance}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
