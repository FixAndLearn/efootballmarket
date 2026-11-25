-- Trust and safety RPCs for the recall-window foundation.
-- Applies after 20261118_trust_and_safety_foundation.sql.
-- No M-Pesa provider, callback, STK push, or settlement code is changed.
begin;

create or replace function public.confirm_and_open_recall_window(
  p_order_id uuid,
  p_performed_by uuid,
  p_initial_release_pct numeric default 0.80,
  p_window_days integer default 7
) returns void
language plpgsql security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_escrow public.escrow_accounts%rowtype;
  v_profile public.profiles%rowtype;
  v_is_admin boolean := false;
  v_rows integer := 0;
  v_initial numeric(12,2);
  v_held numeric(12,2);
begin
  if p_order_id is null or p_performed_by is null then raise exception 'Order and authenticated actor are required.'; end if;
  if p_initial_release_pct < 0 or p_initial_release_pct > 1 then raise exception 'Initial release percentage must be between 0 and 1.'; end if;
  if p_window_days < 1 or p_window_days > 90 then raise exception 'Recall window must be between 1 and 90 days.'; end if;

  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;
  if p_performed_by <> v_order.buyer_id then
    select exists(select 1 from public.user_roles where user_id=p_performed_by and role_id in ('admin','super_admin'))
        or exists(select 1 from public.profiles where id=p_performed_by and role in ('admin','super_admin')) into v_is_admin;
    if not v_is_admin then raise exception 'Only the order buyer or an administrator may confirm delivery.'; end if;
  end if;

  select * into v_escrow from public.escrow_accounts where order_id=p_order_id for update;
  if not found then raise exception 'Escrow account not found.'; end if;
  if v_escrow.buyer_id is distinct from v_order.buyer_id or v_escrow.seller_id is distinct from v_order.seller_id
     or not public.escrow_matches_order(v_escrow.net_amount,v_escrow.initial_release_amount,v_escrow.held_amount,v_order.seller_net_amount) then
    raise exception 'Order and escrow ledger do not match.';
  end if;
  if v_order.status='recall_window' and v_escrow.escrow_state='recall_window' then return; end if;
  if v_order.status='disputed' or v_escrow.escrow_state='disputed' then raise exception 'Escrow is disputed and cannot be confirmed.'; end if;
  if v_order.status='completed' then raise exception 'Order is already completed.'; end if;
  if not ((v_order.status='seller_delivered' and v_escrow.escrow_state='seller_delivered') or (v_order.status='buyer_reviewing' and v_escrow.escrow_state='buyer_reviewing')) then
    raise exception 'Order and escrow are not in a confirmable state.';
  end if;
  if v_escrow.net_amount<=0 then raise exception 'Escrow release amount must be positive.'; end if;

  v_initial := round(v_escrow.net_amount*p_initial_release_pct,2);
  v_held := v_escrow.net_amount-v_initial;
  if v_held<0 then v_held:=0; end if;
  if v_initial>0 then
    select * into v_profile from public.profiles where id=v_order.seller_id for update;
    if not found then raise exception 'Seller ledger not found.'; end if;
    if coalesce(v_profile.escrow_balance,0)<v_initial then raise exception 'Seller escrow balance is insufficient; release refused.'; end if;
    perform set_config('app.internal_ledger_op','true',true);
    update public.profiles set available_balance=coalesce(available_balance,0)+v_initial,
      escrow_balance=coalesce(escrow_balance,0)-v_initial,updated_at=now() where id=v_order.seller_id;
    get diagnostics v_rows=row_count;
    if v_rows<>1 then raise exception 'Seller balance could not be updated.'; end if;
    insert into public.escrow_transactions(escrow_id,action_type,amount,balance_after,performed_by,notes)
    values(v_escrow.id,'partial_release_to_seller',v_initial,v_held,p_performed_by,'Initial release on buyer confirmation; remainder held through the recall window');
  end if;

  update public.escrow_accounts set escrow_state='recall_window',net_amount=v_held,
    initial_release_amount=v_initial,held_amount=v_held,
    recall_deadline=now()+make_interval(days=>p_window_days),initial_released_at=now(),updated_at=now()
   where id=v_escrow.id and escrow_state=v_escrow.escrow_state;
  get diagnostics v_rows=row_count;
  if v_rows<>1 then raise exception 'Escrow state changed during confirmation.'; end if;
  update public.orders set status='recall_window',updated_at=now() where id=v_order.id and status=v_order.status;
  get diagnostics v_rows=row_count;
  if v_rows<>1 then raise exception 'Order state changed during confirmation.'; end if;
  update public.listings set status='sold',updated_at=now() where id=v_order.listing_id;
  insert into public.notifications(recipient_id,type,title,message,action_url,is_read)
  values(v_order.seller_id,'funds_released','Partial payment released',
    'KES '||v_initial||' was credited for order #'||v_order.order_number||'. KES '||v_held||' is held until the buyer''s '||p_window_days||'-day account-recovery window closes.',
    '/seller/earnings',false);
  insert into public.audit_logs(actor_id,action,resource_type,resource_id,changes)
  values(p_performed_by,'escrow_recall_window_opened','escrow_account',v_escrow.id::text,
    jsonb_build_object('order_id',p_order_id,'initial',v_initial,'held',v_held,'days',p_window_days));
end;
$$;

create or replace function public.release_escrow_remainder(p_order_id uuid,p_performed_by uuid)
returns void language plpgsql security definer
set search_path = pg_catalog, public, pg_temp as $$
declare
  v_order public.orders%rowtype; v_escrow public.escrow_accounts%rowtype;
  v_profile public.profiles%rowtype; v_is_admin boolean:=false; v_is_buyer boolean:=false;
  v_rows integer:=0; v_credit numeric(12,2); v_open_claim boolean:=false;
begin
  if p_order_id is null then raise exception 'Order is required.'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;
  select * into v_escrow from public.escrow_accounts where order_id=p_order_id for update;
  if not found then raise exception 'Escrow account not found.'; end if;
  if v_order.status='completed' and v_escrow.escrow_state='completed' then return; end if;
  if v_order.status='disputed' or v_escrow.escrow_state='disputed' then raise exception 'Escrow is disputed; remaining funds cannot be released.'; end if;
  if not (v_order.status='recall_window' and v_escrow.escrow_state='recall_window') then raise exception 'Order is not inside a recall window.'; end if;
  if p_performed_by is not null then
    select exists(select 1 from public.user_roles where user_id=p_performed_by and role_id in ('admin','super_admin'))
      or exists(select 1 from public.profiles where id=p_performed_by and role in ('admin','super_admin')) into v_is_admin;
    v_is_buyer:=p_performed_by=v_order.buyer_id;
    if not v_is_admin and not v_is_buyer then raise exception 'Only the buyer, an administrator, or the scheduled job may release held funds.'; end if;
    if v_is_buyer and not v_is_admin and (v_escrow.recall_deadline is null or now()<v_escrow.recall_deadline) then
      raise exception 'Held funds unlock on %; a report inside the window must be reviewed first.',coalesce(to_char(v_escrow.recall_deadline,'YYYY-MM-DD HH24:MI'),'the recall deadline');
    end if;
  end if;
  select exists(select 1 from public.account_recall_claims where order_id=p_order_id and status in ('open','investigating')) into v_open_claim;
  if v_open_claim then raise exception 'An account-recovery claim is open on this order; held funds stay frozen until it is resolved.'; end if;
  v_credit:=coalesce(v_escrow.held_amount,v_escrow.net_amount,0);
  if v_credit<=0 then raise exception 'No held amount to release.'; end if;
  select * into v_profile from public.profiles where id=v_order.seller_id for update;
  if not found then raise exception 'Seller ledger not found.'; end if;
  if coalesce(v_profile.escrow_balance,0)<v_credit then raise exception 'Seller escrow balance is insufficient; release refused.'; end if;
  perform set_config('app.internal_ledger_op','true',true);
  update public.profiles set available_balance=coalesce(available_balance,0)+v_credit,
    escrow_balance=coalesce(escrow_balance,0)-v_credit,
    completed_sales_count=coalesce(completed_sales_count,0)+1,updated_at=now() where id=v_order.seller_id;
  get diagnostics v_rows=row_count;
  if v_rows<>1 then raise exception 'Seller balance could not be updated.'; end if;
  insert into public.escrow_transactions(escrow_id,action_type,amount,balance_after,performed_by,notes)
  values(v_escrow.id,'release_remainder_to_seller',v_credit,0.00,p_performed_by,'Held portion released after the account-recovery window closed clean');
  update public.escrow_accounts set escrow_state='completed',
    initial_release_amount=coalesce(initial_release_amount,0)+v_credit,held_amount=0,
    released_at=now(),completed_at=now(),updated_at=now()
   where id=v_escrow.id and escrow_state=v_escrow.escrow_state;
  get diagnostics v_rows=row_count;
  if v_rows<>1 then raise exception 'Escrow state changed during release.'; end if;
  update public.orders set status='completed',updated_at=now() where id=v_order.id and status=v_order.status;
  get diagnostics v_rows=row_count;
  if v_rows<>1 then raise exception 'Order state changed during release.'; end if;
  update public.listings set status='sold',updated_at=now() where id=v_order.listing_id;
  insert into public.notifications(recipient_id,type,title,message,action_url,is_read)
  values(v_order.seller_id,'funds_released','Held funds released','KES '||v_credit||' of held funds for order #'||v_order.order_number||' was credited to your available balance. The account-recovery window closed with no upheld claim.','/seller/earnings',false);
  insert into public.audit_logs(actor_id,action,resource_type,resource_id,changes)
  values(p_performed_by,'escrow_remainder_released','escrow_account',v_escrow.id::text,jsonb_build_object('order_id',p_order_id,'amount',v_credit));
  perform public.refresh_seller_tier(v_order.seller_id);
end;
$$;

create or replace function public.open_account_recall_claim(
  p_order_id uuid,p_claimant_id uuid,p_description text,
  p_evidence_urls text[] default '{}'::text[],p_konami_notice_reference text default null::text
) returns uuid language plpgsql security definer
set search_path = pg_catalog, public, pg_temp as $$
declare v_order public.orders%rowtype; v_escrow public.escrow_accounts%rowtype; v_claim_id uuid;
begin
  if p_order_id is null or p_claimant_id is null then raise exception 'Order and claimant are required.'; end if;
  if p_description is null or length(btrim(p_description))<20 then raise exception 'Describe what happened in at least 20 characters.'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;
  if v_order.buyer_id<>p_claimant_id then raise exception 'Only the buyer on this order may report an account recovery.'; end if;
  select * into v_escrow from public.escrow_accounts where order_id=p_order_id for update;
  if not found then raise exception 'Escrow account not found.'; end if;
  if v_order.status<>'recall_window' or v_escrow.escrow_state<>'recall_window' then raise exception 'An account-recovery report can only be filed during the active recall window.'; end if;
  if v_escrow.recall_deadline is null or now()>v_escrow.recall_deadline then raise exception 'The account-recovery window has closed.'; end if;
  insert into public.account_recall_claims(order_id,claimant_id,claimed_amount,status,description,evidence_urls,konami_notice_reference)
  values(p_order_id,p_claimant_id,coalesce(v_escrow.held_amount,0),'open',btrim(p_description),coalesce(p_evidence_urls,'{}'),p_konami_notice_reference)
  returning id into v_claim_id;
  update public.orders set status='disputed',updated_at=now() where id=p_order_id;
  update public.escrow_accounts set escrow_state='disputed',updated_at=now() where id=v_escrow.id;
  update public.profiles set recall_claims_count=coalesce(recall_claims_count,0)+1,updated_at=now() where id=v_order.seller_id;
  insert into public.notifications(recipient_id,type,title,message,action_url,is_read)
  values(v_order.seller_id,'dispute_opened','Account-recovery claim filed','The buyer on order #'||v_order.order_number||' reports the account was recovered. Held funds are frozen while an admin reviews it. Respond with your side in the order chat.','/orders/'||p_order_id,false);
  insert into public.audit_logs(actor_id,action,resource_type,resource_id,changes)
  values(p_claimant_id,'account_recall_claim_opened','order',p_order_id::text,jsonb_build_object('claim_id',v_claim_id,'frozen_amount',coalesce(v_escrow.held_amount,0)));
  return v_claim_id;
end;
$$;

create or replace function public.resolve_account_recall_claim(
  p_claim_id uuid,p_admin_id uuid,p_outcome text,p_notes text default null::text
) returns void language plpgsql security definer
set search_path = pg_catalog, public, pg_temp as $$
declare
  v_claim public.account_recall_claims%rowtype; v_order public.orders%rowtype;
  v_escrow public.escrow_accounts%rowtype; v_is_admin boolean:=false;
  v_amount numeric(12,2); v_rows integer:=0;
begin
  if p_outcome not in ('upheld','rejected') then raise exception 'Outcome must be upheld or rejected.'; end if;
  select exists(select 1 from public.user_roles where user_id=p_admin_id and role_id in ('admin','super_admin'))
    or exists(select 1 from public.profiles where id=p_admin_id and role in ('admin','super_admin')) into v_is_admin;
  if not v_is_admin then raise exception 'Only an administrator may resolve an account-recovery claim.'; end if;
  select * into v_claim from public.account_recall_claims where id=p_claim_id for update;
  if not found then raise exception 'Claim not found.'; end if;
  if v_claim.status not in ('open','investigating') then raise exception 'Claim is already resolved (%).',v_claim.status; end if;
  select * into v_order from public.orders where id=v_claim.order_id for update;
  select * into v_escrow from public.escrow_accounts where order_id=v_claim.order_id for update;
  if not found then raise exception 'Escrow account not found.'; end if;
  v_amount:=coalesce(v_escrow.held_amount,0);

  if p_outcome='upheld' then
    insert into public.escrow_transactions(escrow_id,action_type,amount,balance_after,performed_by,notes)
    values(v_escrow.id,'refund_to_buyer',v_amount,v_amount,p_admin_id,'Account-recovery claim upheld: held funds parked in refund_pending for manual transfer to buyer');
    update public.escrow_accounts set escrow_state='refund_pending',updated_at=now() where id=v_escrow.id;
    update public.orders set status='refunded',updated_at=now() where id=v_order.id;
    update public.profiles set confirmed_recall_count=coalesce(confirmed_recall_count,0)+1,
      seller_tier='restricted',seller_tier_updated_at=now(),updated_at=now() where id=v_order.seller_id;
    update public.listings set status='archived',updated_at=now() where seller_id=v_order.seller_id and status in ('published','pending_review');
    insert into public.notifications(recipient_id,type,title,message,action_url,is_read)
    values(v_order.buyer_id,'dispute_resolved','Account-recovery claim upheld','Your report on order #'||v_order.order_number||' was upheld. KES '||v_amount||' is queued for a manual refund. Support will contact you to complete the transfer.','/orders/'||v_order.id,false);
  else
    if v_amount>0 then
      select * into v_escrow from public.escrow_accounts where id=v_escrow.id for update;
      update public.profiles set available_balance=coalesce(available_balance,0)+v_amount,
        escrow_balance=coalesce(escrow_balance,0)-v_amount,
        completed_sales_count=coalesce(completed_sales_count,0)+1,updated_at=now()
       where id=v_order.seller_id and coalesce(escrow_balance,0)>=v_amount;
      get diagnostics v_rows=row_count;
      if v_rows<>1 then raise exception 'Seller escrow balance was short; cannot release held funds.'; end if;
      insert into public.escrow_transactions(escrow_id,action_type,amount,balance_after,performed_by,notes)
      values(v_escrow.id,'release_remainder_to_seller',v_amount,0.00,p_admin_id,'Account-recovery claim rejected: held portion released to seller');
    end if;
    update public.escrow_accounts set escrow_state='completed',
      initial_release_amount=coalesce(initial_release_amount,0)+v_amount,
      held_amount=0,released_at=now(),completed_at=now(),updated_at=now() where id=v_escrow.id;
    update public.orders set status='completed',updated_at=now() where id=v_order.id;
    insert into public.notifications(recipient_id,type,title,message,action_url,is_read)
    values(v_order.seller_id,'funds_released','Account-recovery claim rejected','The claim on order #'||v_order.order_number||' was reviewed and rejected. Held funds have been released to your available balance.','/seller/earnings',false);
  end if;

  update public.account_recall_claims set status=p_outcome,resolution_notes=p_notes,
    resolved_by=p_admin_id,resolved_at=now(),updated_at=now() where id=p_claim_id;
  perform public.refresh_seller_tier(v_order.seller_id);
  insert into public.audit_logs(actor_id,action,resource_type,resource_id,changes)
  values(p_admin_id,'account_recall_claim_resolved','account_recall_claim',p_claim_id::text,jsonb_build_object('outcome',p_outcome,'amount',v_amount,'notes',p_notes));
end;
$$;

create or replace function public.compute_seller_tier(p_profile_id uuid)
returns text language plpgsql stable security definer
set search_path = pg_catalog, public, pg_temp as $$
declare v_completed integer; v_confirmed_recalls integer; v_clean_windows integer;
begin
  select coalesce(completed_sales_count,0),coalesce(confirmed_recall_count,0) into v_completed,v_confirmed_recalls
    from public.profiles where id=p_profile_id;
  if not found then return 'new'; end if;
  if v_confirmed_recalls>=1 then return 'restricted'; end if;
  select count(*) into v_clean_windows from public.escrow_accounts e
   where e.seller_id=p_profile_id and e.escrow_state='completed' and e.held_amount=0 and e.recall_deadline is not null;
  if v_completed>=20 and v_clean_windows>=10 then return 'trusted'; end if;
  if v_completed>=5 then return 'established'; end if;
  return 'new';
end;
$$;

create or replace function public.refresh_seller_tier(p_profile_id uuid)
returns text language plpgsql security definer
set search_path = pg_catalog, public, pg_temp as $$
declare v_tier text;
begin
  v_tier:=public.compute_seller_tier(p_profile_id);
  update public.profiles set seller_tier=v_tier,seller_tier_updated_at=now()
   where id=p_profile_id and seller_tier is distinct from v_tier;
  return v_tier;
end;
$$;

-- Resolve/reject must preserve the invariant after the held amount reaches the
-- seller: initial_release_amount + held_amount = seller_net_amount.
commit;
