-- Migration 009: Add text_limit to organizations for usage tracking
ALTER TABLE organizations ADD COLUMN text_limit integer DEFAULT 600;
