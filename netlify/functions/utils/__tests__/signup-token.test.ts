import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SETUP_TOKEN_TTL_MS,
  generateSetupToken,
  hashSetupToken,
  isPlausibleSetupToken,
  isSetupTokenExpired,
} from "../signup-token.ts";

test("generateSetupToken yields a URL-safe token whose hash matches", () => {
  const { token, hash, expiresAt } = generateSetupToken(0);
  assert.ok(isPlausibleSetupToken(token), `token shape: ${token}`);
  assert.equal(hash, hashSetupToken(token));
  assert.equal(hash.length, 64); // sha256 hex
  assert.equal(expiresAt, new Date(SETUP_TOKEN_TTL_MS).toISOString());
});

test("tokens are unique", () => {
  const a = generateSetupToken().token;
  const b = generateSetupToken().token;
  assert.notEqual(a, b);
});

test("hash is deterministic and never equals the token", () => {
  const { token } = generateSetupToken();
  assert.equal(hashSetupToken(token), hashSetupToken(token));
  assert.notEqual(hashSetupToken(token), token);
});

test("isPlausibleSetupToken rejects junk without a DB round-trip", () => {
  assert.equal(isPlausibleSetupToken(undefined), false);
  assert.equal(isPlausibleSetupToken(42), false);
  assert.equal(isPlausibleSetupToken(""), false);
  assert.equal(isPlausibleSetupToken("short"), false);
  assert.equal(isPlausibleSetupToken("has spaces ".repeat(5)), false);
  assert.equal(isPlausibleSetupToken("a".repeat(43) + "/"), false);
  assert.equal(isPlausibleSetupToken("a".repeat(43)), true);
});

test("isSetupTokenExpired: boundary, missing, and garbage", () => {
  const now = Date.parse("2026-09-02T12:00:00Z");
  assert.equal(isSetupTokenExpired("2026-09-02T12:00:01Z", now), false);
  assert.equal(isSetupTokenExpired("2026-09-02T12:00:00Z", now), true); // exact = expired
  assert.equal(isSetupTokenExpired("2026-09-01T12:00:00Z", now), true);
  assert.equal(isSetupTokenExpired(null, now), true);
  assert.equal(isSetupTokenExpired(undefined, now), true);
  assert.equal(isSetupTokenExpired("not a date", now), true);
});
