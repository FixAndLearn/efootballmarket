-- ============================================================================
-- Username integrity: handle the public storefront key safely.
--
-- Background
--   `profiles.username` is citext (case-insensitive uniqueness already works)
--   and `profiles_username_no_email_check` already blocks '@', so the original
--   "emails leaking as usernames" concern is closed. What remained open:
--
--   1. Two legacy rows hold handles that violate the charset the app itself
--      enforces in code ("idk..." and "jayven azyel veyron"). Nothing at the
--      DB layer stopped them, and they produce broken public storefront URLs.
--   2. `src/app/profile/page.tsx` stripped '@' and symbols from a saved
--      username but never re-checked length. A user could therefore save an
--      EMPTY or 1-2 character handle. Because username is the public storefront
--      key (`/u/<username>`), the first blank handle would have squatted the
--      empty slug permanently. This migration makes that impossible.
--   3. Reserved handles (admin, support, escrow, ...) were unguarded, allowing
--      brand impersonation on a marketplace that holds customer money.
--
-- Deliberately preserved: '-' in usernames. One real seller with published
-- inventory uses "lone-ranger_"; forcing underscores-only would rename a live
-- storefront for no security benefit.
-- ============================================================================

BEGIN;

-- 1. Repair the two legacy malformed handles -------------------------------
-- Both accounts have zero published listings. A rename would break any
-- bookmarked storefront, so they fall back to an opaque UUID-derived handle.
-- Both are guaranteed to satisfy the new constraint below.
UPDATE public.profiles
SET username = 'trader_' || substr(replace(id::text, '-', ''), 1, 8)
WHERE username !~ '^[A-Za-z0-9_-]{3,24}$';

-- 2. Enforce the charset and length at the database layer ------------------
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_username_charset_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_charset_check
  CHECK (username ~ '^[A-Za-z0-9_-]{3,24}$');

-- 3. Block brand / role impersonation --------------------------------------
CREATE OR REPLACE FUNCTION public.reject_reserved_username()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reserved text[] := ARRAY[
    'admin', 'administrator', 'support', 'help', 'helpdesk',
    'escrow', 'efootballmarket', 'efm', 'official', 'staff', 'team',
    'moderator', 'mod', 'system', 'root', 'owner', 'seller', 'buyer',
    'payments', 'billing', 'security', 'verify', 'verified', 'dispute',
    'customer', 'service', 'customercare', 'marketplace'
  ];
BEGIN
  -- Service role and trusted internal jobs may set anything.
  IF COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF COALESCE(current_setting('app.internal_ledger_op', true), '') = 'true' THEN
    RETURN NEW;
  END IF;

  -- Only guard the public-facing handle, and only when it actually changes.
  IF NEW.username IS DISTINCT FROM OLD.username THEN
    IF lower(NEW.username) = ANY (v_reserved) THEN
      RAISE EXCEPTION
        'That username is reserved. Please choose another.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reject_reserved_username ON public.profiles;
CREATE TRIGGER trg_reject_reserved_username
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.reject_reserved_username();

-- 4. handle_new_user(): keep generated handles inside the new constraint ----
-- The previous definition produced `left(raw_username, 20) || '_' || 6-char id`
-- = 27 characters whenever a handle collided, which profiles_username_charset_check
-- now rejects. That would have turned a duplicate name into a hard signup
-- failure. This rewrite guarantees a 3-24 character, charset-valid handle on
-- every path, including the unique_violation fallback.
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

  -- Lowercase BEFORE stripping. Doing it the other way round deletes capital
  -- letters instead of folding them, so "Support" became "upport" and the
  -- reserved-name guard never saw the real word.
  v_raw_username := regexp_replace(
    lower(COALESCE(
      NULLIF(btrim(NEW.raw_user_meta_data->>'username'), ''),
      NULLIF(btrim(NEW.raw_user_meta_data->>'user_name'), ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      'trader_' || v_clean_id
    )),
    '[^a-z0-9_-]', '', 'g'
  );

  -- Guarantee the 3 character minimum. A 1-2 character email local part
  -- (e.g. "a@example.com") would otherwise insert an unusable handle.
  IF length(v_raw_username) < 3 THEN
    v_raw_username := 'trader_' || v_clean_id;
  END IF;
  v_raw_username := left(v_raw_username, 24);

  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(v_raw_username) AND id <> NEW.id
  ) THEN
    -- 17 + 1 + 6 = 24 characters.
    v_username := left(v_raw_username, 17) || '_' || v_clean_id;
  ELSE
    v_username := v_raw_username;
  END IF;

  -- Reserved names must not reach a brand-impersonating handle at signup.
  IF lower(v_username) = ANY (ARRAY[
       'admin','administrator','support','help','helpdesk','escrow',
       'efootballmarket','efm','official','staff','team','moderator','mod',
       'system','root','owner','seller','buyer','payments','billing',
       'security','verify','verified','dispute','customer','service',
       'customercare','marketplace']) THEN
    v_username := 'trader_' || v_clean_id;
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
    -- Last-resort handle: 7 + 1 + 10 = 18 characters, always unique enough.
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

  RETURN NEW;
END;
$function$;

COMMIT;
