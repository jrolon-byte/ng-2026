-- Migration 011: Add Stripe and plan fields to organizations
ALTER TABLE organizations ADD COLUMN stripe_customer_id text;
ALTER TABLE organizations ADD COLUMN stripe_subscription_id text;
ALTER TABLE organizations ADD COLUMN plan_status text DEFAULT 'first_blast';
-- plan_status values: 'first_blast', 'active', 'past_due', 'cancelled'
