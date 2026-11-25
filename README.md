# eFootballMarket.co.ke

Kenyan eFootball account marketplace, M-Pesa Till `1572931` escrow settlement platform, and verified Konami ID transfer desk.

## Overview

- **Marketplace & Live Offers**: Verified eFootball Mobile, PlayStation, Xbox, and Steam/PC squad listings with Permanent Team Strength verification and binding M-Pesa escrow checkout.
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

### M-Pesa callback verification

Successful callbacks are never trusted on payload contents alone. UnifiedPay settlement checks require its status API to return the requested transaction ID, a valid receipt, and the exact ledger amount. For direct Daraja, the STK Query confirms success and checkout identity; receipt and amount are accepted only from the callback after its `secret` (or `token`) matches `MPESA_WEBHOOK_SECRET` and the values match the payment/order ledger. This composite evidence is recorded as `authenticated_callback_and_status_query`; it is not represented as if STK Query returned the receipt or amount. The direct Daraja STK Push route refuses to initiate if callback URL protection is not configured. Use a high-entropy URL-safe secret, do not log callback request URLs, and keep provider credentials out of application logs. Test forged, replayed, underpaid, duplicate, and genuine callbacks in staging before production rollout.

### Shared server-side state

API rate limits, payment/withdrawal idempotency claims, tournament fallback snapshots, and secure money-action RPCs use Supabase so they remain consistent across Vercel function instances. Migrations `supabase/migrations/20261114184511_shared_runtime_state.sql` and `supabase/migrations/20261114184512_secure_money_action_rpcs.sql` are currently unapplied local artifacts; the latter follows the former. Confirm the exact Supabase project/environment and obtain explicit authorization before applying either migration; do not infer the target from local configuration. The related routes fail closed if their required shared RPCs or the server-only `SUPABASE_SERVICE_ROLE_KEY` are unavailable; the public anon key is not a substitute.
