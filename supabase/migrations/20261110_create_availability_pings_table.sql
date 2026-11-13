-- ============================================================================
-- eFootballMarket Kenya — Direct Seller Phone Availability Pings
-- Applied to live Supabase project `fdnflvbknoopethbihns`
-- Date: 2026-11-10
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.availability_pings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  buyer_name varchar(120),
  buyer_phone varchar(40),
  status varchar(24) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'available', 'unavailable')),
  seller_note varchar(240),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_availability_pings_seller
  ON public.availability_pings (seller_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_availability_pings_listing
  ON public.availability_pings (listing_id, created_at DESC);

ALTER TABLE public.availability_pings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parties or admin view availability pings" ON public.availability_pings;
CREATE POLICY "Parties or admin view availability pings" ON public.availability_pings
  FOR SELECT TO authenticated
  USING (
    seller_id = auth.uid()
    OR buyer_id = auth.uid()
    OR public.is_admin_user()
  );

DROP POLICY IF EXISTS "Sellers or admin update availability pings" ON public.availability_pings;
CREATE POLICY "Sellers or admin update availability pings" ON public.availability_pings
  FOR UPDATE TO authenticated
  USING (seller_id = auth.uid() OR public.is_admin_user())
  WITH CHECK (seller_id = auth.uid() OR public.is_admin_user());
