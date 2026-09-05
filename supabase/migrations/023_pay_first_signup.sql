-- Migration 023: pay-first signup (2026-09-02)
--
-- The signup funnel is being reordered: the customer pays FIRST (Stripe
-- Checkout collects email, phone, name and business name), and only then
-- sets a password — on the success page, or later via a one-time link we
-- text them. Three consequences for the schema:
--
-- 1. users.password_hash must allow NULL. Between "paid" and "set a
--    password" the account exists (the money is in, the org is provisioned,
--    the welcome text has gone out) but has no credential yet. auth-login
--    treats NULL as "finish setting up", never as a bcrypt compare.
--
-- 2. users.setup_token_hash / setup_token_expires_at carry the one-time
--    password-setup token. We store only the sha256 of the token; the raw
--    token lives in the success-page response and the welcome SMS. A token
--    is single-use (cleared when the password is set) and expires in 7 days.
--
-- 3. organizations.stripe_checkout_session_id is the idempotency key for
--    provisioning. The Stripe webhook AND the success page both try to
--    provision the same session (whichever the network delivers first); the
--    partial unique index guarantees exactly one org per paid session, and
--    the loser re-reads instead of inserting. Previously idempotency keyed
--    on the username in Stripe metadata — there is no username in metadata
--    any more (it is derived server-side from the business name).
--
-- Existing rows are untouched: every current user keeps a NOT NULL hash,
-- and pre-existing orgs simply have a NULL session id.
--
-- Apply by hand in the Supabase SQL editor (house convention) BEFORE
-- deploying the code that expects these columns.

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS setup_token_hash text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS setup_token_expires_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_setup_token_hash
  ON users (setup_token_hash)
  WHERE setup_token_hash IS NOT NULL;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orgs_stripe_checkout_session
  ON organizations (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
