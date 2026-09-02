BEGIN;

INSERT INTO organizations (
    id, name, slug, phone, plan_status, text_limit, active, locale,
    message_prefix, message_suffix, created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Demo Barber Studio',
    'demo-barber-studio',
    '+14075550100',
    'active',
    10,
    true,
    'en',
    'DemoBarber: ',
    ' · Call 407-555-0100',
    now() - interval '14 months'
)
ON CONFLICT (id) DO UPDATE SET
    plan_status    = 'active',
    text_limit     = 10,
    active         = true,
    locale         = 'en',
    message_prefix = EXCLUDED.message_prefix,
    message_suffix = EXCLUDED.message_suffix;

INSERT INTO users (
    id, org_id, username, email, password_hash,
    first_name, last_name, role, active, created_at
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'appledemo',
    'appledemo@notifygrid.com',
    '$2b$10$coT/cBVOUfInpg.aU7.AC.DTz03S3w2RD.y0IMiAZ7BTZHV.q5KoO',
    'Alex',
    'Rivera',
    'admin',
    true,
    now() - interval '14 months'
)
ON CONFLICT (id) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    active        = true;

INSERT INTO contacts (id, org_id, first_name, last_name, phone, opted_in, active, created_at)
VALUES
    ('c0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Marcus', 'Bell',     '+14075550101', true, true, now() - interval '13 months'),
    ('c0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Elena',  'Ortiz',    '+14075550102', true, true, now() - interval '11 months'),
    ('c0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Devon',  'Wright',   '+14075550103', true, true, now() - interval '9 months'),
    ('c0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Priya',  'Nair',     '+14075550104', true, true, now() - interval '7 months'),
    ('c0000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Tomas',  'Lindgren', '+14075550105', true, true, now() - interval '5 months'),
    ('c0000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Aisha',  'Kone',     '+14075550106', true, true, now() - interval '3 months'),
    ('c0000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Ben',    'Carter',   '+14075550107', true, true, now() - interval '6 weeks'),
    ('c0000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'Jordan', 'Freeman',  '+14075550108', true, true, now() - interval '12 months')
ON CONFLICT (id) DO UPDATE SET
    opted_in = EXCLUDED.opted_in,
    active   = true;

INSERT INTO campaigns (id, org_id, user_id, body, total_recipients, total_delivered, total_failed, status, sent_at, created_at)
VALUES
    ('ca000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
     'Hey @Name, three chairs open this afternoon. Reply YES and we''ll lock you in.', 8, 7, 1, 'completed', now() - interval '6 days', now() - interval '6 days'),
    ('ca000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
     'Friday special for you @Name: $5 off any cut. Show this text at the counter.', 8, 7, 1, 'completed', now() - interval '3 weeks', now() - interval '3 weeks'),
    ('ca000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
     '@Name we''re open late Thursday until 9pm. Walk-ins welcome.', 8, 7, 1, 'completed', now() - interval '7 weeks', now() - interval '7 weeks')
ON CONFLICT (id) DO NOTHING;

INSERT INTO message_logs (org_id, campaign_id, contact_id, body, status, error_code, twilio_sid, sent_at, created_at)
SELECT
    '11111111-1111-1111-1111-111111111111',
    ca.id,
    c.id,
    'DemoBarber: ' || replace(ca.body, '@Name', c.first_name) || ' · Call 407-555-0100',
    CASE WHEN c.id = 'c0000000-0000-0000-0000-000000000008' THEN 'undelivered' ELSE 'delivered' END,
    CASE WHEN c.id = 'c0000000-0000-0000-0000-000000000008' THEN 30005 ELSE NULL END,
    'SMdemo' || substr(md5(ca.id::text || c.id::text), 1, 26),
    ca.sent_at,
    ca.sent_at
FROM campaigns ca
CROSS JOIN contacts c
WHERE ca.org_id = '11111111-1111-1111-1111-111111111111'
  AND c.org_id  = '11111111-1111-1111-1111-111111111111'
ON CONFLICT DO NOTHING;

INSERT INTO inbound_messages (org_id, contact_id, from_phone, to_phone, body, twilio_sid, received_at, read_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001',
     '+14075550101', '+14075550100', 'YES 2:30 works for me, thanks!', 'SMdemoinbound000000000000001', now() - interval '5 days', NULL),
    ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000004',
     '+14075550104', '+14075550100', 'Do you have anything open Saturday morning?', 'SMdemoinbound000000000000002', now() - interval '2 days', NULL),
    ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000006',
     '+14075550106', '+14075550100', 'On my way, be there in 10', 'SMdemoinbound000000000000003', now() - interval '1 day', NULL)
ON CONFLICT (twilio_sid) DO NOTHING;

COMMIT;

SELECT
    (SELECT count(*) FROM contacts         WHERE org_id = '11111111-1111-1111-1111-111111111111') AS contacts,
    (SELECT count(*) FROM campaigns        WHERE org_id = '11111111-1111-1111-1111-111111111111') AS campaigns,
    (SELECT count(*) FROM message_logs     WHERE org_id = '11111111-1111-1111-1111-111111111111') AS sent_logs,
    (SELECT count(*) FROM inbound_messages WHERE org_id = '11111111-1111-1111-1111-111111111111') AS replies,
    (SELECT text_limit FROM organizations  WHERE id     = '11111111-1111-1111-1111-111111111111') AS text_limit;
