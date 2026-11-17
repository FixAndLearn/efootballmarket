import crypto from "crypto";
import {
  AnyCallbackBody,
  B2CPayoutParams,
  B2CPayoutResponse,
  MpesaProvider,
  ParsedMpesaCallback,
  StkCallbackBody,
  StkPushParams,
  StkPushResponse,
} from "./types";
import {
  normalizeMpesaReceiptNumber,
  normalizePositiveAmount,
} from "./settlement";

class MpesaService {
  private consumerKey: string;
  private consumerSecret: string;
  private shortCode: string;
  private passkey: string;
  private callbackUrl: string;
  private baseUrl: string;
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  // UnifiedPay integration
  private unifiedPayKey: string;
  private unifiedPaySecret: string;
  private unifiedPayTill: string;

  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || "";
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || "";
    this.shortCode = process.env.MPESA_SHORTCODE || "174379";
    this.passkey = process.env.MPESA_PASSKEY || "";
    this.callbackUrl = process.env.MPESA_CALLBACK_URL || "";
    const env = process.env.MPESA_ENV || "sandbox";
    this.baseUrl =
      env === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

    // UnifiedPay credentials (can be configured explicitly or mapped from MPESA credentials)
    this.unifiedPayKey =
      process.env.UNIFIEDPAY_CONSUMER_KEY ||
      (this.consumerKey.startsWith("ck_") ? this.consumerKey : "");
    this.unifiedPaySecret =
      process.env.UNIFIEDPAY_CONSUMER_SECRET ||
      (this.consumerSecret.startsWith("cs_") ? this.consumerSecret : "");
    this.unifiedPayTill =
      process.env.UNIFIEDPAY_TILL_NUMBER ||
      process.env.MPESA_SHORTCODE ||
      "1572931";
  }

  public isUnifiedPay(): boolean {
    return Boolean(this.unifiedPayKey && this.unifiedPaySecret);
  }

  public getCallbackProvider(body: any): MpesaProvider | null {
    if (body?.Body?.stkCallback) return "safaricom";
    if (
      body &&
      typeof body === "object" &&
      (body.event ||
        body.TransactionStatus ||
        body.TransactionCode !== undefined ||
        body.transaction_request_id)
    ) {
      return "unifiedpay";
    }
    return null;
  }

  private hasDarajaCredentials(): boolean {
    return Boolean(
      this.consumerKey &&
        this.consumerKey !== "dummy_consumer_key" &&
        this.consumerSecret &&
        this.passkey &&
        this.shortCode
    );
  }

  /**
   * Daraja rejects a CallBackURL whose query string contains characters it
   * cannot parse, and it fails at initiation time with a generic error that
   * looks identical to a customer declining the prompt. A secret containing
   * '+', '=', '/', '&' or spaces therefore silently broke every checkout.
   *
   * We never mutate the configured URL's meaning: the `secret` parameter is
   * re-encoded from its decoded value, and any other parameters are preserved.
   */
  private preparedCallbackUrl(): string {
    try {
      const parsed = new URL(this.callbackUrl);
      const params = new URLSearchParams(parsed.search);

      const secret = params.get("secret");
      if (secret !== null) {
        params.set("secret", secret);
      }
      const token = params.get("token");
      if (token !== null) {
        params.set("token", token);
      }

      // URLSearchParams serialises with '+' for spaces, which Daraja also
      // mishandles; %20 is the safe form.
      parsed.search = params.toString().replace(/\+/g, "%20");
      return parsed.toString();
    } catch {
      return this.callbackUrl;
    }
  }

  /**
   * PayBill and Buy Goods are different Daraja transaction types. A till
   * shortcode charged as `CustomerPayBillOnline` is refused by Safaricom.
   */
  private transactionType(): "CustomerBuyGoodsOnline" | "CustomerPayBillOnline" {
    const configured = (process.env.MPESA_TRANSACTION_TYPE || "").trim();
    if (configured === "CustomerBuyGoodsOnline" || configured === "CustomerPayBillOnline") {
      return configured as "CustomerBuyGoodsOnline" | "CustomerPayBillOnline";
    }
    // MPESA_PAYMENT_MODE lets the operator declare a till vs a paybill without
    // needing a new deploy.
    const mode = (process.env.MPESA_PAYMENT_MODE || "").trim().toLowerCase();
    if (mode === "buygoods" || mode === "till") return "CustomerBuyGoodsOnline";
    if (mode === "paybill") return "CustomerPayBillOnline";
    // Safest default for this business: the platform collects on Buy Goods
    // Till 1572931, which is a till, not a paybill.
    return "CustomerBuyGoodsOnline";
  }

  /** Daraja does not sign STK callbacks; a per-callback URL token authenticates its metadata. */
  public hasProtectedDarajaCallbackUrl(): boolean {
    const secret = process.env.MPESA_WEBHOOK_SECRET?.trim();
    if (!secret || !this.callbackUrl) return false;

    try {
      const callbackUrl = new URL(this.callbackUrl);
      const callbackSecret =
        callbackUrl.searchParams.get("secret") || callbackUrl.searchParams.get("token");
      return Boolean(callbackSecret && callbackSecret === secret);
    } catch {
      return false;
    }
  }

  /**
   * Normalizes Kenyan phone numbers to the 254XXXXXXXXX format required by Safaricom.
   */
  public normalizePhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("07") || cleaned.startsWith("01")) {
      return `254${cleaned.slice(1)}`;
    }
    if (cleaned.startsWith("254")) {
      return cleaned;
    }
    if (cleaned.startsWith("+254")) {
      return cleaned.slice(1);
    }
    if (cleaned.length === 9) {
      return `254${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Obtains an OAuth Access Token from Safaricom with caching.
   */
  public async getAccessToken(): Promise<string> {
    if (!this.consumerKey || !this.consumerSecret) {
      throw new Error("M-Pesa API credentials are not configured.");
    }

    const now = Date.now();
    if (this.cachedToken && this.tokenExpiresAt > now + 60000) {
      return this.cachedToken;
    }

    const auth = Buffer.from(
      `${this.consumerKey}:${this.consumerSecret}`
    ).toString("base64");

    const response = await fetch(
      `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch M-Pesa access token (HTTP ${response.status}).`);
    }

    const data = await response.json();
    this.cachedToken = data.access_token;
    // expires_in is in seconds
    this.tokenExpiresAt = now + parseInt(data.expires_in, 10) * 1000;
    return this.cachedToken!;
  }

  /**
   * Generates formatted timestamp (YYYYMMDDHHmmss) and base64 security password.
   */
  private generatePasswordAndTimestamp(): { password: string; timestamp: string } {
    const date = new Date();
    const YYYY = date.getFullYear().toString();
    const MM = String(date.getMonth() + 1).padStart(2, "0");
    const DD = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    const timestamp = `${YYYY}${MM}${DD}${hh}${mm}${ss}`;

    const raw = `${this.shortCode}${this.passkey}${timestamp}`;
    const password = Buffer.from(raw).toString("base64");
    return { password, timestamp };
  }

  /**
   * Initiates STK Push (via UnifiedPay or Safaricom Daraja) to customer's handset.
   */
  public async initiateStkPush(
    params: StkPushParams,
    onRequestStart?: () => void
  ): Promise<StkPushResponse> {
    const phone = this.normalizePhoneNumber(params.phoneNumber);

    // 1. If configured with UnifiedPay (Till 1572931)
    if (this.isUnifiedPay()) {
      const url = `https://unifiedpay.co.ke/auth/cred/${encodeURIComponent(
        this.unifiedPayKey
      )}/${encodeURIComponent(this.unifiedPaySecret)}/sendstk`;

      onRequestStart?.();
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(params.amount),
          msisdn: phone,
          reference: params.orderNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok || (data.ResponseCode && data.ResponseCode !== "0")) {
        throw new Error(`UnifiedPay STK Push failed (HTTP ${response.status}).`);
      }

      const unifiedTransId = data.transaction_request_id || "";
      const safaricomCheckoutId = data.CheckoutRequestID || "";
      const safaricomMerchantId = data.MerchantRequestID || "";

      return {
        MerchantRequestID: unifiedTransId || safaricomMerchantId,
        CheckoutRequestID: unifiedTransId || safaricomCheckoutId,
        ResponseCode: data.ResponseCode || "0",
        ResponseDescription: data.message || "STK push initiated",
        CustomerMessage:
          data.message ||
          "Please check your phone and enter your M-Pesa PIN to complete payment.",
      };
    }

    // 2. Fallback to Safaricom Daraja API. Do not initiate a payment unless
    // callbacks can be authenticated and provider status can be queried.
    if (!this.hasDarajaCredentials()) {
      throw new Error("Safaricom Daraja payment credentials are not configured.");
    }
    if (!this.hasProtectedDarajaCallbackUrl()) {
      throw new Error(
        "Safaricom callback verification is not configured. Set MPESA_WEBHOOK_SECRET and include the same value as the callback URL's secret query parameter."
      );
    }

    const token = await this.getAccessToken();
    const { password, timestamp } = this.generatePasswordAndTimestamp();

    const payload = {
      BusinessShortCode: this.shortCode,
      Password: password,
      Timestamp: timestamp,
      // A Buy Goods (till) shortcode must be charged as CustomerBuyGoodsOnline.
      // PayBill against a till shortcode is rejected by Daraja, which is a
      // separate failure mode from the customer simply declining the prompt.
      TransactionType: this.transactionType(),
      Amount: Math.round(params.amount),
      PartyA: phone,
      PartyB: this.shortCode,
      PhoneNumber: phone,
      CallBackURL: this.preparedCallbackUrl(),
      AccountReference: params.orderNumber,
      TransactionDesc: params.description || `Order ${params.orderNumber}`,
    };

    onRequestStart?.();
    const response = await fetch(
      `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      // Surface WHICH Daraja field was rejected. Without this, every failure
      // looked like "HTTP 400" and a misconfigured shortcode was
      // indistinguishable from a customer declining the prompt.
      let providerError = "";
      try {
        const bodyText = await response.text();
        providerError = this.sanitizeProviderError(bodyText);
      } catch {
        // body already consumed or unreadable; fall through with status only
      }
      throw new Error(
        `M-Pesa STK Push failed (HTTP ${response.status})${providerError ? `: ${providerError}` : ""}.`
      );
    }

    return await response.json();
  }

  /**
   * Daraja error bodies can echo request fields. Strip anything that could
   * contain credentials (Password, SecurityCredential, tokens) before the
   * message reaches a log or a client response.
   */
  public sanitizeProviderError(raw: string): string {
    return String(raw || "")
      .replace(/"?(Password|SecurityCredential|Authorization|access_token|Bearer)"?\s*[:=]\s*"?[^",}\s]+/gi, "$1:[redacted]")
      .replace(/[A-Za-z0-9+/=]{40,}/g, "[redacted]")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);
  }

  /**
   * Queries UnifiedPay for real-time transaction status. A successful result is
   * returned only when the provider echoes this transaction ID and supplies a
   * real receipt and positive amount; an HTTP/API acknowledgement is not proof.
   */
  public async checkUnifiedPayStatus(
    transactionId: string
  ): Promise<ParsedMpesaCallback | null> {
    if (!this.isUnifiedPay() || !transactionId) return null;

    try {
      const url = `https://unifiedpay.co.ke/auth/cred/${encodeURIComponent(
        this.unifiedPayKey
      )}/${encodeURIComponent(this.unifiedPaySecret)}/sendstatus`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_request_id: transactionId,
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (!data || typeof data !== "object") return null;

      const reportedTransactionId = String(data.transaction_request_id || "").trim();
      const reportedCheckoutId = String(data.CheckoutRequestID || "").trim();
      const reportedMerchantId = String(data.MerchantRequestID || "").trim();
      const returnedIds = [
        reportedTransactionId,
        reportedCheckoutId,
        reportedMerchantId,
      ].filter(Boolean);

      // Never accept a status response that cannot be tied to the requested transaction.
      if (!returnedIds.includes(transactionId)) return null;

      const statusStr = String(data.TransactionStatus || data.status || "")
        .trim()
        .toLowerCase();
      const transactionCode = String(data.TransactionCode ?? "").trim();
      const resultCodeValue = data.ResultCode ?? data.resultCode;
      const hasResultCode =
        resultCodeValue !== undefined &&
        resultCodeValue !== null &&
        String(resultCodeValue).trim() !== "";
      const resultCode = hasResultCode ? String(resultCodeValue).trim() : "";
      const receipt = normalizeMpesaReceiptNumber(
        data.TransactionReceipt ||
          data.mpesa_receipt_number ||
          data.receiptNumber ||
          data.ReceiptNumber
      );
      const amount = normalizePositiveAmount(
        data.TransactionAmount ?? data.amount ?? data.Amount
      );
      const statusIndicatesSuccess =
        statusStr === "completed" ||
        statusStr === "success" ||
        statusStr === "successful" ||
        statusStr === "paid";
      const statusIndicatesFailure =
        statusStr === "failed" ||
        statusStr === "cancelled" ||
        statusStr === "rejected" ||
        statusStr.includes("cancel") ||
        statusStr.includes("fail");
      const hasSuccessEvidence =
        statusIndicatesSuccess || (!statusStr && transactionCode === "0");
      const isSuccess = Boolean(
        hasSuccessEvidence &&
          !statusIndicatesFailure &&
          (!transactionCode || transactionCode === "0") &&
          (!hasResultCode || resultCode === "0") &&
          receipt &&
          amount !== null
      );

      const isFailed =
        !isSuccess &&
        !statusStr.includes("pending") &&
        (statusStr === "failed" ||
          statusStr === "cancelled" ||
          statusStr === "rejected" ||
          statusStr.includes("cancel") ||
          statusStr.includes("fail") ||
          transactionCode === "1032" ||
          transactionCode === "1037" ||
          String(data.ResultCode ?? "") === "1032" ||
          String(data.ResultCode ?? "") === "1037");

      const isPending = !isSuccess && !isFailed;
      return {
        merchantRequestId: reportedMerchantId,
        checkoutRequestId: reportedCheckoutId || reportedTransactionId,
        resultCode: isSuccess ? 0 : isFailed ? 1037 : 100,
        resultDesc:
          String(data.ResultDesc || data.message || "") ||
          (isSuccess
            ? "Transaction completed successfully"
            : isPending
            ? "Transaction pending"
            : String(data.TransactionStatus || "Transaction failed")),
        receiptNumber: receipt || undefined,
        amount: amount === null ? undefined : amount,
        phoneNumber: data.Msisdn || data.phoneNumber,
        transactionDate: data.TransactionDate,
        isSuccess,
      };
    } catch {
      // Do not log request URLs or provider credentials on status-query failures.
      return null;
    }
  }

  /**
   * Queries Safaricom's STK Push Query endpoint. Daraja's query response confirms
   * settlement status and checkout identity; amount/receipt must still be
   * present in the authenticated callback and match our ledger.
   */
  public async checkSafaricomStkStatus(
    checkoutRequestId: string
  ): Promise<ParsedMpesaCallback | null> {
    if (!this.hasDarajaCredentials() || !checkoutRequestId) return null;

    try {
      const token = await this.getAccessToken();
      const { password, timestamp } = this.generatePasswordAndTimestamp();
      const response = await fetch(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            BusinessShortCode: this.shortCode,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestId,
          }),
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!response.ok) return null;
      const data = await response.json();
      if (!data || typeof data !== "object") return null;

      const returnedCheckoutId = String(data.CheckoutRequestID || "").trim();
      if (returnedCheckoutId !== checkoutRequestId) return null;

      const resultCode = Number(data.ResultCode);
      const isSuccess =
        String(data.ResponseCode ?? "") === "0" &&
        String(data.ResultCode ?? "") === "0";

      return {
        merchantRequestId: String(data.MerchantRequestID || ""),
        checkoutRequestId: returnedCheckoutId,
        resultCode: Number.isFinite(resultCode) ? resultCode : 1,
        resultDesc: String(data.ResultDesc || data.ResponseDescription || ""),
        isSuccess,
      };
    } catch {
      // Do not log request URLs, response bodies, or provider credentials.
      return null;
    }
  }

  /**
   * Verifies HMAC SHA-256 signature from UnifiedPay webhooks.
   */
  public verifyUnifiedPaySignature(rawBody: string, signature?: string | null): boolean {
    const signingSecret = process.env.UNIFIEDPAY_WEBHOOK_SECRET?.trim();
    if (!signingSecret || !signature || !rawBody) return false;

    try {
      const suppliedHex = signature.trim().replace(/^sha256=/i, "");
      if (!/^[a-f0-9]{64}$/i.test(suppliedHex)) return false;

      const expected = crypto
        .createHmac("sha256", signingSecret)
        .update(rawBody, "utf8")
        .digest();
      const supplied = Buffer.from(suppliedHex, "hex");
      return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
    } catch {
      return false;
    }
  }

  /**
   * Parses and validates raw webhook callbacks received from UnifiedPay or Safaricom STK Push.
   */
  public parseCallback(body: AnyCallbackBody | any): ParsedMpesaCallback {
    const payload = body && typeof body === "object" ? body : {};

    if (this.getCallbackProvider(payload) === "unifiedpay") {
      const statusStr = String(payload.TransactionStatus || "").trim().toLowerCase();
      const transactionCode = String(payload.TransactionCode ?? "").trim();
      const callbackResultCode = payload.ResultCode ?? payload.resultCode;
      const hasCallbackResultCode =
        callbackResultCode !== undefined &&
        callbackResultCode !== null &&
        String(callbackResultCode).trim() !== "";
      const isExplicitFailure =
        ["failed", "cancelled", "rejected"].includes(statusStr) ||
        statusStr.includes("cancel") ||
        statusStr.includes("fail") ||
        (transactionCode !== "" && transactionCode !== "0") ||
        (hasCallbackResultCode && String(callbackResultCode).trim() !== "0");
      const isSuccess =
        !isExplicitFailure &&
        (payload.event === "transaction.completed" ||
          statusStr === "completed" ||
          statusStr === "success" ||
          statusStr === "successful" ||
          statusStr === "paid" ||
          transactionCode === "0");
      const amount = normalizePositiveAmount(
        payload.TransactionAmount ?? payload.amount ?? payload.Amount
      );

      return {
        merchantRequestId: String(
          payload.MerchantRequestID || payload.transaction_request_id || ""
        ),
        checkoutRequestId: String(
          payload.CheckoutRequestID || payload.transaction_request_id || ""
        ),
        resultCode: isSuccess ? 0 : Number(payload.TransactionCode ?? 1),
        resultDesc: String(
          payload.ResultDesc || (isSuccess ? "Completed" : "Transaction failed")
        ),
        receiptNumber:
          payload.TransactionReceipt ||
          payload.mpesa_receipt_number ||
          payload.receiptNumber ||
          undefined,
        amount: amount === null ? undefined : amount,
        phoneNumber: payload.Msisdn || payload.phoneNumber,
        transactionDate: payload.TransactionDate,
        isSuccess,
      };
    }

    const callback = payload?.Body?.stkCallback;
    if (!callback || typeof callback !== "object") {
      return {
        merchantRequestId: "",
        checkoutRequestId: "",
        resultCode: 1,
        resultDesc: "Unknown callback structure",
        isSuccess: false,
      };
    }

    const hasResultCode =
      callback.ResultCode !== undefined &&
      callback.ResultCode !== null &&
      String(callback.ResultCode).trim() !== "";
    const resultCode = hasResultCode ? Number(callback.ResultCode) : NaN;
    const isSuccess = hasResultCode && Number.isFinite(resultCode) && resultCode === 0;
    let receiptNumber: string | undefined;
    let amount: number | undefined;
    let phoneNumber: string | undefined;
    let transactionDate: string | undefined;

    if (isSuccess && Array.isArray(callback.CallbackMetadata?.Item)) {
      for (const item of callback.CallbackMetadata.Item) {
        if (item?.Name === "MpesaReceiptNumber" && item.Value !== undefined) {
          receiptNumber = String(item.Value);
        } else if (item?.Name === "Amount" && item.Value !== undefined) {
          const parsedAmount = normalizePositiveAmount(item.Value);
          amount = parsedAmount === null ? undefined : parsedAmount;
        } else if (item?.Name === "PhoneNumber" && item.Value !== undefined) {
          phoneNumber = String(item.Value);
        } else if (item?.Name === "TransactionDate" && item.Value !== undefined) {
          transactionDate = String(item.Value);
        }
      }
    }

    return {
      merchantRequestId: String(callback.MerchantRequestID || ""),
      checkoutRequestId: String(callback.CheckoutRequestID || ""),
      resultCode: Number.isFinite(resultCode) ? resultCode : 1,
      resultDesc: String(callback.ResultDesc || ""),
      receiptNumber,
      amount,
      phoneNumber,
      transactionDate,
      isSuccess,
    };
  }

  /**
   * Initiates B2C Payout to seller handset for balance withdrawals.
   */
  public async initiateB2CPayout(params: B2CPayoutParams): Promise<B2CPayoutResponse> {
    const token = await this.getAccessToken();
    const phone = this.normalizePhoneNumber(params.phoneNumber);
    const b2cShortcode = process.env.MPESA_B2C_SHORTCODE || this.shortCode;
    const initiator = process.env.MPESA_B2C_INITIATOR_NAME || "testapi";
    const securityCredential = process.env.MPESA_B2C_SECURITY_CREDENTIAL || "";

    const payload = {
      InitiatorName: initiator,
      SecurityCredential: securityCredential,
      CommandID: "BusinessPayment",
      Amount: Math.round(params.amount),
      PartyA: b2cShortcode,
      PartyB: phone,
      Remarks: params.remarks,
      QueueTimeOutURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/withdrawals/queue-timeout`,
      ResultURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/withdrawals/callback`,
      Occasion: params.occasion || "Withdrawal",
    };

    const response = await fetch(
      `${this.baseUrl}/mpesa/b2c/v1/paymentrequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`M-Pesa B2C payout failed (HTTP ${response.status}).`);
    }

    return await response.json();
  }
}

export const mpesaClient = new MpesaService();
