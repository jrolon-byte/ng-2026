-- ============================================================================
-- 017 — Two-way SMS: per-org Twilio numbers + inbound replies
--
-- Run BY HAND in the Supabase SQL editor. Idempotent — safe to re-run.
--
-- WHY per-org numbers:
--   Until now every org sent from one shared TWILIO_PHONE_NUMBER. That makes
--   inbound replies unroutable: the webhook only sees `To: <shared number>`
--   and cannot tell which shop is being replied to. Resolving by the sender's
--   number breaks as soon as one person is a customer of two NotifyGrid shops
--   — and misrouting a private reply to the wrong business is not a bug you
--   want to find in production. `To` must identify the tenant.
-- ============================================================================

-- ── Per-org sending number ──────────────────────────────────────────────────
ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS twilio_phone_number text;

-- One number belongs to exactly one org. Partial so the many orgs without a
-- number yet don't collide on NULL.
CREATE UNIQUE INDEX IF NOT EXISTS uq_organizations_twilio_phone_number
    ON organizations (twilio_phone_number)
    WHERE twilio_phone_number IS NOT NULL;

-- ── Inbound messages ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inbound_messages (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,

    -- Nullable on purpose: someone who isn't in the contact list can still
    -- text the shop's number, and that message is exactly what an owner
    -- wants to see. Dropping it would be losing real customer intent.
    contact_id  uuid        REFERENCES contacts (id) ON DELETE SET NULL,

    from_phone  text        NOT NULL,
    to_phone    text        NOT NULL,
    body        text        NOT NULL,

    -- Twilio retries any non-2xx response. Without this constraint a single
    -- slow response produces duplicate rows in the thread.
    twilio_sid  text        NOT NULL UNIQUE,

    received_at timestamptz NOT NULL DEFAULT now(),
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- Exactly the shape contact-messages queries.
CREATE INDEX IF NOT EXISTS idx_inbound_messages_org_contact_time
    ON inbound_messages (org_id, contact_id, received_at DESC);

-- Used by the webhook to attach an unknown sender to a contact later.
CREATE INDEX IF NOT EXISTS idx_inbound_messages_org_from
    ON inbound_messages (org_id, from_phone);

-- ── Backfill note ───────────────────────────────────────────────────────────
-- Existing orgs get NULL and keep sending from the shared env number until
-- `ensureOrgNumber` provisions one. They can't receive replies until then —
-- that's the intended, safe fallback rather than a hard cutover.
