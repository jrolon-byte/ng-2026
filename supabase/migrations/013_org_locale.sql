-- Migration 013: Locale per org (paywall i18n scope).
--
-- Only the Engage paywall surface reads this today. Other screens remain
-- English regardless. Defaults to 'en' so existing orgs behave unchanged.
-- Add more locales by extending src/i18n/paywall.ts — no schema change needed.

ALTER TABLE organizations ADD COLUMN locale TEXT NOT NULL DEFAULT 'en';
