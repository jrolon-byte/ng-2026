-- Migration 022: account deletion requests (2026-08-30)
--
-- App Store guideline 5.1.1(v) expects an account holder to be able to START
-- deleting their account from inside the app. Actually closing a NotifyGrid
-- org can't happen in a single request — it means cancelling a Stripe
-- subscription, releasing the org's Twilio number, and recalculating any
-- referrer's discount — so the app files a request and `alertAdmin()` texts
-- James, who finishes it by hand. That is the flow Apple accepts when
-- completion genuinely requires steps the app can't take alone.
--
-- Deliberately two columns on `organizations` rather than a new table: at
-- this volume a request is a one-shot flag on the thing being deleted, not an
-- event stream. The stamp is also what keeps the request idempotent — a
-- second tap re-reports success without texting James twice.
--
-- Nothing here deletes or deactivates anything. `active` stays true until a
-- human acts, because a shop that changes its mind between tapping and being
-- called must still be able to text its customers.
--
-- Apply by hand in the Supabase SQL editor (house convention).

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS deletion_requested_by uuid REFERENCES users(id) ON DELETE SET NULL;

-- Partial: the only query that matters is "what's waiting on me?", and all
-- but a handful of rows are NULL forever.
CREATE INDEX IF NOT EXISTS idx_organizations_deletion_requested
  ON organizations(deletion_requested_at)
  WHERE deletion_requested_at IS NOT NULL;
