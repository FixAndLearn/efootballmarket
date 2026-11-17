import { mpesaClient } from "@/lib/mpesa/client";
import { AnyCallbackBody, VerifiedMpesaSettlement } from "@/lib/mpesa/types";
import {
  amountsMatch,
  isValidSettlementEvidence,
  isVerifiedSettlementClaim,
  normalizeMpesaReceiptNumber,
  normalizePositiveAmount,
} from "@/lib/mpesa/settlement";
import { dispatchAdminOrderAlert } from "@/lib/notifications/adminAlert";
import { sendBuyerPaymentConfirmedSms, sendSellerOrderReceivedSms } from "@/lib/notifications/smsAlert";
import { sendBuyerPaymentSecuredWhatsApp, sendSellerDeliverCredentialsWhatsApp } from "@/lib/whatsapp/notifications";
import { Payment } from "@/types/database";
import { SupabaseClient } from "@supabase/supabase-js";

export class PaymentService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Initiates STK push for an order.
   */
  async initiateOrderPayment(
    orderId: string,
    rawPhoneNumber: string,
    onStkPushRequestStart?: () => void
  ): Promise<{ checkoutRequestId: string; customerMessage: string }> {
    const { data: order, error: orderError } = await this.supabase
      .from("orders")
      .select("*, listing:listings(title)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found.");
    }

    if (order.status !== "payment_pending") {
      throw new Error(`Order is not in payment_pending status (current: ${order.status})`);
    }

    const normalizedPhone = mpesaClient.normalizePhoneNumber(rawPhoneNumber);

    // Call Daraja STK Push API
    const response = await mpesaClient.initiateStkPush({
      phoneNumber: normalizedPhone,
      amount: order.total_amount,
      orderNumber: order.order_number,
      description: `Payment for ${order.listing?.title || "eFootball Account"}`,
    }, onStkPushRequestStart);

    // Record pending payment entry
    const { error: insertError } = await this.supabase
      .from("payments")
      .insert({
        order_id: orderId,
        payment_method: "mpesa",
        phone_number: normalizedPhone,
        amount: order.total_amount,
        currency: order.currency || "KES",
        merchant_request_id: response.MerchantRequestID,
        checkout_request_id: response.CheckoutRequestID,
        status: "pending",
      });

    if (insertError) {
      console.error("Failed to log payment record:", insertError);
    }

    return {
      checkoutRequestId: response.CheckoutRequestID,
      customerMessage: response.CustomerMessage,
    };
  }

  /**
   * Securely marks a payment, order, escrow account, and listing as confirmed.
   */
  async markPaymentSuccessful(
    paymentId: string,
    settlement: VerifiedMpesaSettlement,
    rawCallback: unknown
  ): Promise<void> {
    const receiptNumber = normalizeMpesaReceiptNumber(settlement?.receiptNumber);
    const amount = normalizePositiveAmount(settlement?.amount);
    const transactionId = String(settlement?.transactionId || '').trim();
    const strictId = (value?: string | null) => {
      const raw = String(value || '').trim();
      const safe = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
      return raw && raw === safe ? safe : '';
    };
    const safeTransaction = strictId(transactionId);
    const safeCheckout = strictId(settlement?.checkoutRequestId);
    const safeMerchant = strictId(settlement?.merchantRequestId);

    if (
      !receiptNumber ||
      amount === null ||
      !safeTransaction ||
      (!safeCheckout && !safeMerchant) ||
      !isValidSettlementEvidence(
        settlement?.provider,
        settlement?.verificationMethod
      ) ||
      settlement?.providerStatus !== 'completed' ||
      !Number.isFinite(Date.parse(settlement?.verifiedAt || ''))
    ) {
      throw new Error('Provider-confirmed settlement proof is incomplete.');
    }

    const { data: payment, error: paymentError } = await this.supabase
      .from('payments')
      .select('*, order:orders(*, listing:listings(title))')
      .eq('id', paymentId)
      .maybeSingle();

    if (paymentError || !payment) {
      throw new Error('Matching payment record was not found.');
    }

    const order = Array.isArray(payment.order) ? payment.order[0] : payment.order;
    const paymentAmount = normalizePositiveAmount(payment.amount);
    const orderAmount = normalizePositiveAmount(order?.total_amount);
    const storedCheckout = String(payment.checkout_request_id || '');
    const storedMerchant = String(payment.merchant_request_id || '');
    const storedIds = [storedCheckout, storedMerchant].filter(Boolean);

    if (
      paymentAmount === null ||
      orderAmount === null ||
      !amountsMatch(amount, paymentAmount) ||
      !amountsMatch(amount, orderAmount) ||
      !storedIds.includes(safeTransaction) ||
      (safeCheckout && storedCheckout !== safeCheckout) ||
      (safeMerchant && storedMerchant !== safeMerchant)
    ) {
      throw new Error('Provider settlement does not match the stored order ledger.');
    }

    // The database function atomically claims the global M-Pesa receipt and
    // updates payment, order, escrow, listing, and seller balance. There is no
    // non-atomic application fallback if that function is unavailable.
    const { data: settlementResult, error: settlementError } = await this.supabase.rpc(
      'settle_mpesa_marketplace_payment',
      {
        p_payment_id: paymentId,
        p_receipt_number: receiptNumber,
        p_amount: amount,
        p_provider: settlement.provider,
        p_verification_method: settlement.verificationMethod,
        p_transaction_id: safeTransaction,
        p_verified_at: settlement.verifiedAt,
        p_raw_callback: rawCallback ?? {},
      }
    );

    if (settlementError || settlementResult?.success !== true) {
      throw new Error('Could not atomically apply the provider-confirmed settlement.');
    }
    if (settlementResult.already_settled === true) return;

    const now = new Date().toISOString();
    if (payment.order_id) {
      dispatchAdminOrderAlert({
        orderId: payment.order_id,
        orderNumber: payment.order?.order_number || `ORD-${paymentId.slice(0, 8)}`,
        listingTitle: payment.order?.listing?.title || 'eFootball squad listing',
        amount,
        currency: payment.currency || 'KES',
        buyerPhone: payment.phone_number || '',
        receiptNumber,
        eventType: 'PAYMENT_RECEIVED',
      }).catch(() => console.error('Admin order alert failed.'));

      if (payment.phone_number) {
        sendBuyerPaymentConfirmedSms(
          payment.phone_number,
          payment.order?.order_number || `ORD-${paymentId.slice(0, 8)}`,
          amount,
          payment.order_id
        ).catch(() => console.warn('Buyer payment SMS failed.'));

        sendBuyerPaymentSecuredWhatsApp(
          payment.phone_number,
          payment.order?.order_number || `ORD-${paymentId.slice(0, 8)}`,
          amount,
          payment.order?.listing?.title || 'eFootball squad listing',
          payment.order_id
        ).catch(() => console.warn('Buyer payment WhatsApp notification failed.'));
      }

      if (payment.order?.seller_id) {
        try {
          const { data: sellerProfile } = await this.supabase
            .from('profiles')
            .select('phone_number')
            .eq('id', payment.order.seller_id)
            .maybeSingle();

          if (sellerProfile?.phone_number) {
            sendSellerOrderReceivedSms(
              sellerProfile.phone_number,
              payment.order?.order_number || `ORD-${paymentId.slice(0, 8)}`,
              amount,
              payment.order?.listing?.title || 'eFootball squad listing',
              payment.order_id
            ).catch(() => console.warn('Seller order SMS failed.'));

            sendSellerDeliverCredentialsWhatsApp(
              sellerProfile.phone_number,
              payment.order?.order_number || `ORD-${paymentId.slice(0, 8)}`,
              amount,
              payment.order?.listing?.title || 'eFootball squad listing',
              payment.order_id
            ).catch(() => console.warn('Seller order WhatsApp notification failed.'));
          }
        } catch {
          console.warn('Seller order notification lookup failed.');
        }
      }
    }
  }

  /**
   * Checks the real-time status of a payment by its CheckoutRequestID, MerchantRequestID, or OrderID.
   */
  async getPaymentStatus(identifier?: string, orderId?: string): Promise<Payment | null> {
    let query = this.supabase.from('payments').select('*, order:orders(*)');

    if (orderId) {
      query = query.eq('order_id', orderId);
    } else if (identifier) {
      const safeIdent = identifier.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
      if (!safeIdent) return null;
      query = query.or(
        `checkout_request_id.eq.${safeIdent},merchant_request_id.eq.${safeIdent}`
      );
    } else {
      return null;
    }

    const { data: payments, error } = await query
      .order('created_at', { ascending: false })
      .limit(1);
    if (error || !payments?.length) return null;

    const payment = payments[0] as Payment;
    if (payment.status === 'completed') {
      const order = Array.isArray(payment.order) ? payment.order[0] : payment.order;
      const receipt = normalizeMpesaReceiptNumber(payment.mpesa_receipt_number);
      if (!receipt) return null;
      const { data: claim, error: claimError } = await this.supabase
        .from('mpesa_settlement_receipts')
        .select('source, entity_id, provider, verification_method, transaction_id, amount')
        .eq('receipt_number', receipt)
        .maybeSingle();
      if (
        claimError ||
        !isVerifiedSettlementClaim(claim, {
          source: 'marketplace',
          entityId: payment.id,
          transactionIds: [payment.checkout_request_id, payment.merchant_request_id],
          amount: payment.amount,
        }) ||
        !order ||
        order.status === 'payment_pending' ||
        !amountsMatch(payment.amount, order.total_amount) ||
        !amountsMatch(claim?.amount, order.total_amount)
      ) {
        return null;
      }
      return payment;
    }

    if (
      ['pending', 'failed'].includes(payment.status) &&
      mpesaClient.isUnifiedPay()
    ) {
      const idsToTry = Array.from(
        new Set([payment.checkout_request_id, payment.merchant_request_id].filter(Boolean))
      ) as string[];
      const order = Array.isArray(payment.order) ? payment.order[0] : payment.order;

      for (const transactionId of idsToTry) {
        const liveStatus = await mpesaClient.checkUnifiedPayStatus(transactionId);
        const receipt = normalizeMpesaReceiptNumber(liveStatus?.receiptNumber);
        const settledAmount = normalizePositiveAmount(liveStatus?.amount);
        if (
          liveStatus?.isSuccess &&
          receipt &&
          settledAmount !== null &&
          amountsMatch(settledAmount, payment.amount) &&
          order &&
          amountsMatch(settledAmount, order.total_amount)
        ) {
          const settlement: VerifiedMpesaSettlement = {
            provider: 'unifiedpay',
            verificationMethod: 'provider_status_query',
            providerStatus: 'completed',
            transactionId,
            checkoutRequestId: payment.checkout_request_id || undefined,
            merchantRequestId: payment.merchant_request_id || undefined,
            receiptNumber: receipt,
            amount: settledAmount,
            verifiedAt: new Date().toISOString(),
          };
          await this.markPaymentSuccessful(payment.id, settlement, liveStatus);

          const { data: updated } = await this.supabase
            .from('payments')
            .select('*, order:orders(*)')
            .eq('id', payment.id)
            .maybeSingle();
          return (updated as Payment) || payment;
        }

        if (
          liveStatus &&
          !liveStatus.isSuccess &&
          (liveStatus.resultCode === 1037 ||
            liveStatus.resultDesc?.toLowerCase().includes('cancelled') ||
            liveStatus.resultDesc?.toLowerCase().includes('failed'))
        ) {
          await this.supabase
            .from('payments')
            .update({
              status: 'failed',
              result_code: liveStatus.resultCode,
              result_desc: String(liveStatus.resultDesc || 'Provider confirmed payment failure').slice(0, 300),
            })
            .eq('id', payment.id)
            .eq('status', 'pending');
          payment.status = 'failed';
          payment.result_desc = liveStatus.resultDesc;
        }
      }
    }

    return payment;
  }

  /**
   * Applies a callback only when the caller has already obtained provider
   * settlement proof. Raw webhook bodies are never sufficient by themselves.
   */
  async processCallback(
    body: AnyCallbackBody | any,
    settlement: VerifiedMpesaSettlement
  ): Promise<void> {
    const parsed = mpesaClient.parseCallback(body);
    if (
      !parsed.isSuccess ||
      mpesaClient.getCallbackProvider(body) !== settlement?.provider
    ) {
      throw new Error("Callback provider or status does not match settlement proof.");
    }

    const receiptNumber = normalizeMpesaReceiptNumber(settlement?.receiptNumber);
    const amount = normalizePositiveAmount(settlement?.amount);
    const transactionId = String(settlement?.transactionId || "").trim();
    const checkoutRequestId = String(settlement?.checkoutRequestId || "").trim();
    const merchantRequestId = String(settlement?.merchantRequestId || "").trim();
    if (
      !receiptNumber ||
      amount === null ||
      !transactionId ||
      (!checkoutRequestId && !merchantRequestId) ||
      !isValidSettlementEvidence(
        settlement?.provider,
        settlement?.verificationMethod
      ) ||
      settlement?.providerStatus !== "completed" ||
      !Number.isFinite(Date.parse(settlement?.verifiedAt || ""))
    ) {
      throw new Error("Provider settlement proof is incomplete.");
    }

    const strictId = (value: string) => {
      const safe = value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
      return value === safe ? safe : "";
    };
    const callbackCheckout = strictId(String(parsed.checkoutRequestId || "").trim());
    const callbackMerchant = strictId(String(parsed.merchantRequestId || "").trim());
    const safeCheckout = strictId(checkoutRequestId);
    const safeMerchant = strictId(merchantRequestId);
    const safeTransaction = strictId(transactionId);
    if (
      !safeTransaction ||
      (callbackCheckout && callbackCheckout !== safeCheckout) ||
      (callbackMerchant && callbackMerchant !== safeMerchant) ||
      ![safeCheckout, safeMerchant].filter(Boolean).includes(safeTransaction)
    ) {
      throw new Error("Callback transaction IDs do not match provider settlement proof.");
    }

    const callbackReceipt = parsed.receiptNumber
      ? normalizeMpesaReceiptNumber(parsed.receiptNumber)
      : null;
    if (
      settlement.provider === "safaricom" &&
      (!callbackReceipt || parsed.amount === undefined)
    ) {
      throw new Error("Safaricom callback is missing its receipt or amount metadata.");
    }
    if (parsed.receiptNumber && callbackReceipt !== receiptNumber) {
      throw new Error("Callback receipt does not match provider settlement proof.");
    }
    if (parsed.amount !== undefined && !amountsMatch(parsed.amount, amount)) {
      throw new Error("Callback amount does not match provider settlement proof.");
    }

    let byCheckout: any = null;
    let byMerchant: any = null;
    if (safeCheckout) {
      const { data, error } = await this.supabase
        .from("payments")
        .select("id, amount, status, checkout_request_id, merchant_request_id")
        .eq("checkout_request_id", safeCheckout)
        .maybeSingle();
      if (error) throw new Error("Could not resolve payment by checkout ID.");
      byCheckout = data;
    }
    if (safeMerchant) {
      const { data, error } = await this.supabase
        .from("payments")
        .select("id, amount, status, checkout_request_id, merchant_request_id")
        .eq("merchant_request_id", safeMerchant)
        .maybeSingle();
      if (error) throw new Error("Could not resolve payment by merchant ID.");
      byMerchant = data;
    }
    if (byCheckout && byMerchant && byCheckout.id !== byMerchant.id) {
      throw new Error("Callback IDs resolve to different payment records.");
    }

    const payment = byCheckout || byMerchant;
    if (!payment) throw new Error("No payment record matches the verified transaction.");

    const storedIds = [payment.checkout_request_id, payment.merchant_request_id]
      .filter(Boolean)
      .map((id: string) => String(id));
    if (
      !storedIds.includes(safeTransaction) ||
      (safeCheckout && String(payment.checkout_request_id || "") !== safeCheckout) ||
      (safeMerchant && String(payment.merchant_request_id || "") !== safeMerchant) ||
      !amountsMatch(amount, payment.amount)
    ) {
      throw new Error("Provider settlement does not match the payment ledger.");
    }

    await this.markPaymentSuccessful(payment.id, settlement, {
      provider_callback: body,
      provider_settlement: {
        provider: settlement.provider,
        verification_method: settlement.verificationMethod,
        provider_status: settlement.providerStatus,
        transaction_id: safeTransaction,
        receipt_number: receiptNumber,
        amount,
        verified_at: settlement.verifiedAt,
      },
    });
  }

  /** Apply an authenticated provider failure only while the payment is pending. */
  async processFailureCallback(
    checkoutRequestId: string,
    merchantRequestId: string,
    resultCode: number,
    resultDesc: string,
    body: AnyCallbackBody | any
  ): Promise<void> {
    if (Number(resultCode) === 0) {
      throw new Error("A successful callback cannot be applied as a failure.");
    }

    const strictId = (value: string) => {
      const trimmed = String(value || "").trim();
      const safe = trimmed.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
      return trimmed === safe ? safe : "";
    };
    const checkout = strictId(checkoutRequestId);
    const merchant = strictId(merchantRequestId);
    if (!checkout && !merchant) throw new Error("Missing callback transaction ID.");

    let byCheckout: any = null;
    let byMerchant: any = null;
    if (checkout) {
      const { data, error } = await this.supabase
        .from("payments")
        .select("id, status, checkout_request_id, merchant_request_id")
        .eq("checkout_request_id", checkout)
        .maybeSingle();
      if (error) throw new Error("Could not resolve payment by checkout ID.");
      byCheckout = data;
    }
    if (merchant) {
      const { data, error } = await this.supabase
        .from("payments")
        .select("id, status, checkout_request_id, merchant_request_id")
        .eq("merchant_request_id", merchant)
        .maybeSingle();
      if (error) throw new Error("Could not resolve payment by merchant ID.");
      byMerchant = data;
    }
    if (byCheckout && byMerchant && byCheckout.id !== byMerchant.id) {
      throw new Error("Callback IDs resolve to different payment records.");
    }

    const payment = byCheckout || byMerchant;
    if (!payment) throw new Error("No payment record matches the callback.");
    if (
      (checkout && String(payment.checkout_request_id || "") !== checkout) ||
      (merchant && String(payment.merchant_request_id || "") !== merchant)
    ) {
      throw new Error("Callback IDs do not match the payment record.");
    }
    if (payment.status !== "pending") return;

    const { error } = await this.supabase
      .from("payments")
      .update({
        status: "failed",
        result_code: resultCode,
        result_desc: String(resultDesc || "Payment failed").slice(0, 300),
        raw_callback: body as unknown as Record<string, unknown>,
      })
      .eq("id", payment.id)
      .eq("status", "pending");
    if (error) throw new Error("Could not update failed payment status.");
  }
}
