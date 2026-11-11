import { Resend } from "resend";

export const RESEND_CONFIG = {
  fromAddress: process.env.RESEND_FROM_EMAIL || "eFootballMarket <notifications@efootballmarket.co.ke>",
  supportAddress: process.env.SUPPORT_EMAIL || "support@efootballmarket.co.ke",
  domain: "efootballmarket.co.ke",
};

let cachedClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = new Resend(apiKey);
  }
  return cachedClient;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | string[];
  idempotencyKey?: string;
}

export async function sendTransactionalEmail(options: SendEmailOptions) {
  const client = getResendClient();
  if (!client) {
    console.warn("[Resend] RESEND_API_KEY not set; skipping transactional email.");
    return { success: false, error: "RESEND_API_KEY environment variable is not configured." };
  }

  const from = RESEND_CONFIG.fromAddress;

  const { data, error } = await client.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo || RESEND_CONFIG.supportAddress,
    headers: {
      "X-Entity-Ref-ID": options.idempotencyKey || `tx-${Date.now()}`,
    },
  });

  if (error) {
    console.error("[Resend Delivery Error]:", error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data?.id };
}
