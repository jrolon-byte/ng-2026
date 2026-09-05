/**
 * One-time password-setup tokens for pay-first signups.
 *
 * A token is minted when an account is provisioned without a password
 * (the customer paid but has not chosen one yet). It rides in two places:
 * the success-page response and the welcome SMS link. Only its sha256 is
 * stored (users.setup_token_hash); the raw value never touches the DB, so a
 * leaked database dump cannot be used to claim an account.
 *
 * Single-use: signup-set-password clears the hash on success. Time-boxed:
 * 7 days — long enough to survive "I'll do it after close", short enough
 * that a stale welcome text is not a permanent side door.
 *
 * Pure module (node:crypto only) so it is unit-testable without a bundler.
 */
import { createHash, randomBytes } from "node:crypto";

export const SETUP_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** 32 random bytes, base64url — URL-safe, 43 chars, 256 bits of entropy. */
export function generateSetupToken(now: number = Date.now()): {
  token: string;
  hash: string;
  expiresAt: string;
} {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    hash: hashSetupToken(token),
    expiresAt: new Date(now + SETUP_TOKEN_TTL_MS).toISOString(),
  };
}

export function hashSetupToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Shape check before hitting the DB — rejects junk without a query. */
export function isPlausibleSetupToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{40,48}$/.test(value);
}

export function isSetupTokenExpired(
  expiresAt: string | null | undefined,
  now: number = Date.now()
): boolean {
  if (!expiresAt) return true;
  const t = Date.parse(expiresAt);
  return Number.isNaN(t) || t <= now;
}
