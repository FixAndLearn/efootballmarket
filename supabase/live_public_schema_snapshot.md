# Live Supabase schema snapshot — `public`

**Project:** eFootball Market (`juleseantigravityefootball`, ref `fdnflvbknoopethbihns`)  
**Captured:** 2026-11-10, using read-only catalog queries  
**Data included:** none. This is schema metadata only; no table rows or secrets were read.

## Scope and status

This is the complete application-facing `public` schema inventory: tables, columns, defaults, nullability, generated columns, and constraints. Security metadata (RLS policies, indexes, triggers, routine signatures/privileges) is in `live_public_security_snapshot.md`; live app-owned routine bodies are in `live_public_routines_snapshot.sql`. Policy expressions and some index predicates in the security reference are normalized for readability, so this bundle is a catalog reference, not a byte-for-byte replayable `pg_dump`.

Supabase-managed schemas are not expanded here. Catalog inventory showed: `auth` (27 tables, 1 sequence), `extensions` (2 views), `realtime` (10 tables, 1 sequence), `storage` (10 tables), `supabase_migrations` (1 table), and `vault` (1 table, 1 view). They are platform-managed and outside the app-facing `public` schema.

Public schema counts: **39 tables, 468 columns, 208 constraints, 117 indexes, 55 policies, 17 non-internal triggers, 21 app-owned routines, 1 enum, 0 views/materialized views.** All 39 public tables have RLS enabled; none have `FORCE ROW LEVEL SECURITY` enabled.

Live migration history currently ends at `20261114184510`. Local migrations `20261114184511` and `20261114184512` are not applied. This file is a reference snapshot, not a deployment script or `pg_dump`.

## Enum type

```sql
public.user_role = ENUM ('user', 'moderator', 'admin', 'super_admin')
```

## Tables

The following column fragments are ordered as in PostgreSQL. `NOT NULL`, defaults, and the generated expression are shown explicitly. Constraints follow each table.

### `account_deliveries`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
order_id uuid NOT NULL,
encrypted_konami_email text NOT NULL,
encrypted_konami_password text NOT NULL,
encrypted_backup_codes text,
transfer_instructions text,
seller_ip inet,
delivered_at timestamp with time zone DEFAULT now() NOT NULL,
buyer_confirmed_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now() NOT NULL
```
- `account_deliveries_order_id_fkey`: FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
- `account_deliveries_pkey`: PRIMARY KEY (id)
- `account_deliveries_order_id_key`: UNIQUE (order_id)

### `audit_logs`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
actor_id uuid,
action character varying(100) NOT NULL,
resource_type character varying(50) NOT NULL,
resource_id character varying(100),
ip_address inet,
changes jsonb DEFAULT '{}'::jsonb,
created_at timestamp with time zone DEFAULT now() NOT NULL,
admin_id uuid,
admin_email text
```
- `audit_logs_actor_id_fkey`: FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL
- `audit_logs_admin_id_fkey`: FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL
- `audit_logs_pkey`: PRIMARY KEY (id)

### `availability_pings`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
listing_id uuid NOT NULL,
seller_id uuid NOT NULL,
buyer_id uuid,
buyer_name character varying(120),
buyer_phone character varying(40),
status character varying(24) DEFAULT 'pending'::character varying NOT NULL,
seller_note character varying(240),
responded_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL
```
- `availability_pings_status_check`: CHECK (status::text = ANY (ARRAY['pending'::character varying, 'available'::character varying, 'unavailable'::character varying]::text[]))
- `availability_pings_buyer_id_fkey`: FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE SET NULL
- `availability_pings_listing_id_fkey`: FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
- `availability_pings_seller_id_fkey`: FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE
- `availability_pings_pkey`: PRIMARY KEY (id)

### `conversation_members`
```sql
conversation_id uuid NOT NULL,
user_id uuid NOT NULL,
unread_count integer DEFAULT 0 NOT NULL,
last_read_at timestamp with time zone DEFAULT now() NOT NULL,
joined_at timestamp with time zone DEFAULT now() NOT NULL
```
- `conversation_members_unread_count_check`: CHECK (unread_count >= 0)
- `conversation_members_conversation_id_fkey`: FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
- `conversation_members_user_id_fkey`: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE RESTRICT
- `conversation_members_pkey`: PRIMARY KEY (conversation_id, user_id)

### `conversations`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
order_id uuid,
conversation_type character varying(30) DEFAULT 'order'::character varying NOT NULL,
last_message_at timestamp with time zone DEFAULT now() NOT NULL,
is_locked boolean DEFAULT false NOT NULL,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL
```
- `conversations_conversation_type_check`: CHECK (conversation_type::text = ANY (ARRAY['order'::character varying, 'inquiry'::character varying, 'support'::character varying]::text[]))
- `conversations_order_id_fkey`: FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
- `conversations_pkey`: PRIMARY KEY (id)

### `dispute_evidence`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
dispute_id uuid NOT NULL,
uploaded_by uuid NOT NULL,
file_url text NOT NULL,
file_type character varying(50) NOT NULL,
caption text,
created_at timestamp with time zone DEFAULT now() NOT NULL
```
- `dispute_evidence_dispute_id_fkey`: FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE
- `dispute_evidence_uploaded_by_fkey`: FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE RESTRICT
- `dispute_evidence_pkey`: PRIMARY KEY (id)

### `disputes`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
order_id uuid NOT NULL,
opened_by uuid NOT NULL,
reason character varying(100) NOT NULL,
description text NOT NULL,
status character varying(30) DEFAULT 'open'::character varying NOT NULL,
assigned_to uuid,
resolution_notes text,
resolved_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL
```
- `disputes_reason_check`: CHECK (reason::text = ANY (ARRAY['credentials_invalid'::character varying, 'wrong_account_details'::character varying, 'account_recovered_by_seller'::character varying, 'missing_players_or_coins'::character varying, 'unauthorized_changes'::character varying, 'seller_unresponsive'::character varying, 'other'::character varying]::text[]))
- `disputes_status_check`: CHECK (status::text = ANY (ARRAY['open'::character varying, 'under_review'::character varying, 'resolved_buyer_refund'::character varying, 'resolved_seller_release'::character varying, 'closed_dismissed'::character varying]::text[]))
- `disputes_assigned_to_fkey`: FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL
- `disputes_opened_by_fkey`: FOREIGN KEY (opened_by) REFERENCES profiles(id) ON DELETE RESTRICT
- `disputes_order_id_fkey`: FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
- `disputes_pkey`: PRIMARY KEY (id)
- `disputes_order_id_key`: UNIQUE (order_id)

### `escrow_accounts`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
order_id uuid NOT NULL,
buyer_id uuid NOT NULL,
seller_id uuid NOT NULL,
gross_amount numeric(12,2) NOT NULL,
fee_amount numeric(12,2) NOT NULL,
net_amount numeric(12,2) NOT NULL,
currency character varying(3) DEFAULT 'KES'::character varying NOT NULL,
escrow_state character varying(30) DEFAULT 'pending'::character varying NOT NULL,
inspection_deadline timestamp with time zone,
delivered_at timestamp with time zone,
completed_at timestamp with time zone,
released_at timestamp with time zone,
refunded_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL
```
- `escrow_accounts_escrow_state_check`: CHECK (escrow_state::text = ANY (ARRAY['pending'::character varying, 'payment_initiated'::character varying, 'payment_received'::character varying, 'waiting_for_seller'::character varying, 'seller_delivered'::character varying, 'buyer_reviewing'::character varying, 'completed'::character varying, 'refund_pending'::character varying, 'refunded'::character varying, 'disputed'::character varying, 'cancelled'::character varying, 'expired'::character varying]::text[]))
- `escrow_accounts_fee_amount_check`: CHECK (fee_amount >= 0::numeric)
- `escrow_accounts_gross_amount_check`: CHECK (gross_amount > 0::numeric)
- `escrow_accounts_net_amount_check`: CHECK (net_amount > 0::numeric)
- `escrow_accounts_buyer_id_fkey`: FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE RESTRICT
- `escrow_accounts_order_id_fkey`: FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
- `escrow_accounts_seller_id_fkey`: FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE RESTRICT
- `escrow_accounts_pkey`: PRIMARY KEY (id)
- `escrow_accounts_order_id_key`: UNIQUE (order_id)

### `escrow_transactions`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
escrow_id uuid NOT NULL,
action_type character varying(50) NOT NULL,
amount numeric(12,2) NOT NULL,
balance_after numeric(12,2) NOT NULL,
performed_by uuid,
notes text,
created_at timestamp with time zone DEFAULT now() NOT NULL
```
- `escrow_transactions_action_type_check`: CHECK (action_type::text = ANY (ARRAY['deposit'::character varying, 'fee_deduction'::character varying, 'release_to_seller'::character varying, 'refund_to_buyer'::character varying, 'penalty'::character varying]::text[]))
- `escrow_transactions_amount_check`: CHECK (amount > 0::numeric)
- `escrow_transactions_escrow_id_fkey`: FOREIGN KEY (escrow_id) REFERENCES escrow_accounts(id) ON DELETE RESTRICT
- `escrow_transactions_performed_by_fkey`: FOREIGN KEY (performed_by) REFERENCES profiles(id) ON DELETE SET NULL
- `escrow_transactions_pkey`: PRIMARY KEY (id)

### `favorites`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
user_id uuid NOT NULL,
listing_id uuid NOT NULL,
created_at timestamp with time zone DEFAULT now() NOT NULL
```
- `favorites_listing_id_fkey`: FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
- `favorites_user_id_fkey`: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
- `favorites_pkey`: PRIMARY KEY (id)
- `favorites_user_id_listing_id_key`: UNIQUE (user_id, listing_id)

### `listing_credentials`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
listing_id uuid NOT NULL,
seller_id uuid NOT NULL,
konami_id character varying(255) NOT NULL,
konami_password text NOT NULL,
linked_email character varying(255),
recovery_info text,
is_released boolean DEFAULT false NOT NULL,
released_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now() NOT NULL
```
- `listing_credentials_listing_id_fkey`: FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
- `listing_credentials_seller_id_fkey`: FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE
- `listing_credentials_pkey`: PRIMARY KEY (id)

### `listing_images`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
listing_id uuid NOT NULL,
image_url text NOT NULL,
display_order integer DEFAULT 0 NOT NULL,
is_primary boolean DEFAULT false NOT NULL,
created_at timestamp with time zone DEFAULT now() NOT NULL
```
- `listing_images_listing_id_fkey`: FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
- `listing_images_pkey`: PRIMARY KEY (id)

### `listing_offers`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
listing_id uuid NOT NULL,
buyer_id uuid,
seller_id uuid NOT NULL,
offer_amount numeric(12,2) DEFAULT 0 NOT NULL,
status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
counter_amount numeric(12,2),
message text,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL,
buyer_name character varying(120),
buyer_phone character varying(40),
offered_price numeric,
original_price numeric,
discount_percentage integer DEFAULT 0,
counter_price numeric,
note text,
expires_at timestamp with time zone
```
- `listing_offers_buyer_id_fkey`: FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE CASCADE
- `listing_offers_listing_id_fkey`: FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
- `listing_offers_seller_id_fkey`: FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE
- `listing_offers_pkey`: PRIMARY KEY (id)

### `listings`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
seller_id uuid NOT NULL,
title character varying(255) NOT NULL,
description text NOT NULL,
price numeric(12,2) NOT NULL,
currency character varying(3) DEFAULT 'KES'::character varying NOT NULL,
platform character varying(30) NOT NULL,
game_version character varying(30) DEFAULT 'v4.0.0'::character varying NOT NULL,
region character varying(50) DEFAULT 'Global'::character varying NOT NULL,
account_level integer DEFAULT 1 NOT NULL,
overall_team_strength integer NOT NULL,
gp_balance bigint DEFAULT 0 NOT NULL,
coin_balance integer DEFAULT 0 NOT NULL,
efootball_points integer DEFAULT 0 NOT NULL,
contract_renewal_tickets integer DEFAULT 0 NOT NULL,
booster_tokens integer DEFAULT 0 NOT NULL,
training_programs integer DEFAULT 0 NOT NULL,
player_slots integer DEFAULT 500 NOT NULL,
legend_players_count integer DEFAULT 0 NOT NULL,
epic_players_count integer DEFAULT 0 NOT NULL,
big_time_players_count integer DEFAULT 0 NOT NULL,
highlight_players_count integer DEFAULT 0 NOT NULL,
featured_players_count integer DEFAULT 0 NOT NULL,
key_players_list text[] DEFAULT '{}'::text[] NOT NULL,
manager_name character varying(100),
formation character varying(20),
primary_playstyle character varying(50) NOT NULL,
possession_rating integer DEFAULT 70,
quick_counter_rating integer DEFAULT 70,
long_ball_counter_rating integer DEFAULT 70,
out_wide_rating integer DEFAULT 70,
long_ball_rating integer DEFAULT 70,
current_division integer DEFAULT 10 NOT NULL,
highest_division integer DEFAULT 10 NOT NULL,
dream_team_name character varying(100),
matches_played integer DEFAULT 0 NOT NULL,
wins integer DEFAULT 0 NOT NULL,
draws integer DEFAULT 0 NOT NULL,
losses integer DEFAULT 0 NOT NULL,
goals_scored integer DEFAULT 0 NOT NULL,
goals_conceded integer DEFAULT 0 NOT NULL,
account_age_months integer DEFAULT 0 NOT NULL,
konami_id_status character varying(50) NOT NULL,
linked_email_status character varying(50) NOT NULL,
status character varying(30) DEFAULT 'published'::character varying NOT NULL,
views_count integer DEFAULT 0 NOT NULL,
favorites_count integer DEFAULT 0 NOT NULL,
is_featured boolean DEFAULT false NOT NULL,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL,
deleted_at timestamp with time zone,
featured_players jsonb DEFAULT '[]'::jsonb,
allows_swap boolean DEFAULT false NOT NULL,
swap_preferences text,
player_search_text text GENERATED ALWAYS AS (immutable_text_array_join(key_players_list)) STORED
```
- `listings_account_age_months_check`: CHECK (account_age_months >= 0)
- `listings_account_level_check`: CHECK (account_level >= 1)
- `listings_big_time_players_count_check`: CHECK (big_time_players_count >= 0)
- `listings_booster_tokens_check`: CHECK (booster_tokens >= 0)
- `listings_coin_balance_check`: CHECK (coin_balance >= 0)
- `listings_contract_renewal_tickets_check`: CHECK (contract_renewal_tickets >= 0)
- `listings_current_division_check`: CHECK (current_division >= 1 AND current_division <= 10)
- `listings_draws_check`: CHECK (draws >= 0)
- `listings_efootball_points_check`: CHECK (efootball_points >= 0)
- `listings_epic_players_count_check`: CHECK (epic_players_count >= 0)
- `listings_favorites_count_check`: CHECK (favorites_count >= 0)
- `listings_featured_players_count_check`: CHECK (featured_players_count >= 0)
- `listings_goals_conceded_check`: CHECK (goals_conceded >= 0)
- `listings_goals_scored_check`: CHECK (goals_scored >= 0)
- `listings_gp_balance_check`: CHECK (gp_balance >= 0)
- `listings_highest_division_check`: CHECK (highest_division >= 1 AND highest_division <= 10)
- `listings_highlight_players_count_check`: CHECK (highlight_players_count >= 0)
- `listings_konami_id_status_check`: CHECK (konami_id_status::text = ANY (ARRAY['linked_changeable'::character varying, 'unlinked'::character varying, 'linked_immutable'::character varying]::text[]))
- `listings_legend_players_count_check`: CHECK (legend_players_count >= 0)
- `listings_linked_email_status_check`: CHECK (linked_email_status::text = ANY (ARRAY['transferable_full_access'::character varying, 'buyer_email_bindable'::character varying]::text[]))
- `listings_long_ball_counter_rating_check`: CHECK (long_ball_counter_rating >= 0 AND long_ball_counter_rating <= 100)
- `listings_long_ball_rating_check`: CHECK (long_ball_rating >= 0 AND long_ball_rating <= 100)
- `listings_losses_check`: CHECK (losses >= 0)
- `listings_matches_played_check`: CHECK (matches_played >= 0)
- `listings_out_wide_rating_check`: CHECK (out_wide_rating >= 0 AND out_wide_rating <= 100)
- `listings_overall_team_strength_check`: CHECK (overall_team_strength >= 2000)
- `listings_platform_check`: CHECK (platform::text = ANY (ARRAY['android'::character varying, 'ios'::character varying, 'pc_steam'::character varying, 'playstation_4'::character varying, 'playstation_5'::character varying, 'xbox_one'::character varying, 'xbox_series_x'::character varying]::text[]))
- `listings_player_slots_check`: CHECK (player_slots >= 100)
- `listings_possession_rating_check`: CHECK (possession_rating >= 0 AND possession_rating <= 100)
- `listings_price_check`: CHECK (price >= 100.00)
- `listings_primary_playstyle_check`: CHECK (primary_playstyle::text = ANY (ARRAY['possession'::character varying, 'quick_counter'::character varying, 'long_ball_counter'::character varying, 'out_wide'::character varying, 'long_ball'::character varying]::text[]))
- `listings_quick_counter_rating_check`: CHECK (quick_counter_rating >= 0 AND quick_counter_rating <= 100)
- `listings_status_check`: CHECK (status::text = ANY (ARRAY['draft'::text, 'pending_review'::text, 'published'::text, 'in_escrow'::text, 'sold'::text, 'archived'::text, 'suspended'::text, 'cancelled'::text]))
- `listings_training_programs_check`: CHECK (training_programs >= 0)
- `listings_views_count_check`: CHECK (views_count >= 0)
- `listings_wins_check`: CHECK (wins >= 0)
- `listings_seller_id_fkey`: FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE RESTRICT
- `listings_pkey`: PRIMARY KEY (id)

### `login_history`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
user_id uuid NOT NULL,
ip_address inet,
user_agent text,
device_type character varying(50),
login_time timestamp with time zone DEFAULT now() NOT NULL,
success boolean DEFAULT true NOT NULL
```
- `login_history_user_id_fkey`: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
- `login_history_pkey`: PRIMARY KEY (id)

### `messages`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
conversation_id uuid NOT NULL,
sender_id uuid NOT NULL,
message_type character varying(30) DEFAULT 'text'::character varying NOT NULL,
content text NOT NULL,
attachments jsonb DEFAULT '[]'::jsonb,
is_read boolean DEFAULT false NOT NULL,
created_at timestamp with time zone DEFAULT now() NOT NULL,
deleted_at timestamp with time zone
```
- `messages_message_type_check`: CHECK (message_type::text = ANY (ARRAY['text'::character varying, 'image'::character varying, 'system'::character varying, 'credential_alert'::character varying, 'escrow_alert'::character varying]::text[]))
- `messages_conversation_id_fkey`: FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
- `messages_sender_id_fkey`: FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE RESTRICT
- `messages_pkey`: PRIMARY KEY (id)

### `mpesa_settlement_receipts`
```sql
receipt_number text NOT NULL,
source text NOT NULL,
entity_id text NOT NULL,
provider text NOT NULL,
verification_method text NOT NULL,
transaction_id text NOT NULL,
amount numeric(14,2),
verified_at timestamp with time zone NOT NULL,
created_at timestamp with time zone DEFAULT now() NOT NULL
```
- `mpesa_settlement_receipts_amount_check`: CHECK (amount IS NULL OR amount > 0::numeric)
- `mpesa_settlement_receipts_evidence_pair_check`: CHECK (provider = 'unifiedpay'::text AND verification_method = 'provider_status_query'::text OR provider = 'safaricom'::text AND verification_method = 'authenticated_callback_and_status_query'::text OR provider = 'legacy'::text AND verification_method = 'legacy'::text)
- `mpesa_settlement_receipts_provider_check`: CHECK (provider = ANY (ARRAY['safaricom'::text, 'unifiedpay'::text, 'legacy'::text]))
- `mpesa_settlement_receipts_receipt_number_check`: CHECK (receipt_number ~ '^[A-Z0-9]{8,12}$'::text AND receipt_number <> 'CONFIRMED'::text)
- `mpesa_settlement_receipts_source_check`: CHECK (source = ANY (ARRAY['marketplace'::text, 'tournament'::text]))
- `mpesa_settlement_receipts_verification_method_check`: CHECK (verification_method = ANY (ARRAY['provider_status_query'::text, 'authenticated_callback_and_status_query'::text, 'legacy'::text]))
- `mpesa_settlement_receipts_pkey`: PRIMARY KEY (receipt_number)

### `news_articles`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
title character varying(300) NOT NULL,
slug character varying(350) NOT NULL,
category character varying(50) DEFAULT 'efootball_news'::character varying NOT NULL,
summary text NOT NULL,
content text NOT NULL,
cover_image_url text,
author_id uuid,
author_name character varying(150) DEFAULT 'Brian Okibo, Chief Executive Officer (CEO)'::character varying,
is_pinned boolean DEFAULT false NOT NULL,
is_published boolean DEFAULT true NOT NULL,
views_count integer DEFAULT 0 NOT NULL,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL
```
- `news_articles_author_id_fkey`: FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL
- `news_articles_pkey`: PRIMARY KEY (id)
- `news_articles_slug_key`: UNIQUE (slug)

### `notifications`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
recipient_id uuid NOT NULL,
type character varying(50) NOT NULL,
title character varying(200) NOT NULL,
message text NOT NULL,
action_url text,
is_read boolean DEFAULT false NOT NULL,
created_at timestamp with time zone DEFAULT now() NOT NULL
```
- `notifications_recipient_id_fkey`: FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE
- `notifications_pkey`: PRIMARY KEY (id)

### `orders`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
order_number character varying(30) NOT NULL,
listing_id uuid NOT NULL,
buyer_id uuid NOT NULL,
seller_id uuid NOT NULL,
total_amount numeric(12,2) NOT NULL,
platform_fee numeric(12,2) DEFAULT 0.00 NOT NULL,
seller_net_amount numeric(12,2) NOT NULL,
currency character varying(3) DEFAULT 'KES'::character varying NOT NULL,
status character varying(30) DEFAULT 'payment_pending'::character varying NOT NULL,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL
```
- `orders_platform_fee_check`: CHECK (platform_fee >= 0::numeric)
- `orders_seller_net_amount_check`: CHECK (seller_net_amount > 0::numeric)
- `orders_status_check`: CHECK (status::text = ANY (ARRAY['payment_pending'::character varying, 'escrow_locked'::character varying, 'seller_delivered'::character varying, 'buyer_reviewing'::character varying, 'completed'::character varying, 'disputed'::character varying, 'cancelled'::character varying, 'refunded'::character varying]::text[]))
- `orders_total_amount_check`: CHECK (total_amount > 0::numeric)
- `orders_buyer_id_fkey`: FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE RESTRICT
- `orders_listing_id_fkey`: FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE RESTRICT
- `orders_seller_id_fkey`: FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE RESTRICT
- `orders_pkey`: PRIMARY KEY (id)
- `orders_order_number_key`: UNIQUE (order_number)

### `payment_receipts`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
payment_id uuid NOT NULL,
receipt_number character varying(50) NOT NULL,
issued_to uuid NOT NULL,
amount numeric(12,2) NOT NULL,
currency character varying(3) DEFAULT 'KES'::character varying NOT NULL,
pdf_url text,
created_at timestamp with time zone DEFAULT now() NOT NULL
```
- `payment_receipts_issued_to_fkey`: FOREIGN KEY (issued_to) REFERENCES profiles(id) ON DELETE RESTRICT
- `payment_receipts_payment_id_fkey`: FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE RESTRICT
- `payment_receipts_pkey`: PRIMARY KEY (id)
- `payment_receipts_payment_id_key`: UNIQUE (payment_id)
- `payment_receipts_receipt_number_key`: UNIQUE (receipt_number)

### `payments`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
order_id uuid NOT NULL,
payment_method character varying(30) DEFAULT 'mpesa'::character varying NOT NULL,
phone_number character varying(20) NOT NULL,
amount numeric(12,2) NOT NULL,
currency character varying(3) DEFAULT 'KES'::character varying NOT NULL,
merchant_request_id character varying(100),
checkout_request_id character varying(100),
mpesa_receipt_number character varying(100),
result_code integer,
result_desc text,
status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
raw_callback jsonb,
created_at timestamp with time zone DEFAULT now() NOT NULL,
completed_at timestamp with time zone
```
- `payments_amount_check`: CHECK (amount > 0::numeric)
- `payments_payment_method_check`: CHECK (payment_method::text = ANY (ARRAY['mpesa'::character varying, 'visa'::character varying, 'mastercard'::character varying, 'paypal'::character varying]::text[]))
- `payments_status_check`: CHECK (status::text = ANY (ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying]::text[]))
- `payments_order_id_fkey`: FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
- `payments_pkey`: PRIMARY KEY (id)
- `payments_checkout_request_id_key`: UNIQUE (checkout_request_id)
- `payments_mpesa_receipt_number_key`: UNIQUE (mpesa_receipt_number)

### `profiles`
```sql
id uuid NOT NULL,
username citext NOT NULL,
first_name character varying(100) NOT NULL,
last_name character varying(100) NOT NULL,
phone_number character varying(20) NOT NULL,
country character varying(3) DEFAULT 'KEN'::character varying NOT NULL,
avatar_url text,
bio text,
is_verified_seller boolean DEFAULT false NOT NULL,
seller_rating numeric(3,2) DEFAULT 0.00 NOT NULL,
total_reviews_count integer DEFAULT 0 NOT NULL,
completed_sales_count integer DEFAULT 0 NOT NULL,
available_balance numeric(12,2) DEFAULT 0.00 NOT NULL,
escrow_balance numeric(12,2) DEFAULT 0.00 NOT NULL,
is_suspended boolean DEFAULT false NOT NULL,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL,
deleted_at timestamp with time zone,
role character varying(50) DEFAULT 'user'::character varying,
email text,
whatsapp_number character varying(50)
```
- `profiles_available_balance_check`: CHECK (available_balance >= 0.00)
- `profiles_completed_sales_count_check`: CHECK (completed_sales_count >= 0)
- `profiles_escrow_balance_check`: CHECK (escrow_balance >= 0.00)
- `profiles_seller_rating_check`: CHECK (seller_rating >= 0.00 AND seller_rating <= 5.00)
- `profiles_total_reviews_count_check`: CHECK (total_reviews_count >= 0)
- `profiles_id_fkey`: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE RESTRICT
- `profiles_pkey`: PRIMARY KEY (id)
- `profiles_username_key`: UNIQUE (username)

### `reports`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
reporter_id uuid NOT NULL,
target_type character varying(30) NOT NULL,
target_id uuid NOT NULL,
reason character varying(100) NOT NULL,
details text,
status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
reviewed_by uuid,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL
```
- `reports_status_check`: CHECK (status::text = ANY (ARRAY['pending'::character varying, 'investigating'::character varying, 'resolved'::character varying, 'dismissed'::character varying]::text[]))
- `reports_target_type_check`: CHECK (target_type::text = ANY (ARRAY['listing'::character varying, 'user'::character varying, 'message'::character varying, 'review'::character varying]::text[]))
- `reports_reporter_id_fkey`: FOREIGN KEY (reporter_id) REFERENCES profiles(id) ON DELETE RESTRICT
- `reports_reviewed_by_fkey`: FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL
- `reports_pkey`: PRIMARY KEY (id)

### `reviews`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
order_id uuid NOT NULL,
reviewer_id uuid NOT NULL,
seller_id uuid NOT NULL,
rating integer NOT NULL,
accuracy_rating integer,
speed_rating integer,
communication_rating integer,
comment text NOT NULL,
seller_reply text,
seller_replied_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL
```
- `reviews_accuracy_rating_check`: CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5)
- `reviews_communication_rating_check`: CHECK (communication_rating >= 1 AND communication_rating <= 5)
- `reviews_rating_check`: CHECK (rating >= 1 AND rating <= 5)
- `reviews_speed_rating_check`: CHECK (speed_rating >= 1 AND speed_rating <= 5)
- `reviews_order_id_fkey`: FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
- `reviews_reviewer_id_fkey`: FOREIGN KEY (reviewer_id) REFERENCES profiles(id) ON DELETE RESTRICT
- `reviews_seller_id_fkey`: FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE RESTRICT
- `reviews_pkey`: PRIMARY KEY (id)
- `reviews_order_id_key`: UNIQUE (order_id)

### `roles`
```sql
id character varying(50) NOT NULL,
name character varying(100) NOT NULL,
description text,
created_at timestamp with time zone DEFAULT now() NOT NULL
```
- `roles_pkey`: PRIMARY KEY (id)

### `saved_searches`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
user_id uuid NOT NULL,
search_query text,
filters jsonb DEFAULT '{}'::jsonb NOT NULL,
created_at timestamp with time zone DEFAULT now() NOT NULL
```
- `saved_searches_user_id_fkey`: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
- `saved_searches_pkey`: PRIMARY KEY (id)

### `scammer_reports`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
phone_number character varying(40),
username_alias character varying(120),
platform_source character varying(80) DEFAULT 'WhatsApp / Off-Platform'::character varying,
incident_summary text NOT NULL,
amount_scammed_kes numeric,
evidence_notes text,
reporter_contact character varying(120),
verified_status character varying(32) DEFAULT 'pending'::character varying NOT NULL,
reviewed_by uuid,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL
```
- `scammer_reports_amount_scammed_kes_check`: CHECK (amount_scammed_kes IS NULL OR amount_scammed_kes >= 0::numeric)
- `scammer_reports_verified_status_check`: CHECK (verified_status::text = ANY (ARRAY['pending'::character varying, 'verified'::character varying, 'dismissed'::character varying, 'appealed_removed'::character varying]::text[]))
- `scammer_reports_reviewed_by_fkey`: FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL
- `scammer_reports_pkey`: PRIMARY KEY (id)

### `seller_verifications`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
seller_id uuid NOT NULL,
id_document_front_url text NOT NULL,
id_document_back_url text,
selfie_with_id_url text NOT NULL,
status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
reviewed_by uuid,
rejection_reason text,
submitted_at timestamp with time zone DEFAULT now() NOT NULL,
reviewed_at timestamp with time zone,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL
```
- `seller_verifications_status_check`: CHECK (status::text = ANY (ARRAY['pending'::character varying, 'under_review'::character varying, 'approved'::character varying, 'rejected'::character varying, 'resubmission_required'::character varying]::text[]))
- `seller_verifications_reviewed_by_fkey`: FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL
- `seller_verifications_seller_id_fkey`: FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE RESTRICT
- `seller_verifications_pkey`: PRIMARY KEY (id)

### `seller_withdrawals`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
seller_id uuid NOT NULL,
amount numeric(12,2) NOT NULL,
payout_method character varying(30) DEFAULT 'mpesa'::character varying NOT NULL,
phone_number character varying(20) NOT NULL,
b2c_conversation_id character varying(100),
b2c_originator_conversation_id character varying(100),
b2c_transaction_id character varying(100),
status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
reviewed_by uuid,
failure_reason text,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL
```
- `seller_withdrawals_amount_check`: CHECK (amount >= 10.00)
- `seller_withdrawals_payout_method_check`: CHECK (payout_method::text = ANY (ARRAY['mpesa'::character varying, 'bank_transfer'::character varying]::text[]))
- `seller_withdrawals_status_check`: CHECK (status::text = ANY (ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'rejected'::character varying, 'failed'::character varying]::text[]))
- `seller_withdrawals_reviewed_by_fkey`: FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL
- `seller_withdrawals_seller_id_fkey`: FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE RESTRICT
- `seller_withdrawals_pkey`: PRIMARY KEY (id)
- `seller_withdrawals_b2c_transaction_id_key`: UNIQUE (b2c_transaction_id)

### `system_settings`
```sql
key character varying(100) NOT NULL,
value jsonb NOT NULL,
description text,
updated_by uuid,
updated_at timestamp with time zone DEFAULT now() NOT NULL
```
- `system_settings_updated_by_fkey`: FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL
- `system_settings_pkey`: PRIMARY KEY (key)

### `tournament_matches`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
tournament_id uuid NOT NULL,
round character varying(50) NOT NULL,
match_number integer NOT NULL,
player1_name character varying(100) DEFAULT 'TBD'::character varying NOT NULL,
player2_name character varying(100) DEFAULT 'TBD'::character varying NOT NULL,
player1_friend_id character varying(100),
player2_friend_id character varying(100),
player1_user_id uuid,
player2_user_id uuid,
score1 integer,
score2 integer,
winner_name character varying(100),
winner_user_id uuid,
is_completed boolean DEFAULT false NOT NULL,
match_code character varying(50),
next_match_id uuid,
next_match_slot integer,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL
```
- `tournament_matches_next_match_id_fkey`: FOREIGN KEY (next_match_id) REFERENCES tournament_matches(id) ON DELETE SET NULL
- `tournament_matches_player1_user_id_fkey`: FOREIGN KEY (player1_user_id) REFERENCES profiles(id) ON DELETE SET NULL
- `tournament_matches_player2_user_id_fkey`: FOREIGN KEY (player2_user_id) REFERENCES profiles(id) ON DELETE SET NULL
- `tournament_matches_tournament_id_fkey`: FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
- `tournament_matches_winner_user_id_fkey`: FOREIGN KEY (winner_user_id) REFERENCES profiles(id) ON DELETE SET NULL
- `tournament_matches_pkey`: PRIMARY KEY (id)

### `tournament_participants`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
tournament_id uuid NOT NULL,
user_id uuid,
gamer_tag character varying(100) NOT NULL,
friend_id character varying(100) NOT NULL,
phone_number character varying(50) NOT NULL,
payment_status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
payment_method character varying(50) DEFAULT 'mpesa_till'::character varying NOT NULL,
amount_paid numeric(12,2) DEFAULT 0 NOT NULL,
seed integer,
created_at timestamp with time zone DEFAULT now() NOT NULL
```
- `tournament_participants_tournament_id_fkey`: FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
- `tournament_participants_user_id_fkey`: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
- `tournament_participants_pkey`: PRIMARY KEY (id)
- `uq_tournament_friend`: UNIQUE (tournament_id, friend_id)

### `tournament_payments`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
tournament_id uuid NOT NULL,
user_id uuid,
gamer_tag character varying(100) NOT NULL,
friend_id character varying(100) NOT NULL,
phone_number character varying(50) NOT NULL,
amount numeric(12,2) NOT NULL,
checkout_request_id character varying(100),
merchant_request_id character varying(100),
mpesa_receipt_number character varying(100),
status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
result_code integer,
result_desc text,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL
```
- `tournament_payments_tournament_id_fkey`: FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
- `tournament_payments_user_id_fkey`: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
- `tournament_payments_pkey`: PRIMARY KEY (id)
- `tournament_payments_checkout_request_id_key`: UNIQUE (checkout_request_id)

### `tournaments`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
title character varying(255) NOT NULL,
subtitle character varying(350),
description text,
platform character varying(50) DEFAULT 'crossplay'::character varying NOT NULL,
prize_pool_kes numeric(12,2) DEFAULT 0 NOT NULL,
first_place_kes numeric(12,2) DEFAULT 0 NOT NULL,
second_place_kes numeric(12,2) DEFAULT 0 NOT NULL,
entry_fee_kes numeric(12,2) DEFAULT 0 NOT NULL,
tournament_type character varying(50) DEFAULT 'tournament'::character varying NOT NULL,
admin_fee_kes numeric(12,2) DEFAULT 0 NOT NULL,
payout_split character varying(50) DEFAULT 'winner_takes_all'::character varying NOT NULL,
format character varying(100) DEFAULT 'Single Knockout 1v1 (12-Minute Game + Extra Time & PKs)'::character varying NOT NULL,
max_players integer DEFAULT 8 NOT NULL,
registered_count integer DEFAULT 0 NOT NULL,
start_date character varying(150) NOT NULL,
status character varying(50) DEFAULT 'registration_open'::character varying NOT NULL,
winner_name character varying(150),
winner_user_id uuid,
winner_gamer_tag character varying(100),
created_by uuid,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL
```
- `tournaments_created_by_fkey`: FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
- `tournaments_winner_user_id_fkey`: FOREIGN KEY (winner_user_id) REFERENCES profiles(id) ON DELETE SET NULL
- `tournaments_pkey`: PRIMARY KEY (id)

### `user_invitations`
```sql
id uuid DEFAULT gen_random_uuid() NOT NULL,
inviter_id uuid NOT NULL,
invitee_email character varying(255),
invitee_phone character varying(50),
code character varying(50) NOT NULL,
status character varying(50) DEFAULT 'sent'::character varying,
joined_user_id uuid,
created_at timestamp with time zone DEFAULT now()
```
- `user_invitations_inviter_id_fkey`: FOREIGN KEY (inviter_id) REFERENCES profiles(id) ON DELETE CASCADE
- `user_invitations_joined_user_id_fkey`: FOREIGN KEY (joined_user_id) REFERENCES profiles(id) ON DELETE SET NULL
- `user_invitations_pkey`: PRIMARY KEY (id)
- `user_invitations_code_key`: UNIQUE (code)

### `user_roles`
```sql
user_id uuid NOT NULL,
role_id character varying(50) NOT NULL,
assigned_at timestamp with time zone DEFAULT now() NOT NULL
```
- `user_roles_role_id_fkey`: FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
- `user_roles_user_id_fkey`: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
- `user_roles_pkey`: PRIMARY KEY (user_id, role_id)

### `wanted_requests`
```sql
id character varying(80) NOT NULL,
user_id uuid,
buyer_name character varying(120) NOT NULL,
buyer_phone character varying(40) NOT NULL,
title character varying(200) NOT NULL,
description text,
min_overall_rating integer DEFAULT 3000 NOT NULL,
target_playstyle character varying(40) DEFAULT 'quick_counter'::character varying NOT NULL,
preferred_platform character varying(40) DEFAULT 'android'::character varying NOT NULL,
budget_kes numeric NOT NULL,
key_players_wanted text[] DEFAULT '{}'::text[] NOT NULL,
status character varying(32) DEFAULT 'active'::character varying NOT NULL,
created_at timestamp with time zone DEFAULT now() NOT NULL,
updated_at timestamp with time zone DEFAULT now() NOT NULL
```
- `wanted_requests_budget_kes_check`: CHECK (budget_kes > 0::numeric)
- `wanted_requests_status_check`: CHECK (status::text = ANY (ARRAY['active'::character varying, 'fulfilled'::character varying, 'closed'::character varying, 'archived'::character varying]::text[]))
- `wanted_requests_user_id_fkey`: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
- `wanted_requests_pkey`: PRIMARY KEY (id)
