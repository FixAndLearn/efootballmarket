"use client";

import React, { useRef } from "react";
import { Order } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { formatCurrency, getPlatformLabel } from "@/lib/utils";
import { CheckCircle2, Copy, Download, Printer, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

export interface EscrowReceiptModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export function EscrowReceiptModal({ order, isOpen, onClose }: EscrowReceiptModalProps) {
  const [copied, setCopied] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const certificateId = `ESC-${order.order_number}-${order.id.slice(0, 8).toUpperCase()}`;
  const transactionDate = new Date(order.created_at).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(certificateId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-sx-subtle border border-sx-border-strong rounded-3xl shadow-2xl p-6 sm:p-8 my-8 text-sx-ink">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-sx-border mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sx-green-tint text-sx-green-text">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-sx-ink">Official Escrow Receipt</h3>
              <p className="text-xs text-sx-muted">Safaricom Till 1572931 Verified Record</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-sx-stone hover:bg-slate-700 text-sx-muted hover:text-sx-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Voucher Paper */}
        <div
          ref={receiptRef}
          id="official-escrow-receipt"
          className="bg-sx-canvas p-6 sm:p-8 rounded-2xl border border-sx-border space-y-6 text-sx-ink-soft print:bg-white print:text-black print:border-none print:p-0"
        >
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-sx-border print:border-gray-300 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-black tracking-tight text-sx-ink print:text-black font-display">
                  eFootballMarket Kenya
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sx-green-tint border border-emerald-500/60 text-sx-green-text print:bg-gray-100 print:text-black">
                  OFFICIAL ESCROW
                </span>
              </div>
              <p className="text-xs text-sx-muted print:text-sx-muted">
                Non-Custodial Gaming Escrow & Digital Handover Intermediary
              </p>
              <p className="text-xs text-sx-muted print:text-sx-muted font-medium">
                Safaricom Buy Goods Till: <strong className="text-sx-green-text print:text-black">1572931</strong>
              </p>
            </div>

            <div className="text-left sm:text-right text-xs">
              <span className="block text-sx-muted print:text-sx-muted uppercase text-[10px] font-bold">
                Certificate ID
              </span>
              <span className="font-mono font-bold text-sx-amber-text print:text-black text-sm block">
                {certificateId}
              </span>
              <span className="text-sx-muted print:text-sx-muted text-[11px] block mt-0.5">
                Date: {transactionDate}
              </span>
            </div>
          </div>

          {/* Certificate Stamp Box */}
          <div className="p-3.5 rounded-xl bg-sx-green-tint border border-sx-green-border print:bg-gray-50 print:border-gray-300 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sx-green-text print:text-emerald-600 shrink-0" />
              <span className="text-sx-green-text print:text-black font-semibold">
                Status: {order.status === "completed" ? "Escrow Settlement Finalized" : "Bilateral Escrow Locked"}
              </span>
            </div>
            <span className="font-mono text-[11px] text-sx-muted print:text-sx-muted">
              Till 1572931 Confirmed
            </span>
          </div>

          {/* Asset & Order Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-sx-muted print:text-sx-muted block text-[10px] uppercase font-bold">
                Account Item / Squad
              </span>
              <span className="font-bold text-sx-ink print:text-black text-sm block mt-0.5">
                {order.listing?.title || "eFootball Account"}
              </span>
              <span className="text-sx-muted print:text-sx-muted text-[11px]">
                Platform: {order.listing?.platform ? getPlatformLabel(order.listing.platform) : "Mobile/Console"} / OVR {order.listing?.overall_team_strength || "Elite"}
              </span>
            </div>

            <div>
              <span className="text-sx-muted print:text-sx-muted block text-[10px] uppercase font-bold">
                Order Reference
              </span>
              <span className="font-mono font-bold text-sx-ink-soft print:text-black text-sm block mt-0.5">
                Order #{order.order_number}
              </span>
              <span className="text-sx-muted print:text-sx-muted text-[11px]">
                Internal ID: {order.id.slice(0, 13)}
              </span>
            </div>
          </div>

          {/* Counterparties Summary */}
          <div className="p-4 rounded-xl bg-sx-subtle print:bg-gray-50 border border-sx-border print:border-gray-200 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-sx-muted print:text-sx-muted block">
                Purchaser (Buyer)
              </span>
              <span className="font-semibold text-sx-ink-soft print:text-black block mt-0.5">
                {order.buyer?.username || "Verified Buyer"}
              </span>
              <span className="text-[11px] text-sx-muted print:text-sx-muted">
                M-Pesa Verified Account
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-sx-muted print:text-sx-muted block">
                Vendor (Seller)
              </span>
              <span className="font-semibold text-sx-ink-soft print:text-black block mt-0.5">
                {order.seller?.username || "Platform Seller"}
              </span>
              <span className="text-[11px] text-sx-green-text print:text-emerald-700">
                Net Payout Verified
              </span>
            </div>
          </div>

          {/* Financial Ledger Breakdown */}
          <div className="border-t border-sx-border print:border-gray-300 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-sx-ink-soft print:text-gray-700">
              <span>Account Agreed Price</span>
              <span className="font-mono">{formatCurrency(order.total_amount, order.currency)}</span>
            </div>
            <div className="flex justify-between text-sx-muted print:text-sx-muted">
              <span>eFootballMarket Service Fee (Seller Payout Protection)</span>
              <span className="font-mono text-sx-green-text print:text-black">
                {order.platform_fee ? formatCurrency(order.platform_fee, order.currency) : "Included (KES 50 - 500)"}
              </span>
            </div>
            <div className="flex justify-between text-sx-muted print:text-sx-muted">
              <span>Konami ID AES-256-GCM Vault Handover</span>
              <span className="font-mono text-sx-green-text print:text-black">Included (Free)</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-sx-ink print:text-black pt-2 border-t border-sx-border print:border-gray-300">
              <span>Total Settled via Till 1572931</span>
              <span className="font-mono text-sx-green-text print:text-black">
                {formatCurrency(order.total_amount, order.currency)}
              </span>
            </div>
          </div>

          {/* Legal Warranty & Guarantees */}
          <div className="pt-3 border-t border-sx-border print:border-gray-200 text-[10px] text-sx-muted print:text-sx-muted leading-relaxed space-y-1">
            <p>
              <strong>Bilateral Guarantee:</strong> This transaction receipt confirms that digital game assets were exchanged in adherence with eFootballMarket Kenya non-custodial software escrow terms. Funds were sequestered under Safaricom Till 1572931 custody until buyer inspection was certified.
            </p>
          </div>

          {/* Official Sign-off & Director Seal */}
          <div className="pt-4 border-t border-sx-border print:border-gray-300 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 text-xs">
            <div>
              <span className="block text-[10px] uppercase font-bold text-sx-muted print:text-sx-muted">
                Issued By
              </span>
              <span className="font-bold text-sx-ink print:text-black block text-sm mt-0.5">
                eFootballMarket Support
              </span>
              <span className="text-[11px] text-sx-muted print:text-sx-muted">
                Nairobi, Kenya &middot; 0794 400 365
              </span>
            </div>

            <div className="text-left sm:text-right text-[10px] text-sx-muted print:text-sx-muted font-mono">
              <span>Verified Cryptographic Hash:</span>
              <span className="block">{certificateId}</span>
            </div>
          </div>
        </div>

        {/* Action Controls (Hidden in Print) */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Button variant="outline" size="sm" onClick={handleCopyHash}>
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            {copied ? "Copied Certificate ID!" : "Copy Certificate ID"}
          </Button>

          <div className="flex items-center gap-3">
            <Button variant="primary" size="md" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1.5" />
              Print / Save PDF Receipt
            </Button>
            <Button variant="secondary" size="md" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
