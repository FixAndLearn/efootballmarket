# Live Supabase `public` schema — security and access snapshot

**Project:** eFootball Market (`fdnflvbknoopethbihns`)  
**Captured:** 2026-11-10, by read-only catalog queries. No DB writes or row-data reads were performed.

For table/column definitions and constraints, see `live_public_schema_snapshot.md`.

## RLS state

RLS is enabled on all 39 `public` tables. `FORCE ROW LEVEL SECURITY` is **off** for all 39.

| Table | Policies |
|---|---:|
| account_deliveries | 3 |
| audit_logs | 2 |
| availability_pings | 2 |
| conversation_members | 0 |
| conversations | 1 |
| dispute_evidence | 0 |
| disputes | 2 |
| escrow_accounts | 1 |
| escrow_transactions | 0 |
| favorites | 1 |
| listing_credentials | 0 |
| listing_images | 2 |
| listing_offers | 2 |
| listings | 7 |
| login_history | 0 |
| messages | 2 |
| middleman_deals | 1 |
| mpesa_settlement_receipts | 0 |
| news_articles | 2 |
| notifications | 2 |
| orders | 1 |
| payment_receipts | 0 |
| payments | 0 |
| profiles | 3 |
| reports | 0 |
| reviews | 2 |
| roles | 0 |
| saved_searches | 0 |
| scammer_reports | 2 |
| seller_verifications | 0 |
| seller_withdrawals | 4 |
| system_settings | 0 |
| tournament_matches | 2 |
| tournament_participants | 3 |
| tournament_payments | 3 |
| tournaments | 4 |
| user_invitations | 0 |
| user_roles | 0 |
| wanted_requests | 1 |

All listed policies are `PERMISSIVE`.

## RLS policies

`USING` and `WITH CHECK` below are the expressions returned by `pg_policies`; `—` means NULL/not set.

### `account_deliveries`
- **Account credentials strictly visible to order parties** — `{public}`, SELECT; USING: `((EXISTS (SELECT 1 FROM orders WHERE orders.id = account_deliveries.order_id AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid()))) OR (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role_id IN ('admin','super_admin'))))`; CHECK: —
- **Order parties can update deliveries** — `{public}`, UPDATE; USING and CHECK: `((EXISTS (SELECT 1 FROM orders WHERE orders.id = account_deliveries.order_id AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid()))) OR (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role_id IN ('admin','super_admin'))))`
- **Sellers can insert credentials** — `{public}`, INSERT; USING: —; CHECK: `((EXISTS (SELECT 1 FROM orders WHERE orders.id = account_deliveries.order_id AND orders.seller_id = auth.uid())) OR (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role_id IN ('admin','super_admin'))))`

### `audit_logs`
- **Admins can record audit logs** — `{authenticated}`, INSERT; CHECK: `is_admin()`
- **Admins can view audit logs** — `{authenticated}`, SELECT; USING: `is_admin()`

### `availability_pings`
- **Parties or admin view availability pings** — `{authenticated}`, SELECT; USING: `(seller_id = auth.uid()) OR (buyer_id = auth.uid()) OR is_admin_user()`
- **Sellers or admin update availability pings** — `{authenticated}`, UPDATE; USING and CHECK: `(seller_id = auth.uid()) OR is_admin_user()`

### `conversations`
- **Members can view conversations** — `{public}`, SELECT; USING: `EXISTS (SELECT 1 FROM conversation_members WHERE conversation_members.conversation_id = conversations.id AND conversation_members.user_id = auth.uid())`

### `disputes`
- **Admins update disputes** — `{authenticated}`, UPDATE; USING and CHECK: `is_admin_user()`
- **Order parties view disputes** — `{authenticated}`, SELECT; USING: `(opened_by = auth.uid()) OR (EXISTS (SELECT 1 FROM orders o WHERE o.id = disputes.order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid()))) OR is_admin_user()`

### `escrow_accounts`
- **Escrow visible to participants** — `{public}`, SELECT; USING: `(auth.uid() = buyer_id) OR (auth.uid() = seller_id)`

### `favorites`
- **Users can manage own favorites** — `{public}`, ALL; USING: `(auth.uid() = user_id)`; CHECK: —

### `listing_images`
- **Listing images are viewable by everyone** — `{public}`, SELECT; USING: `true`
- **Sellers can manage images for own listings** — `{public}`, ALL; USING: `EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_images.listing_id AND listings.seller_id = auth.uid())`; CHECK: —

### `listing_offers`
- **Offer parties view offers** — `{authenticated}`, SELECT; USING: `(buyer_id = auth.uid()) OR (seller_id = auth.uid()) OR is_admin_user()`
- **Sellers update own listing offers** — `{authenticated}`, UPDATE; USING and CHECK: `(seller_id = auth.uid()) OR is_admin_user()`

### `listings`
- **Admins have full CRUD access** — `{authenticated}`, ALL; USING and CHECK: `is_admin()`
- **Published or party listings viewable** — `{public}`, SELECT; USING: `((status = 'published' AND deleted_at IS NULL) OR (auth.uid() IS NOT NULL AND seller_id = auth.uid()) OR (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM orders o WHERE o.listing_id = listings.id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid()))) OR is_admin_user())`
- **Sellers can insert their own listings** — `{public}`, INSERT; CHECK: `(auth.uid() = seller_id)`
- **Sellers can manage own listings** — `{public}`, ALL; USING: `(auth.uid() = seller_id) OR is_admin_user()`; CHECK: —
- **Sellers can update their own listings** — `{public}`, UPDATE; USING: `(auth.uid() = seller_id)`; CHECK: —
- **Sellers can view own listings of any status** — `{public}`, SELECT; USING: `(auth.uid() = seller_id)`
- **Sellers manage own listings** — `{authenticated}`, ALL; USING and CHECK: `(seller_id = auth.uid())`

### `messages`
- **Members can insert messages** — `{public}`, INSERT; CHECK: `(auth.uid() = sender_id) AND EXISTS (SELECT 1 FROM conversation_members WHERE conversation_members.conversation_id = messages.conversation_id AND conversation_members.user_id = auth.uid())`
- **Members can view messages** — `{public}`, SELECT; USING: `EXISTS (SELECT 1 FROM conversation_members WHERE conversation_members.conversation_id = messages.conversation_id AND conversation_members.user_id = auth.uid())`

### `middleman_deals`
- **Admins manage middleman deals** — `{authenticated}`, ALL; USING and CHECK: `is_admin_user()`

### `news_articles`
- **Admins can manage news** — `{public}`, ALL; USING: authenticated user and (`user_roles` admin/super_admin OR `auth.users.email` equals `brianokibo@gmail.com`); CHECK: —
- **Public can view published news** — `{public}`, SELECT; USING: `(is_published = true) OR is_admin_user()`

### `notifications`
- **Users can read own notifications** — `{public}`, SELECT; USING: `(auth.uid() = recipient_id)`
- **Users can update own notifications** — `{public}`, UPDATE; USING: `(auth.uid() = recipient_id)`

### `orders`
- **Buyers and sellers can view their own orders** — `{public}`, SELECT; USING: `(auth.uid() = buyer_id) OR (auth.uid() = seller_id)`

### `profiles`
- **Public can view profiles** — `{public}`, SELECT; USING: `true`
- **Public profiles are readable** — `{public}`, SELECT; USING: `(deleted_at IS NULL)`
- **Users can update own profile** — `{public}`, UPDATE; USING: `(auth.uid() = id)`

### `reviews`
- **Buyers can write reviews for completed orders** — `{public}`, INSERT; CHECK: `(auth.uid() = reviewer_id)`
- **Reviews are viewable by everyone** — `{public}`, SELECT; USING: `true`

### `scammer_reports`
- **Admins manage scammer reports** — `{authenticated}`, ALL; USING and CHECK: `is_admin_user()`
- **Public read verified scammer reports** — `{public}`, SELECT; USING: `(verified_status = 'verified') OR is_admin_user()`

### `seller_withdrawals`
- **Admins can update withdrawals** — `{authenticated}`, UPDATE; USING and CHECK: `is_admin_user()`
- **Sellers and admins can view withdrawals** — `{public}`, SELECT; USING: `auth.uid() IS NOT NULL AND ((auth.uid() = seller_id) OR is_admin_user())`
- **Sellers can insert own withdrawals** — `{public}`, INSERT; CHECK: `auth.uid() IS NOT NULL AND ((auth.uid() = seller_id) OR is_admin_user())`
- **Sellers can view own withdrawals** — `{public}`, SELECT; USING: `(auth.uid() = seller_id) OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role_id IN ('admin','super_admin'))`

### `tournament_matches`
- **Moderators and admins can manage matches** — `{public}`, ALL; USING: `is_admin_user() OR EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_matches.tournament_id AND t.created_by = auth.uid())`; CHECK: —
- **Public can view tournament matches** — `{public}`, SELECT; USING: `true`

### `tournament_participants`
- **Moderators and admins can manage participants** — `{public}`, ALL; USING: `is_admin_user() OR EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_participants.tournament_id AND t.created_by = auth.uid())`; CHECK: —
- **Public can view tournament participants** — `{public}`, SELECT; USING: `true`
- **Users can register for tournament** — `{public}`, INSERT; CHECK: `auth.uid() IS NOT NULL AND ((user_id IS NULL) OR (user_id = auth.uid()))`

### `tournament_payments`
- **Admins manage tournament payments** — `{authenticated}`, ALL; USING and CHECK: `is_admin_user()`
- **Users insert pending tournament payments** — `{authenticated}`, INSERT; CHECK: `((user_id IS NULL) OR (user_id = auth.uid())) AND (status = 'pending')`
- **Users view own tournament payments** — `{authenticated}`, SELECT; USING: `(user_id = auth.uid()) OR is_admin_user()`

### `tournaments`
- **Authenticated users can create tournaments** — `{public}`, INSERT; CHECK: `(auth.uid() IS NOT NULL)`
- **Hosts and admins can delete tournaments** — `{public}`, DELETE; USING: `(auth.uid() = created_by) OR is_admin_user()`
- **Hosts and admins can update tournaments** — `{public}`, UPDATE; USING: `(auth.uid() = created_by) OR is_admin_user()`
- **Public can view tournaments** — `{public}`, SELECT; USING: `true`

### `wanted_requests`
- **Admins manage wanted requests** — `{authenticated}`, ALL; USING and CHECK: `is_admin_user()`

## Indexes

There are 117 total public indexes. The following 61 are standalone indexes (not the indexes backing PK/UNIQUE constraints); constraint-backed indexes are represented by table constraints in the companion schema file. Definitions are normalized for readability and are not guaranteed byte-for-byte identical to PostgreSQL's emitted DDL.

```sql
CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs USING btree (actor_id);
CREATE INDEX idx_audit_logs_admin ON public.audit_logs USING btree (admin_id);
CREATE INDEX idx_availability_pings_listing ON public.availability_pings USING btree (listing_id, created_at DESC);
CREATE INDEX idx_availability_pings_seller ON public.availability_pings USING btree (seller_id, status, created_at DESC);
CREATE INDEX idx_escrow_accounts_buyer ON public.escrow_accounts USING btree (buyer_id);
CREATE INDEX idx_escrow_accounts_seller ON public.escrow_accounts USING btree (seller_id);
CREATE INDEX idx_escrow_order ON public.escrow_accounts USING btree (order_id);
CREATE INDEX idx_escrow_state ON public.escrow_accounts USING btree (escrow_state);
CREATE INDEX idx_escrow_transactions_escrow ON public.escrow_transactions USING btree (escrow_id, created_at DESC);
CREATE INDEX idx_favorites_listing ON public.favorites USING btree (listing_id);
CREATE INDEX idx_listing_credentials_listing ON public.listing_credentials USING btree (listing_id);
CREATE INDEX idx_listing_images_listing_order ON public.listing_images USING btree (listing_id, display_order);
CREATE INDEX idx_listing_offers_buyer ON public.listing_offers USING btree (buyer_id, created_at DESC);
CREATE INDEX idx_listing_offers_listing_status ON public.listing_offers USING btree (listing_id, status, created_at DESC);
CREATE INDEX idx_listing_offers_seller_status ON public.listing_offers USING btree (seller_id, status, created_at DESC);
CREATE INDEX idx_listings_created ON public.listings USING btree (created_at DESC);
CREATE INDEX idx_listings_key_players_gin ON public.listings USING gin (key_players_list);
CREATE INDEX idx_listings_platform ON public.listings USING btree (platform);
CREATE INDEX idx_listings_published_active ON public.listings USING btree (created_at DESC) WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX idx_listings_seller ON public.listings USING btree (seller_id);
CREATE INDEX idx_listings_status ON public.listings USING btree (status, created_at DESC);
CREATE INDEX idx_listings_status_price ON public.listings USING btree (status, price);
CREATE INDEX idx_listings_strength ON public.listings USING btree (overall_team_strength DESC);
CREATE INDEX idx_listings_trgm_manager ON public.listings USING gin (manager_name gin_trgm_ops);
CREATE INDEX idx_listings_trgm_players ON public.listings USING gin (player_search_text gin_trgm_ops);
CREATE INDEX idx_listings_trgm_title ON public.listings USING gin (title gin_trgm_ops);
CREATE INDEX idx_messages_conv_created ON public.messages USING btree (conversation_id, created_at DESC);
CREATE INDEX idx_middleman_deals_buyer_phone ON public.middleman_deals USING btree (buyer_phone);
CREATE INDEX idx_middleman_deals_code ON public.middleman_deals USING btree (deal_code);
CREATE INDEX idx_middleman_deals_seller_phone ON public.middleman_deals USING btree (seller_phone);
CREATE UNIQUE INDEX mpesa_settlement_receipts_source_entity_uidx ON public.mpesa_settlement_receipts USING btree (source, entity_id);
CREATE INDEX idx_news_articles_category ON public.news_articles USING btree (category);
CREATE INDEX idx_news_articles_published ON public.news_articles USING btree (is_published, created_at DESC);
CREATE INDEX idx_news_articles_slug ON public.news_articles USING btree (slug);
CREATE INDEX idx_notifications_recipient ON public.notifications USING btree (recipient_id, is_read, created_at DESC);
CREATE INDEX idx_orders_buyer ON public.orders USING btree (buyer_id);
CREATE INDEX idx_orders_listing ON public.orders USING btree (listing_id);
CREATE INDEX idx_orders_seller ON public.orders USING btree (seller_id);
CREATE INDEX idx_orders_status ON public.orders USING btree (status);
CREATE INDEX idx_payments_checkout_req ON public.payments USING btree (checkout_request_id);
CREATE INDEX idx_payments_order ON public.payments USING btree (order_id);
CREATE INDEX idx_payments_receipt ON public.payments USING btree (mpesa_receipt_number);
CREATE UNIQUE INDEX payments_mpesa_receipt_uidx ON public.payments USING btree (upper(btrim((mpesa_receipt_number)::text))) WHERE mpesa_receipt_number IS NOT NULL AND upper(btrim((mpesa_receipt_number)::text)) ~ '^[A-Z0-9]{8,12}$' AND upper(btrim((mpesa_receipt_number)::text)) <> 'CONFIRMED';
CREATE INDEX idx_profiles_role ON public.profiles USING btree (id, role);
CREATE INDEX idx_profiles_telegram_chat_id ON public.profiles USING btree (telegram_chat_id);
CREATE INDEX idx_profiles_username ON public.profiles USING btree (username);
CREATE INDEX idx_reviews_seller_created ON public.reviews USING btree (seller_id, created_at DESC);
CREATE INDEX idx_scammer_reports_phone ON public.scammer_reports USING btree (phone_number);
CREATE INDEX idx_scammer_reports_verified ON public.scammer_reports USING btree (verified_status);
CREATE INDEX idx_seller_withdrawals_seller ON public.seller_withdrawals USING btree (seller_id, status);
CREATE INDEX idx_tournament_matches_tourney ON public.tournament_matches USING btree (tournament_id, match_number);
CREATE INDEX idx_tournament_participants_tourney ON public.tournament_participants USING btree (tournament_id);
CREATE INDEX idx_tournament_participants_user ON public.tournament_participants USING btree (user_id);
CREATE INDEX idx_tournament_payments_checkout ON public.tournament_payments USING btree (checkout_request_id);
CREATE INDEX idx_tournament_payments_status ON public.tournament_payments USING btree (status);
CREATE INDEX idx_tournament_payments_tourney ON public.tournament_payments USING btree (tournament_id);
CREATE UNIQUE INDEX tournament_payments_mpesa_receipt_uidx ON public.tournament_payments USING btree (upper(btrim((mpesa_receipt_number)::text))) WHERE mpesa_receipt_number IS NOT NULL AND upper(btrim((mpesa_receipt_number)::text)) ~ '^[A-Z0-9]{8,12}$' AND upper(btrim((mpesa_receipt_number)::text)) <> 'CONFIRMED';
CREATE INDEX idx_tournaments_status ON public.tournaments USING btree (status, created_at DESC);
CREATE INDEX idx_tournaments_type ON public.tournaments USING btree (tournament_type);
CREATE INDEX idx_wanted_requests_status ON public.wanted_requests USING btree (status, created_at DESC);
```

## Triggers

```sql
CREATE TRIGGER trg_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_escrow_accounts_updated_at BEFORE UPDATE ON escrow_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_guard_escrow_funding BEFORE UPDATE ON escrow_accounts FOR EACH ROW EXECUTE FUNCTION guard_escrow_funding();
CREATE TRIGGER trg_sync_listing_offers BEFORE INSERT OR UPDATE ON listing_offers FOR EACH ROW EXECUTE FUNCTION sync_listing_offers_columns();
CREATE TRIGGER trg_guard_mpesa_listing_lock BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION guard_mpesa_listing_lock();
CREATE TRIGGER trg_listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_guard_order_escrow_lock BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION guard_order_escrow_lock();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_guard_mpesa_payment_completion BEFORE INSERT OR UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION guard_mpesa_payment_completion();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_protect_profile_sensitive_fields BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION protect_sensitive_profile_fields();
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_seller_verifications_updated_at BEFORE UPDATE ON seller_verifications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_seller_withdrawals_updated_at BEFORE UPDATE ON seller_withdrawals FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_guard_mpesa_tournament_participant BEFORE INSERT OR UPDATE ON tournament_participants FOR EACH ROW EXECUTE FUNCTION guard_mpesa_tournament_participant();
CREATE TRIGGER trg_guard_tournament_payment_completion BEFORE INSERT OR UPDATE ON tournament_payments FOR EACH ROW EXECUTE FUNCTION guard_tournament_payment_completion();
```

## App-owned routine signatures and access

There are 21 app-owned routines in `public` (extension-owned routines are excluded). `SECURITY DEFINER` is shown explicitly. `EXECUTE` flags are the catalog's effective privilege checks for `anon`, `authenticated`, and `service_role`.

| Routine | Arguments → result | SECURITY DEFINER | anon / authenticated / service_role EXECUTE |
|---|---|---:|---|
| `decrement_listing_favorites` | `(listing_id uuid) → void` | yes | yes / yes / yes |
| `get_public_platform_metrics` | `() → jsonb` | yes | yes / yes / yes |
| `guard_escrow_funding` | `() → trigger` | no | yes / yes / yes |
| `guard_mpesa_listing_lock` | `() → trigger` | no | yes / yes / yes |
| `guard_mpesa_payment_completion` | `() → trigger` | no | yes / yes / yes |
| `guard_mpesa_tournament_participant` | `() → trigger` | no | yes / yes / yes |
| `guard_order_escrow_lock` | `() → trigger` | no | yes / yes / yes |
| `guard_tournament_payment_completion` | `() → trigger` | no | yes / yes / yes |
| `handle_mpesa_payment_success` | `(p_checkout_request_id varchar, p_receipt_number varchar, p_amount numeric, p_raw_callback jsonb) → void` | yes | no / no / no |
| `handle_new_user` | `() → trigger` | yes | yes / yes / yes |
| `immutable_text_array_join` | `(arr text[]) → text` | no | yes / yes / yes |
| `increment_listing_favorites` | `(listing_id uuid) → void` | yes | yes / yes / yes |
| `increment_listing_views` | `(listing_id uuid) → void` | yes | yes / yes / yes |
| `is_admin` | `() → boolean` | yes | yes / yes / yes |
| `is_admin_user` | `() → boolean` | yes | yes / yes / yes |
| `protect_sensitive_profile_fields` | `() → trigger` | yes | yes / yes / yes |
| `release_escrow_funds` | `(p_order_id uuid, p_performed_by uuid) → void` | yes | yes / yes / yes |
| `set_updated_at` | `() → trigger` | no | yes / yes / yes |
| `settle_mpesa_marketplace_payment` | `(p_payment_id text, p_receipt_number text, p_amount numeric, p_provider text, p_verification_method text, p_transaction_id text, p_verified_at timestamptz, p_raw_callback jsonb) → jsonb` | yes | no / no / yes |
| `settle_mpesa_tournament_payment` | `(p_tournament_payment_id text, p_receipt_number text, p_amount numeric, p_provider text, p_verification_method text, p_transaction_id text, p_verified_at timestamptz) → jsonb` | yes | no / no / yes |
| `sync_listing_offers_columns` | `() → trigger` | no | yes / yes / yes |

## Table grants (catalog summary)

The information-schema grant view reports the following table-level grant pattern:

- On **38 public tables** (every listed public table except `mpesa_settlement_receipts`), `anon` and `authenticated` have `DELETE`, `INSERT`, `REFERENCES`, `SELECT`, `TRIGGER`, `TRUNCATE`, and `UPDATE`; `service_role` and `postgres` have those same privileges.
- On `mpesa_settlement_receipts`, the catalog reports `postgres` with those privileges and `service_role` with `SELECT` only.

These are grants, not an assessment of which operations are exposed through a particular API path. RLS does not filter `TRUNCATE`; that privilege should be reviewed independently.

## Security-relevant live findings

- All 39 public tables have RLS enabled, but none force RLS. Fifteen have zero `public` policies: `conversation_members`, `dispute_evidence`, `escrow_transactions`, `listing_credentials`, `login_history`, `mpesa_settlement_receipts`, `payment_receipts`, `payments`, `reports`, `roles`, `saved_searches`, `seller_verifications`, `system_settings`, `user_invitations`, and `user_roles`.
- Live `release_escrow_funds(uuid, uuid)` is `SECURITY DEFINER` and catalog-executable by `anon`, `authenticated`, and `service_role`. Its caller authorization should be reviewed before relying on it.
- The two provider-confirmed settlement functions are executable only by `service_role` among those three roles.
- The new atomic registration and money-action RPCs from local migrations `20261114184511` / `20261114184512` are not part of this live snapshot because those migrations remain unapplied.
