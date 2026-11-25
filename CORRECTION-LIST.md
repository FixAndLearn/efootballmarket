# Correction list — ordered

Re-verified against the live DB and current HEAD (`822c513`) on 2026-11-17.
Three items that older notes listed as open are **not** real. They're at the
bottom with the reason, so nobody re-opens them.

---

## 1. Rotate the Resend API key  (5 min, you)

**Why first:** it is the only item on this list where something is currently
broken in production, and the fix is outside the repo.

The key that was pasted in an earlier session (`UW8NwVPzKBqa3Djl`) failed
authentication, so it was never confirmed live. Every admin alert — new order,
dispute opened, scammer report — goes out through Resend to
`brianokibo@gmail.com`. If that key is dead, you are getting no alerts and don't
know it.

Nothing to code. Rotate in the Resend dashboard, then confirm a test mail
actually lands in the inbox. Until that's done, the alerting pipeline this repo
was cleaned up for is unproven.

## 2. Close the two RLS write holes  (10 min, me)

**Why second:** active data-integrity exposure, and it's a single SQL grant
change — no deploy, no code.

Verified live just now:

- `reviews` has policies for SELECT and INSERT only, **no UPDATE and no DELETE
  policy** — RLS correctly denies both. But `anon` and `authenticated` still hold
  the raw `UPDATE`, `DELETE` and `TRUNCATE` table grants. The only thing standing
  between an anonymous caller and wiping the table is RLS not having a policy for
  it. That is one `create policy` away from being a hole, and it reads as a
  mistake rather than a decision.
- `profiles` is tighter — policies exist for SELECT and UPDATE, so `anon` has no
  DELETE or TRUNCATE path. The leftover grants are still worth removing.

Fix is `revoke update, delete, truncate on public.reviews from anon, authenticated`
plus the equivalent on `profiles` for DELETE/TRUNCATE, then `grant` back only
what the app genuinely needs. I'd rather confirm nothing in `src/` depends on
those grants before revoking — that's the 10 minutes.

## 3. `/tournaments` should render its brackets server-side  (half a day, me)

**Why third:** real and visible, but cosmetic — nothing is broken for users.

The page is a client component that fetches `/api/tournaments` after mount, so
the HTML a crawler or a slow phone receives says **"Loading brackets..."** and
nothing else. Both cups exist and are open in the DB. Google indexes an empty
page; a user on a bad connection stares at a spinner that a server render would
have made instant.

This is the last remaining item from the original audit that is a genuine
defect rather than a preference. It's also the biggest change on this list,
which is why it's third and not first.

## 4. Sitemap: revalidate on status change, not on a timer  (2 hrs, me)

**Why fourth:** currently correct, just not elegant.

The archived-listing-in-sitemap bug is fixed — I cut `revalidate` from 3600 to
300 and re-verified that all 70 sitemap URLs return 200 and the archived squad
is gone. What's left is that correctness now costs a DB query every 5 minutes
forever. The proper fix is calling `revalidatePath("/sitemap.xml")` from the
publish/archive path so it only regenerates when something actually changes.

Strictly optional. Nothing is wrong today.

## 5. Automated tests for the four things that broke  (1 day, me)

**Why last:** it doesn't fix anything now, it stops the same class of bug
returning.

Today I shipped three commits where the first two were correct code that
changed nothing, and only a live check caught it. The failure modes worth
locking down:

- a nonexistent listing / article / seller / order returns 404, not 200
- a 404 emits exactly one robots tag
- `notFound()` and `redirect()` inside a `try` re-throw `NEXT_` digests
- no `loading.tsx` is added back at the root

A handful of route-level assertions would have caught every one of those in
seconds instead of four deploys.

---

## Not real — do not re-open

- **9 `XXX` markers.** All nine are phone-number format examples in user-facing
  copy (`e.g. +254 7XX XXX XXX`) or a comment (`254XXXXXXXXX format`). None are
  placeholders. Four of the nine are in M-Pesa files, which are off-limits
  anyway.
- **`{userId}/` upload prefix.** The upload route *does* authenticate
  (`getUser()` at line 28, rejects with 401) and names files
  `squad_<timestamp>_<uniqueId>_<name>`, so there are no collisions. It isn't
  namespaced per user, which is untidy for storage housekeeping, but it is not a
  security or data bug.
- **`ordering` on the 7 bare `catch {}` blocks.** I checked each: none wraps a
  `redirect()` or `notFound()`, except two in `middleware.ts` which are
  deliberate fail-open/fail-closed decisions with comments. The dangerous variant
  was the one inside `generateMetadata`, and that's fixed.

## Still yours, unrelated to code

- 5 clicks in the Supabase auth dashboard (password/email settings).
- `BUG F` from the old notes has no surviving description and I can't
  reconstruct it. If you remember what it was, say the word; otherwise I'd drop
  it rather than guess.

## Reconfirmed fine while checking

RLS is enabled on all of `orders`, `listings`, `messages`, `disputes`,
`notifications`, `profiles`, `reviews`, `scammer_reports`. Every table has
policies. The gap in item 2 is specifically the excess *grants*, not missing RLS.
