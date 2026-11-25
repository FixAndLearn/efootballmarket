-- ============================================================================
-- Tighten excess grants on public.reviews and public.profiles
-- ============================================================================
-- Applied to the live database (project fdnflvbknoopethbihns) on 2026-11-17.
-- Everything below was verified against the live DB and the app source first,
-- not assumed.
--
-- WHAT WAS WRONG
--
--   reviews: policies existed for SELECT and INSERT only, so RLS already denied
--   UPDATE and DELETE. But anon AND authenticated both held the raw
--   UPDATE / DELETE / TRUNCATE grants. The table was protected only by the
--   absence of a policy -- one CREATE POLICY away from being a hole.
--
--   reviews INSERT policy was named "Buyers can write reviews for completed
--   orders" but its predicate was only `auth.uid() = reviewer_id`. It did not
--   check that the order belonged to the reviewer, that the seller matched, or
--   that the order was completed. The name promised more than the policy did.
--
--   profiles: authenticated held table-level UPDATE on EVERY column, including
--   available_balance, escrow_balance, is_suspended, is_verified_seller, role
--   and seller_rating. A BEFORE UPDATE trigger
--   (protect_sensitive_profile_fields) silently reverted those six, so
--   escalation was blocked -- but by a trigger rather than by permission, which
--   is defense-in-depth pointed the wrong way.
--
--   anon held DELETE and TRUNCATE on profiles. No code path deletes a profile.
--
-- WHAT MUST NOT BE REVOKED (checked against app source, not assumed)
--
--   profiles UPDATE for authenticated on the five profile fields --
--   src/app/profile/page.tsx is a "use client" component that upserts
--   {id, first_name, last_name, username, phone_number, country} with the
--   browser client. Revoking these breaks profile save for every logged-in user.
--
--   profiles INSERT for authenticated -- signup paths supply
--   is_verified_seller / available_balance / escrow_balance at creation time.
--   src/app/auth/callback/route.ts uses `ignoreDuplicates: true`, which is
--   ON CONFLICT DO NOTHING, so it never takes an UPDATE path; and
--   protect_sensitive_profile_fields reverts those values on any later update,
--   so INSERT-time trust columns are not an escalation vector.
--
--   profiles SELECT for anon -- public storefronts (/u/<username>) read with
--   the anon role. Verified live: 61 rows still visible to anon after the change.
--
--   reviews INSERT for authenticated -- fallback path in
--   api/orders/[id]/rate/route.ts when the service-role key is absent.
--
-- THE POSTGRES TRAP THAT MADE THE FIRST ATTEMPT A NO-OP
--
--   `revoke update (col) on t from role` does NOTHING if a TABLE-level UPDATE
--   grant exists: a table grant covers every column and a column revoke cannot
--   subtract from it. The first attempt revoked the sensitive columns and
--   information_schema still showed all 21. The fix is to revoke the table-level
--   grant, then grant back only the columns the app writes.
--
-- Nothing here touches M-Pesa, payments, or settlement tables.
-- ============================================================================

begin;

-- 1. reviews: remove policy-less write grants -------------------------------
revoke update, delete, truncate on table public.reviews from anon;
revoke update, delete, truncate on table public.reviews from authenticated;

-- 2. reviews: make the INSERT policy enforce its own name --------------------
drop policy if exists "Buyers can write reviews for completed orders" on public.reviews;

create policy "Buyers can write reviews for completed orders"
  on public.reviews
  for insert
  to authenticated
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1
      from public.orders o
      where o.id = reviews.order_id
        and o.buyer_id = auth.uid()
        and o.seller_id = reviews.seller_id
        and o.status = 'completed'
    )
  );

-- 3. profiles: deletion is not an app operation -----------------------------
revoke delete, truncate on table public.profiles from anon;
revoke delete, truncate on table public.profiles from authenticated;

-- 4. profiles: drop the blanket UPDATE, grant back only what the UI writes ---
revoke update on table public.profiles from authenticated;

grant update (first_name, last_name, username, phone_number, country)
  on table public.profiles to authenticated;

commit;

-- ============================================================================
-- Verification actually run afterwards
-- ============================================================================
-- reviews grants for anon+authenticated -> INSERT, REFERENCES, SELECT, TRIGGER
--   (UPDATE / DELETE / TRUNCATE gone)
--
-- profiles UPDATE columns for authenticated -> country, first_name, last_name,
--   phone_number, username  (exactly five, no wallet or trust columns)
--
-- service_role still holds UPDATE on available_balance, escrow_balance,
--   is_suspended, role -- money RPCs unaffected
--
-- as anon: 61 profiles visible (storefronts still work)
--
-- as authenticated, updating available_balance on own row ->
--   ERROR 42501: permission denied for table profiles   <- the hole is closed
