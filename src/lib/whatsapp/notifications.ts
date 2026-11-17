/**
 * High-Level WhatsApp Business Notification Dispatchers
 * Formats beautifully styled customer & admin notifications for eFootballMarket.
 */

import { formatDisplayPhone } from "@/lib/utils/phone";
import { sendWhatsAppMessage, sendWhatsAppButtons, WhatsAppSendResult } from "./cloudApi";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.efootballmarket.co.ke";

/**
 * 1. Alert buyer that Lipa Na M-Pesa payment is confirmed and funds are locked in Escrow.
 */
export async function sendBuyerPaymentSecuredWhatsApp(
  buyerPhone: string,
  orderNumber: string,
  amountKes: number,
  listingTitle: string,
  orderId: string
): Promise<WhatsAppSendResult> {
  const message =
    `*PAYMENT SECURED IN ESCROW (TILL 1572931)*\n\n` +
    `Hello! We received your payment of *KES ${amountKes.toLocaleString()}* for:\n` +
    `*${listingTitle}*\n` +
    `*Order Number:* ${orderNumber}\n\n` +
    `*Your payment is secured in escrow:* Funds are held in eFootballMarket Escrow Till 1572931. The seller has NOT been paid and will only receive money after you inspect and confirm access to the Konami ID.\n\n` +
    `*Track Your Order:* ${APP_URL}/orders/${orderId}\n\n` +
    `_Need help? Reply to this message anytime._`;

  return sendWhatsAppMessage({ toPhone: buyerPhone, message });
}

/**
 * 2. Alert seller that buyer has paid and request Konami ID credentials delivery.
 */
export async function sendSellerDeliverCredentialsWhatsApp(
  sellerPhone: string,
  orderNumber: string,
  amountKes: number,
  listingTitle: string,
  orderId: string
): Promise<WhatsAppSendResult> {
  const message =
    `*NEW ORDER: BUYER PAID KES ${amountKes.toLocaleString()}!*\n\n` +
    `Congratulations! A buyer has locked funds into Escrow for your listing:\n` +
    `*${listingTitle}*\n` +
    `*Order:* ${orderNumber}\n\n` +
    `*Next Step - Deliver Konami ID:*\n` +
    `Log into eFootballMarket now and securely submit your Konami ID email and password into the encrypted vault.\n\n` +
    `*Deliver Credentials Here:* ${APP_URL}/orders/${orderId}\n\n` +
    `_Funds will be credited to your available balance as soon as the buyer confirms._`;

  return sendWhatsAppMessage({ toPhone: sellerPhone, message });
}

/**
 * 3. Alert buyer that seller has uploaded Konami ID credentials into the vault.
 */
export async function sendBuyerCredentialsDeliveredWhatsApp(
  buyerPhone: string,
  orderNumber: string,
  listingTitle: string,
  orderId: string
): Promise<WhatsAppSendResult> {
  const message =
    `*KONAMI ID CREDENTIALS DELIVERED!*\n\n` +
    `The seller has securely transferred the account credentials for:\n` +
    `*${listingTitle}*\n` +
    `*Order:* ${orderNumber}\n\n` +
    `⏳ *24-Hour Inspection Window:*\n` +
    `Please log in, reveal your credentials, verify the squad details (OVR, players, coins), and change the password.\n\n` +
    `*Inspect Account:* ${APP_URL}/orders/${orderId}\n\n` +
    `_If anything is wrong, click 'Open Dispute' before the 24 hours expire._`;

  return sendWhatsAppMessage({ toPhone: buyerPhone, message });
}

/**
 * 4. Alert seller that buyer confirmed receipt and proceeds were credited to the platform balance.
 */
export async function sendSellerFundsReleasedWhatsApp(
  sellerPhone: string,
  orderNumber: string,
  netAmountKes: number
): Promise<WhatsAppSendResult> {
  const message =
    `*ORDER COMPLETED - BALANCE CREDITED!*\n\n` +
    `The buyer has confirmed receipt and finalized Order *#${orderNumber}*.\n\n` +
    `*Net Credited to Available Balance:* KES ${netAmountKes.toLocaleString()}\n\n` +
    `To withdraw to M-Pesa, submit a separate request from Seller Earnings. Withdrawal requests are reviewed and arranged manually; processing time varies.\n` +
    `*Seller Earnings:* ${APP_URL}/seller/earnings\n\n` +
    `_Thank you for trading safely on eFootballMarket!_`;

  return sendWhatsAppMessage({ toPhone: sellerPhone, message });
}

/**
 * 5. Alert seller when an administrator records a withdrawal outcome.
 */
export async function sendSellerWithdrawalStatusWhatsApp(
  sellerPhone: string,
  amountKes: number,
  status: "completed" | "rejected",
  reason?: string
): Promise<WhatsAppSendResult> {
  if (status === "completed") {
    const message =
      `*WITHDRAWAL MARKED PAID*\n\n` +
      `An administrator marked your withdrawal of *KES ${amountKes.toLocaleString()}* as paid after manual handling. This system does not independently verify the M-Pesa transfer. Check your M-Pesa SMS or transaction receipt, and contact support if the funds have not arrived.\n\n` +
      `*View Earnings:* ${APP_URL}/seller/earnings`;
    return sendWhatsAppMessage({ toPhone: sellerPhone, message });
  } else {
    const message =
      `*WITHDRAWAL REQUEST REJECTED*\n\n` +
      `Your withdrawal request of *KES ${amountKes.toLocaleString()}* was rejected. The reserved amount is returned to your Available Balance when the rejection is recorded.\n\n` +
      (reason ? `*Reason:* ${reason}\n\n` : "\n") +
      `*Check Balance:* ${APP_URL}/seller/earnings`;
    return sendWhatsAppMessage({ toPhone: sellerPhone, message });
  }
}
