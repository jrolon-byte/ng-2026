-- Token revocation hook (2026-07-30)
--
-- auth-refresh makes sessions indefinitely renewable (7d token + 14d grace,
-- rolling). token_version is the kill switch: it rides in the JWT, and
-- refresh rejects any token whose version doesn't match the DB. Bump a
-- user's token_version (UPDATE users SET token_version = token_version + 1
-- WHERE id = ...) and every outstanding token stops refreshing — the access
-- token itself still dies within its 7-day window.
--
-- Apply by hand in the Supabase SQL editor.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS token_version integer NOT NULL DEFAULT 0;
