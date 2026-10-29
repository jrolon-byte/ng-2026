-- Referral credit becomes one-time (2026-10-26)
--
-- James: "no cap, but only for the month. One successful referral is $5
-- off." Each referred org earns its referrer a single $5 Stripe customer
-- balance credit the first time it is an active paying subscriber. This
-- column is the exactly-once claim: set when the credit is granted, cleared
-- again only if the Stripe call failed (netlify/functions/utils/referrals.ts).
--
-- Existing "Referral credit" coupons created by the previous recurring engine
-- are not touched by this migration; remove them from the referrers'
-- subscriptions in the Stripe dashboard when switching over.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS referral_credited_at timestamptz;

COMMENT ON COLUMN organizations.referral_credited_at IS
  'When this org''s referrer received their one-time $5 credit for it. NULL = not yet (or not referred).';
