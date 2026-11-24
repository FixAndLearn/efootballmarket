/**
 * Single source of truth for every support contact the platform publishes.
 *
 * Why this file exists: the WhatsApp number was previously copy-pasted as a
 * string literal into 39 files. Changing it meant 76 individual edits, and a
 * single missed literal would silently route shoppers to a dead number -- or,
 * worse, keep delivering admin alerts to the wrong handset. Everything that
 * needs the number now imports from here.
 *
 * PRIVACY POLICY: the number is intentionally never rendered as visible text
 * on the public site. Shoppers get the WhatsApp glyph and get on with their
 * day; the digits live only inside link targets. If you need to print the
 * number, stop and ask why first.
 */

/** E.164 digits, no plus. Required by https://wa.me/<digits> */
export const SUPPORT_WHATSAPP_DIGITS = "254105472373";

/** Local Kenyan format for internal logs and admin tooling. */
export const SUPPORT_PHONE_LOCAL = "0105472373";

/** E.164 with plus, for structured data and tel: links. */
export const SUPPORT_PHONE_E164 = "+254105472373";

/** Human-readable form. Internal/admin use only -- never public copy. */
export const SUPPORT_PHONE_DISPLAY = "0105 472 373";

/** Public support inbox. This is the visible fallback wherever the number
 *  used to be printed. */
export const SUPPORT_EMAIL = "support@efootballmarket.co.ke";

/** WhatsApp Channel (broadcast) -- the public invitation surface. */
export const SUPPORT_WHATSAPP_CHANNEL_URL =
  "https://whatsapp.com/channel/0029VbE0fut1yT2AtW2Fr50h";

/** Direct chat link. `text` is optional and URL-encoded for you. */
export function buildSupportWhatsAppUrl(text?: string): string {
  const base = `https://wa.me/${SUPPORT_WHATSAPP_DIGITS}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Masked form for logs: +2541****2373 */
export const SUPPORT_PHONE_MASKED = "+2541****2373";
