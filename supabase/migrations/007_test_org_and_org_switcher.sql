-- Migration 007: Test org for James + org switcher support
-- Creates Rolonium Labs test org, James as admin in it,
-- and adds super_admin flag to users table for org switching

-- Add super_admin column
ALTER TABLE users ADD COLUMN super_admin boolean DEFAULT false;

-- Create test organization
INSERT INTO organizations (name, slug, phone, address, city, state, zip)
VALUES ('Rolonium Labs', 'roloniumlabs', '+13212041239', '117 Broadway', 'Kissimmee', 'FL', '34741');

-- Create James as admin in the test org
INSERT INTO users (org_id, username, email, password_hash, first_name, last_name, role, super_admin)
SELECT id, 'james-test', 'james@roloniumlabs.com', 'NGWelcome.407', 'James', 'Rolon', 'admin', true
FROM organizations WHERE slug = 'roloniumlabs';

-- Mark James's tonytouch account as super_admin too
UPDATE users SET super_admin = true WHERE username = 'james';

-- Add James's phone as a test contact in Rolonium Labs
INSERT INTO contacts (org_id, first_name, phone, active, created_at)
VALUES (
  (SELECT id FROM organizations WHERE slug = 'roloniumlabs'),
  'James Rolon',
  '+14077548294',
  true,
  '2026-03-26 00:00:00'
);
