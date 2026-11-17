BEGIN;

-- Cross-instance rate limiting. Keys are HMAC-SHA256 digests, not raw IP/user IDs.
CREATE TABLE IF NOT EXISTS public.api_rate_limit_buckets (
  key_hash text PRIMARY KEY CHECK (key_hash ~ '^[0-9a-f]{64}$'),
  request_count integer NOT NULL CHECK (request_count >= 1),
  reset_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS api_rate_limit_buckets_reset_at_idx
  ON public.api_rate_limit_buckets (reset_at);
ALTER TABLE public.api_rate_limit_buckets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.api_rate_limit_buckets FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.api_rate_limit_buckets TO service_role;

-- Cross-instance idempotency claims. A lease protects in-flight side effects;
-- successful responses are retained for the caller-selected short cache TTL.
CREATE TABLE IF NOT EXISTS public.api_idempotency_records (
  key_hash text PRIMARY KEY CHECK (key_hash ~ '^[0-9a-f]{64}$'),
  state text NOT NULL CHECK (state IN ('processing', 'completed')),
  owner_token uuid,
  response jsonb,
  lease_until timestamptz,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT api_idempotency_records_state_shape_check CHECK (
    (state = 'processing' AND owner_token IS NOT NULL AND response IS NULL AND lease_until IS NOT NULL)
    OR
    (state = 'completed' AND owner_token IS NULL AND response IS NOT NULL AND lease_until IS NULL)
  )
);
CREATE INDEX IF NOT EXISTS api_idempotency_records_expiry_idx
  ON public.api_idempotency_records (expires_at);
ALTER TABLE public.api_idempotency_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.api_idempotency_records FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.api_idempotency_records TO service_role;

CREATE OR REPLACE FUNCTION public.consume_shared_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_ms integer
)
RETURNS TABLE (allowed boolean, remaining integer, reset_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_window interval;
  v_count integer;
  v_reset_at timestamptz;
BEGIN
  IF p_key_hash IS NULL OR p_key_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Invalid rate-limit key.';
  END IF;
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100000 THEN
    RAISE EXCEPTION 'Invalid rate-limit maximum.';
  END IF;
  IF p_window_ms IS NULL OR p_window_ms < 1 OR p_window_ms > 86400000 THEN
    RAISE EXCEPTION 'Invalid rate-limit window.';
  END IF;

  v_window := p_window_ms * interval '1 millisecond';

  INSERT INTO public.api_rate_limit_buckets AS bucket (
    key_hash, request_count, reset_at, updated_at
  ) VALUES (
    p_key_hash, 1, v_now + v_window, v_now
  )
  ON CONFLICT (key_hash) DO UPDATE
  SET request_count = CASE
        WHEN bucket.reset_at <= v_now THEN 1
        ELSE bucket.request_count + 1
      END,
      reset_at = CASE
        WHEN bucket.reset_at <= v_now THEN v_now + v_window
        ELSE bucket.reset_at
      END,
      updated_at = v_now
  WHERE bucket.reset_at <= v_now OR bucket.request_count < p_limit
  RETURNING bucket.request_count, bucket.reset_at
  INTO v_count, v_reset_at;

  IF FOUND THEN
    RETURN QUERY
    SELECT v_count <= p_limit, GREATEST(p_limit - v_count, 0), v_reset_at;
  ELSE
    SELECT bucket.request_count, bucket.reset_at
    INTO v_count, v_reset_at
    FROM public.api_rate_limit_buckets AS bucket
    WHERE bucket.key_hash = p_key_hash;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Rate-limit bucket disappeared during update.';
    END IF;

    RETURN QUERY SELECT false, 0, v_reset_at;
  END IF;

  -- Opportunistic bounded cleanup; the indexed TTL keeps this work small.
  IF random() < 0.01 THEN
    WITH expired AS (
      SELECT key_hash
      FROM public.api_rate_limit_buckets
      WHERE reset_at < v_now - interval '1 hour'
      ORDER BY reset_at
      LIMIT 500
      FOR UPDATE SKIP LOCKED
    )
    DELETE FROM public.api_rate_limit_buckets AS bucket
    USING expired
    WHERE bucket.key_hash = expired.key_hash;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_shared_idempotency_key(
  p_key_hash text,
  p_owner_token uuid,
  p_cache_ttl_ms integer,
  p_lease_ttl_ms integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_state text;
  v_response jsonb;
  v_lease_until timestamptz;
  v_expires_at timestamptz;
BEGIN
  IF p_key_hash IS NULL OR p_key_hash !~ '^[0-9a-f]{64}$' OR p_owner_token IS NULL THEN
    RAISE EXCEPTION 'Invalid idempotency claim.';
  END IF;
  IF p_cache_ttl_ms IS NULL OR p_cache_ttl_ms < 1 OR p_cache_ttl_ms > 86400000
     OR p_lease_ttl_ms IS NULL OR p_lease_ttl_ms < 1000 OR p_lease_ttl_ms > 86400000 THEN
    RAISE EXCEPTION 'Invalid idempotency duration.';
  END IF;

  -- Opportunistically prune expired keys in bounded batches.
  IF random() < 0.01 THEN
    WITH expired AS (
      SELECT key_hash
      FROM public.api_idempotency_records
      WHERE expires_at < v_now - interval '1 day'
      ORDER BY expires_at
      LIMIT 500
      FOR UPDATE SKIP LOCKED
    )
    DELETE FROM public.api_idempotency_records AS stale
    USING expired
    WHERE stale.key_hash = expired.key_hash;
  END IF;

  INSERT INTO public.api_idempotency_records AS existing_row (
    key_hash, state, owner_token, response, lease_until, expires_at, updated_at
  ) VALUES (
    p_key_hash,
    'processing',
    p_owner_token,
    NULL,
    v_now + p_lease_ttl_ms * interval '1 millisecond',
    v_now + p_lease_ttl_ms * interval '1 millisecond',
    v_now
  )
  ON CONFLICT (key_hash) DO UPDATE
  SET state = 'processing',
      owner_token = EXCLUDED.owner_token,
      response = NULL,
      lease_until = EXCLUDED.lease_until,
      expires_at = EXCLUDED.expires_at,
      updated_at = v_now
  WHERE existing_row.expires_at <= v_now
     OR (existing_row.state = 'processing' AND existing_row.lease_until <= v_now)
  RETURNING state, response, lease_until, expires_at
  INTO v_state, v_response, v_lease_until, v_expires_at;

  IF FOUND THEN
    RETURN jsonb_build_object('status', 'acquired');
  END IF;

  SELECT existing_row.state, existing_row.response, existing_row.lease_until, existing_row.expires_at
  INTO v_state, v_response, v_lease_until, v_expires_at
  FROM public.api_idempotency_records AS existing_row
  WHERE existing_row.key_hash = p_key_hash;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Idempotency claim disappeared during update.';
  END IF;

  IF v_state = 'completed' AND v_expires_at > v_now THEN
    RETURN jsonb_build_object('status', 'cached', 'response', v_response);
  END IF;

  RETURN jsonb_build_object('status', 'in_progress');
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_shared_idempotency_key(
  p_key_hash text,
  p_owner_token uuid,
  p_response jsonb,
  p_cache_ttl_ms integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_rows integer;
BEGIN
  IF p_key_hash IS NULL OR p_key_hash !~ '^[0-9a-f]{64}$' OR p_owner_token IS NULL
     OR p_response IS NULL THEN
    RAISE EXCEPTION 'Invalid idempotency completion.';
  END IF;
  IF p_cache_ttl_ms IS NULL OR p_cache_ttl_ms < 1 OR p_cache_ttl_ms > 86400000 THEN
    RAISE EXCEPTION 'Invalid idempotency cache duration.';
  END IF;
  IF pg_column_size(p_response) > 65536 THEN
    RAISE EXCEPTION 'Idempotency response is too large.';
  END IF;

  UPDATE public.api_idempotency_records
  SET state = 'completed',
      owner_token = NULL,
      response = p_response,
      lease_until = NULL,
      expires_at = v_now + p_cache_ttl_ms * interval '1 millisecond',
      updated_at = v_now
  WHERE key_hash = p_key_hash
    AND state = 'processing'
    AND owner_token = p_owner_token;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_shared_idempotency_key(
  p_key_hash text,
  p_owner_token uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $$
DECLARE
  v_rows integer;
BEGIN
  IF p_key_hash IS NULL OR p_key_hash !~ '^[0-9a-f]{64}$' OR p_owner_token IS NULL THEN
    RAISE EXCEPTION 'Invalid idempotency release.';
  END IF;

  DELETE FROM public.api_idempotency_records
  WHERE key_hash = p_key_hash
    AND state = 'processing'
    AND owner_token = p_owner_token;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_shared_rate_limit(text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_shared_rate_limit(text, integer, integer)
  TO service_role;
REVOKE ALL ON FUNCTION public.claim_shared_idempotency_key(text, uuid, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_shared_idempotency_key(text, uuid, integer, integer)
  TO service_role;
REVOKE ALL ON FUNCTION public.complete_shared_idempotency_key(text, uuid, jsonb, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_shared_idempotency_key(text, uuid, jsonb, integer)
  TO service_role;
REVOKE ALL ON FUNCTION public.release_shared_idempotency_key(text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_shared_idempotency_key(text, uuid)
  TO service_role;

-- Durable fallback for tournament data. Normal reads/writes continue using the
-- normalized tournament tables; this service-role-only store replaces per-instance
-- arrays when those tables cannot be used, and lets another function instance recover.
CREATE TABLE IF NOT EXISTS public.tournament_runtime_state (
  record_type text NOT NULL CHECK (record_type IN ('tournament', 'payment', 'tombstone')),
  record_id text NOT NULL,
  tournament_id text,
  user_id text,
  checkout_request_id text,
  merchant_request_id text,
  phone_number text,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  version bigint NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (record_type, record_id)
);
CREATE INDEX IF NOT EXISTS tournament_runtime_state_type_updated_idx
  ON public.tournament_runtime_state (record_type, updated_at DESC);
CREATE INDEX IF NOT EXISTS tournament_runtime_state_payment_user_idx
  ON public.tournament_runtime_state (tournament_id, user_id, created_at DESC)
  WHERE record_type = 'payment';
CREATE INDEX IF NOT EXISTS tournament_runtime_state_payment_phone_idx
  ON public.tournament_runtime_state (tournament_id, phone_number, created_at DESC)
  WHERE record_type = 'payment';
CREATE UNIQUE INDEX IF NOT EXISTS tournament_runtime_state_checkout_request_uidx
  ON public.tournament_runtime_state (checkout_request_id)
  WHERE record_type = 'payment' AND checkout_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS tournament_runtime_state_payment_merchant_idx
  ON public.tournament_runtime_state (merchant_request_id)
  WHERE record_type = 'payment' AND merchant_request_id IS NOT NULL;
ALTER TABLE public.tournament_runtime_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.tournament_runtime_state FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.tournament_runtime_state TO service_role;

-- Serialize payment/registration inserts with safe tournament removal. Lock the
-- normalized tournament row when present and the durable shared snapshot when it
-- is the only available copy. Tombstones prevent stale fallback seeds resurrecting
-- a tournament after a successful removal.
CREATE OR REPLACE FUNCTION public.guard_tournament_activity_parent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $$
DECLARE
  v_tournament_id text;
  v_database_parent_found boolean := false;
  v_shared_parent_found boolean := false;
BEGIN
  IF TG_TABLE_NAME = 'tournament_runtime_state' THEN
    IF NEW.record_type = 'tombstone' THEN
      RETURN NEW;
    END IF;

    IF NEW.record_type = 'tournament' THEN
      PERFORM 1
      FROM public.tournaments
      WHERE id::text = NEW.record_id
      FOR KEY SHARE;

      PERFORM 1
      FROM public.tournament_runtime_state
      WHERE record_type = 'tournament'
        AND record_id = NEW.record_id
      FOR KEY SHARE;

      PERFORM 1
      FROM public.tournament_runtime_state
      WHERE record_type = 'tombstone'
        AND record_id = NEW.record_id;
      IF FOUND THEN
        RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'Tournament was removed.';
      END IF;
      RETURN NEW;
    END IF;

    IF NEW.record_type <> 'payment' THEN
      RETURN NEW;
    END IF;
    v_tournament_id := NEW.tournament_id;
  ELSE
    v_tournament_id := NEW.tournament_id::text;
  END IF;

  IF v_tournament_id IS NULL OR btrim(v_tournament_id) = '' THEN
    RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = 'Tournament activity requires a tournament ID.';
  END IF;

  PERFORM 1
  FROM public.tournaments
  WHERE id::text = v_tournament_id
  FOR KEY SHARE;
  v_database_parent_found := FOUND;

  PERFORM 1
  FROM public.tournament_runtime_state
  WHERE record_type = 'tournament'
    AND record_id = v_tournament_id
  FOR KEY SHARE;
  v_shared_parent_found := FOUND;

  IF NOT v_database_parent_found AND NOT v_shared_parent_found THEN
    RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = 'Tournament does not exist.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_tournament_payment_parent ON public.tournament_payments;
CREATE TRIGGER trg_guard_tournament_payment_parent
BEFORE INSERT OR UPDATE ON public.tournament_payments
FOR EACH ROW EXECUTE FUNCTION public.guard_tournament_activity_parent();

DROP TRIGGER IF EXISTS trg_guard_tournament_participant_parent ON public.tournament_participants;
CREATE TRIGGER trg_guard_tournament_participant_parent
BEFORE INSERT OR UPDATE ON public.tournament_participants
FOR EACH ROW EXECUTE FUNCTION public.guard_tournament_activity_parent();

DROP TRIGGER IF EXISTS trg_guard_tournament_runtime_parent ON public.tournament_runtime_state;
CREATE TRIGGER trg_guard_tournament_runtime_parent
BEFORE INSERT OR UPDATE ON public.tournament_runtime_state
FOR EACH ROW EXECUTE FUNCTION public.guard_tournament_activity_parent();

-- One transaction checks all payment ledgers, checks for existing entrants,
-- removes the normalized/shared tournament, and writes a tombstone. The row locks
-- coordinate with the guards above, so no payment/registration can slip in between
-- the checks and deletion.
CREATE OR REPLACE FUNCTION public.delete_tournament_if_no_payment_activity(
  p_tournament_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $$
DECLARE
  v_tournament public.tournaments%ROWTYPE;
  v_tournament_found boolean := false;
  v_shared_payload jsonb;
  v_shared_found boolean := false;
  v_deleted_rows integer := 0;
BEGIN
  IF p_tournament_id IS NULL OR btrim(p_tournament_id) = '' OR length(p_tournament_id) > 128 THEN
    RAISE EXCEPTION 'Invalid tournament ID.';
  END IF;

  SELECT t.* INTO v_tournament
  FROM public.tournaments AS t
  WHERE t.id::text = p_tournament_id
  FOR UPDATE;
  v_tournament_found := FOUND;

  SELECT state.payload INTO v_shared_payload
  FROM public.tournament_runtime_state AS state
  WHERE state.record_type = 'tournament'
    AND state.record_id = p_tournament_id
  FOR UPDATE;
  v_shared_found := FOUND;

  IF NOT v_tournament_found AND NOT v_shared_found THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.tournament_runtime_state AS state
    WHERE state.record_type = 'tombstone'
      AND state.record_id = p_tournament_id
  ) THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.tournament_payments AS payment
    WHERE payment.tournament_id::text = p_tournament_id
  ) OR EXISTS (
    SELECT 1
    FROM public.tournament_runtime_state AS payment
    WHERE payment.record_type = 'payment'
      AND (payment.tournament_id = p_tournament_id
           OR payment.payload ->> 'tournament_id' = p_tournament_id)
  ) THEN
    RETURN false;
  END IF;

  IF (v_tournament_found AND coalesce(v_tournament.registered_count, 0) > 0)
     OR EXISTS (
       SELECT 1
       FROM public.tournament_participants AS participant
       WHERE participant.tournament_id::text = p_tournament_id
     ) THEN
    RETURN false;
  END IF;

  IF v_shared_found AND (
    coalesce((v_shared_payload ->> 'registered_count')::integer, 0) > 0
    OR CASE
      WHEN jsonb_typeof(v_shared_payload -> 'participants') = 'array'
        THEN jsonb_array_length(v_shared_payload -> 'participants') > 0
      ELSE false
    END
  ) THEN
    RETURN false;
  END IF;

  DELETE FROM public.tournament_runtime_state
  WHERE record_type = 'tournament'
    AND record_id = p_tournament_id;

  IF v_tournament_found THEN
    DELETE FROM public.tournaments
    WHERE id::text = p_tournament_id;
    GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;
    IF v_deleted_rows <> 1 THEN
      RAISE EXCEPTION 'Tournament changed during removal.';
    END IF;
  END IF;

  INSERT INTO public.tournament_runtime_state (
    record_type,
    record_id,
    tournament_id,
    payload,
    version,
    created_at,
    updated_at
  ) VALUES (
    'tombstone',
    p_tournament_id,
    p_tournament_id,
    jsonb_build_object('deleted_at', now()),
    1,
    now(),
    now()
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_tournament_if_no_payment_activity(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_tournament_if_no_payment_activity(text)
  TO service_role;

COMMIT;
