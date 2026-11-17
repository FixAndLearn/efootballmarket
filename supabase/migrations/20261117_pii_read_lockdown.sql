-- =====================================================================
-- 20261117_pii_read_lockdown.sql
--
-- Closes two live data leaks, found by diffing the RLS policies against
-- the column privileges the API actually grants.
--
-- ---------------------------------------------------------------------
-- LEAK 1 (critical) -- public.profiles
-- ---------------------------------------------------------------------
-- Policy "Public can view profiles" was `FOR SELECT USING (true)` with
-- roles={public}, AND role `authenticated` held TABLE-level SELECT
-- (a table-level grant overrides any column-level REVOKE, so revoking
-- individual columns alone did nothing -- verified the hard way).
--
-- Verified on production before the fix: an ordinary signed-in user
-- read 44 of 44 profiles including 44 emails, 44 phone numbers and 44
-- wallet balances. Any registered account could dump the entire
-- customer base's contact details and finances.
--
-- After the fix, as `authenticated`:
--   select email from public.profiles limit 1;
--   -> ERROR 42501: permission denied for table profiles
--
-- Fix:
--   1. Drop the blanket `USING (true)` policy.
--   2. REVOKE table-level SELECT from `authenticated`.
--   3. GRANT column-level SELECT on the safe columns only.
-- Reads of one's own row go through get_my_profile()
-- (SECURITY DEFINER, `WHERE p.id = auth.uid()`, execute granted to
-- authenticated).
--
-- ---------------------------------------------------------------------
-- LEAK 2 (high) -- public.tournament_participants
-- ---------------------------------------------------------------------
-- Policy "Public can view tournament participants" is USING (true) and
-- `authenticated` held table-level SELECT, exposing every participant's
-- phone_number. The app's own sanitizer excludes phone_number because
-- "the roster is world-readable" -- the DB was handing out the column
-- the application deliberately withholds.
--
-- Fix: REVOKE table-level SELECT from authenticated, then GRANT
-- column-level SELECT on everything EXCEPT phone_number.
--
-- ---------------------------------------------------------------------
-- DELIBERATELY NOT CHANGED
-- ---------------------------------------------------------------------
--   * reviews UPDATE/DELETE held by authenticated/anon. Revoking needs an
--     app-side review-reply redesign; flagged, not silently altered.
--   * Wallet WRITES were already safe: protect_sensitive_profile_fields()
--     resets available_balance/escrow_balance/role/is_verified_seller/
--     seller_rating/completed_sales_count for every non-admin caller.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- LEAK 1: profiles
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;

REVOKE SELECT ON public.profiles FROM authenticated;
REVOKE SELECT ON public.profiles FROM anon;

GRANT SELECT (
  id,
  username,
  first_name,
  last_name,
  avatar_url,
  bio,
  country,
  role,
  is_verified_seller,
  is_suspended,
  seller_rating,
  total_reviews_count,
  completed_sales_count,
  created_at,
  updated_at,
  deleted_at
) ON public.profiles TO authenticated;

-- anon keeps exactly the columns it already had (public storefronts).
GRANT SELECT (
  id,
  username,
  first_name,
  last_name,
  avatar_url,
  bio,
  country,
  role,
  is_verified_seller,
  is_suspended,
  seller_rating,
  total_reviews_count,
  completed_sales_count,
  created_at,
  updated_at,
  deleted_at
) ON public.profiles TO anon;

-- ---------------------------------------------------------------------
-- LEAK 2: tournament_participants
-- ---------------------------------------------------------------------
REVOKE SELECT ON public.tournament_participants FROM authenticated;
REVOKE SELECT ON public.tournament_participants FROM anon;

GRANT SELECT (
  id,
  tournament_id,
  user_id,
  gamer_tag,
  friend_id,
  payment_status,
  payment_method,
  amount_paid,
  seed,
  created_at
) ON public.tournament_participants TO authenticated;

GRANT SELECT (
  id,
  tournament_id,
  user_id,
  gamer_tag,
  friend_id,
  payment_status,
  payment_method,
  amount_paid,
  seed,
  created_at
) ON public.tournament_participants TO anon;

COMMIT;
