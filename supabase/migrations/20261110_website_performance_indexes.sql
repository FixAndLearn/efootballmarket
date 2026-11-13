-- Website & Marketplace Hot-Path Foreign Key + Search Indexes
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_order
  ON public.listing_images (listing_id, display_order);

CREATE INDEX IF NOT EXISTS idx_listing_offers_listing_status
  ON public.listing_offers (listing_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listing_offers_seller_status
  ON public.listing_offers (seller_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listing_offers_buyer
  ON public.listing_offers (buyer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_seller_created
  ON public.reviews (seller_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_listing
  ON public.orders (listing_id);

CREATE INDEX IF NOT EXISTS idx_favorites_listing
  ON public.favorites (listing_id);

CREATE INDEX IF NOT EXISTS idx_listing_credentials_listing
  ON public.listing_credentials (listing_id);

CREATE INDEX IF NOT EXISTS idx_escrow_accounts_buyer
  ON public.escrow_accounts (buyer_id);

CREATE INDEX IF NOT EXISTS idx_escrow_accounts_seller
  ON public.escrow_accounts (seller_id);

CREATE INDEX IF NOT EXISTS idx_escrow_transactions_escrow
  ON public.escrow_transactions (escrow_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listings_published_active
  ON public.listings (created_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_listings_key_players_gin
  ON public.listings USING gin (key_players_list);

CREATE OR REPLACE FUNCTION public.immutable_text_array_join(arr text[])
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT COALESCE(array_to_string(arr, ' '), '');
$$;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS player_search_text text
  GENERATED ALWAYS AS (public.immutable_text_array_join(key_players_list)) STORED;

CREATE INDEX IF NOT EXISTS idx_listings_trgm_players
  ON public.listings USING gin (player_search_text gin_trgm_ops);
