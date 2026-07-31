-- ============================================================================
-- 018 — Contact signals: unread replies + delivery health
--
-- Run BY HAND in the Supabase SQL editor. Idempotent — safe to re-run.
--
-- WHY
--   The contact list is becoming dynamic: customers who replied float to the
--   top (someone asking for a chair today is the most actionable thing in the
--   app), and contacts whose number is dead float up behind them so they can
--   be cleaned out. Both need per-contact aggregates over tables with
--   thousands of rows.
--
--   Doing that in the Netlify function would mean either N+1 queries per
--   contact or pulling every message_log into JS to group it. Neither scales
--   past a demo. One RPC does it in a single round trip, in Postgres, where
--   the aggregation belongs.
-- ============================================================================

-- ── Read tracking for replies ───────────────────────────────────────────────
-- NULL = unread. Set when the customer's thread is opened.
ALTER TABLE inbound_messages
    ADD COLUMN IF NOT EXISTS read_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_inbound_messages_unread
    ON inbound_messages (org_id, contact_id)
    WHERE read_at IS NULL;

-- Supports the delivery-health aggregate below.
CREATE INDEX IF NOT EXISTS idx_message_logs_org_contact_status
    ON message_logs (org_id, contact_id, status);

-- ── Per-contact signals ─────────────────────────────────────────────────────
-- Returns one row per contact that has ANY signal. Contacts with nothing to
-- report are simply absent — the caller left-joins, so a quiet list costs
-- almost nothing to compute or transfer.
--
-- Raw counts only. What counts as "dead" is a product judgement (currently
-- ≥3 attempts, all failed) and belongs in application code where it can be
-- tuned without a migration.
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
            COUNT(*)                                        AS send_attempts,
            COUNT(*) FILTER (WHERE ml.status = 'failed')    AS send_failures
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
