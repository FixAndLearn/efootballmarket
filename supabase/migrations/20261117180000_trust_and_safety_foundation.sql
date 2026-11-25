-- ============================================================================
-- Trust & safety foundation: recall window, seller track record, verification,
-- fingerprinting, reservations.
-- ============================================================================
-- Built from competitor research (COMPETITOR-RESEARCH.md). Every change here is
-- additive: no existing column is dropped or narrowed, and the existing
-- release_escrow_funds RPC is left untouched so nothing that works today breaks.
--
-- SCOPE NOTE: this migration does not touch M-Pesa, STK push, callback or
-- settlement tables. Partial release moves money between the same two internal
-- ledger columns (escrow_balance -> available_balance) that
-- release_escrow_funds already moves, just in two steps instead of one.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Orders + escrow: recall window and two-step release
-- ---------------------------------------------------------------------------
-- Today: seller delivers -> buyer confirms -> 100% of net_amount moves to
-- available_balance in one call, and the seller can withdraw immediately.
-- If the seller recalls the Konami ID on day 20 there is nothing left to
-- recover. Every serious competitor holds a post-sale window (PlayerSells 30
-- days, G2G 14, Eldorado 5-14, PlayerAuctions 7/14/30). We start at 7 days.

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check check (status::text = any (array[
    'payment_pending','escrow_locked','seller_delivered','buyer_reviewing',
    'recall_window','completed','disputed','cancelled','refunded','refund_requested'
  ]::text[]));

alter table public.escrow_accounts drop constraint if exists escrow_accounts_escrow_state_check;
alter table public.escrow_accounts
  add constraint escrow_accounts_escrow_state_check check (escrow_state::text = any (array[
    'pending','payment_initiated','payment_received','waiting_for_seller',
    'seller_delivered','buyer_reviewing','recall_window','completed',
    'refund_pending','refunded','disputed','cancelled','expired'
  ]::text[]));

alter table public.escrow_transactions drop constraint if exists escrow_transactions_action_type_check;
alter table public.escrow_transactions
  add constraint escrow_transactions_action_type_check check (action_type::text = any (array[
    'deposit','fee_deduction','release_to_seller',
    'partial_release_to_seller','release_remainder_to_seller',
    'refund_to_buyer','penalty'
  ]::text[]));

-- How the net amount is split, and when the held part becomes withdrawable.
alter table public.escrow_accounts
  add column if not exists initial_release_amount numeric(12,2),
  add column if not exists held_amount numeric(12,2),
  add column if not exists recall_deadline timestamptz,
  add column if not exists initial_released_at timestamptz;

comment on column public.escrow_accounts.initial_release_amount is
  'Portion of net_amount released at buyer confirmation. NULL for orders created before the recall window existed.';
comment on column public.escrow_accounts.held_amount is
  'Portion still held after confirmation, releasable only when the recall window closes clean.';
comment on column public.escrow_accounts.recall_deadline is
  'End of the post-sale window during which a buyer may report the account recovered.';

-- ---------------------------------------------------------------------------
-- 2. Profiles: real track record instead of a single boolean badge
-- ---------------------------------------------------------------------------
-- is_verified_seller is a boolean and says nothing about whether a seller has
-- done 0 sales or 50. With every current listing at 0 completed sales, showing
-- "New seller" honestly is worth more than a badge that implies nothing.

alter table public.profiles
  add column if not exists seller_tier text not null default 'new',
  add column if not exists recall_claims_count integer not null default 0,
  add column if not exists confirmed_recall_count integer not null default 0,
  add column if not exists seller_tier_updated_at timestamptz;

alter table public.profiles drop constraint if exists profiles_seller_tier_check;
alter table public.profiles
  add constraint profiles_seller_tier_check
  check (seller_tier in ('new','established','trusted','restricted'));

comment on column public.profiles.confirmed_recall_count is
  'Upheld account-recovery claims against this seller. Never reset; one confirmed recall is grounds for restriction.';

-- These are public trust signals shown on seller cards and listing pages; keep
-- access limited to the three non-sensitive columns, not SELECT on the whole row.
grant select (seller_tier, confirmed_recall_count, recall_claims_count)
  on table public.profiles to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Post-sale recall claims
-- ---------------------------------------------------------------------------
create table if not exists public.account_recall_claims (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  claimant_id uuid not null references public.profiles(id) on delete cascade,
  claimed_amount numeric(12,2),
  status text not null default 'open',
  description text not null,
  evidence_urls text[] not null default '{}',
  konami_notice_reference text,
  resolution_notes text,
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_recall_claims_status_check
    check (status in ('open','investigating','upheld','rejected','withdrawn'))
);

create unique index if not exists account_recall_claims_one_open_per_order
  on public.account_recall_claims (order_id)
  where status in ('open','investigating');

create index if not exists account_recall_claims_claimant_idx
  on public.account_recall_claims (claimant_id, created_at desc);

alter table public.account_recall_claims enable row level security;

-- A buyer sees only their own claims; the counterparty seller may see claims
-- against their orders, since they need a chance to respond. Admins use the
-- service role and bypass RLS entirely.
drop policy if exists "claimants and counterparties can read claims" on public.account_recall_claims;
create policy "claimants and counterparties can read claims"
  on public.account_recall_claims
  for select
  to authenticated
  using (
    claimant_id = auth.uid()
    or exists (
      select 1 from public.orders o
      where o.id = account_recall_claims.order_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

-- Inserts go through the API, which validates order ownership and window
-- timing. No insert policy is granted to authenticated on purpose.
revoke all on table public.account_recall_claims from anon;
revoke insert, update, delete, truncate on table public.account_recall_claims from authenticated;

-- ---------------------------------------------------------------------------
-- 4. Listing verification (screenshot check)
-- ---------------------------------------------------------------------------
alter table public.listings
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists verified_strength integer,
  add column if not exists verification_notes text,
  add column if not exists verified_at timestamptz;

alter table public.listings drop constraint if exists listings_verification_status_check;
alter table public.listings
  add constraint listings_verification_status_check
  check (verification_status in ('unverified','pending','verified','mismatch','rejected'));

comment on column public.listings.verification_status is
  'verified = screenshot strength matched the listing. mismatch = it did not, held for review. rejected = image reuse or other fraud signal.';

-- ---------------------------------------------------------------------------
-- 5. Fingerprints: same account relisted under a new listing
-- ---------------------------------------------------------------------------
-- The recall-and-resell loop is: sell, wait, recall, relist, sell again.
-- eFootball listing metadata is effectively a fingerprint -- dream team name,
-- strength, matches played and record rarely change between resales.

create table if not exists public.listing_fingerprints (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  fingerprint_hash text not null,
  image_hashes text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists listing_fingerprints_hash_idx
  on public.listing_fingerprints (fingerprint_hash);
create index if not exists listing_fingerprints_image_hashes_idx
  on public.listing_fingerprints using gin (image_hashes);

alter table public.listing_fingerprints enable row level security;

-- Fingerprints are an anti-fraud signal, not public data. Nobody gets to read
-- them through the API; the publish path checks them server-side and an admin
-- sees flagged rows via the service role.
revoke all on table public.listing_fingerprints from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Reservations: stop two buyers paying for one squad
-- ---------------------------------------------------------------------------
alter table public.listings
  add column if not exists reserved_until timestamptz,
  add column if not exists reserved_order_id uuid;

comment on column public.listings.reserved_until is
  'Set while a checkout is in flight so the buy button is disabled for everyone else. Cleared on completion, cancellation or expiry.';


-- ---------------------------------------------------------------------------
-- 7. Atomic checkout reservation and recall-compatible ledger guards
-- ---------------------------------------------------------------------------
create or replace function public.escrow_matches_order(
  p_net_amount numeric, p_initial_release_amount numeric,
  p_held_amount numeric, p_seller_net_amount numeric
) returns boolean language sql immutable as $$
  select coalesce(p_initial_release_amount, 0)
       + coalesce(p_held_amount, p_net_amount)
       = coalesce(p_seller_net_amount, 0);
$$;

create or replace function public.reserve_listing_for_checkout(
  p_listing_id uuid, p_order_id uuid, p_hold_minutes integer default 30
) returns boolean language plpgsql security definer
set search_path = pg_catalog, public, pg_temp as $$
declare v_rows integer;
begin
  if p_listing_id is null or p_order_id is null then raise exception 'Listing and order are required.'; end if;
  if p_hold_minutes < 1 or p_hold_minutes > 240 then raise exception 'Hold must be between 1 and 240 minutes.'; end if;
  update public.listings set reserved_order_id = p_order_id,
    reserved_until = now() + make_interval(mins => p_hold_minutes), updated_at = now()
   where id = p_listing_id and deleted_at is null
     and (reserved_order_id is null or reserved_order_id = p_order_id or reserved_until is null or reserved_until < now());
  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$$;

create or replace function public.release_listing_reservation(p_listing_id uuid, p_order_id uuid)
returns void language plpgsql security definer
set search_path = pg_catalog, public, pg_temp as $$
begin
  update public.listings set reserved_order_id = null, reserved_until = null, updated_at = now()
   where id = p_listing_id and reserved_order_id = p_order_id;
end;
$$;

create or replace function public.sync_listing_reservation()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public, pg_temp as $$
begin
  if new.status is distinct from old.status and new.status in
    ('escrow_locked','seller_delivered','buyer_reviewing','recall_window','completed','disputed','cancelled','refunded') then
    update public.listings set reserved_order_id = null, reserved_until = null, updated_at = now()
     where id = new.listing_id and reserved_order_id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_sync_listing_reservation on public.orders;
create trigger trg_sync_listing_reservation after update of status on public.orders
for each row execute function public.sync_listing_reservation();

-- These SECURITY DEFINER functions are server-only: allowing browser RPC calls
-- would let a client reserve arbitrary listings by supplying someone else's
-- order ID. The app routes call them through the service-role client.
revoke all on function public.reserve_listing_for_checkout(uuid,uuid,integer) from public, anon, authenticated;
grant execute on function public.reserve_listing_for_checkout(uuid,uuid,integer) to service_role;
revoke all on function public.release_listing_reservation(uuid,uuid) from public, anon, authenticated;
grant execute on function public.release_listing_reservation(uuid,uuid) to service_role;

-- Dynamic CREATE OR REPLACE preserves the existing RPC signatures and business
-- logic while replacing the broken net_amount = seller_net guard.
do $patch$
declare r record; v_src text; v_new text;
  v_old text := '     OR v_escrow.net_amount IS DISTINCT FROM v_order.seller_net_amount THEN' || E'\n' || '    RAISE EXCEPTION ''Order and escrow ledger do not match.'';';
  v_guard text := '     OR NOT public.escrow_matches_order(' || E'\n' || '        v_escrow.net_amount, v_escrow.initial_release_amount,' || E'\n' || '        v_escrow.held_amount, v_order.seller_net_amount) THEN' || E'\n' || '    RAISE EXCEPTION ''Order and escrow ledger do not match.'';';
begin
  for r in select p.oid,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname in ('open_escrow_dispute','resolve_escrow_dispute','confirm_and_open_recall_window') loop
    v_src := pg_get_functiondef(r.oid);
    if position('escrow_matches_order' in v_src)=0 then
      if position(v_old in v_src)=0 then raise exception 'ledger guard not found in %',r.proname; end if;
      execute replace(v_src,v_old,v_guard);
    end if;
  end loop;
  select p.oid into r from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='release_escrow_funds';
  v_src := pg_get_functiondef(r.oid);
  if position('escrow_matches_order' in v_src)=0 then
    v_new := replace(v_src,E'     OR v_escrow.net_amount IS DISTINCT FROM v_order.seller_net_amount THEN',E'     OR NOT public.escrow_matches_order(\n        v_escrow.net_amount, v_escrow.initial_release_amount,\n        v_escrow.held_amount, v_order.seller_net_amount) THEN');
    if v_new=v_src then raise exception 'release_escrow_funds guard not found'; end if;
    execute v_new;
  end if;
end;
$patch$;

-- Disputes can be opened during the recall window. A moderator ruling cannot
-- bypass the hold; an overlapping claim is closed by dispute resolution.
do $patch$
declare r record; v_src text; v_new text;
begin
  select p.oid into r from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='open_escrow_dispute';
  v_src := pg_get_functiondef(r.oid);
  if position('v_order.status = ''recall_window''' in v_src)=0 then
    v_new := replace(v_src,E'    OR (v_order.status = ''buyer_reviewing'' AND v_escrow.escrow_state = ''buyer_reviewing'')\n  ) THEN',E'    OR (v_order.status = ''buyer_reviewing'' AND v_escrow.escrow_state = ''buyer_reviewing'')\n    OR (v_order.status = ''recall_window'' AND v_escrow.escrow_state = ''recall_window'')\n  ) THEN');
    if v_new=v_src then raise exception 'open dispute eligibility clause not found'; end if;
    execute v_new;
  end if;

  select p.oid into r from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='resolve_escrow_dispute';
  v_src := pg_get_functiondef(r.oid);
  if position('v_release_holds' in v_src)=0 then
    v_new := replace(v_src,E'  v_post_release boolean := false;\n  v_clean_notes text;',E'  v_post_release boolean := false;\n  v_release_holds boolean := false;\n  v_initial numeric(12,2);\n  v_held numeric(12,2);\n  v_clean_notes text;');
    v_new := replace(v_new,E'  v_release_holds := (v_escrow.initial_release_amount IS NULL);',E'  v_release_holds := (v_escrow.initial_release_amount IS NULL AND NOT v_post_release AND p_action IN (''release_to_seller'',''dismiss''));');
    v_new := replace(v_new,E'  IF NOT v_post_release AND p_action IN (''release_to_seller'', ''dismiss'') THEN\n    SELECT * INTO v_profile',E'  v_release_holds := (v_escrow.initial_release_amount IS NULL AND NOT v_post_release AND p_action IN (''release_to_seller'',''dismiss''));\n  IF v_release_holds THEN\n    v_initial := round(v_escrow.net_amount * 0.8, 2);\n    v_held := v_escrow.net_amount - v_initial;\n    IF v_held < 0 THEN v_held := 0; END IF;\n  ELSE\n    v_initial := 0;\n    v_held := coalesce(v_escrow.held_amount, v_escrow.net_amount, 0);\n  END IF;\n  IF NOT v_post_release AND v_release_holds AND p_action IN (''release_to_seller'', ''dismiss'') THEN\n    SELECT * INTO v_profile');
    v_new := replace(v_new,E'    SET available_balance = coalesce(available_balance, 0) + v_escrow.net_amount,\n        escrow_balance = coalesce(escrow_balance, 0) - v_escrow.net_amount,',E'    SET available_balance = coalesce(available_balance, 0) + v_initial,\n        escrow_balance = coalesce(escrow_balance, 0) - v_initial,');
    v_new := replace(v_new,E'        completed_sales_count = coalesce(completed_sales_count, 0) + 1,',E'        completed_sales_count = coalesce(completed_sales_count, 0) + CASE WHEN v_release_holds THEN 0 ELSE 1 END,');
    v_new := replace(v_new,E'      ''release_to_seller'',\n      v_escrow.net_amount,\n      0.00,',E'      ''release_to_seller'',\n      v_initial,\n      v_held,');
    v_new := replace(v_new,E'  v_new_order_status := CASE WHEN p_action = ''refund_buyer'' THEN ''refunded'' ELSE ''completed'' END;\n  v_new_escrow_state := CASE WHEN p_action = ''refund_buyer'' THEN ''refund_pending'' ELSE ''completed'' END;',E'  v_new_order_status := CASE WHEN p_action = ''refund_buyer'' THEN ''refunded'' WHEN p_action IN (''release_to_seller'',''dismiss'') AND NOT v_post_release THEN ''recall_window'' ELSE ''completed'' END;\n  v_new_escrow_state := CASE WHEN p_action = ''refund_buyer'' THEN ''refund_pending'' WHEN p_action IN (''release_to_seller'',''dismiss'') AND NOT v_post_release THEN ''recall_window'' ELSE ''completed'' END;');
    v_new := replace(v_new,E'  SET escrow_state = v_new_escrow_state,\n      updated_at = now()\n  WHERE id = v_escrow.id AND escrow_state = ''disputed'';',E'  SET escrow_state = v_new_escrow_state,\n      net_amount = CASE WHEN v_release_holds THEN v_held ELSE net_amount END,\n      initial_release_amount = CASE WHEN v_release_holds THEN v_initial ELSE initial_release_amount END,\n      held_amount = CASE WHEN v_release_holds THEN v_held ELSE held_amount END,\n      recall_deadline = CASE WHEN v_release_holds THEN now() + make_interval(days => 7) ELSE recall_deadline END,\n      initial_released_at = CASE WHEN v_release_holds THEN now() ELSE initial_released_at END,\n      updated_at = now()\n  WHERE id = v_escrow.id AND escrow_state = ''disputed'';');
    v_new := replace(v_new,E'  UPDATE public.disputes\n  SET status = v_new_dispute_status,',E'  UPDATE public.account_recall_claims SET status = ''withdrawn'', resolved_by = p_reviewed_by, resolved_at = now(), updated_at = now() WHERE order_id = p_order_id AND status IN (''open'', ''investigating'');\n\n  UPDATE public.disputes\n  SET status = v_new_dispute_status,');
    if v_new=v_src then raise exception 'resolve dispute patches did not apply'; end if;
    execute v_new;
  end if;
end;
$patch$;

-- Maintain initial + held = seller_net after the held funds have moved.
do $patch$
declare r record; v_src text; v_new text;
begin
  select p.oid into r from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='release_escrow_remainder';
  v_src := pg_get_functiondef(r.oid);
  if position('initial_release_amount = coalesce(initial_release_amount, 0) + v_credit' in v_src)=0 then
    v_new := replace(v_src,E'     SET escrow_state = ''completed'',\n         held_amount = 0,',E'     SET escrow_state = ''completed'',\n         initial_release_amount = coalesce(initial_release_amount, 0) + v_credit,\n         held_amount = 0,');
    if v_new=v_src then raise exception 'remainder-release update not found'; end if;
    execute v_new;
  end if;
end;
$patch$;

commit;
