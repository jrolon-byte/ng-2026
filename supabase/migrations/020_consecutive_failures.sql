-- ============================================================================
-- 020 — Consecutive delivery failures per contact
--
-- Run BY HAND in the Supabase SQL editor. Idempotent — safe to re-run.
--
-- WHY
--   019 measured delivery health as an all-time ratio: "every attempt failed".
--   Against real data that misses the most common dead number of all — the
--   customer who changed their phone. Nelson received 8 messages fine, then
--   failed 20 straight with 30005 (number doesn't exist). By an all-time
--   ratio he looks 71% healthy. By what actually matters — has anything
--   arrived lately — he's gone.
--
--   Trailing consecutive failures is the honest measure: it catches numbers
--   that were never good AND numbers that went bad, while forgiving the shop
--   regular whose phone happened to be off during one blast.
-- ============================================================================

-- CREATE OR REPLACE cannot change a function's return type — this adds a
-- column to the OUT record, so the old definition has to go first. Safe:
-- contacts-list treats a missing/erroring RPC as "no signals" and returns the
-- plain list, so the brief window between these two statements degrades the
-- app rather than breaking it.
DROP FUNCTION IF EXISTS contact_signals(uuid);

CREATE OR REPLACE FUNCTION contact_signals(p_org_id uuid)
RETURNS TABLE (
    contact_id           uuid,
    unread_replies       bigint,
    last_reply_at        timestamptz,
    send_attempts        bigint,
    send_failures        bigint,
    consecutive_failures bigint
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
    ordered AS (
        SELECT
            ml.contact_id,
            ROW_NUMBER() OVER (
                PARTITION BY ml.contact_id
                ORDER BY ml.sent_at DESC NULLS LAST
            ) AS rn,
            (ml.status IN ('failed', 'undelivered') OR ml.error_code IS NOT NULL) AS is_fail
        FROM message_logs ml
        WHERE ml.org_id = p_org_id
          AND ml.contact_id IS NOT NULL
    ),
    delivery AS (
        SELECT
            o.contact_id,
            COUNT(*)                             AS send_attempts,
            COUNT(*) FILTER (WHERE o.is_fail)    AS send_failures,
            -- Position of the most recent success, minus one, is how many
            -- failures sit on top of it. No success at all => everything
            -- failed.
            COALESCE(
                MIN(o.rn) FILTER (WHERE NOT o.is_fail) - 1,
                COUNT(*)
            ) AS consecutive_failures
        FROM ordered o
        GROUP BY o.contact_id
    )
    SELECT
        COALESCE(r.contact_id, d.contact_id)   AS contact_id,
        COALESCE(r.unread_replies, 0)          AS unread_replies,
        r.last_reply_at,
        COALESCE(d.send_attempts, 0)           AS send_attempts,
        COALESCE(d.send_failures, 0)           AS send_failures,
        COALESCE(d.consecutive_failures, 0)    AS consecutive_failures
    FROM replies r
    FULL OUTER JOIN delivery d ON d.contact_id = r.contact_id;
$$;
