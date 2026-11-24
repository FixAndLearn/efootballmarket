"use client";

import { buildSupportWhatsAppUrl, SUPPORT_WHATSAPP_CHANNEL_URL } from "@/lib/constants/support";

/**
 * Accessible WhatsApp glyph, drawn inline.
 *
 * Inline SVG rather than an image file so it renders instantly with no extra
 * request and is never blocked by an ad/script blocker. No external CDN, no
 * font dependency -- the sandboxed preview keeps working too.
 */
export function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

/**
 * Icon-only support entry point.
 *
 * The phone number is deliberately NOT rendered as text -- see the privacy
 * policy in lib/constants/support.ts. `aria-label` still announces it to
 * screen readers, which is an accessibility need rather than a visual leak.
 */
export function WhatsAppIconLink({
  text,
  className = "",
  label = "Chat with eFootballMarket support on WhatsApp",
  size = "w-4 h-4",
  children,
}: {
  text?: string;
  className?: string;
  label?: string;
  size?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={buildSupportWhatsAppUrl(text)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center gap-1.5 ${className}`}
    >
      <WhatsAppIcon className={size} />
      {children}
    </a>
  );
}

/**
 * Compact "Join our WhatsApp Channel" control.
 * Drop-in for footers, headers, and empty states. Never prints a number.
 */
export function WhatsAppChannelButton({
  className = "",
  label = "Join our WhatsApp Channel",
  compact = false,
}: {
  className?: string;
  label?: string;
  compact?: boolean;
}) {
  return (
    <a
      href={SUPPORT_WHATSAPP_CHANNEL_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sx-green ${
        compact ? "h-8 px-2.5 text-[11px]" : "h-10 px-4 text-xs sm:text-sm"
      } ${className}`}
    >
      <WhatsAppIcon className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
      <span>{compact ? "Channel" : label}</span>
    </a>
  );
}

/**
 * Full-width "join the channel" banner.
 *
 * Deliberately NOT another outline pill: the hero already carries six filter
 * pills, a search field and two CTAs, and a seventh chip would read as
 * decoration. This is a distinct, self-contained surface with room for the
 * reason to join and a single obvious action.
 */
export function WhatsAppChannelBanner({
  variant = "default",
  className = "",
}: {
  variant?: "default" | "compact";
  className?: string;
}) {
  const compact = variant === "compact";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-sx-green-border bg-sx-green-tint ${
        compact ? "p-3.5" : "p-4 sm:p-5"
      } ${className}`}
    >
      {/* Soft brand wash, purely decorative */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sx-green/10 blur-2xl"
      />

      <div className="relative flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sx-green text-white shadow-sm">
          <WhatsAppIcon className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={`font-bold text-sx-ink leading-tight ${
              compact ? "text-xs" : "text-sm sm:text-base"
            }`}
          >
            Join the eFootballMarket WhatsApp Channel
          </p>
          <p
            className={`text-sx-muted leading-snug ${
              compact ? "text-[11px]" : "text-[11px] sm:text-xs"
            } mt-0.5`}
          >
            New squad drops, price cuts and restock alerts&nbsp;&mdash; straight to
            WhatsApp. No group chat, no spam, leave anytime.
          </p>
        </div>

        <a
          href={SUPPORT_WHATSAPP_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full bg-sx-green text-white font-bold hover:bg-sx-green-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sx-green ${
            compact ? "h-8 px-3 text-[11px]" : "h-9 sm:h-10 px-3.5 sm:px-4 text-xs"
          }`}
        >
          <span className="hidden sm:inline">Follow Channel</span>
          <span className="sm:hidden">Follow</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-3.5 w-3.5"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </div>
    </div>
  );
}
