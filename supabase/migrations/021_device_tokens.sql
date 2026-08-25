-- Migration 021: APNs device tokens for iOS push notifications.
--
-- One row per device. `token` is the natural key: a device re-registering
-- after an org switch must MOVE to the new org, not duplicate — so
-- device-register upserts on token and overwrites org_id/user_id.
-- Rows die with their org/user, and the APNs sender prunes tokens Apple
-- reports as gone (410 Unregistered).

CREATE TABLE IF NOT EXISTS device_tokens (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id     uuid        REFERENCES users(id) ON DELETE CASCADE,
    token       text        NOT NULL UNIQUE,
    platform    text        NOT NULL DEFAULT 'ios',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_org ON device_tokens (org_id);
