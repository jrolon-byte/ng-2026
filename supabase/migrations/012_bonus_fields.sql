-- Migration 012: Per-org one-time bonus fields (a.k.a. "gift the customer")
--
-- Adds three columns to organizations so we can grant a time-limited bonus
-- of extra texts on top of the standard grace_limit, with a warm message the
-- user sees in the Engage UI until the expiry timestamp passes. No cron job
-- required — grace math treats the bonus as inactive once bonus_expires_at
-- is in the past.
--
-- Defaults are 0 / NULL / NULL so existing orgs behave exactly as before.

ALTER TABLE organizations ADD COLUMN bonus_extra_texts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE organizations ADD COLUMN bonus_expires_at  TIMESTAMPTZ NULL;
ALTER TABLE organizations ADD COLUMN bonus_note        TEXT NULL;
