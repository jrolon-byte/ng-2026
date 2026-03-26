-- Migration 006: Login rate limiting
-- Tracks failed login attempts per username to prevent brute force

CREATE TABLE login_attempts (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    username   text        NOT NULL,
    attempted_at timestamptz DEFAULT now()
);

CREATE INDEX idx_login_attempts_username ON login_attempts (username, attempted_at);
