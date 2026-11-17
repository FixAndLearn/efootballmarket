// ==============================================================================
// Safaricom Daraja API v2 Types
// ==============================================================================

export interface MpesaTokenResponse {
  access_token: string;
  expires_in: string;
}

export interface StkPushParams {
  phoneNumber: string; // Format: 2547XXXXXXXX or 2541XXXXXXXX
  amount: number;
  orderNumber: string;
  description?: string;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface StkCallbackItem {
  Name: string;
  Value?: string | number;
}

export interface StkCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: StkCallbackItem[];
      };
    };
  };
}

export interface ParsedMpesaCallback {
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  receiptNumber?: string;
  amount?: number;
  phoneNumber?: string;
  transactionDate?: string;
  isSuccess: boolean;
}

export type MpesaProvider = "unifiedpay" | "safaricom";
export type MpesaSettlementVerificationMethod =
  | "provider_status_query"
  | "authenticated_callback_and_status_query";

/**
 * Settlement details are created only after a provider query confirms success.
 * Safaricom's STK Query does not return the receipt or amount, so those fields
 * are taken from the authenticated callback and cross-checked against that
 * query; UnifiedPay supplies all fields from its provider status response.
 */
export interface VerifiedMpesaSettlement {
  provider: MpesaProvider;
  verificationMethod: MpesaSettlementVerificationMethod;
  providerStatus: "completed";
  transactionId: string;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  receiptNumber: string;
  amount: number;
  verifiedAt: string;
}

export interface B2CPayoutParams {
  phoneNumber: string;
  amount: number;
  remarks: string;
  occasion?: string;
}

export interface B2CPayoutResponse {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export interface UnifiedPayStkResponse {
  ResponseCode: string;
  success?: boolean;
  message?: string;
  transaction_request_id?: string;
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  party_b?: string;
  account_reference?: string;
  transaction_type?: string;
  errorMessage?: string;
}

export interface UnifiedPayStatusResponse {
  ResultCode?: string | number;
  transaction_request_id?: string;
  TransactionStatus?: string;
  TransactionCode?: string | number;
  ResultDesc?: string;
  TransactionReceipt?: string;
  TransactionAmount?: string | number;
  Msisdn?: string;
  TransactionDate?: string;
  TransactionReference?: string;
  CheckoutRequestID?: string;
  MerchantRequestID?: string;
  errorMessage?: string;
}

export interface UnifiedPayWebhookBody {
  event?: string;
  transaction_request_id?: string;
  TransactionStatus?: string;
  TransactionCode?: string | number;
  ResultDesc?: string;
  TransactionReceipt?: string;
  TransactionAmount?: string | number;
  Msisdn?: string;
  TransactionDate?: string;
  TransactionReference?: string;
  CheckoutRequestID?: string;
  MerchantRequestID?: string;
}

export type AnyCallbackBody = StkCallbackBody | UnifiedPayWebhookBody;
