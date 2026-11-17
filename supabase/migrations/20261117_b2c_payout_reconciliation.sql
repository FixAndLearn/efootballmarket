-- ============================================================================
-- 20261117_b2c_payout_reconciliation
-- Model A (operator-managed escrow) hardening.
--
-- Context: /api/withdrawals queues a seller withdrawal and debits their
-- available_balance via request_seller_withdrawal(). Payout was performed
-- manually by an admin flipping status to 'completed', and nothing ever wrote
-- the B2C identifiers the schema already reserves
-- (b2c_conversation_id, b2c_originator_conversation_id, b2c_transaction_id).
--
-- This migration gives the payout an authoritative, idempotent, audited
-- settlement path so an M-Pesa result callback can finalise a withdrawal
-- without a human clicking anything, and so a failed payout can never
-- silently strand a seller's money.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. RePLAY GUARD — one B2C conversation may settle exactly one withdrawal.
--    Partial + NULL-safe so queued/manual withdrawals are unaffected.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS seller_withdrawals_b2c_conversation_uidx
  ON public.seller_withdrawals (b2c_conversation_id)
  WHERE b2c_conversation_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. finalize_b2c_payout()
--    Server-only. Applies a *verified* Safaricom B2C outcome to a withdrawal.
--
--    p_outcome:
--      'success' -> mark completed, store transaction id (NO balance change:
--                   the amount was already debited at request time)
--      'failed'  -> mark rejected and RESTORE the reserved amount
--
--    Idempotent: re-delivery of the same callback returns changed = false and
--    never credits a balance twice.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finalize_b2c_payout(
  p_withdrawal_id uuid,
  p_outcome text,
  p_b2c_conversation_id text DEFAULT NULL,
  p_b2c_originator_conversation_id text DEFAULT NULL,
  p_b2c_transaction_id text DEFAULT NULL,
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
  v_balance_restored boolean := false;
  v_rows integer := 0;
BEGIN
  IF p_withdrawal_id IS NULL THEN
    RAISE EXCEPTION 'Withdrawal ID is required.';
  END IF;

  IF p_outcome IS NULL OR p_outcome NOT IN ('success', 'failed') THEN
    RAISE EXCEPTION 'Outcome must be success or failed.';
  END IF;

  SELECT * INTO v_withdrawal
  FROM public.seller_withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found.';
  END IF;

  v_previous_status := v_withdrawal.status;

  -- Replay protection: a terminal withdrawal is never re-settled.
  IF v_previous_status IN ('completed', 'rejected') THEN
    RETURN jsonb_build_object(
      'id', v_withdrawal.id,
      'status', v_withdrawal.status,
      'previous_status', v_previous_status,
      'changed', false,
      'balance_restored',
        (v_previous_status = 'rejected' AND v_withdrawal.failure_reason IS NOT NULL)
    );
  END IF;

  IF v_withdrawal.amount <= 0 THEN
    RAISE EXCEPTION 'Withdrawal amount must be positive.';
  END IF;

  IF p_outcome = 'success' THEN
    IF p_b2c_transaction_id IS NULL OR btrim(p_b2c_transaction_id) = '' THEN
      RAISE EXCEPTION 'A real M-Pesa transaction id is required to mark a payout paid.';
    END IF;

    UPDATE public.seller_withdrawals
    SET status = 'completed',
        b2c_conversation_id = COALESCE(p_b2c_conversation_id, b2c_conversation_id),
        b2c_originator_conversation_id = COALESCE(p_b2c_originator_conversation_id, b2c_originator_conversation_id),
        b2c_transaction_id = p_b2c_transaction_id,
        updated_at = now()
    WHERE id = v_withdrawal.id
      AND status = v_previous_status;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN
      RAISE EXCEPTION 'Withdrawal state changed during settlement.';
    END IF;

  ELSE
    -- Failed payout: give the seller their money back.
    PERFORM set_config('app.internal_ledger_op', 'true', true);
    UPDATE public.profiles
    SET available_balance = COALESCE(available_balance, 0) + v_withdrawal.amount,
        updated_at = now()
    WHERE id = v_withdrawal.seller_id;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN
      RAISE EXCEPTION 'Seller balance could not be restored.';
    END IF;
    v_balance_restored := true;

    UPDATE public.seller_withdrawals
    SET status = 'rejected',
        b2c_conversation_id = COALESCE(p_b2c_conversation_id, b2c_conversation_id),
        b2c_originator_conversation_id = COALESCE(p_b2c_originator_conversation_id, b2c_originator_conversation_id),
        failure_reason = COALESCE(NULLIF(btrim(p_failure_reason), ''), 'M-Pesa payout failed'),
        updated_at = now()
    WHERE id = v_withdrawal.id
      AND status = v_previous_status;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN
      RAISE EXCEPTION 'Withdrawal state changed during settlement.';
    END IF;
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, resource_type, resource_id, changes)
  VALUES (
    v_withdrawal.seller_id,
    CASE WHEN p_outcome = 'success' THEN 'b2c_payout_confirmed' ELSE 'b2c_payout_failed' END,
    'seller_withdrawal',
    v_withdrawal.id::text,
    jsonb_build_object(
      'outcome', p_outcome,
      'amount', v_withdrawal.amount,
      'previous_status', v_previous_status,
      'b2c_transaction_id', p_b2c_transaction_id,
      'b2c_conversation_id', p_b2c_conversation_id,
      'failure_reason', p_failure_reason,
      'balance_restored', v_balance_restored,
      'source', 'daraja_b2c_callback'
    )
  );

  RETURN jsonb_build_object(
    'id', v_withdrawal.id,
    'seller_id', v_withdrawal.seller_id,
    'amount', v_withdrawal.amount,
    'phone_number', v_withdrawal.phone_number,
    'status', (SELECT status FROM public.seller_withdrawals WHERE id = v_withdrawal.id),
    'previous_status', v_previous_status,
    'changed', true,
    'balance_restored', v_balance_restored
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.finalize_b2c_payout(uuid, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_b2c_payout(uuid, text, text, text, text, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Lookup helper for callbacks that carry only the Daraja conversation ids.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.find_withdrawal_by_b2c_ids(
  p_b2c_conversation_id text DEFAULT NULL,
  p_b2c_originator_conversation_id text DEFAULT NULL
)
RETURNS TABLE (id uuid, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $fn$
  SELECT w.id, w.status::text
  FROM public.seller_withdrawals w
  WHERE (p_b2c_conversation_id IS NOT NULL AND w.b2c_conversation_id = p_b2c_conversation_id)
     OR (p_b2c_originator_conversation_id IS NOT NULL
         AND w.b2c_originator_conversation_id = p_b2c_originator_conversation_id)
  ORDER BY w.created_at DESC
  LIMIT 1;
$fn$;

REVOKE ALL ON FUNCTION public.find_withdrawal_by_b2c_ids(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_withdrawal_by_b2c_ids(text, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Attach the B2C identifiers at initiation time so an inbound callback can
--    always be correlated even if it arrives before the admin UI updates.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.attach_b2c_conversation_id(
  p_withdrawal_id uuid,
  p_b2c_conversation_id text,
  p_b2c_originator_conversation_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
BEGIN
  IF p_withdrawal_id IS NULL OR p_b2c_conversation_id IS NULL
     OR btrim(p_b2c_conversation_id) = '' THEN
    RAISE EXCEPTION 'Withdrawal ID and conversation id are required.';
  END IF;

  UPDATE public.seller_withdrawals
  SET b2c_conversation_id = p_b2c_conversation_id,
      b2c_originator_conversation_id = COALESCE(p_b2c_originator_conversation_id, b2c_originator_conversation_id),
      status = CASE WHEN status = 'pending' THEN 'processing' ELSE status END,
      updated_at = now()
  WHERE id = p_withdrawal_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.attach_b2c_conversation_id(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.attach_b2c_conversation_id(uuid, text, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Housekeeping: unbounded runtime state was never pruned.
--    api_rate_limit_buckets and api_idempotency_records grow forever.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prune_runtime_state(
  p_rate_limit_grace interval DEFAULT interval '1 day',
  p_idempotency_grace interval DEFAULT interval '7 days'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_buckets integer := 0;
  v_idem integer := 0;
BEGIN
  DELETE FROM public.api_rate_limit_buckets
  WHERE reset_at < now() - p_rate_limit_grace;
  GET DIAGNOSTICS v_buckets = ROW_COUNT;

  DELETE FROM public.api_idempotency_records
  WHERE expires_at < now() - p_idempotency_grace;
  GET DIAGNOSTICS v_idem = ROW_COUNT;

  RETURN jsonb_build_object(
    'rate_limit_buckets_pruned', v_buckets,
    'idempotency_records_pruned', v_idem
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.prune_runtime_state(interval, interval) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_runtime_state(interval, interval) TO service_role;

COMMIT;
