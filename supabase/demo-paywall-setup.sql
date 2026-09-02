-- Apple demo account: one blast fills the plan, then the paywall appears.
--
-- App Review asked to see "any purchase or subscription flows" in the
-- recording. This arranges the demo shop so the reviewer sends a single blast,
-- watches it consume the last of the allowance, and gets the upgrade sheet —
-- the real product moment, not a pre-staged screen.
--
-- HOW THE NUMBERS WORK
--   cap   = 100                      the real First Blast tier
--   seed  = 100 - (active contacts)  usage pre-loaded, just short of the cap
--   blast = (active contacts)        the reviewer's one send closes the gap
--   => sent lands exactly on 100, and `sent >= cap` puts the paywall at "near"
--
-- WHY cap = 100 AND NOT SOMETHING SMALLER
-- PaywallModel maps cap -> plan name (100/600/1500/4000). Any other value
-- renders "past your your plan (6)" — a copy bug, in front of a reviewer.
-- 100 is the First Blast tier the App Store description already sells.
--
-- WHY "near" AND NOT "over"
-- grace = cap + 2/contact, so 100 sent against a 112 grace is "near": the
-- "View options" link appears and the sheet opens, but the send button still
-- works. "over" would force the sheet open and dead-end sending, which is a
-- worse thing to hand someone evaluating the app.
--
-- WHY USAGE IS SEEDED AT ALL
-- Only a Twilio API *rejection* writes status 'failed', and dashboard-stats
-- excludes exactly that status. Accepted-then-undelivered messages — what
-- 555-01xx numbers produce — are logged 'sent' and do count. Seeding the
-- shortfall is what makes a single 6-message blast land on a round 100.
--
-- RUN THIS LAST, once the demo contact list is final and you have finished
-- test-sending. The seed is computed from BOTH the live contact count and the
-- usage already spent this cycle, so anything you do afterwards — adding a
-- contact, sending another test blast — shifts where the reviewer's blast
-- lands. Re-running fixes it; the script is idempotent and self-correcting.
--
-- Confirmed empirically 2026-08-31: blasts to 555-01xx numbers are logged
-- 'undelivered', not 'failed'. Twilio accepts them and the carrier rejects
-- them downstream, so they DO count toward usage. That is what makes
-- one-blast-fills-the-plan work at all.
--
-- Idempotent: re-running replaces the seeded rows rather than stacking them.

BEGIN;

UPDATE organizations
SET text_limit = 100
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Orphan logs (campaign_id NULL) never surface in History, so the campaign
-- list stays consistent with a small shop.
DELETE FROM message_logs
WHERE org_id = '11111111-1111-1111-1111-111111111111'
  AND body = 'DemoBarber: earlier this cycle';

INSERT INTO message_logs (org_id, campaign_id, contact_id, body, status, sent_at, created_at)
SELECT
    '11111111-1111-1111-1111-111111111111',
    NULL,
    (SELECT id FROM contacts
      WHERE org_id = '11111111-1111-1111-1111-111111111111'
        AND active
      ORDER BY created_at
      LIMIT 1),
    'DemoBarber: earlier this cycle',
    'delivered',
    now(),
    now()
FROM generate_series(
    1,
    GREATEST(0,
        100
        -- Room for the reviewer's one blast.
        - (SELECT count(*) FROM contacts
            WHERE org_id = '11111111-1111-1111-1111-111111111111'
              AND active)::int
        -- Usage already spent this cycle. Test blasts you send while checking
        -- the app land here too, and the first version of this script ignored
        -- them: two 4-message tests pushed the org past the cap on their own,
        -- so the paywall was already showing before the reviewer did anything.
        -- The DELETE above runs first, so this counts only real sends.
        - (SELECT count(*) FROM message_logs
            WHERE org_id = '11111111-1111-1111-1111-111111111111'
              AND status <> 'failed'
              AND sent_at >= date_trunc('month', now()))::int
    )
);

COMMIT;

-- Expect: sent_this_cycle + contacts = 100, and 100 < grace_limit.
-- That is "one blast away from the wall, still able to send".
SELECT
    o.text_limit AS cap,
    (SELECT count(*) FROM message_logs m
      WHERE m.org_id = o.id
        AND m.status <> 'failed'
        AND m.sent_at >= date_trunc('month', now()))  AS sent_this_cycle,
    (SELECT count(*) FROM contacts c
      WHERE c.org_id = o.id AND c.active)             AS blast_size,
    o.text_limit + 2 * (SELECT count(*) FROM contacts c
      WHERE c.org_id = o.id AND c.active)             AS grace_limit
FROM organizations o
WHERE o.id = '11111111-1111-1111-1111-111111111111';
