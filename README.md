# eFootballMarket.co.ke

Kenyan eFootball account marketplace, M-Pesa Till `1572931` escrow settlement platform, and verified Konami ID transfer desk.

## Overview

- **Marketplace & Live Offers**: Verified eFootball Mobile, PlayStation, Xbox, and Steam/PC squad listings with Permanent Team Strength verification and binding M-Pesa escrow checkout.
- **Middleman Escrow**: On-demand escrow deal room for off-platform agreements negotiated on WhatsApp, Telegram, Discord, or TikTok.
- **Scammer Registry & Guides**: Public phone/handle lookup and original guides covering Konami ID Data Transfer rules, M-Pesa SMS spoofing checks, and squad inspection.
- **Device-Adaptive Theme**: Automatically matches OS/device Light and Dark appearance preferences (`prefers-color-scheme`) with zero flash on load.

## Local Development

1. Copy environment variables into `.env.local`:
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CREDENTIAL_ENCRYPTION_KEY` (64-char hex key for AES-256-GCM handover vaulting)
   - `UNIFIEDPAY_API_KEY`, `UNIFIEDPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_MPESA_TILL_NUMBER`
   - `RESEND_API_KEY`, `NEXT_PUBLIC_ADSENSE_CLIENT_ID`
2. Install dependencies and start the server:

```bash
npm install
npm run typecheck
npm run dev
```
