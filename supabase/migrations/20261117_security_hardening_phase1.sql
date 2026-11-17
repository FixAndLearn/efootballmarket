-- ============================================================================
-- 20261117_security_hardening_phase1
-- Fixes: (1) anonymous PII exposure on profiles, (2) anonymous phone exposure on
--        tournament_participants, (3) broken storage moderation (no UPDATE/DELETE
--        policy on storage.objects), (4) adds get_my_profile() RPC so authenticated
--        users can read their OWN sensitive row without a blanket table grant.
--
-- SAFE-BY-CONSTRUCTION: only removes privileges from `anon` (never granted PII use
-- by the app) and adds one new function + two storage policies. No data is touched.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. profiles: stop anonymous reads of PII / wallet columns
--    Table-level SELECT implies every column, so revoke table-level and re-grant
--    only the columns the public storefront actually uses
--    (PUBLIC_SELLER_PROFILE_SELECT + deleted_at for RLS predicates).
-- ---------------------------------------------------------------------------
REVOKE SELECT ON public.profiles FROM anon;

GRANT SELECT (
  id,
  username,
  first_name,
  last_name,
  country,
  avatar_url,
  bio,
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

-- Anon can never write profiles.
REVOKE INSERT, UPDATE, REFERENCES ON public.profiles FROM anon;

-- ---------------------------------------------------------------------------
-- 2. tournament_participants: phone_number was world-readable
-- ---------------------------------------------------------------------------
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
) ON public.tournament_participants TO anon;

-- ---------------------------------------------------------------------------
-- 3. get_my_profile(): the caller's own full row, without a blanket grant.
--    Server routes keep using the service-role client; this is for the
--    authenticated browser client (useAuth, profile page).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $fn$
  SELECT p.*
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1;
$fn$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. storage.objects: only INSERT + SELECT existed, so admins could not delete
--    or replace listing images (illegal-content takedown was impossible).
--    Bucket stays public-read; writes are scoped to the owning auth.uid() folder.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Owner can update own listing images" ON storage.objects;
CREATE POLICY "Owner can update own listing images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Owner can delete own listing images" ON storage.objects;
CREATE POLICY "Owner can delete own listing images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

COMMIT;
