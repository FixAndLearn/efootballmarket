/**
 * Admin notification dispatcher.
 * Routes high-priority platform events to the admin inbox.
 */

import { formatDisplayPhone, formatInternationalPhone, formatWhatsAppPhone } from "@/lib/utils/phone";
import { redactAccidentalPii } from "@/lib/security/publicSanitizer";
import { sendAdminAlertEmail } from "./emailAlert";

import {
  SUPPORT_PHONE_LOCAL as ADMIN_PHONE_NUMBER,
  SUPPORT_WHATSAPP_DIGITS as ADMIN_WHATSAPP_NUMBER,
  SUPPORT_PHONE_E164 as ADMIN_INTERNATIONAL_PHONE,
} from "@/lib/constants/support";

// Re-exported under their historical names so existing importers keep working.
export { ADMIN_PHONE_NUMBER, ADMIN_WHATSAPP_NUMBER, ADMIN_INTERNATIONAL_PHONE };
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "support@efootballmarket.co.ke";

export type AdminEventType =
  | "PAYMENT_RECEIVED"
  | "NEW_ORDER_CREATED"
  | "NEW_USER_REGISTERED"
  | "NEW_LISTING_CREATED"
  | "CREDENTIALS_DELIVERED"
  | "ESCROW_RELEASED"
  | "DISPUTE_OPENED"
  | "POST_RELEASE_DISPUTE_OPENED"
  | "NEW_OFFER_SUBMITTED"
  | "AVAILABILITY_PING"
  | "WANTED_REQUEST_POSTED"
  | "WITHDRAWAL_REQUESTED"
  | "TOURNAMENT_REGISTRATION"
  | "TOURNAMENT_WINNER_CROWNED"
  | "LISTING_REPORTED";

export interface AdminAlertPayload {
  eventType: AdminEventType;
  orderId?: string;
  orderNumber?: string;
  listingTitle?: string;
  amount?: number;
  currency?: string;
  buyerPhone?: string;
  sellerPhone?: string;
  receiptNumber?: string;
  username?: string;
  userEmail?: string;
  details?: string;
}

// Backward compatibility alias
export type OrderAlertPayload = AdminAlertPayload;

/**
 * Formats a clean, high-priority WhatsApp notification for admin support desk.
 */
export function formatAdminWhatsAppMessage(payload: AdminAlertPayload): string {
  const currency = payload.currency || "KES";
  const formattedAmount = payload.amount !== undefined ? `${currency} ${Number(payload.amount).toLocaleString()}` : "";
  const time = new Date().toLocaleTimeString("en-KE", { timeZone: "Africa/Nairobi", hour: "2-digit", minute: "2-digit" });

  let header = "*eFootballMarket Alert*";
  let lines: string[] = [];

  switch (payload.eventType) {
    case "PAYMENT_RECEIVED":
      header = "*M-PESA PAYMENT SECURED (TILL 1572931)*";
      lines = [
        `*Order:* ${payload.orderNumber || "Direct"}`,
        `*Squad:* ${payload.listingTitle || "eFootball Account"}`,
        `*Amount:* ${formattedAmount}`,
        payload.receiptNumber ? `*Receipt:* ${payload.receiptNumber}` : "",
        payload.buyerPhone ? `*Buyer:* ${formatDisplayPhone(payload.buyerPhone)}` : "",
        `*Status:* Funds in Escrow. Seller notified to deliver Konami ID.`,
      ];
      break;

    case "NEW_USER_REGISTERED":
      header = "*NEW USER REGISTRATION*";
      lines = [
        `*Username:* @${payload.username || "Trader"}`,
        payload.userEmail ? `*Email:* ${payload.userEmail}` : "",
        payload.buyerPhone ? `*Phone:* ${formatDisplayPhone(payload.buyerPhone)}` : "",
        `⏰ *Time:* ${time} EAT`,
      ];
      break;

    case "NEW_LISTING_CREATED":
      header = "*NEW ACCOUNT LISTED FOR SALE*";
      lines = [
        `*Squad:* ${payload.listingTitle || "Account"}`,
        `*Price:* ${formattedAmount}`,
        payload.username ? `*Seller:* @${payload.username}` : "",
        payload.sellerPhone ? `*Seller Phone:* ${formatDisplayPhone(payload.sellerPhone)}` : "",
        `⏰ *Time:* ${time} EAT`,
      ];
      break;

    case "CREDENTIALS_DELIVERED":
      header = "*SELLER DELIVERED KONAMI ID*";
      lines = [
        `*Order:* ${payload.orderNumber}`,
        `*Squad:* ${payload.listingTitle}`,
        `⏳ *Buyer Window:* 24-hr inspection timer running.`,
      ];
      break;

    case "ESCROW_RELEASED":
      header = "*ESCROW COMPLETED & RELEASED*";
      lines = [
        `*Order:* ${payload.orderNumber}`,
        `*Squad:* ${payload.listingTitle}`,
        `*Net to Seller:* ${formattedAmount}`,
        `*Result:* Deal complete without disputes!`,
      ];
      break;

    case "DISPUTE_OPENED":
      header = "*ESCROW DISPUTE OPENED (ACTION REQUIRED)*";
      lines = [
        `*Order:* ${payload.orderNumber}`,
        `*Squad:* ${payload.listingTitle}`,
        `*Conflict:* Buyer or seller opened dispute. Mediation needed.`,
      ];
      break;

    case "POST_RELEASE_DISPUTE_OPENED":
      header = "*POST-RELEASE DISPUTE OPENED (REVIEW NEEDED)*";
      lines = [
        `*Order:* ${payload.orderNumber}`,
        `*Squad:* ${payload.listingTitle}`,
        payload.amount !== undefined ? `*Disputed Amount:* ${formattedAmount}` : "",
        `*Conflict:* Post-completion dispute report; review the evidence and any requested remedy.`,
        `*Important:* This report does not automatically hold seller funds or reverse an M-Pesa transfer already sent. Record any separate manual decision.`,
        payload.details ? `*Details:* ${payload.details}` : "",
      ];
      break;

    case "NEW_OFFER_SUBMITTED":
      header = "*NEW BUYER COUNTER-OFFER*";
      lines = [
        `*Squad:* ${payload.listingTitle}`,
        `*Offered Price:* ${formattedAmount}`,
        payload.buyerPhone ? `*Buyer Phone:* ${formatDisplayPhone(payload.buyerPhone)} (https://wa.me/${formatWhatsAppPhone(payload.buyerPhone)})` : "",
        payload.sellerPhone ? `*Seller Phone:* ${formatDisplayPhone(payload.sellerPhone)} (https://wa.me/${formatWhatsAppPhone(payload.sellerPhone)})` : "",
        payload.details ? `*Note:* "${payload.details}"` : "",
      ];
      break;

    case "AVAILABILITY_PING":
      header = "*BUYER CHECKING SQUAD AVAILABILITY*";
      lines = [
        `*Squad:* ${payload.listingTitle || "Listed Squad"}`,
        payload.amount !== undefined ? `*Price:* ${formattedAmount}` : "",
        payload.username ? `*Seller:* @${payload.username}` : "",
        payload.sellerPhone
          ? `*WhatsApp Seller:* https://wa.me/${formatWhatsAppPhone(payload.sellerPhone)}`
          : "",
        payload.buyerPhone
          ? `*WhatsApp Buyer:* https://wa.me/${formatWhatsAppPhone(payload.buyerPhone)}`
          : "",
        payload.details ? `*Status:* ${payload.details}` : "",
      ];
      break;

    case "WANTED_REQUEST_POSTED":
      header = "*NEW WANTED SQUAD REQUEST*";
      lines = [
        `*Request:* ${payload.listingTitle}`,
        `*Budget:* ${formattedAmount}`,
        payload.buyerPhone ? `*Buyer:* ${formatDisplayPhone(payload.buyerPhone)}` : "",
      ];
      break;

    case "WITHDRAWAL_REQUESTED":
      header = "*SELLER M-PESA WITHDRAWAL REQUEST*";
      lines = [
        payload.username ? `*Seller:* @${payload.username}` : "",
        `*Amount:* ${formattedAmount}`,
        payload.sellerPhone ? `*M-Pesa:* ${formatDisplayPhone(payload.sellerPhone)}` : "",
      ];
      break;

    case "TOURNAMENT_REGISTRATION":
      header = "*NEW TOURNAMENT REGISTRATION*";
      lines = [
        `*Tournament:* ${payload.listingTitle || "eFootball Cup"}`,
        payload.amount ? `*Entry Fee:* ${formattedAmount}` : "*Entry Fee:* Free Entry",
        payload.buyerPhone ? `*Player Phone:* ${formatDisplayPhone(payload.buyerPhone)}` : "",
        payload.details ? `*Player Info:* ${payload.details}` : "",
        `*Action:* Review the tournament details above and follow up as needed.`,
      ];
      break;

    case "TOURNAMENT_WINNER_CROWNED":
      header = "*TOURNAMENT CHAMPION CROWNED!*";
      lines = [
        `*Tournament:* ${payload.listingTitle || "eFootball Tournament"}`,
        payload.username ? `*Champion:* ${payload.username}` : "",
        payload.amount !== undefined ? `*1st Place Prize:* ${formattedAmount}` : "",
        payload.buyerPhone ? `*Champion M-Pesa:* ${formatDisplayPhone(payload.buyerPhone)}` : "",
        payload.sellerPhone ? `*Runner-up M-Pesa:* ${formatDisplayPhone(payload.sellerPhone)}` : "",
        payload.details ? `*Details:* ${payload.details}` : "",
        `*Action:* Manually review and arrange the listed prize transfer; this alert does not send money.`,
      ];
      break;

    default:
      header = "*eFootballMarket Update*";
      lines = [payload.details || payload.listingTitle || "Activity recorded."];
      break;
  }

  const cleanLines = lines.filter(Boolean).join("\n");
  return (
    `${header}\n\n` +
    `${cleanLines}\n\n` +
    `*Admin Panel:* https://www.efootballmarket.co.ke/admin`
  );
}

/**
 * Backward compatibility function for order alert formatting.
 */
export function formatAdminOrderAlertMessage(payload: AdminAlertPayload): string {
  return formatAdminWhatsAppMessage(payload);
}

/**
 * Generates direct WhatsApp click-to-chat URL to message Brian Okibo at +254 105 472 373.
 */
export function getAdminWhatsAppAlertUrl(payload: AdminAlertPayload): string {
  const text = formatAdminWhatsAppMessage(payload);
  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/**
 * Dispatches automated alerts for platform events.
 *
 * This used to be a five-branch waterfall in which four branches required
 * credentials that were never present. The structure was decorative: it logged
 * "dispatching" and then delivered nothing until it reached the email step.
 * Those dead branches have been removed.
 *
 * Email is the only channel. Every event type routes through it, and the
 * subject line is prefixed so a financial event still stands out in an inbox.
 *
 * The body is NOT passed through redactAccidentalPii. That helper masks Kenyan
 * phone numbers, and these alerts deliberately print the buyer's phone, the
 * seller's M-Pesa payout line and the two wa.me call-back links -- an operator
 * cannot action a dispute or a withdrawal without being able to ring that
 * number. Redacting served nobody: the only reader is the admin inbox that
 * already holds these details. Only a failure line is logged, and it carries
 * the error, never the alert body.
 */
export async function dispatchAdminWhatsAppAlert(payload: AdminAlertPayload): Promise<void> {
  const alertText = formatAdminWhatsAppMessage(payload);

  const FINANCIAL_EVENTS: AdminEventType[] = [
    "PAYMENT_RECEIVED",
    "ESCROW_RELEASED",
    "DISPUTE_OPENED",
    "POST_RELEASE_DISPUTE_OPENED",
    "WITHDRAWAL_REQUESTED",
    "NEW_OFFER_SUBMITTED",
  ];
  const isActionable = FINANCIAL_EVENTS.includes(payload.eventType);

  const adminEmail = (process.env.ADMIN_EMAIL || ADMIN_EMAIL).trim();
  if (!adminEmail || adminEmail.includes("placeholder")) {
    console.warn("[ADMIN ALERT] No admin email configured; alert dropped.");
    return;
  }

  try {
    // The subject identifies WHICH event, not which listing. The old chain put
    // the order number here, and that was the only identifier in the subject
    // line -- dropping it meant an operator had to open the mail to know what
    // it was about.
    const subjectRef = payload.orderNumber || payload.listingTitle?.slice(0, 60) || "";

    const result = await sendAdminAlertEmail({
      toEmail: adminEmail,
      subject: `${isActionable ? "[ACTION] " : ""}${payload.eventType.replaceAll("_", " ")}${
        subjectRef ? ` - ${subjectRef}` : ""
      }`,
      body: alertText,
      severity: isActionable ? "action" : "info",
    });

    if (!result?.success) {
      console.warn("[ADMIN ALERT] Email delivery failed:", result?.error);
    }
  } catch (err: any) {
    console.warn("[ADMIN ALERT] Email dispatch threw:", err?.message);
  }
}

export const dispatchAdminAlert = dispatchAdminWhatsAppAlert;

export async function dispatchAdminOrderAlert(payload: AdminAlertPayload): Promise<void> {
  return dispatchAdminWhatsAppAlert(payload);
}
