-- ============================================================================
-- Service-only table lockdown: remove anon/authenticated table grants.
--
-- Finding
--   Prisma's `supabase db pull` granted the full table privilege set
--   (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER) to the
--   `anon` and `authenticated` Postgres roles on every public table.
--   Eighteen tables have RLS enabled with ZERO policies, so access currently
--   resolves to default-deny and nothing leaks today -- verified by probe.
--
--   But that means Row Level Security is the ONLY barrier between the open
--   internet and `listing_credentials` (seller login details), `payments`,
--   `escrow_transactions`, `dispute_evidence` and `login_history`.
--   A single mis-created permissive policy, or `ALTER TABLE ... DISABLE ROW
--   LEVEL SECURITY` during debugging, would publish all of it instantly.
--
--   Defence in depth: these tables are only ever touched from server code
--   holding the service-role key, which bypasses grants entirely, so removing
--   the client-facing grants costs nothing operationally.
--
-- Scope
--   Only the twelve tables whose names and access patterns are unambiguous.
--   Tables read by real user sessions (`user_roles`, `conversations`,
--   `conversation_members`, `tournament_runtime_state`) are deliberately left
--   alone so chat and dashboard flows keep working.
-- ============================================================================

BEGIN;

-- Never let these reach a browser session, regardless of future RLS changes.
REVOKE ALL ON TABLE
  public.payments,
  public.listing_credentials,
  public.escrow_transactions,
  public.dispute_evidence,
  public.login_history,
  public.seller_verifications,
  public.payment_receipts,
  public.mpesa_settlement_receipts,
  public.api_idempotency_records,
  public.api_rate_limit_buckets,
  public.system_settings,
  public.user_invitations
FROM anon, authenticated;

COMMIT;
