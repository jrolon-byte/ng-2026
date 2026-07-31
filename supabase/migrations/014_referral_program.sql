-- Referral program (2026-07-30)
--
-- Mechanics: an org shares its referral_code; a new customer who signs up
-- with it gets linked via referred_by_org_id. Each referral that is an
-- active paying subscriber earns the referrer $5/mo off, applied as a
-- dynamic Stripe coupon on the referrer's subscription (recalculated by
-- netlify/functions/utils/referrals.ts on upgrade / cancel / deactivate).
-- Referral cancels -> their $5 disappears on the next recalc. Enough
-- referrals (5 on Starter, 10 on Pro) drive the invoice to $0.
--
-- referral_code is lazily generated the first time an org opens its
-- referral card (referrals-stats function) — existing orgs don't need a
-- backfill.
--
-- Apply by hand in the Supabase SQL editor (house convention).

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS referred_by_org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_referred_by
  ON organizations(referred_by_org_id)
  WHERE referred_by_org_id IS NOT NULL;
