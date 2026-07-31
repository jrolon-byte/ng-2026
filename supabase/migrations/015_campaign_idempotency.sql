-- Campaign idempotency (2026-07-30)
--
-- campaign-send became async (fast validate/queue + background worker). The
-- client now supplies an idempotency_key per logical send; a retry after a
-- timeout/flaky network returns the EXISTING campaign instead of blasting
-- everyone a second time (and double-billing Twilio).
--
-- Unique per org, only when a key is present — older clients that don't send
-- a key keep working.
--
-- ⚠️ Apply BY HAND in the Supabase SQL editor BEFORE deploying the new
-- campaign-send: the updated web client always sends a key, and inserting
-- into a missing column 500s.

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_campaigns_org_idempotency
  ON campaigns(org_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
