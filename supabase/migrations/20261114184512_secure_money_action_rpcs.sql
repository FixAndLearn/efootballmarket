-- Secure marketplace money actions. These RPCs are server-only: application
-- routes must authenticate and authorize the user before invoking them.
BEGIN;

-- Bind GUC-based trigger bypasses to a service-role JWT. PostgreSQL custom GUCs
-- are transaction-local coordination flags, not caller authentication by themselves.
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  v_jwt_role text := coalesce(auth.role(), '');
BEGIN
  IF v_jwt_role = 'service_role'
     OR (v_jwt_role = '' AND session_user IN ('postgres', 'supabase_admin')) THEN
    RETURN NEW;
  END IF;

  IF public.is_admin_user() THEN
    IF NEW.available_balance IS DISTINCT FROM OLD.available_balance
       OR NEW.escrow_balance IS DISTINCT FROM OLD.escrow_balance THEN
      RAISE EXCEPTION 'Wallet balances must be changed through an authorized money-action RPC.';
    END IF;
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
$function$;

CREATE OR REPLACE FUNCTION public.guard_mpesa_payment_completion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role'
     AND coalesce(current_setting('app.mpesa_settlement', true), '') = 'true' THEN
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
$function$;

CREATE OR REPLACE FUNCTION public.guard_order_escrow_lock()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
BEGIN
  IF NOT (coalesce(auth.role(), '') = 'service_role'
          AND coalesce(current_setting('app.mpesa_settlement', true), '') = 'true')
     AND OLD.status = 'payment_pending'
     AND NEW.status = 'escrow_locked' THEN
    RAISE EXCEPTION 'Orders may enter escrow only through a provider-confirmed settlement.';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_escrow_funding()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
BEGIN
  IF NOT (coalesce(auth.role(), '') = 'service_role'
          AND coalesce(current_setting('app.mpesa_settlement', true), '') = 'true')
     AND OLD.escrow_state IS DISTINCT FROM 'waiting_for_seller'
     AND NEW.escrow_state = 'waiting_for_seller' THEN
    RAISE EXCEPTION 'Escrow may be funded only through a provider-confirmed settlement.';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_mpesa_listing_lock()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
BEGIN
  IF NOT (coalesce(auth.role(), '') = 'service_role'
          AND coalesce(current_setting('app.mpesa_settlement', true), '') = 'true')
     AND OLD.status = 'published'
     AND NEW.status = 'in_escrow' THEN
    RAISE EXCEPTION 'Listings may enter escrow only through a provider-confirmed settlement.';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_tournament_payment_completion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role'
     AND coalesce(current_setting('app.mpesa_settlement', true), '') = 'true' THEN
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
$function$;

CREATE OR REPLACE FUNCTION public.guard_mpesa_tournament_participant()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role'
     AND coalesce(current_setting('app.mpesa_settlement', true), '') = 'true' THEN
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
$function$;

-- Prevent direct PostgREST table writes from bypassing the atomic money-action
-- RPCs. Reads remain governed by the existing RLS policies; server-role RPCs
-- and service-role evidence writes continue to work.
DROP POLICY IF EXISTS "Sellers can insert own withdrawals" ON public.seller_withdrawals;
DROP POLICY IF EXISTS "Admins can update withdrawals" ON public.seller_withdrawals;
DROP POLICY IF EXISTS "Admins update disputes" ON public.disputes;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.seller_withdrawals
  FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.disputes
  FROM PUBLIC, anon, authenticated;

-- Replace the legacy release body with a fail-closed, row-locked settlement.
-- Buyers may release after delivery; admins retain the explicit escrow_locked
-- override; cron acts as the authenticated buyer after bearer-secret auth.
CREATE OR REPLACE FUNCTION public.release_escrow_funds(
  p_order_id uuid,
  p_performed_by uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_order public.orders%ROWTYPE;
  v_escrow public.escrow_accounts%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_is_admin boolean := false;
  v_rows integer := 0;
BEGIN
  IF p_order_id IS NULL OR p_performed_by IS NULL THEN
    RAISE EXCEPTION 'Order and authenticated actor are required.';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  IF p_performed_by <> v_order.buyer_id THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = p_performed_by AND role_id IN ('admin', 'super_admin')
    ) OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = p_performed_by AND role IN ('admin', 'super_admin')
    ) INTO v_is_admin;
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'Only the order buyer or an administrator may release escrow.';
    END IF;
  END IF;

  SELECT * INTO v_escrow
  FROM public.escrow_accounts
  WHERE order_id = p_order_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escrow account not found.';
  END IF;
  IF v_escrow.buyer_id IS DISTINCT FROM v_order.buyer_id
     OR v_escrow.seller_id IS DISTINCT FROM v_order.seller_id
     OR v_escrow.net_amount IS DISTINCT FROM v_order.seller_net_amount THEN
    RAISE EXCEPTION 'Order and escrow ledger do not match.';
  END IF;

  IF v_order.status = 'completed' AND v_escrow.escrow_state = 'completed' THEN
    RETURN;
  END IF;
  IF v_order.status = 'completed' OR v_escrow.escrow_state = 'completed' THEN
    RAISE EXCEPTION 'Order and escrow completion states do not match; release refused.';
  END IF;
  IF v_order.status = 'disputed' OR v_escrow.escrow_state = 'disputed' THEN
    RAISE EXCEPTION 'Escrow is disputed and cannot be released.';
  END IF;

  IF v_order.status = 'escrow_locked' AND v_escrow.escrow_state = 'waiting_for_seller' THEN
    IF p_performed_by = v_order.buyer_id THEN
      RAISE EXCEPTION 'Buyer release is unavailable until seller delivery.';
    END IF;
  ELSIF NOT (
    (v_order.status = 'seller_delivered' AND v_escrow.escrow_state = 'seller_delivered')
    OR (v_order.status = 'buyer_reviewing' AND v_escrow.escrow_state = 'buyer_reviewing')
  ) THEN
    RAISE EXCEPTION 'Order and escrow are not in a releasable state.';
  END IF;

  IF v_escrow.net_amount <= 0 THEN
    RAISE EXCEPTION 'Escrow release amount must be positive.';
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_order.seller_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seller ledger not found.';
  END IF;
  IF coalesce(v_profile.escrow_balance, 0) < v_escrow.net_amount THEN
    RAISE EXCEPTION 'Seller escrow balance is insufficient; release refused.';
  END IF;

  PERFORM set_config('app.internal_ledger_op', 'true', true);
  UPDATE public.profiles
  SET available_balance = coalesce(available_balance, 0) + v_escrow.net_amount,
      escrow_balance = coalesce(escrow_balance, 0) - v_escrow.net_amount,
      completed_sales_count = coalesce(completed_sales_count, 0) + 1,
      updated_at = now()
  WHERE id = v_order.seller_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Seller balance could not be updated.';
  END IF;

  UPDATE public.escrow_accounts
  SET escrow_state = 'completed',
      released_at = now(),
      completed_at = now(),
      updated_at = now()
  WHERE id = v_escrow.id AND escrow_state = v_escrow.escrow_state;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Escrow state changed during release.';
  END IF;

  UPDATE public.orders
  SET status = 'completed', updated_at = now()
  WHERE id = v_order.id AND status = v_order.status;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Order state changed during release.';
  END IF;

  UPDATE public.listings
  SET status = 'sold', updated_at = now()
  WHERE id = v_order.listing_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Listing state could not be updated during release.';
  END IF;

  INSERT INTO public.escrow_transactions (escrow_id, action_type, amount, balance_after, performed_by, notes)
  VALUES (
    v_escrow.id,
    'release_to_seller',
    v_escrow.net_amount,
    0.00,
    p_performed_by,
    'Escrow funds released to seller available platform balance'
  );

  INSERT INTO public.notifications (recipient_id, type, title, message, action_url, is_read)
  VALUES (
    v_order.seller_id,
    'funds_released',
    'Seller Balance Credited',
    'KES ' || v_escrow.net_amount || ' was credited to your available platform balance for order #' || v_order.order_number || '. M-Pesa withdrawal is a separate manual request.',
    '/seller/earnings',
    false
  );

  INSERT INTO public.audit_logs (actor_id, action, resource_type, resource_id, changes)
  VALUES (
    p_performed_by,
    'escrow_released',
    'escrow_account',
    v_escrow.id::text,
    jsonb_build_object('order_id', p_order_id, 'amount', v_escrow.net_amount)
  );
END;
$function$;

REVOKE ALL PRIVILEGES ON FUNCTION public.release_escrow_funds(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_escrow_funds(uuid, uuid)
  TO service_role;

-- Persist a request fingerprint so a retry can return the original withdrawal
-- record instead of reserving the same balance a second time.
ALTER TABLE public.seller_withdrawals
  ADD COLUMN IF NOT EXISTS request_key text;
CREATE INDEX IF NOT EXISTS seller_withdrawals_request_key_recent_idx
  ON public.seller_withdrawals (seller_id, request_key, created_at DESC)
  WHERE request_key IS NOT NULL;

-- Debit available balance and create the withdrawal row atomically. The profile
-- row lock serializes concurrent requests for the same seller, while request_key
-- makes retries idempotent during a pending/processing request and for five
-- minutes after a completed/rejected one.
CREATE OR REPLACE FUNCTION public.request_seller_withdrawal(
  p_seller_id uuid,
  p_amount numeric,
  p_phone_number text,
  p_request_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_existing public.seller_withdrawals%ROWTYPE;
  v_withdrawal public.seller_withdrawals%ROWTYPE;
  v_balance_after numeric;
  v_reused boolean := false;
BEGIN
  IF p_seller_id IS NULL OR p_amount IS NULL OR p_request_key IS NULL
     OR btrim(p_request_key) = '' OR length(p_request_key) > 512 THEN
    RAISE EXCEPTION 'Seller, amount, and request key are required.';
  END IF;

  IF p_amount < 10 OR p_amount > 250000 THEN
    RAISE EXCEPTION 'Withdrawal amount must be between KES 10 and KES 250,000.';
  END IF;

  IF p_phone_number IS NULL OR p_phone_number !~ '^254[17][0-9]{8}$' THEN
    RAISE EXCEPTION 'A valid Kenyan M-Pesa phone number is required.';
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_seller_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seller profile not found.';
  END IF;

  IF coalesce(v_profile.is_suspended, false) THEN
    RAISE EXCEPTION 'Account is suspended. Withdrawals are disabled.';
  END IF;

  -- The profile lock ensures any concurrent request from this seller has
  -- committed before this idempotency lookup runs.
  SELECT * INTO v_existing
  FROM public.seller_withdrawals
  WHERE seller_id = p_seller_id
    AND request_key = p_request_key
    AND (
      created_at >= now() - interval '5 minutes'
      OR status IN ('pending', 'processing')
    )
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    IF v_existing.amount <> p_amount OR v_existing.phone_number <> p_phone_number THEN
      RAISE EXCEPTION 'This withdrawal request key was already used with different details.';
    END IF;
    v_withdrawal := v_existing;
    v_reused := true;
    v_balance_after := coalesce(v_profile.available_balance, 0);
  ELSE
    IF coalesce(v_profile.available_balance, 0) < p_amount THEN
      RAISE EXCEPTION 'Insufficient available balance.';
    END IF;

    PERFORM set_config('app.internal_ledger_op', 'true', true);
    UPDATE public.profiles
    SET
      available_balance = coalesce(available_balance, 0) - p_amount,
      updated_at = now()
    WHERE id = p_seller_id
    RETURNING available_balance INTO v_balance_after;

    INSERT INTO public.seller_withdrawals (
      seller_id,
      amount,
      payout_method,
      phone_number,
      status,
      request_key
    ) VALUES (
      p_seller_id,
      p_amount,
      'mpesa',
      p_phone_number,
      'pending',
      p_request_key
    )
    RETURNING * INTO v_withdrawal;
  END IF;

  RETURN jsonb_build_object(
    'id', v_withdrawal.id,
    'seller_id', v_withdrawal.seller_id,
    'amount', v_withdrawal.amount,
    'payout_method', v_withdrawal.payout_method,
    'phone_number', v_withdrawal.phone_number,
    'status', v_withdrawal.status,
    'created_at', v_withdrawal.created_at,
    'updated_at', v_withdrawal.updated_at,
    'available_balance_after', v_balance_after,
    'idempotent', v_reused
  );
END;
$function$;

REVOKE ALL PRIVILEGES ON FUNCTION public.request_seller_withdrawal(uuid, numeric, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_seller_withdrawal(uuid, numeric, text, text)
  TO service_role;

-- Rejection returns the reserved wallet amount and changes the request status
-- in one locked transaction. This prevents retries or concurrent admin actions
-- from crediting the same withdrawal back more than once.
CREATE OR REPLACE FUNCTION public.review_seller_withdrawal(
  p_withdrawal_id uuid,
  p_status text,
  p_reviewed_by uuid,
  p_failure_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_withdrawal public.seller_withdrawals%ROWTYPE;
  v_previous_status text;
  v_profile_rows integer := 0;
  v_balance_restored boolean := false;
BEGIN
  IF p_withdrawal_id IS NULL OR p_reviewed_by IS NULL THEN
    RAISE EXCEPTION 'Withdrawal ID and reviewer are required.';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('pending', 'processing', 'completed', 'rejected') THEN
    RAISE EXCEPTION 'Invalid withdrawal status.';
  END IF;

  SELECT * INTO v_withdrawal
  FROM public.seller_withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found.';
  END IF;

  v_previous_status := v_withdrawal.status;

  -- Repeated requests are idempotent and never apply another wallet credit.
  IF v_previous_status = p_status THEN
    RETURN jsonb_build_object(
      'id', v_withdrawal.id,
      'seller_id', v_withdrawal.seller_id,
      'amount', v_withdrawal.amount,
      'phone_number', v_withdrawal.phone_number,
      'status', v_withdrawal.status,
      'previous_status', v_previous_status,
      'changed', false,
      'balance_restored', false
    );
  END IF;

  IF v_previous_status NOT IN ('pending', 'processing') THEN
    RAISE EXCEPTION 'A terminal withdrawal status cannot be changed.';
  END IF;

  IF (v_previous_status = 'pending' AND p_status NOT IN ('processing', 'completed', 'rejected'))
     OR (v_previous_status = 'processing' AND p_status NOT IN ('completed', 'rejected')) THEN
    RAISE EXCEPTION 'Invalid withdrawal status transition.';
  END IF;

  IF v_withdrawal.amount <= 0 THEN
    RAISE EXCEPTION 'Withdrawal amount must be positive.';
  END IF;

  IF p_status = 'rejected' THEN
    PERFORM set_config('app.internal_ledger_op', 'true', true);
    UPDATE public.profiles
    SET
      available_balance = COALESCE(available_balance, 0) + v_withdrawal.amount,
      updated_at = now()
    WHERE id = v_withdrawal.seller_id;

    GET DIAGNOSTICS v_profile_rows = ROW_COUNT;
    IF v_profile_rows <> 1 THEN
      RAISE EXCEPTION 'Seller balance could not be restored; withdrawal was not rejected.';
    END IF;
    v_balance_restored := true;
  END IF;

  UPDATE public.seller_withdrawals
  SET
    status = p_status,
    reviewed_by = p_reviewed_by,
    failure_reason = NULLIF(btrim(p_failure_reason), ''),
    updated_at = now()
  WHERE id = v_withdrawal.id;

  RETURN jsonb_build_object(
    'id', v_withdrawal.id,
    'seller_id', v_withdrawal.seller_id,
    'amount', v_withdrawal.amount,
    'phone_number', v_withdrawal.phone_number,
    'status', p_status,
    'previous_status', v_previous_status,
    'changed', true,
    'balance_restored', v_balance_restored
  );
END;
$function$;

REVOKE ALL PRIVILEGES ON FUNCTION public.review_seller_withdrawal(uuid, text, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_seller_withdrawal(uuid, text, uuid, text)
  TO service_role;

-- Align accepted dispute reasons with the choices already exposed by the app.
ALTER TABLE public.disputes DROP CONSTRAINT IF EXISTS disputes_reason_check;
ALTER TABLE public.disputes ADD CONSTRAINT disputes_reason_check
  CHECK (reason IN (
    'credentials_invalid',
    'wrong_account_details',
    'account_recovered_by_seller',
    'missing_players_or_coins',
    'unauthorized_changes',
    'seller_unresponsive',
    'google_linked_breach',
    'account_banned_or_deducted',
    'other'
  ));

-- Dispute creation and the order/escrow pause are one transaction. A report
-- opened after release is recorded for review only; it does not mutate a seller
-- balance or imply that a manual M-Pesa transfer has been reversed.
CREATE OR REPLACE FUNCTION public.open_escrow_dispute(
  p_order_id uuid,
  p_opened_by uuid,
  p_reason text,
  p_description text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_order public.orders%ROWTYPE;
  v_escrow public.escrow_accounts%ROWTYPE;
  v_existing public.disputes%ROWTYPE;
  v_dispute_id uuid;
  v_clean_description text;
  v_final_description text;
  v_listing_title text;
  v_was_completed boolean := false;
  v_is_admin boolean := false;
  v_rows integer := 0;
BEGIN
  IF p_order_id IS NULL OR p_opened_by IS NULL THEN
    RAISE EXCEPTION 'Order and authenticated actor are required.';
  END IF;

  IF p_reason IS NULL OR p_reason NOT IN (
    'credentials_invalid',
    'wrong_account_details',
    'account_recovered_by_seller',
    'missing_players_or_coins',
    'unauthorized_changes',
    'seller_unresponsive',
    'google_linked_breach',
    'account_banned_or_deducted',
    'other'
  ) THEN
    RAISE EXCEPTION 'Invalid dispute reason.';
  END IF;

  v_clean_description := btrim(regexp_replace(
    coalesce(p_description, ''),
    '^\[POST-RELEASE DISPUTE\][[:space:]]*',
    '',
    'i'
  ));
  IF length(v_clean_description) < 10 OR length(v_clean_description) > 10000 THEN
    RAISE EXCEPTION 'Please provide a detailed dispute description of no more than 10,000 characters.';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  IF p_opened_by <> v_order.buyer_id AND p_opened_by <> v_order.seller_id THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = p_opened_by AND role_id IN ('admin', 'super_admin')
    ) OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = p_opened_by AND role IN ('admin', 'super_admin')
    ) INTO v_is_admin;
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'Unauthorized to dispute this order.';
    END IF;
  END IF;

  SELECT * INTO v_escrow
  FROM public.escrow_accounts
  WHERE order_id = p_order_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escrow account not found.';
  END IF;
  IF v_escrow.buyer_id IS DISTINCT FROM v_order.buyer_id
     OR v_escrow.seller_id IS DISTINCT FROM v_order.seller_id
     OR v_escrow.net_amount IS DISTINCT FROM v_order.seller_net_amount THEN
    RAISE EXCEPTION 'Order and escrow ledger do not match.';
  END IF;

  SELECT * INTO v_existing
  FROM public.disputes
  WHERE order_id = p_order_id
  FOR UPDATE;
  IF FOUND THEN
    IF v_existing.opened_by = p_opened_by
       AND v_existing.reason = p_reason
       AND v_existing.status IN ('open', 'under_review')
       AND btrim(regexp_replace(
         v_existing.description,
         '^\[POST-RELEASE DISPUTE\][[:space:]]*',
         '',
         'i'
       )) = v_clean_description
       AND v_order.status = 'disputed'
       AND v_escrow.escrow_state = 'disputed' THEN
      v_was_completed := left(v_existing.description, length('[POST-RELEASE DISPUTE]')) = '[POST-RELEASE DISPUTE]';
      SELECT title INTO v_listing_title
      FROM public.listings
      WHERE id = v_order.listing_id;
      RETURN jsonb_build_object(
        'dispute_id', v_existing.id,
        'order_id', v_order.id,
        'buyer_id', v_order.buyer_id,
        'seller_id', v_order.seller_id,
        'order_number', v_order.order_number,
        'was_completed', v_was_completed,
        'description', v_existing.description,
        'listing_title', v_listing_title,
        'idempotent', true
      );
    END IF;
    RAISE EXCEPTION 'A dispute already exists for this order.';
  END IF;

  IF v_order.status = 'completed' AND v_escrow.escrow_state = 'completed' THEN
    v_was_completed := true;
  ELSIF v_order.status = 'completed' OR v_escrow.escrow_state = 'completed' THEN
    RAISE EXCEPTION 'Order and escrow completion states do not match; dispute opening refused.';
  ELSIF NOT (
    (v_order.status = 'escrow_locked' AND v_escrow.escrow_state = 'waiting_for_seller')
    OR (v_order.status = 'seller_delivered' AND v_escrow.escrow_state = 'seller_delivered')
    OR (v_order.status = 'buyer_reviewing' AND v_escrow.escrow_state = 'buyer_reviewing')
  ) THEN
    RAISE EXCEPTION 'Order and escrow are not eligible for a new dispute.';
  END IF;

  v_final_description := CASE
    WHEN v_was_completed THEN '[POST-RELEASE DISPUTE] ' || v_clean_description
    ELSE v_clean_description
  END;

  INSERT INTO public.disputes (order_id, opened_by, reason, description, status)
  VALUES (p_order_id, p_opened_by, p_reason, v_final_description, 'open')
  RETURNING id INTO v_dispute_id;

  UPDATE public.escrow_accounts
  SET escrow_state = 'disputed', updated_at = now()
  WHERE id = v_escrow.id AND escrow_state = v_escrow.escrow_state;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Escrow state changed while opening the dispute.';
  END IF;

  UPDATE public.orders
  SET status = 'disputed', updated_at = now()
  WHERE id = v_order.id AND status = v_order.status;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Order state changed while opening the dispute.';
  END IF;

  SELECT title INTO v_listing_title
  FROM public.listings
  WHERE id = v_order.listing_id;

  RETURN jsonb_build_object(
    'dispute_id', v_dispute_id,
    'order_id', v_order.id,
    'buyer_id', v_order.buyer_id,
    'seller_id', v_order.seller_id,
    'order_number', v_order.order_number,
    'was_completed', v_was_completed,
    'description', v_final_description,
    'listing_title', v_listing_title,
    'idempotent', false
  );
END;
$function$;

REVOKE ALL PRIVILEGES ON FUNCTION public.open_escrow_dispute(uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.open_escrow_dispute(uuid, uuid, text, text)
  TO service_role;

-- Resolve the dispute, status transitions, and any pre-release seller credit in
-- one transaction. Post-release resolution never re-credits or claws back the
-- seller balance. Refund decisions leave reserve funds pending manual handling.
CREATE OR REPLACE FUNCTION public.resolve_escrow_dispute(
  p_dispute_id uuid,
  p_order_id uuid,
  p_action text,
  p_reviewed_by uuid,
  p_notes text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_order_id uuid;
  v_order public.orders%ROWTYPE;
  v_escrow public.escrow_accounts%ROWTYPE;
  v_dispute public.disputes%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_new_dispute_status text;
  v_new_order_status text;
  v_new_escrow_state text;
  v_post_release boolean := false;
  v_clean_notes text;
  v_rows integer := 0;
BEGIN
  IF p_dispute_id IS NULL OR p_order_id IS NULL OR p_reviewed_by IS NULL THEN
    RAISE EXCEPTION 'Dispute, order, and reviewer are required.';
  END IF;
  IF p_action IS NULL OR p_action NOT IN ('release_to_seller', 'refund_buyer', 'dismiss') THEN
    RAISE EXCEPTION 'Invalid dispute resolution action.';
  END IF;

  v_clean_notes := btrim(coalesce(p_notes, ''));
  IF length(v_clean_notes) < 3 OR length(v_clean_notes) > 10000 THEN
    RAISE EXCEPTION 'Resolution notes must contain 3 to 10,000 characters.';
  END IF;

  SELECT order_id INTO v_order_id
  FROM public.disputes
  WHERE id = p_dispute_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dispute not found.';
  END IF;
  IF v_order_id IS DISTINCT FROM p_order_id THEN
    RAISE EXCEPTION 'Dispute does not belong to the supplied order.';
  END IF;

  -- Lock the order first, matching the opener and release RPC lock order.
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dispute order not found.';
  END IF;

  SELECT * INTO v_dispute
  FROM public.disputes
  WHERE id = p_dispute_id AND order_id = p_order_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dispute not found for this order.';
  END IF;

  SELECT * INTO v_escrow
  FROM public.escrow_accounts
  WHERE order_id = p_order_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escrow account not found.';
  END IF;
  IF v_escrow.buyer_id IS DISTINCT FROM v_order.buyer_id
     OR v_escrow.seller_id IS DISTINCT FROM v_order.seller_id
     OR v_escrow.net_amount IS DISTINCT FROM v_order.seller_net_amount THEN
    RAISE EXCEPTION 'Order and escrow ledger do not match.';
  END IF;

  v_post_release := left(v_dispute.description, length('[POST-RELEASE DISPUTE]')) = '[POST-RELEASE DISPUTE]';
  v_new_dispute_status := CASE p_action
    WHEN 'release_to_seller' THEN 'resolved_seller_release'
    WHEN 'refund_buyer' THEN 'resolved_buyer_refund'
    ELSE 'closed_dismissed'
  END;
  v_new_order_status := CASE WHEN p_action = 'refund_buyer' THEN 'refunded' ELSE 'completed' END;
  v_new_escrow_state := CASE WHEN p_action = 'refund_buyer' THEN 'refund_pending' ELSE 'completed' END;

  IF v_dispute.status = v_new_dispute_status
     AND v_order.status = v_new_order_status
     AND v_escrow.escrow_state = v_new_escrow_state THEN
    RETURN jsonb_build_object(
      'dispute_id', v_dispute.id,
      'order_id', v_order.id,
      'action', p_action,
      'status', v_dispute.status,
      'post_release', v_post_release,
      'changed', false
    );
  END IF;

  IF v_dispute.status NOT IN ('open', 'under_review')
     OR v_order.status <> 'disputed'
     OR v_escrow.escrow_state <> 'disputed' THEN
    RAISE EXCEPTION 'Dispute state changed or is no longer eligible for resolution.';
  END IF;

  IF NOT v_post_release AND p_action IN ('release_to_seller', 'dismiss') THEN
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = v_order.seller_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Seller ledger not found.';
    END IF;
    IF coalesce(v_profile.escrow_balance, 0) < v_escrow.net_amount THEN
      RAISE EXCEPTION 'Seller escrow balance is insufficient; dispute resolution refused.';
    END IF;

    PERFORM set_config('app.internal_ledger_op', 'true', true);
    UPDATE public.profiles
    SET available_balance = coalesce(available_balance, 0) + v_escrow.net_amount,
        escrow_balance = coalesce(escrow_balance, 0) - v_escrow.net_amount,
        completed_sales_count = coalesce(completed_sales_count, 0) + 1,
        updated_at = now()
    WHERE id = v_order.seller_id;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN
      RAISE EXCEPTION 'Seller balance could not be updated; dispute resolution refused.';
    END IF;

    UPDATE public.listings
    SET status = 'sold', updated_at = now()
    WHERE id = v_order.listing_id;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN
      RAISE EXCEPTION 'Listing state could not be updated; dispute resolution refused.';
    END IF;

    INSERT INTO public.escrow_transactions (escrow_id, action_type, amount, balance_after, performed_by, notes)
    VALUES (
      v_escrow.id,
      'release_to_seller',
      v_escrow.net_amount,
      0.00,
      p_reviewed_by,
      'Seller balance credited after moderator dispute resolution'
    );
  END IF;

  -- An approved M-Pesa refund is still a manual transfer. Keep pre-release
  -- reserve funds out of the seller's available balance until that handling is
  -- completed; this RPC does not mark a provider transfer as sent.
  UPDATE public.disputes
  SET status = v_new_dispute_status,
      assigned_to = p_reviewed_by,
      resolution_notes = v_clean_notes,
      resolved_at = now(),
      updated_at = now()
  WHERE id = v_dispute.id AND status IN ('open', 'under_review');
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Dispute state changed while resolving.';
  END IF;

  UPDATE public.escrow_accounts
  SET escrow_state = v_new_escrow_state,
      updated_at = now()
  WHERE id = v_escrow.id AND escrow_state = 'disputed';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Escrow state changed while resolving the dispute.';
  END IF;

  UPDATE public.orders
  SET status = v_new_order_status,
      updated_at = now()
  WHERE id = v_order.id AND status = 'disputed';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Order state changed while resolving the dispute.';
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, resource_type, resource_id, changes)
  VALUES (
    p_reviewed_by,
    'escrow_dispute_resolved',
    'dispute',
    v_dispute.id::text,
    jsonb_build_object(
      'order_id', v_order.id,
      'action', p_action,
      'post_release', v_post_release,
      'seller_balance_changed', (NOT v_post_release AND p_action IN ('release_to_seller', 'dismiss'))
    )
  );

  RETURN jsonb_build_object(
    'dispute_id', v_dispute.id,
    'order_id', v_order.id,
    'action', p_action,
    'status', v_new_dispute_status,
    'post_release', v_post_release,
    'changed', true
  );
END;
$function$;

REVOKE ALL PRIVILEGES ON FUNCTION public.resolve_escrow_dispute(uuid, uuid, text, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_escrow_dispute(uuid, uuid, text, uuid, text)
  TO service_role;

-- Tournament registrations paid from the platform wallet must debit the profile
-- and create the paid participant row in the same transaction. Free entries use
-- the same lock-and-register path so capacity and duplicate checks are serialized.
CREATE OR REPLACE FUNCTION public.register_tournament_participant_atomic(
  p_tournament_id uuid,
  p_user_id uuid,
  p_gamer_tag text,
  p_friend_id text,
  p_phone_number text,
  p_payment_method text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_tournament public.tournaments%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_user_participant public.tournament_participants%ROWTYPE;
  v_friend_participant public.tournament_participants%ROWTYPE;
  v_participant public.tournament_participants%ROWTYPE;
  v_expected_status text;
  v_expected_amount numeric;
  v_balance_after numeric;
  v_participant_count integer := 0;
  v_rows integer := 0;
  v_has_user boolean := false;
  v_has_friend boolean := false;
BEGIN
  IF p_tournament_id IS NULL OR p_user_id IS NULL THEN
    RAISE EXCEPTION 'Tournament and authenticated member are required.';
  END IF;
  IF p_gamer_tag IS NULL OR length(btrim(p_gamer_tag)) NOT BETWEEN 1 AND 60
     OR p_friend_id IS NULL OR length(btrim(p_friend_id)) NOT BETWEEN 1 AND 40 THEN
    RAISE EXCEPTION 'A valid gamer tag and eFootball Friend ID are required.';
  END IF;
  IF p_phone_number IS NULL OR p_phone_number !~ '^\+?254[17][0-9]{8}$' THEN
    RAISE EXCEPTION 'A valid Kenyan mobile number is required.';
  END IF;
  IF p_payment_method IS NULL OR p_payment_method NOT IN ('free', 'wallet') THEN
    RAISE EXCEPTION 'Unsupported tournament registration payment method.';
  END IF;

  -- Serializes capacity, duplicate checks, fee reads, balance reservation, and
  -- participant creation for all registrations against this tournament.
  SELECT * INTO v_tournament
  FROM public.tournaments
  WHERE id = p_tournament_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found.';
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member profile not found.';
  END IF;
  IF coalesce(v_profile.is_suspended, false) THEN
    RAISE EXCEPTION 'Suspended accounts cannot register for tournaments.';
  END IF;

  IF v_tournament.entry_fee_kes = 0 THEN
    IF p_payment_method <> 'free' THEN
      RAISE EXCEPTION 'This tournament has no entry fee; use free registration.';
    END IF;
    v_expected_status := 'exempt';
    v_expected_amount := 0;
  ELSE
    IF p_payment_method <> 'wallet' THEN
      RAISE EXCEPTION 'For a paid tournament, use a provider-confirmed M-Pesa payment or an available wallet balance.';
    END IF;
    IF v_tournament.entry_fee_kes < 0 THEN
      RAISE EXCEPTION 'Tournament entry fee is invalid.';
    END IF;
    v_expected_status := 'paid';
    v_expected_amount := v_tournament.entry_fee_kes;
  END IF;

  -- An identical retry after a lost HTTP response returns the original entry
  -- without charging again. A different existing registration is rejected.
  SELECT * INTO v_user_participant
  FROM public.tournament_participants
  WHERE tournament_id = p_tournament_id AND user_id = p_user_id
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;
  v_has_user := FOUND;

  SELECT * INTO v_friend_participant
  FROM public.tournament_participants
  WHERE tournament_id = p_tournament_id
    AND lower(btrim(friend_id)) = lower(btrim(p_friend_id))
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;
  v_has_friend := FOUND;

  IF v_has_user OR v_has_friend THEN
    IF v_has_user AND v_has_friend
       AND v_user_participant.id = v_friend_participant.id
       AND lower(btrim(v_user_participant.friend_id)) = lower(btrim(p_friend_id))
       AND v_user_participant.payment_method = p_payment_method
       AND v_user_participant.payment_status = v_expected_status
       AND v_user_participant.amount_paid = v_expected_amount THEN
      RETURN jsonb_build_object(
        'success', true,
        'participant', to_jsonb(v_user_participant),
        'available_balance_after', coalesce(v_profile.available_balance, 0),
        'idempotent', true
      );
    END IF;
    IF v_has_user THEN
      RAISE EXCEPTION 'You are already registered for this tournament with your community account.';
    END IF;
    RAISE EXCEPTION 'A gamer with this eFootball Friend ID has already registered.';
  END IF;

  IF v_tournament.status <> 'registration_open' THEN
    RAISE EXCEPTION 'Registration is closed for this tournament.';
  END IF;

  SELECT count(*)::integer INTO v_participant_count
  FROM public.tournament_participants
  WHERE tournament_id = p_tournament_id;
  IF v_participant_count >= v_tournament.max_players THEN
    RAISE EXCEPTION 'This tournament is already full.';
  END IF;

  IF p_payment_method = 'wallet' THEN
    IF coalesce(v_profile.available_balance, 0) < v_expected_amount THEN
      RAISE EXCEPTION 'Insufficient account balance. Available wallet balance is too low.';
    END IF;

    PERFORM set_config('app.internal_ledger_op', 'true', true);
    UPDATE public.profiles
    SET available_balance = coalesce(available_balance, 0) - v_expected_amount,
        updated_at = now()
    WHERE id = p_user_id
      AND coalesce(available_balance, 0) >= v_expected_amount
    RETURNING available_balance INTO v_balance_after;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN
      RAISE EXCEPTION 'Wallet balance changed or is insufficient; no tournament entry was created.';
    END IF;
  ELSE
    v_balance_after := coalesce(v_profile.available_balance, 0);
  END IF;

  INSERT INTO public.tournament_participants (
    tournament_id,
    user_id,
    gamer_tag,
    friend_id,
    phone_number,
    payment_status,
    payment_method,
    amount_paid,
    seed
  ) VALUES (
    p_tournament_id,
    p_user_id,
    btrim(p_gamer_tag),
    btrim(p_friend_id),
    p_phone_number,
    v_expected_status,
    p_payment_method,
    v_expected_amount,
    v_participant_count + 1
  )
  RETURNING * INTO v_participant;

  UPDATE public.tournaments
  SET registered_count = v_participant_count + 1,
      updated_at = now()
  WHERE id = p_tournament_id AND status = 'registration_open';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Tournament registration state changed; no wallet charge was retained.';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'participant', to_jsonb(v_participant),
    'available_balance_after', v_balance_after,
    'idempotent', false
  );
END;
$function$;

REVOKE ALL PRIVILEGES ON FUNCTION public.register_tournament_participant_atomic(uuid, uuid, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_tournament_participant_atomic(uuid, uuid, text, text, text, text)
  TO service_role;

-- Participants are created by the authenticated server route above or by the
-- provider-confirmed M-Pesa settlement function, never by direct client inserts.
DROP POLICY IF EXISTS "Users can register for tournament" ON public.tournament_participants;
REVOKE INSERT ON TABLE public.tournament_participants
  FROM PUBLIC, anon, authenticated;

-- Defense in depth: even a future client write policy cannot create or rewrite
-- a wallet-paid entry without the transaction-local flag set by the atomic RPC.
CREATE OR REPLACE FUNCTION public.guard_wallet_tournament_participant()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_is_service_role boolean := coalesce(auth.role(), '') = 'service_role';
  v_internal boolean := v_is_service_role
    AND coalesce(current_setting('app.internal_ledger_op', true), '') = 'true';
  v_provider_settlement boolean := v_is_service_role
    AND coalesce(current_setting('app.mpesa_settlement', true), '') = 'true';
  v_money_fields_changed boolean := false;
BEGIN
  IF v_provider_settlement THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF lower(btrim(coalesce(NEW.payment_method, ''))) = 'wallet'
       AND NEW.payment_status = 'paid'
       AND NOT v_internal THEN
      RAISE EXCEPTION 'Wallet-paid tournament entries require atomic wallet registration.';
    END IF;
    RETURN NEW;
  END IF;

  v_money_fields_changed :=
    NEW.payment_status IS DISTINCT FROM OLD.payment_status
    OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
    OR NEW.amount_paid IS DISTINCT FROM OLD.amount_paid
    OR NEW.tournament_id IS DISTINCT FROM OLD.tournament_id
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.friend_id IS DISTINCT FROM OLD.friend_id;

  IF NOT v_internal AND v_money_fields_changed
     AND (
       (lower(btrim(coalesce(NEW.payment_method, ''))) = 'wallet' AND NEW.payment_status = 'paid')
       OR (lower(btrim(coalesce(OLD.payment_method, ''))) = 'wallet' AND OLD.payment_status = 'paid')
     ) THEN
    RAISE EXCEPTION 'Wallet-paid tournament ledger fields cannot be changed outside atomic wallet registration.';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_guard_wallet_tournament_participant ON public.tournament_participants;
CREATE TRIGGER trg_guard_wallet_tournament_participant
BEFORE INSERT OR UPDATE ON public.tournament_participants
FOR EACH ROW EXECUTE FUNCTION public.guard_wallet_tournament_participant();

COMMIT;
