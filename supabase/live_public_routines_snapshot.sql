-- READ-ONLY LIVE SNAPSHOT: eFootball Market public app-owned routines.
-- Captured 2026-11-10 from pg_get_functiondef on project fdnflvbknoopethbihns.
-- This file is reference material, not an approved deployment migration.
-- Extension-owned routines are supplied by their respective extensions and are omitted.

CREATE OR REPLACE FUNCTION public.decrement_listing_favorites(listing_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.listings
  SET favorites_count = GREATEST(0, COALESCE(favorites_count, 0) - 1)
  WHERE id = listing_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_platform_metrics()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'published_listings', (SELECT count(*) FROM public.listings WHERE status = 'published' AND deleted_at IS NULL),
    'completed_trades', (SELECT count(*) FROM public.orders WHERE status = 'completed'),
    'registered_traders', (SELECT count(*) FROM public.profiles WHERE deleted_at IS NULL),
    'active_tournaments', (SELECT count(*) FROM public.tournaments WHERE status IN ('registration_open', 'in_progress'))
  );
$function$;

CREATE OR REPLACE FUNCTION public.guard_escrow_funding()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF coalesce(current_setting('app.mpesa_settlement', true), '') <> 'true'
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
 SET search_path TO 'public'
AS $function$
BEGIN
  IF coalesce(current_setting('app.mpesa_settlement', true), '') <> 'true'
     AND OLD.status = 'published'
     AND NEW.status = 'in_escrow' THEN
    RAISE EXCEPTION 'Listings may enter escrow only through a provider-confirmed settlement.';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_mpesa_payment_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.guard_mpesa_tournament_participant()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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

  IF (lower(btrim(coalesce(OLD.payment_method, '')) ) LIKE 'mpesa%'
      OR lower(btrim(coalesce(NEW.payment_method, '')) ) LIKE 'mpesa%')
     AND NEW.payment_method IS DISTINCT FROM OLD.payment_method THEN
    RAISE EXCEPTION 'M-Pesa tournament payment method cannot be changed outside settlement.';
  END IF;

  IF (lower(btrim(coalesce(OLD.payment_method, '')) ) LIKE 'mpesa%'
      OR lower(btrim(coalesce(NEW.payment_method, '')) ) LIKE 'mpesa%')
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

CREATE OR REPLACE FUNCTION public.guard_order_escrow_lock()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF coalesce(current_setting('app.mpesa_settlement', true), '') <> 'true'
     AND OLD.status = 'payment_pending'
     AND NEW.status = 'escrow_locked' THEN
    RAISE EXCEPTION 'Orders may enter escrow only through a provider-confirmed settlement.';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_tournament_payment_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.handle_mpesa_payment_success(p_checkout_request_id character varying, p_receipt_number character varying, p_amount numeric, p_raw_callback jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_payment RECORD;
  v_order RECORD;
  v_net numeric;
BEGIN
  PERFORM set_config('app.internal_ledger_op', 'true', true);

  SELECT * INTO v_payment
  FROM public.payments
  WHERE checkout_request_id = p_checkout_request_id
     OR merchant_request_id = p_checkout_request_id
     OR id::text = p_checkout_request_id
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment record with checkout_request_id % not found', p_checkout_request_id;
  END IF;

  IF v_payment.status = 'completed' THEN
    RETURN;
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = v_payment.order_id
  FOR UPDATE;

  v_net := COALESCE(v_order.seller_net_amount, v_order.total_amount, p_amount);

  UPDATE public.payments
  SET
    status = 'completed',
    mpesa_receipt_number = p_receipt_number,
    raw_callback = p_raw_callback,
    completed_at = NOW()
  WHERE id = v_payment.id;

  UPDATE public.orders
  SET
    status = 'escrow_locked',
    updated_at = NOW()
  WHERE id = v_order.id;

  UPDATE public.escrow_accounts
  SET
    escrow_state = 'waiting_for_seller',
    updated_at = NOW()
  WHERE order_id = v_order.id;

  UPDATE public.listings
  SET
    status = 'in_escrow',
    updated_at = NOW()
  WHERE id = v_order.listing_id;

  UPDATE public.profiles
  SET
    escrow_balance = COALESCE(escrow_balance, 0) + v_net,
    updated_at = NOW()
  WHERE id = v_order.seller_id;

  INSERT INTO public.notifications (recipient_id, type, title, message, action_url, is_read)
  VALUES (
    v_order.seller_id,
    'payment_received',
    'Payment Secured in Escrow!',
    'Buyer paid KES ' || p_amount || ' (Receipt ' || p_receipt_number || '). Deliver Konami ID credentials within 12 hours.',
    '/orders/' || v_order.id,
    false
  );

  INSERT INTO public.notifications (recipient_id, type, title, message, action_url, is_read)
  VALUES (
    v_order.buyer_id,
    'mpesa_payment',
    'M-Pesa Payment Confirmed on Till 1572931!',
    'KES ' || p_amount || ' is safely held in escrow. Seller has up to 12 hours to deliver credentials.',
    '/orders/' || v_order.id,
    false
  );

  INSERT INTO public.audit_logs (action, resource_type, resource_id, changes)
  VALUES (
    'mpesa_payment_completed',
    'payment',
    v_payment.id::text,
    jsonb_build_object('receipt', p_receipt_number, 'amount', p_amount, 'order_id', v_order.id)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.immutable_text_array_join(arr text[])
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
AS $function$
  SELECT COALESCE(array_to_string(arr, ' '), '');
$function$;

CREATE OR REPLACE FUNCTION public.increment_listing_favorites(listing_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.listings
  SET favorites_count = COALESCE(favorites_count, 0) + 1
  WHERE id = listing_id;
$function$;

CREATE OR REPLACE FUNCTION public.increment_listing_views(listing_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.listings
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = listing_id AND deleted_at IS NULL;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN public.is_admin_user();
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Non-admin client calls cannot mutate privileges, balances, or trust counters
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

CREATE OR REPLACE FUNCTION public.release_escrow_funds(p_order_id uuid, p_performed_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order RECORD;
  v_escrow RECORD;
BEGIN
  PERFORM set_config('app.internal_ledger_op', 'true', true);

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  SELECT * INTO v_escrow FROM public.escrow_accounts WHERE order_id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escrow account not found';
  END IF;

  IF v_escrow.escrow_state = 'completed' OR v_order.status = 'completed' THEN
    RETURN;
  END IF;

  UPDATE public.profiles
  SET
    available_balance = COALESCE(available_balance, 0) + v_escrow.net_amount,
    escrow_balance = GREATEST(0, COALESCE(escrow_balance, 0) - v_escrow.net_amount),
    completed_sales_count = COALESCE(completed_sales_count, 0) + 1,
    updated_at = NOW()
  WHERE id = v_order.seller_id;

  UPDATE public.escrow_accounts
  SET
    escrow_state = 'completed',
    released_at = NOW(),
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_escrow.id;

  UPDATE public.orders
  SET
    status = 'completed',
    updated_at = NOW()
  WHERE id = v_order.id;

  UPDATE public.listings
  SET
    status = 'sold',
    updated_at = NOW()
  WHERE id = v_order.listing_id;

  INSERT INTO public.escrow_transactions (escrow_id, action_type, amount, balance_after, performed_by, notes)
  VALUES (
    v_escrow.id,
    'release_to_seller',
    v_escrow.net_amount,
    0.00,
    p_performed_by,
    'Escrow funds released to seller available balance'
  );

  INSERT INTO public.notifications (recipient_id, type, title, message, action_url, is_read)
  VALUES (
    v_order.seller_id,
    'funds_released',
    'Payout Credited!',
    'KES ' || v_escrow.net_amount || ' has been credited to your available balance for order #' || v_order.order_number,
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

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.settle_mpesa_marketplace_payment(p_payment_id text, p_receipt_number text, p_amount numeric, p_provider text, p_verification_method text, p_transaction_id text, p_verified_at timestamp with time zone, p_raw_callback jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.settle_mpesa_tournament_payment(p_tournament_payment_id text, p_receipt_number text, p_amount numeric, p_provider text, p_verification_method text, p_transaction_id text, p_verified_at timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.sync_listing_offers_columns()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.offered_price := COALESCE(NEW.offered_price, NEW.offer_amount, 0);
  NEW.offer_amount := COALESCE(NEW.offer_amount, NEW.offered_price, 0);
  NEW.counter_price := COALESCE(NEW.counter_price, NEW.counter_amount);
  NEW.counter_amount := COALESCE(NEW.counter_amount, NEW.counter_price);
  NEW.note := COALESCE(NEW.note, NEW.message);
  NEW.message := COALESCE(NEW.message, NEW.note);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$function$;
