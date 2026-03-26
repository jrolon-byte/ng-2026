-- Migration 005: Add username column to users table
-- Login will use username instead of email

ALTER TABLE users ADD COLUMN username text;
CREATE UNIQUE INDEX idx_users_username ON users (username) WHERE username IS NOT NULL;

-- Also re-create the admin user for tonytouch with a proper username
-- (delete first in case they already exist from prior inserts)
DELETE FROM users WHERE email = 'james@notifygrid.com';
DELETE FROM users WHERE email = 'tony@tonytouch.com';
DELETE FROM users WHERE email = 'tony';

-- Create Tony's account: username 'tony', password 'musicc'
INSERT INTO users (org_id, username, email, password_hash, first_name, last_name, role)
SELECT id, 'tony', 'tony@tonytouch.com', 'musicc', 'Tony', 'Touch', 'admin'
FROM organizations WHERE slug = 'tonytouch';

-- Also create James's admin account
INSERT INTO users (org_id, username, email, password_hash, first_name, last_name, role)
SELECT id, 'james', 'james@notifygrid.com', 'SuperPeanutJellyMatch.1906', 'James', 'Rolon', 'admin'
FROM organizations WHERE slug = 'tonytouch';
