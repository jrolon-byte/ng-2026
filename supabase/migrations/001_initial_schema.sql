-- 001_initial_schema.sql
-- NotifyGrid 2026 — Initial database schema
-- Supabase / PostgreSQL

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE organizations (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL,
    slug        text        UNIQUE NOT NULL,
    phone       text,
    address     text,
    city        text,
    state       text,
    zip         text,
    plan_tier   text        DEFAULT 'free',
    active      boolean     DEFAULT true,
    created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_organizations_slug ON organizations (slug);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    email         text        UNIQUE NOT NULL,
    password_hash text        NOT NULL,
    first_name    text        NOT NULL,
    last_name     text,
    role          text        DEFAULT 'admin',
    active        boolean     DEFAULT true,
    created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_users_org_id ON users (org_id);

-- ============================================================
-- CONTACTS
-- ============================================================
CREATE TABLE contacts (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    first_name  text        NOT NULL,
    last_name   text,
    phone       text        NOT NULL,
    email       text,
    opted_in    boolean     DEFAULT true,
    active      boolean     DEFAULT true,
    created_at  timestamptz DEFAULT now(),

    CONSTRAINT uq_contacts_org_phone UNIQUE (org_id, phone)
);

CREATE INDEX idx_contacts_org_id ON contacts (org_id);

-- ============================================================
-- CAMPAIGNS
-- ============================================================
CREATE TABLE campaigns (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id           uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    user_id          uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    body             text        NOT NULL,
    image_url        text,
    total_recipients integer     DEFAULT 0,
    total_delivered  integer     DEFAULT 0,
    total_failed     integer     DEFAULT 0,
    status           text        DEFAULT 'pending',
    sent_at          timestamptz,
    created_at       timestamptz DEFAULT now()
);

CREATE INDEX idx_campaigns_org_id ON campaigns (org_id);

-- ============================================================
-- MESSAGE_LOGS
-- ============================================================
CREATE TABLE message_logs (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      uuid        NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    campaign_id uuid        REFERENCES campaigns (id) ON DELETE SET NULL,
    contact_id  uuid        NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
    body        text        NOT NULL,
    segments    integer     DEFAULT 1,
    twilio_sid  text,
    status      text        DEFAULT 'queued',
    cost        numeric(10,4),
    sent_at     timestamptz,
    created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_message_logs_org_id      ON message_logs (org_id);
CREATE INDEX idx_message_logs_campaign_id ON message_logs (campaign_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on every table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns      ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs   ENABLE ROW LEVEL SECURITY;

-- Helper: extract org_id from the JWT claims
-- Supabase stores custom claims in auth.jwt() -> 'app_metadata' -> 'org_id'

-- Organizations: users can only see their own org
CREATE POLICY "org_isolation" ON organizations
    FOR ALL
    USING (id = ((current_setting('request.jwt.claims', true)::json)->>'org_id')::uuid)
    WITH CHECK (id = ((current_setting('request.jwt.claims', true)::json)->>'org_id')::uuid);

-- Users: scoped to org_id
CREATE POLICY "org_isolation" ON users
    FOR ALL
    USING (org_id = ((current_setting('request.jwt.claims', true)::json)->>'org_id')::uuid)
    WITH CHECK (org_id = ((current_setting('request.jwt.claims', true)::json)->>'org_id')::uuid);

-- Contacts: scoped to org_id
CREATE POLICY "org_isolation" ON contacts
    FOR ALL
    USING (org_id = ((current_setting('request.jwt.claims', true)::json)->>'org_id')::uuid)
    WITH CHECK (org_id = ((current_setting('request.jwt.claims', true)::json)->>'org_id')::uuid);

-- Campaigns: scoped to org_id
CREATE POLICY "org_isolation" ON campaigns
    FOR ALL
    USING (org_id = ((current_setting('request.jwt.claims', true)::json)->>'org_id')::uuid)
    WITH CHECK (org_id = ((current_setting('request.jwt.claims', true)::json)->>'org_id')::uuid);

-- Message Logs: scoped to org_id
CREATE POLICY "org_isolation" ON message_logs
    FOR ALL
    USING (org_id = ((current_setting('request.jwt.claims', true)::json)->>'org_id')::uuid)
    WITH CHECK (org_id = ((current_setting('request.jwt.claims', true)::json)->>'org_id')::uuid);
