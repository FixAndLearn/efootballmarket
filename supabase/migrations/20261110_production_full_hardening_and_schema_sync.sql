-- ============================================================================
-- eFootballMarket Kenya — Production Full Hardening & Schema Synchronization
-- Applied to live Supabase project `fdnflvbknoopethbihns` (juleseantigravityefootball)
-- Date: 2026-11-10
-- ============================================================================

-- 1. Sync admin roles & harden admin RBAC functions
INSERT INTO public.user_roles (user_id, role_id)
SELECT id, 'super_admin' FROM public.profiles WHERE role = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id)
SELECT id, 'admin' FROM public.profiles WHERE role = 'admin'
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN (
    NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_suspended = TRUE
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role_id IN ('admin', 'super_admin')
      )
      OR EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = auth.uid()
          AND lower(u.email) IN ('brianokibo@gmail.com')
      )
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN public.is_admin_user();
END;
$$;

-- 2. Protect sensitive profile fields from non-admin client updates
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_jwt_role text := COALESCE(auth.role(), '');
  v_internal text := COALESCE(current_setting('app.internal_ledger_op', true), '');
BEGIN
  IF v_jwt_role = 'service_role'
     OR v_internal = 'true'
     OR (v_jwt_role = '' AND current_user IN ('postgres', 'supabase_admin'))
     OR public.is_admin_user() THEN
    RETURN NEW;
  END IF;

  NEW.role := OLD.role;
  NEW.available_balance := OLD.available_balance;
  NEW.escrow_balance := OLD.escrow_balance;
  NEW.is_verified_seller := OLD.is_verified_seller;
  NEW.seller_rating := OLD.seller_rating;
  NEW.total_reviews_count := OLD.total_reviews_count;
  NEW.completed_sales_count := OLD.completed_sales_count;
  NEW.is_suspended := OLD.is_suspended;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_sensitive_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_sensitive_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_profile_fields();

-- 3. Collision-safe handle_new_user() trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_raw_username TEXT;
  v_username TEXT;
  v_clean_id TEXT;
BEGIN
  PERFORM set_config('app.internal_ledger_op', 'true', true);
  v_clean_id := substr(replace(NEW.id::text, '-', ''), 1, 6);

  v_raw_username := lower(regexp_replace(
    COALESCE(
      NULLIF(btrim(NEW.raw_user_meta_data->>'username'), ''),
      NULLIF(btrim(NEW.raw_user_meta_data->>'user_name'), ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      'trader_' || v_clean_id
    ),
    '[^a-z0-9_]', '', 'g'
  ));

  IF length(v_raw_username) < 3 THEN
    v_raw_username := 'trader_' || v_clean_id;
  END IF;
  v_raw_username := left(v_raw_username, 24);

  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_raw_username AND id <> NEW.id) THEN
    v_username := left(v_raw_username, 20) || '_' || v_clean_id;
  ELSE
    v_username := v_raw_username;
  END IF;

  BEGIN
    INSERT INTO public.profiles (
      id, username, first_name, last_name, phone_number, country, email, role
    )
    VALUES (
      NEW.id,
      v_username,
      COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'first_name'), ''), NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''), split_part(COALESCE(NEW.email, 'Trader'), '@', 1), 'Trader'),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
      'KEN',
      NEW.email,
      'user'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = COALESCE(EXCLUDED.email, public.profiles.email);
  EXCEPTION WHEN unique_violation THEN
    INSERT INTO public.profiles (
      id, username, first_name, last_name, phone_number, country, email, role
    )
    VALUES (
      NEW.id,
      'trader_' || substr(replace(NEW.id::text, '-', ''), 1, 10),
      COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'first_name'), ''), 'Trader'),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
      'KEN',
      NEW.email,
      'user'
    )
    ON CONFLICT (id) DO NOTHING;
  END;

  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (NEW.id, 'buyer')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- 4. Schema extensions for listings, listing_offers, middleman_deals, scammer_reports, wanted_requests
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS allows_swap boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS swap_preferences text;

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_status_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_status_check
  CHECK ((status)::text = ANY (ARRAY[
    'draft', 'pending_review', 'published', 'in_escrow', 'sold', 'archived', 'suspended', 'cancelled'
  ]));

ALTER TABLE public.listing_offers
  ALTER COLUMN buyer_id DROP NOT NULL,
  ALTER COLUMN offer_amount SET DEFAULT 0,
  ADD COLUMN IF NOT EXISTS buyer_name varchar(120),
  ADD COLUMN IF NOT EXISTS buyer_phone varchar(40),
  ADD COLUMN IF NOT EXISTS offered_price numeric,
  ADD COLUMN IF NOT EXISTS original_price numeric,
  ADD COLUMN IF NOT EXISTS discount_percentage integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS counter_price numeric,
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

CREATE TABLE IF NOT EXISTS public.middleman_deals (
  id varchar(80) PRIMARY KEY,
  deal_code varchar(40) NOT NULL UNIQUE,
  buyer_name varchar(120) NOT NULL,
  buyer_phone varchar(40) NOT NULL,
  seller_name varchar(120) NOT NULL DEFAULT 'Trader',
  seller_phone varchar(40) NOT NULL,
  deal_title varchar(200) NOT NULL,
  deal_description text,
  item_amount_kes numeric NOT NULL CHECK (item_amount_kes >= 100),
  escrow_fee_kes numeric NOT NULL DEFAULT 50 CHECK (escrow_fee_kes >= 0),
  total_amount_kes numeric NOT NULL CHECK (total_amount_kes >= 100),
  status varchar(40) NOT NULL DEFAULT 'awaiting_payment'
    CHECK (status IN ('awaiting_payment', 'escrow_locked', 'seller_delivering', 'buyer_verifying', 'completed', 'disputed', 'cancelled')),
  till_number varchar(20) NOT NULL DEFAULT '1572931',
  mpesa_receipt varchar(40),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);
ALTER TABLE public.middleman_deals ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.scammer_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number varchar(40),
  username_alias varchar(120),
  platform_source varchar(80) DEFAULT 'WhatsApp / Off-Platform',
  incident_summary text NOT NULL,
  amount_scammed_kes numeric CHECK (amount_scammed_kes IS NULL OR amount_scammed_kes >= 0),
  evidence_notes text,
  reporter_contact varchar(120),
  verified_status varchar(32) NOT NULL DEFAULT 'pending'
    CHECK (verified_status IN ('pending', 'verified', 'dismissed', 'appealed_removed')),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);
ALTER TABLE public.scammer_reports ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.wanted_requests (
  id varchar(80) PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  buyer_name varchar(120) NOT NULL,
  buyer_phone varchar(40) NOT NULL,
  title varchar(200) NOT NULL,
  description text,
  min_overall_rating integer NOT NULL DEFAULT 3000,
  target_playstyle varchar(40) NOT NULL DEFAULT 'quick_counter',
  preferred_platform varchar(40) NOT NULL DEFAULT 'android',
  budget_kes numeric NOT NULL CHECK (budget_kes > 0),
  key_players_wanted text[] NOT NULL DEFAULT '{}',
  status varchar(32) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'fulfilled', 'closed', 'archived')),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);
ALTER TABLE public.wanted_requests ENABLE ROW LEVEL SECURITY;
