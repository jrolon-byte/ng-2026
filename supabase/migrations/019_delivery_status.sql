-- ============================================================================
-- 019 — Real delivery status for outbound messages
--
-- Run BY HAND in the Supabase SQL editor. Idempotent — safe to re-run.
--
-- WHY
--   `message_logs.status` has never meant "delivered". It means "Twilio's API
--   accepted the request". `messages.create()` returns as soon as the message
--   is queued; the carrier's verdict arrives later, asynchronously. Nothing
--   consumed that verdict, so every one of the 3,836 rows in this table says
--   "sent" — including 113 attempts to a number that has never once received.
--
--   Consequences: Campaign History reports 100% delivery on every campaign,
--   and there is no way to tell a dead number from a live one.
--
--   `twilio-status.ts` closes the loop going forward;
--   scripts/backfill-delivery-status.mjs repairs the history.
-- ============================================================================

-- Twilio's numeric error code (30003 unreachable handset, 30005 unknown
-- handset, 21610 unsubscribed, …). NULL means delivered or still in flight.
ALTER TABLE message_logs
    ADD COLUMN IF NOT EXISTS error_code integer;

-- When the carrier's verdict landed, as distinct from when we sent.
ALTER TABLE message_logs
    ADD COLUMN IF NOT EXISTS status_updated_at timestamptz;

-- The status callback looks rows up by Twilio's SID on every transition —
-- several per message. Without this it's a sequential scan each time.
CREATE INDEX IF NOT EXISTS idx_message_logs_twilio_sid
    ON message_logs (twilio_sid)
    WHERE twilio_sid IS NOT NULL;

-- Supports the delivery-health half of contact_signals().
CREATE INDEX IF NOT EXISTS idx_message_logs_org_contact_error
    ON message_logs (org_id, contact_id)
    WHERE error_code IS NOT NULL;

-- ── Teach contact_signals about real failures ───────────────────────────────
-- Replaces the 018 definition. `status = 'failed'` only ever caught API-level
-- rejections, which is why send_failures was structurally always 0. Counting
-- terminal delivery states is what actually surfaces a dead number.
CREATE OR REPLACE FUNCTION contact_signals(p_org_id uuid)
RETURNS TABLE (
    contact_id      uuid,
    unread_replies  bigint,
    last_reply_at   timestamptz,
    send_attempts   bigint,
    send_failures   bigint
)
LANGUAGE sql
STABLE
AS $$
    WITH replies AS (
        SELECT
            im.contact_id,
            COUNT(*) FILTER (WHERE im.read_at IS NULL) AS unread_replies,
            MAX(im.received_at)                        AS last_reply_at
        FROM inbound_messages im
        WHERE im.org_id = p_org_id
          AND im.contact_id IS NOT NULL
        GROUP BY im.contact_id
    ),
    delivery AS (
        SELECT
            ml.contact_id,
            COUNT(*) AS send_attempts,
            COUNT(*) FILTER (
                WHERE ml.status IN ('failed', 'undelivered')
                   OR ml.error_code IS NOT NULL
            ) AS send_failures
        FROM message_logs ml
        WHERE ml.org_id = p_org_id
        GROUP BY ml.contact_id
    )
    SELECT
        COALESCE(r.contact_id, d.contact_id)  AS contact_id,
        COALESCE(r.unread_replies, 0)         AS unread_replies,
        r.last_reply_at,
        COALESCE(d.send_attempts, 0)          AS send_attempts,
        COALESCE(d.send_failures, 0)          AS send_failures
    FROM replies r
    FULL OUTER JOIN delivery d ON d.contact_id = r.contact_id;
$$;
