import { formatWhatsAppPhone } from "@/lib/utils/phone";

/**
 * WhatsApp dispatch surface.
 *
 * No third-party messaging provider is integrated. Every transport that used to
 * live here required credentials this project never held, so none of them ever
 * sent a message -- they only created the appearance of a working chain.
 *
 * What remains is deliberately small: the function shapes the rest of the
 * codebase already calls, and an explicit "simulated_local" result so callers
 * can tell, without guessing, that nothing left the server. Adding a real
 * provider later means adding one branch inside sendWhatsAppMessage, not
 * resurrecting five half-wired ones.
 */

export interface SendWhatsAppMessageOptions {
  toPhone: string;
  message: string;
  previewUrl?: boolean;
}

export interface SendInteractiveButtonsOptions {
  toPhone: string;
  bodyText: string;
  buttons: Array<{ id: string; title: string }>;
  headerText?: string;
  footerText?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  provider: "simulated_local" | "error";
  messageId?: string;
  recipient: string;
  error?: string;
}

/**
 * No WhatsApp transport is configured. Always false.
 *
 * Callers use this to decide whether to attempt a send at all; keeping the
 * export means they keep compiling and keep telling the truth.
 */
export function isWhatsAppConfigured(): boolean {
  return false;
}

export function getActiveWhatsAppProvider(): string {
  return "None configured";
}

export async function sendWhatsAppMessage({
  toPhone,
  message,
}: SendWhatsAppMessageOptions): Promise<WhatsAppSendResult> {
  const recipient = formatWhatsAppPhone(toPhone) || toPhone;

  if (!recipient) {
    return { success: false, provider: "error", recipient: "", error: "No recipient." };
  }

  // Nothing is transmitted. We log that fact rather than pretending otherwise.
  console.log(
    `[WHATSAPP:not-configured] No provider is set up; message not sent to ${recipient.length > 4 ? recipient.slice(0, -4) + "****" : "****"} (${message.length} chars).`
  );

  return { success: false, provider: "simulated_local", recipient };
}

export async function sendWhatsAppButtons({
  toPhone,
  bodyText,
  buttons,
}: SendInteractiveButtonsOptions): Promise<WhatsAppSendResult> {
  // Flatten the menu into plain text for the log; interactive sends need a
  // provider, and there isn't one.
  const flat = `${bodyText}\n\n${buttons.map((b: { title: string }, i: number) => `${i + 1}. ${b.title}`).join("\n")}`;
  return sendWhatsAppMessage({ toPhone, message: flat });
}
