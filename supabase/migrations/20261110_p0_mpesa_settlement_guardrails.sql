-- Fail-closed M-Pesa settlement guardrails.
-- Apply only to the explicitly authorized, schema-reviewed Supabase project.
-- Do not infer staging/production from a project ref; the transaction aborts on receipt collisions.
BEGIN;

CREATE TABLE IF NOT EXISTS public.mpesa_settlement_receipts (
  receipt_number text PRIMARY KEY
    CHECK (receipt_number ~ '^[A-Z0-9]{8,12}$' AND receipt_number <> 'CONFIRMED'),
  source text NOT NULL CHECK (source IN ('marketplace', 'tournament')),
  entity_id text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('safaricom', 'unifiedpay', 'legacy')),
  verification_method text NOT NULL CHECK (verification_method IN (
    'provider_status_query', 'authenticated_callback_and_status_query', 'legacy'
  )),
  CONSTRAINT mpesa_settlement_receipts_evidence_pair_check CHECK (
    (provider = 'unifiedpay' AND verification_method = 'provider_status_query')
    OR (provider = 'safaricom' AND verification_method = 'authenticated_callback_and_status_query')
    OR (provider = 'legacy' AND verification_method = 'legacy')
  ),
  transaction_id text NOT NULL,
  amount numeric(14, 2) CHECK (amount IS NULL OR amount > 0),
  verified_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS mpesa_settlement_receipts_source_entity_uidx
  ON public.mpesa_settlement_receipts (source, entity_id);

ALTER TABLE public.mpesa_settlement_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mpesa_settlement_receipts FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.mpesa_settlement_receipts TO service_role;

-- Do not silently pick a winner if historical rows already reuse a receipt.
DO $$
BEGIN
  IF EXISTS (
    SELECT receipt_number
    FROM (
      SELECT upper(btrim(mpesa_receipt_number)) AS receipt_number
      FROM public.payments
      WHERE mpesa_receipt_number IS NOT NULL
        AND upper(btrim(mpesa_receipt_number)) ~ '^[A-Z0-9]{8,12}$'
        AND upper(btrim(mpesa_receipt_number)) <> 'CONFIRMED'
      UNION ALL
      SELECT upper(btrim(mpesa_receipt_number)) AS receipt_number
      FROM public.tournament_payments
      WHERE mpesa_receipt_number IS NOT NULL
        AND upper(btrim(mpesa_receipt_number)) ~ '^[A-Z0-9]{8,12}$'
        AND upper(btrim(mpesa_receipt_number)) <> 'CONFIRMED'
    ) AS all_receipts
    GROUP BY receipt_number
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate historical M-Pesa receipt exists; reconcile before applying settlement guardrails.';
  END IF;
END;
$$;

-- Reserve existing successful receipts, including legacy/manual records, so they
-- cannot be replayed against another payment after rollout. These rows are marked
-- legacy until fresh provider evidence confirms the same receipt for the same ledger.
INSERT INTO public.mpesa_settlement_receipts (
  receipt_number, source, entity_id, provider, verification_method, transaction_id, amount, verified_at
)
SELECT
  upper(btrim(p.mpesa_receipt_number)),
  'marketplace',
  p.id::text,
  'legacy',
  'legacy',
  coalesce(nullif(p.checkout_request_id::text, ''), nullif(p.merchant_request_id::text, ''), p.id::text),
  CASE WHEN p.amount > 0 THEN round(p.amount::numeric, 2) ELSE NULL END,
  coalesce(p.completed_at, p.created_at, now())
FROM public.payments p
WHERE p.status = 'completed'
  AND p.mpesa_receipt_number IS NOT NULL
  AND upper(btrim(p.mpesa_receipt_number)) ~ '^[A-Z0-9]{8,12}$'
  AND upper(btrim(p.mpesa_receipt_number)) <> 'CONFIRMED'
ON CONFLICT (receipt_number) DO NOTHING;

INSERT INTO public.mpesa_settlement_receipts (
  receipt_number, source, entity_id, provider, verification_method, transaction_id, amount, verified_at
)
SELECT
  upper(btrim(tp.mpesa_receipt_number)),
  'tournament',
  tp.id::text,
  'legacy',
  'legacy',
  coalesce(nullif(tp.checkout_request_id::text, ''), nullif(tp.merchant_request_id::text, ''), tp.id::text),
  CASE WHEN tp.amount > 0 THEN round(tp.amount::numeric, 2) ELSE NULL END,
  coalesce(tp.updated_at, tp.created_at, now())
FROM public.tournament_payments tp
WHERE tp.status = 'completed'
  AND tp.mpesa_receipt_number IS NOT NULL
  AND upper(btrim(tp.mpesa_receipt_number)) ~ '^[A-Z0-9]{8,12}$'
  AND upper(btrim(tp.mpesa_receipt_number)) <> 'CONFIRMED'
ON CONFLICT (receipt_number) DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS payments_mpesa_receipt_uidx
  ON public.payments (upper(btrim(mpesa_receipt_number)))
  WHERE mpesa_receipt_number IS NOT NULL
    AND upper(btrim(mpesa_receipt_number)) ~ '^[A-Z0-9]{8,12}$'
    AND upper(btrim(mpesa_receipt_number)) <> 'CONFIRMED';

CREATE UNIQUE INDEX IF NOT EXISTS tournament_payments_mpesa_receipt_uidx
  ON public.tournament_payments (upper(btrim(mpesa_receipt_number)))
  WHERE mpesa_receipt_number IS NOT NULL
    AND upper(btrim(mpesa_receipt_number)) ~ '^[A-Z0-9]{8,12}$'
    AND upper(btrim(mpesa_receipt_number)) <> 'CONFIRMED';

-- Prevent direct API updates from bypassing the atomic settlement functions.
CREATE OR REPLACE FUNCTION public.guard_mpesa_payment_completion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  IF current_setting('app.mpesa_settlement', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF lower(btrim(coalesce(NEW.payment_method, ''))) LIKE 'mpesa%'
       AND NEW.status = 'completed' THEN
      RAISE EXCEPTION 'M-Pesa payments must be settled through the provider-confirmed settlement function.';
    END IF;
    RETURN NEW;
  END IF;

  IF lower(btrim(coalesce(OLD.payment_method, ''))) LIKE 'mpesa%'
     AND NEW.payment_method IS DISTINCT FROM OLD.payment_method THEN
    RAISE EXCEPTION 'M-Pesa payment method cannot be changed outside the settlement function.';
  END IF;

  IF NEW.status = 'completed'
     AND lower(btrim(coalesce(NEW.payment_method, ''))) LIKE 'mpesa%'
     AND (OLD.status IS DISTINCT FROM 'completed'
          OR OLD.payment_method IS DISTINCT FROM NEW.payment_method) THEN
    RAISE EXCEPTION 'M-Pesa payments must be settled through the provider-confirmed settlement function.';
  END IF;

  IF OLD.status = 'completed'
     AND lower(btrim(coalesce(OLD.payment_method, ''))) LIKE 'mpesa%'
     AND (NEW.status IS DISTINCT FROM OLD.status
          OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
          OR NEW.mpesa_receipt_number IS DISTINCT FROM OLD.mpesa_receipt_number
          OR NEW.amount IS DISTINCT FROM OLD.amount
          OR NEW.currency IS DISTINCT FROM OLD.currency
          OR NEW.checkout_request_id IS DISTINCT FROM OLD.checkout_request_id
          OR NEW.merchant_request_id IS DISTINCT FROM OLD.merchant_request_id
          OR NEW.order_id IS DISTINCT FROM OLD.order_id) THEN
    RAISE EXCEPTION 'Completed M-Pesa settlement ledger fields are immutable.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_order_escrow_lock()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  IF coalesce(current_setting('app.mpesa_settlement', true), '') <> 'true'
     AND OLD.status = 'payment_pending'
     AND NEW.status = 'escrow_locked' THEN
    RAISE EXCEPTION 'Orders may enter escrow only through a provider-confirmed settlement.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_escrow_funding()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  IF coalesce(current_setting('app.mpesa_settlement', true), '') <> 'true'
     AND OLD.escrow_state IS DISTINCT FROM 'waiting_for_seller'
     AND NEW.escrow_state = 'waiting_for_seller' THEN
    RAISE EXCEPTION 'Escrow may be funded only through a provider-confirmed settlement.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_mpesa_listing_lock()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  IF coalesce(current_setting('app.mpesa_settlement', true), '') <> 'true'
     AND OLD.status = 'published'
     AND NEW.status = 'in_escrow' THEN
    RAISE EXCEPTION 'Listings may enter escrow only through a provider-confirmed settlement.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_tournament_payment_completion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  IF current_setting('app.mpesa_settlement', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'completed' THEN
      RAISE EXCEPTION 'Tournament payments must be settled through the provider-confirmed settlement function.';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'Tournament payments must be settled through the provider-confirmed settlement function.';
  END IF;

  IF OLD.status = 'completed'
     AND (NEW.status IS DISTINCT FROM OLD.status
          OR NEW.tournament_id IS DISTINCT FROM OLD.tournament_id
          OR NEW.user_id IS DISTINCT FROM OLD.user_id
          OR NEW.gamer_tag IS DISTINCT FROM OLD.gamer_tag
          OR NEW.friend_id IS DISTINCT FROM OLD.friend_id
          OR NEW.phone_number IS DISTINCT FROM OLD.phone_number
          OR NEW.amount IS DISTINCT FROM OLD.amount
          OR NEW.checkout_request_id IS DISTINCT FROM OLD.checkout_request_id
          OR NEW.merchant_request_id IS DISTINCT FROM OLD.merchant_request_id
          OR NEW.mpesa_receipt_number IS DISTINCT FROM OLD.mpesa_receipt_number) THEN
    RAISE EXCEPTION 'Completed tournament settlement ledger fields are immutable.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_mpesa_tournament_participant()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  IF current_setting('app.mpesa_settlement', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF lower(btrim(coalesce(NEW.payment_method, ''))) LIKE 'mpesa%'
       AND NEW.payment_status = 'paid' THEN
      RAISE EXCEPTION 'Paid M-Pesa tournament entries require provider-confirmed settlement.';
    END IF;
    RETURN NEW;
  END IF;

  IF (lower(btrim(coalesce(OLD.payment_method, ''))) LIKE 'mpesa%'
      OR lower(btrim(coalesce(NEW.payment_method, ''))) LIKE 'mpesa%')
     AND NEW.payment_method IS DISTINCT FROM OLD.payment_method THEN
    RAISE EXCEPTION 'M-Pesa tournament payment method cannot be changed outside settlement.';
  END IF;

  IF (lower(btrim(coalesce(OLD.payment_method, ''))) LIKE 'mpesa%'
      OR lower(btrim(coalesce(NEW.payment_method, ''))) LIKE 'mpesa%')
     AND NEW.payment_status = 'paid'
     AND OLD.payment_status IS DISTINCT FROM 'paid' THEN
    RAISE EXCEPTION 'Paid M-Pesa tournament entries require provider-confirmed settlement.';
  END IF;

  IF OLD.payment_status = 'paid'
     AND lower(btrim(coalesce(OLD.payment_method, ''))) LIKE 'mpesa%'
     AND (NEW.payment_status IS DISTINCT FROM OLD.payment_status
          OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
          OR NEW.amount_paid IS DISTINCT FROM OLD.amount_paid
          OR NEW.tournament_id IS DISTINCT FROM OLD.tournament_id
          OR NEW.user_id IS DISTINCT FROM OLD.user_id
          OR NEW.friend_id IS DISTINCT FROM OLD.friend_id) THEN
    RAISE EXCEPTION 'Completed M-Pesa tournament participant ledger fields are immutable.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_mpesa_payment_completion ON public.payments;
CREATE TRIGGER trg_guard_mpesa_payment_completion
BEFORE INSERT OR UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.guard_mpesa_payment_completion();

DROP TRIGGER IF EXISTS trg_guard_order_escrow_lock ON public.orders;
CREATE TRIGGER trg_guard_order_escrow_lock
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.guard_order_escrow_lock();

DROP TRIGGER IF EXISTS trg_guard_escrow_funding ON public.escrow_accounts;
CREATE TRIGGER trg_guard_escrow_funding
BEFORE UPDATE ON public.escrow_accounts
FOR EACH ROW EXECUTE FUNCTION public.guard_escrow_funding();

DROP TRIGGER IF EXISTS trg_guard_mpesa_listing_lock ON public.listings;
CREATE TRIGGER trg_guard_mpesa_listing_lock
BEFORE UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.guard_mpesa_listing_lock();

DROP TRIGGER IF EXISTS trg_guard_tournament_payment_completion ON public.tournament_payments;
CREATE TRIGGER trg_guard_tournament_payment_completion
BEFORE INSERT OR UPDATE ON public.tournament_payments
FOR EACH ROW EXECUTE FUNCTION public.guard_tournament_payment_completion();

DROP TRIGGER IF EXISTS trg_guard_mpesa_tournament_participant ON public.tournament_participants;
CREATE TRIGGER trg_guard_mpesa_tournament_participant
BEFORE INSERT OR UPDATE ON public.tournament_participants
FOR EACH ROW EXECUTE FUNCTION public.guard_mpesa_tournament_participant();

-- Marketplace settlement is one transaction: global receipt claim, payment row,
-- order, escrow ledger, listing, and seller balance either all commit or all roll back.
CREATE OR REPLACE FUNCTION public.settle_mpesa_marketplace_payment(
  p_payment_id text,
  p_receipt_number text,
  p_amount numeric,
  p_provider text,
  p_verification_method text,
  p_transaction_id text,
  p_verified_at timestamptz,
  p_raw_callback jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_escrow public.escrow_accounts%ROWTYPE;
  v_listing public.listings%ROWTYPE;
  v_claim public.mpesa_settlement_receipts%ROWTYPE;
  v_receipt text := upper(btrim(coalesce(p_receipt_number, '')));
  v_rows integer;
BEGIN
  IF v_receipt !~ '^[A-Z0-9]{8,12}$' OR v_receipt = 'CONFIRMED' THEN
    RAISE EXCEPTION 'Invalid M-Pesa receipt.';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR round(p_amount, 2) <> p_amount THEN
    RAISE EXCEPTION 'Invalid M-Pesa settlement amount.';
  END IF;
  IF p_provider IS NULL OR p_provider NOT IN ('safaricom', 'unifiedpay') THEN
    RAISE EXCEPTION 'Unsupported M-Pesa provider.';
  END IF;
  IF (p_provider = 'unifiedpay' AND p_verification_method IS DISTINCT FROM 'provider_status_query')
     OR (p_provider = 'safaricom' AND p_verification_method IS DISTINCT FROM 'authenticated_callback_and_status_query') THEN
    RAISE EXCEPTION 'Provider verification evidence is incomplete or mismatched.';
  END IF;
  IF p_transaction_id IS NULL OR p_transaction_id !~ '^[A-Za-z0-9_-]{1,80}$' THEN
    RAISE EXCEPTION 'Invalid M-Pesa transaction ID.';
  END IF;
  IF p_verified_at IS NULL OR p_verified_at > now() + interval '1 minute' THEN
    RAISE EXCEPTION 'Invalid provider verification timestamp.';
  END IF;

  SELECT p.* INTO v_payment
  FROM public.payments p
  WHERE p.id::text = p_payment_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found.';
  END IF;
  IF lower(btrim(coalesce(v_payment.payment_method, ''))) NOT LIKE 'mpesa%'
     OR v_payment.order_id IS NULL THEN
    RAISE EXCEPTION 'Payment is not an M-Pesa marketplace payment.';
  END IF;

  SELECT o.* INTO v_order
  FROM public.orders o
  WHERE o.id = v_payment.order_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment order not found.';
  END IF;
  IF round(v_payment.amount::numeric, 2) <> round(p_amount, 2)
     OR round(v_order.total_amount::numeric, 2) <> round(p_amount, 2) THEN
    RAISE EXCEPTION 'Provider-confirmed amount does not match the payment and order.';
  END IF;
  IF p_transaction_id <> coalesce(v_payment.checkout_request_id::text, '')
     AND p_transaction_id <> coalesce(v_payment.merchant_request_id::text, '') THEN
    RAISE EXCEPTION 'Provider transaction ID does not match the payment ledger.';
  END IF;

  SELECT e.* INTO v_escrow
  FROM public.escrow_accounts e
  WHERE e.order_id = v_order.id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escrow ledger not found.';
  END IF;
  SELECT l.* INTO v_listing
  FROM public.listings l
  WHERE l.id = v_order.listing_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment listing not found.';
  END IF;

  IF round(v_escrow.gross_amount::numeric, 2) IS DISTINCT FROM round(v_order.total_amount::numeric, 2)
     OR round(v_escrow.fee_amount::numeric, 2) IS DISTINCT FROM round(v_order.platform_fee::numeric, 2)
     OR round(v_escrow.net_amount::numeric, 2) IS DISTINCT FROM round(v_order.seller_net_amount::numeric, 2)
     OR round(v_order.platform_fee::numeric + v_order.seller_net_amount::numeric, 2)
        IS DISTINCT FROM round(v_order.total_amount::numeric, 2)
     OR v_escrow.buyer_id IS DISTINCT FROM v_order.buyer_id
     OR v_escrow.seller_id IS DISTINCT FROM v_order.seller_id
     OR v_listing.seller_id IS DISTINCT FROM v_order.seller_id
     OR upper(btrim(coalesce(v_escrow.currency, ''))) IS DISTINCT FROM 'KES'
     OR upper(btrim(coalesce(v_order.currency, ''))) IS DISTINCT FROM 'KES'
     OR upper(btrim(coalesce(v_payment.currency, ''))) IS DISTINCT FROM 'KES'
     OR upper(btrim(coalesce(v_listing.currency, ''))) IS DISTINCT FROM 'KES' THEN
    RAISE EXCEPTION 'Payment, order, listing, and escrow ledger do not match.';
  END IF;

  IF v_payment.status = 'completed' THEN
    IF v_order.status IS NULL
       OR v_order.status = 'payment_pending'
       OR v_escrow.escrow_state IS NULL
       OR v_escrow.escrow_state IN ('pending', 'payment_initiated', 'payment_received')
       OR v_listing.status IS NULL
       OR v_listing.status = 'published' THEN
      RAISE EXCEPTION 'Completed payment does not have a settled escrow ledger.';
    END IF;
    IF upper(btrim(coalesce(v_payment.mpesa_receipt_number, ''))) <> v_receipt THEN
      RAISE EXCEPTION 'Completed payment has a different receipt.';
    END IF;

    SELECT r.* INTO v_claim
    FROM public.mpesa_settlement_receipts r
    WHERE r.receipt_number = v_receipt
    FOR UPDATE;
    IF NOT FOUND THEN
      INSERT INTO public.mpesa_settlement_receipts (
        receipt_number, source, entity_id, provider, verification_method, transaction_id, amount, verified_at
      ) VALUES (
        v_receipt, 'marketplace', v_payment.id::text, p_provider, p_verification_method, p_transaction_id, round(p_amount, 2), p_verified_at
      );
    ELSE
      IF v_claim.source <> 'marketplace' OR v_claim.entity_id <> v_payment.id::text
         OR (v_claim.amount IS NOT NULL AND round(v_claim.amount, 2) <> round(p_amount, 2)) THEN
        RAISE EXCEPTION 'M-Pesa receipt is already reserved for another settlement.';
      END IF;
      IF v_claim.provider = 'legacy' THEN
        UPDATE public.mpesa_settlement_receipts
        SET provider = p_provider,
            verification_method = p_verification_method,
            transaction_id = p_transaction_id,
            amount = round(p_amount, 2),
            verified_at = p_verified_at
        WHERE receipt_number = v_receipt;
      ELSIF v_claim.provider IS DISTINCT FROM p_provider
         OR v_claim.verification_method IS DISTINCT FROM p_verification_method
         OR v_claim.transaction_id IS DISTINCT FROM p_transaction_id
         OR v_claim.amount IS DISTINCT FROM round(p_amount, 2) THEN
        RAISE EXCEPTION 'M-Pesa receipt verification does not match the existing claim.';
      END IF;
    END IF;

    RETURN jsonb_build_object(
      'success', true,
      'already_settled', true,
      'receipt_number', v_receipt
    );
  END IF;

  IF v_payment.status NOT IN ('pending', 'failed') THEN
    RAISE EXCEPTION 'Payment is not in a payable state.';
  END IF;
  IF v_order.status IS DISTINCT FROM 'payment_pending' THEN
    RAISE EXCEPTION 'Order is not awaiting payment.';
  END IF;
  IF v_listing.status IS DISTINCT FROM 'published' THEN
    RAISE EXCEPTION 'Listing is no longer available for escrow.';
  END IF;

  SELECT r.* INTO v_claim
  FROM public.mpesa_settlement_receipts r
  WHERE r.receipt_number = v_receipt
  FOR UPDATE;
  IF FOUND THEN
    IF v_claim.source <> 'marketplace' OR v_claim.entity_id <> v_payment.id::text
       OR (v_claim.amount IS NOT NULL AND round(v_claim.amount, 2) <> round(p_amount, 2)) THEN
      RAISE EXCEPTION 'M-Pesa receipt is already reserved for another settlement.';
    END IF;
    IF v_claim.provider = 'legacy' THEN
      UPDATE public.mpesa_settlement_receipts
      SET provider = p_provider,
          verification_method = p_verification_method,
          transaction_id = p_transaction_id,
          amount = round(p_amount, 2),
          verified_at = p_verified_at
      WHERE receipt_number = v_receipt;
    ELSIF v_claim.provider IS DISTINCT FROM p_provider
       OR v_claim.verification_method IS DISTINCT FROM p_verification_method
       OR v_claim.transaction_id IS DISTINCT FROM p_transaction_id
       OR v_claim.amount IS DISTINCT FROM round(p_amount, 2) THEN
      RAISE EXCEPTION 'M-Pesa receipt verification does not match the existing claim.';
    END IF;
  ELSE
    INSERT INTO public.mpesa_settlement_receipts (
      receipt_number, source, entity_id, provider, verification_method, transaction_id, amount, verified_at
    ) VALUES (
      v_receipt, 'marketplace', v_payment.id::text, p_provider, p_verification_method, p_transaction_id, round(p_amount, 2), p_verified_at
    );
  END IF;

  PERFORM set_config('app.mpesa_settlement', 'true', true);
  PERFORM set_config('app.internal_ledger_op', 'true', true);

  UPDATE public.payments
  SET status = 'completed',
      mpesa_receipt_number = v_receipt,
      result_code = 0,
      result_desc = 'Provider-confirmed payment completed successfully',
      raw_callback = coalesce(p_raw_callback, '{}'::jsonb),
      completed_at = now()
  WHERE id = v_payment.id
    AND status IN ('pending', 'failed');
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Payment state changed during settlement.';
  END IF;

  UPDATE public.orders
  SET status = 'escrow_locked', updated_at = now()
  WHERE id = v_order.id AND status = 'payment_pending';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Order could not be locked in escrow.';
  END IF;

  UPDATE public.escrow_accounts
  SET escrow_state = 'waiting_for_seller', updated_at = now()
  WHERE order_id = v_order.id
    AND escrow_state IN ('pending', 'payment_initiated');
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Escrow ledger is missing or not payable.';
  END IF;

  UPDATE public.listings
  SET status = 'in_escrow', updated_at = now()
  WHERE id = v_order.listing_id AND status = 'published';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Listing is no longer available for escrow.';
  END IF;

  UPDATE public.profiles
  SET escrow_balance = coalesce(escrow_balance, 0) + coalesce(v_order.seller_net_amount, v_order.total_amount),
      updated_at = now()
  WHERE id = v_order.seller_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Seller ledger could not be updated.';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'already_settled', false,
    'receipt_number', v_receipt
  );
END;
$$;

-- Tournament receipt claim, payment completion, participant insertion, and count
-- increment are committed atomically as one transaction.
CREATE OR REPLACE FUNCTION public.settle_mpesa_tournament_payment(
  p_tournament_payment_id text,
  p_receipt_number text,
  p_amount numeric,
  p_provider text,
  p_verification_method text,
  p_transaction_id text,
  p_verified_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_payment public.tournament_payments%ROWTYPE;
  v_tournament public.tournaments%ROWTYPE;
  v_participant public.tournament_participants%ROWTYPE;
  v_claim public.mpesa_settlement_receipts%ROWTYPE;
  v_receipt text := upper(btrim(coalesce(p_receipt_number, '')));
  v_rows integer;
  v_has_pending_participant boolean := false;
  v_participant_count integer := 0;
BEGIN
  IF v_receipt !~ '^[A-Z0-9]{8,12}$' OR v_receipt = 'CONFIRMED' THEN
    RAISE EXCEPTION 'Invalid M-Pesa receipt.';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR round(p_amount, 2) <> p_amount THEN
    RAISE EXCEPTION 'Invalid M-Pesa settlement amount.';
  END IF;
  IF p_provider IS NULL OR p_provider NOT IN ('safaricom', 'unifiedpay') THEN
    RAISE EXCEPTION 'Unsupported M-Pesa provider.';
  END IF;
  IF (p_provider = 'unifiedpay' AND p_verification_method IS DISTINCT FROM 'provider_status_query')
     OR (p_provider = 'safaricom' AND p_verification_method IS DISTINCT FROM 'authenticated_callback_and_status_query') THEN
    RAISE EXCEPTION 'Provider verification evidence is incomplete or mismatched.';
  END IF;
  IF p_transaction_id IS NULL OR p_transaction_id !~ '^[A-Za-z0-9_-]{1,80}$' THEN
    RAISE EXCEPTION 'Invalid M-Pesa transaction ID.';
  END IF;
  IF p_verified_at IS NULL OR p_verified_at > now() + interval '1 minute' THEN
    RAISE EXCEPTION 'Invalid provider verification timestamp.';
  END IF;

  SELECT tp.* INTO v_payment
  FROM public.tournament_payments tp
  WHERE tp.id::text = p_tournament_payment_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament payment not found.';
  END IF;

  SELECT t.* INTO v_tournament
  FROM public.tournaments t
  WHERE t.id::text = v_payment.tournament_id::text
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found.';
  END IF;
  IF round(v_payment.amount::numeric, 2) <> round(p_amount, 2)
     OR round(v_tournament.entry_fee_kes::numeric, 2) <> round(p_amount, 2) THEN
    RAISE EXCEPTION 'Provider-confirmed amount does not match the tournament entry fee.';
  END IF;
  IF p_transaction_id <> coalesce(v_payment.checkout_request_id::text, '')
     AND p_transaction_id <> coalesce(v_payment.merchant_request_id::text, '') THEN
    RAISE EXCEPTION 'Provider transaction ID does not match the tournament payment.';
  END IF;

  IF v_payment.status = 'completed' THEN
    IF upper(btrim(coalesce(v_payment.mpesa_receipt_number, ''))) <> v_receipt THEN
      RAISE EXCEPTION 'Completed tournament payment has a different receipt.';
    END IF;

    SELECT r.* INTO v_claim
    FROM public.mpesa_settlement_receipts r
    WHERE r.receipt_number = v_receipt
    FOR UPDATE;
    IF NOT FOUND THEN
      INSERT INTO public.mpesa_settlement_receipts (
        receipt_number, source, entity_id, provider, verification_method, transaction_id, amount, verified_at
      ) VALUES (
        v_receipt, 'tournament', v_payment.id::text, p_provider, p_verification_method, p_transaction_id, round(p_amount, 2), p_verified_at
      );
    ELSE
      IF v_claim.source <> 'tournament' OR v_claim.entity_id <> v_payment.id::text
         OR (v_claim.amount IS NOT NULL AND round(v_claim.amount, 2) <> round(p_amount, 2)) THEN
        RAISE EXCEPTION 'M-Pesa receipt is already reserved for another settlement.';
      END IF;
      IF v_claim.provider = 'legacy' THEN
        UPDATE public.mpesa_settlement_receipts
        SET provider = p_provider,
            verification_method = p_verification_method,
            transaction_id = p_transaction_id,
            amount = round(p_amount, 2),
            verified_at = p_verified_at
        WHERE receipt_number = v_receipt;
      ELSIF v_claim.provider IS DISTINCT FROM p_provider
         OR v_claim.verification_method IS DISTINCT FROM p_verification_method
         OR v_claim.transaction_id IS DISTINCT FROM p_transaction_id
         OR v_claim.amount IS DISTINCT FROM round(p_amount, 2) THEN
        RAISE EXCEPTION 'M-Pesa receipt verification does not match the existing claim.';
      END IF;
    END IF;

    SELECT participant.* INTO v_participant
    FROM public.tournament_participants participant
    WHERE participant.tournament_id::text = v_payment.tournament_id::text
      AND lower(btrim(participant.friend_id)) = lower(btrim(v_payment.friend_id))
    ORDER BY participant.created_at ASC
    LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Completed tournament payment has no registered participant.';
    END IF;
    IF v_participant.payment_status IS DISTINCT FROM 'paid'
       OR lower(btrim(coalesce(v_participant.payment_method, ''))) NOT LIKE 'mpesa%'
       OR round(v_participant.amount_paid::numeric, 2) IS DISTINCT FROM round(p_amount, 2)
       OR v_participant.user_id IS DISTINCT FROM v_payment.user_id THEN
      RAISE EXCEPTION 'Completed tournament payment does not match its paid participant.';
    END IF;

    RETURN jsonb_build_object(
      'success', true,
      'already_settled', true,
      'receipt_number', v_receipt,
      'participant', to_jsonb(v_participant)
    );
  END IF;

  IF v_payment.status NOT IN ('pending', 'failed') THEN
    RAISE EXCEPTION 'Tournament payment is not in a payable state.';
  END IF;
  IF v_tournament.status <> 'registration_open' THEN
    RAISE EXCEPTION 'Tournament registration is closed.';
  END IF;

  -- Older deployments could leave an unpaid M-Pesa placeholder participant.
  -- Promote only that same pending M-Pesa entry after provider confirmation;
  -- never overwrite a paid, wallet, exempt, or different user's registration.
  SELECT participant.* INTO v_participant
  FROM public.tournament_participants participant
  WHERE participant.tournament_id = v_payment.tournament_id
    AND lower(btrim(participant.friend_id)) = lower(btrim(v_payment.friend_id))
  ORDER BY participant.created_at ASC
  LIMIT 1
  FOR UPDATE;
  v_has_pending_participant := FOUND;

  IF v_has_pending_participant THEN
    IF v_participant.payment_status IS DISTINCT FROM 'pending'
       OR lower(btrim(coalesce(v_participant.payment_method, ''))) NOT LIKE 'mpesa%'
       OR (v_participant.user_id IS NOT NULL
           AND v_participant.user_id IS DISTINCT FROM v_payment.user_id) THEN
      RAISE EXCEPTION 'Tournament participant is already registered.';
    END IF;
  ELSIF v_payment.user_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.tournament_participants participant
    WHERE participant.tournament_id = v_payment.tournament_id
      AND participant.user_id = v_payment.user_id
  ) THEN
    RAISE EXCEPTION 'Tournament participant is already registered.';
  END IF;

  SELECT count(*)::integer INTO v_participant_count
  FROM public.tournament_participants participant
  WHERE participant.tournament_id = v_payment.tournament_id;

  IF NOT v_has_pending_participant
     AND greatest(coalesce(v_tournament.registered_count, 0), v_participant_count) >= v_tournament.max_players THEN
    RAISE EXCEPTION 'Tournament registration is full.';
  END IF;

  SELECT r.* INTO v_claim
  FROM public.mpesa_settlement_receipts r
  WHERE r.receipt_number = v_receipt
  FOR UPDATE;
  IF FOUND THEN
    IF v_claim.source <> 'tournament' OR v_claim.entity_id <> v_payment.id::text
       OR (v_claim.amount IS NOT NULL AND round(v_claim.amount, 2) <> round(p_amount, 2)) THEN
      RAISE EXCEPTION 'M-Pesa receipt is already reserved for another settlement.';
    END IF;
    IF v_claim.provider = 'legacy' THEN
      UPDATE public.mpesa_settlement_receipts
      SET provider = p_provider,
          verification_method = p_verification_method,
          transaction_id = p_transaction_id,
          amount = round(p_amount, 2),
          verified_at = p_verified_at
      WHERE receipt_number = v_receipt;
    ELSIF v_claim.provider IS DISTINCT FROM p_provider
       OR v_claim.verification_method IS DISTINCT FROM p_verification_method
       OR v_claim.transaction_id IS DISTINCT FROM p_transaction_id
       OR v_claim.amount IS DISTINCT FROM round(p_amount, 2) THEN
      RAISE EXCEPTION 'M-Pesa receipt verification does not match the existing claim.';
    END IF;
  ELSE
    INSERT INTO public.mpesa_settlement_receipts (
      receipt_number, source, entity_id, provider, verification_method, transaction_id, amount, verified_at
    ) VALUES (
      v_receipt, 'tournament', v_payment.id::text, p_provider, p_verification_method, p_transaction_id, round(p_amount, 2), p_verified_at
    );
  END IF;

  PERFORM set_config('app.mpesa_settlement', 'true', true);

  IF v_has_pending_participant THEN
    UPDATE public.tournament_participants
    SET user_id = coalesce(user_id, v_payment.user_id),
        gamer_tag = v_payment.gamer_tag,
        phone_number = v_payment.phone_number,
        payment_status = 'paid',
        payment_method = 'mpesa_stk',
        amount_paid = round(p_amount, 2)
    WHERE id = v_participant.id
    RETURNING * INTO v_participant;
  ELSE
    INSERT INTO public.tournament_participants (
      tournament_id, user_id, gamer_tag, friend_id, phone_number,
      payment_status, payment_method, amount_paid, seed
    ) VALUES (
      v_payment.tournament_id,
      v_payment.user_id,
      v_payment.gamer_tag,
      v_payment.friend_id,
      v_payment.phone_number,
      'paid',
      'mpesa_stk',
      round(p_amount, 2),
      v_participant_count + 1
    ) RETURNING * INTO v_participant;
  END IF;

  UPDATE public.tournament_payments
  SET status = 'completed',
      mpesa_receipt_number = v_receipt,
      result_code = 0,
      result_desc = 'Provider-confirmed payment completed successfully',
      updated_at = now()
  WHERE id = v_payment.id
    AND status IN ('pending', 'failed');
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Tournament payment state changed during settlement.';
  END IF;

  UPDATE public.tournaments
  SET registered_count = (
        SELECT count(*)::integer
        FROM public.tournament_participants participant
        WHERE participant.tournament_id = v_tournament.id
      ),
      updated_at = now()
  WHERE id = v_tournament.id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Tournament registration count could not be updated.';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'already_settled', false,
    'receipt_number', v_receipt,
    'participant', to_jsonb(v_participant)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.settle_mpesa_marketplace_payment(text, text, numeric, text, text, text, timestamptz, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_mpesa_marketplace_payment(text, text, numeric, text, text, text, timestamptz, jsonb)
  TO service_role;

REVOKE ALL ON FUNCTION public.settle_mpesa_tournament_payment(text, text, numeric, text, text, text, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_mpesa_tournament_payment(text, text, numeric, text, text, text, timestamptz)
  TO service_role;

-- The old callback RPC accepted callback payloads without settlement proof.
-- Disable all overloads so stale clients cannot use it to bypass the new path.
DO $$
DECLARE
  v_function record;
BEGIN
  FOR v_function IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'handle_mpesa_payment_success'
  LOOP
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated, service_role',
      v_function.signature
    );
  END LOOP;
END;
$$;

COMMIT;
