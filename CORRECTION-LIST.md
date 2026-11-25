# Correction list — status

Updated 2026-11-17 after working the list. Live at `c82720e`.

| # | Item | Status |
|---|------|--------|
| 1 | Resend key rotation | **Closed — not needed** |
| 2 | RLS grant holes | **Done** |
| 3 | `/tournaments` server render | **Done** |
| 4 | Sitemap on-demand revalidation | **Done** |
| 5 | Tests for the four regressions | Open |

---

## 1. Resend key — closed, no action

You confirmed a notification email arrived yesterday, so the deployed key works
and the admin alert path is live. The earlier "unverified" flag was only ever
about the *pasted* key (`UW8NwVPzKBqa3Djl`) being rejected during a test — a
different string from the one Vercel actually holds. Nothing to rotate.

## 2. RLS grant holes — done

Applied to the live database, recorded as
`supabase/migrations/20261117_tighten_reviews_profiles_grants.sql`.

**reviews**
- `anon` and `authenticated` both held UPDATE / DELETE / TRUNCATE grants while
  policies existed only for SELECT and INSERT. Writes were denied by RLS, but
  only because no policy existed for them. Revoked.
- The INSERT policy was named *"Buyers can write reviews for completed orders"*
  while its predicate was just `auth.uid() = reviewer_id`. It never checked that
  the order belonged to the reviewer, that the seller matched, or that the order
  was completed. Rewritten to enforce what its name claims.

**profiles**
- `authenticated` held table-level UPDATE on every column, including
  `available_balance`, `escrow_balance`, `is_suspended`, `is_verified_seller`,
  `role` and `seller_rating`. The `protect_sensitive_profile_fields` trigger
  reverted those, so nothing was exploitable — but a trigger is the wrong place
  to stop privilege escalation when the grant system can. Revoked the blanket
  grant, granted back only the five fields the profile page writes.
- `anon` held DELETE and TRUNCATE. No code path deletes a profile. Revoked.

Kept deliberately, after reading the code that needs them: `profiles` UPDATE on
those five fields and `profiles` INSERT for `authenticated` (signup sets trust
columns at creation; `auth/callback` uses `ignoreDuplicates: true`, i.e.
ON CONFLICT DO NOTHING, so it never takes an UPDATE path), `profiles` SELECT for
`anon` (storefronts), `reviews` INSERT for `authenticated` (rate route fallback).

**Verified live:** `reviews` grant list is `INSERT, REFERENCES, SELECT, TRIGGER`.
`profiles` UPDATE is exactly `country, first_name, last_name, phone_number,
username`. `service_role` still holds every column, so money RPCs are untouched.
Anon still sees 61 profiles. An authenticated user naming `available_balance` on
their own row gets `ERROR 42501: permission denied for table profiles`.

**Trap worth remembering:** `revoke update (col)` is a silent no-op when a
table-level UPDATE grant exists — a table grant covers every column and a column
revoke cannot subtract from it. My first attempt revoked the sensitive columns
and `information_schema` still showed all 21. Revoke the table grant, then grant
back specific columns.

## 3. `/tournaments` server render — done

Split into a server page (`page.tsx`) and `TournamentsClient.tsx`.

Verified live: **Brinaki Clash** and **1v1 Wager Duel** now appear in the served
HTML, `Loading brackets...` count is 0, title and canonical are correct.

One thing that could have gone wrong and did not: the server wrapper has to
apply the same `maskPhoneNumber` + `isUserAdmin` logic as `GET /api/tournaments`,
or the page would publish participant phone numbers the endpoint deliberately
hides. Checked the live HTML — the only phone number present is the support
number inside `wa.me/` links, exactly as the standing rule requires.

## 4. Sitemap revalidation — done

`revalidatePath("/sitemap.xml")` now fires from `api/listings/[id]` when a PATCH
carries a status change or when a listing is deleted. `revalidate` went back up
to 900 as a backstop for changes made outside the API (direct SQL, dashboard).

Live: 70 URLs, all 200, archived squad absent.

## 5. Tests — still open

Route assertions for the four failure modes found today: 404 status on bogus
content, a single robots tag on 404s, `NEXT_` re-throw inside `generateMetadata`,
and no `loading.tsx` returning to the root. Today that class of bug cost four
deploys to find; the tests would catch it in seconds.

## Not real — do not re-open

- 9 `XXX` markers: phone-format examples in user-facing copy, plus comments.
  Four are in M-Pesa files, off-limits anyway.
- `{userId}/` upload prefix: the route authenticates (`getUser()`, 401) and
  filenames carry a unique ID. Untidy for storage housekeeping, not a bug.
- 7 bare `catch {}` blocks: none wraps `redirect()` or `notFound()`. The two in
  `middleware.ts` are deliberate and commented.

## Still yours

- 5 clicks in the Supabase auth dashboard.
- `BUG F` from older notes has no surviving description. If you remember it,
  say so; otherwise it should be dropped rather than guessed at.
