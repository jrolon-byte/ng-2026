import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSignupSessionParams,
  normalizeReferralCode,
  sanitizeCampaign,
} from "../signup-checkout.ts";

const ORIGIN = "https://app.notifygrid.com";

test("First Blast: one-time $5, customer always created, lands on the success page", () => {
  const p = buildSignupSessionParams({ origin: ORIGIN, referralCode: "", referredByOrgId: "", platform: "", campaign: "" });
  assert.equal(p.mode, "payment");
  assert.equal(p.customer_creation, "always");
  assert.equal(p.line_items?.[0].price_data?.unit_amount, 500);
  assert.deepEqual(p.metadata, { signup: "1" });
  assert.equal(p.success_url, `${ORIGIN}/signup/success?session_id={CHECKOUT_SESSION_ID}`);
  assert.equal(p.cancel_url, `${ORIGIN}/signup`);
  assert.equal(p.phone_number_collection?.enabled, true);
  assert.equal(p.custom_fields?.[0].key, "business_name");
});

test("Referred: straight to Pro subscription, referrer in metadata, cancel keeps the code", () => {
  const p = buildSignupSessionParams({ origin: ORIGIN, referralCode: "TONYTO-K7F3", referredByOrgId: "org_1", platform: "", campaign: "" });
  assert.equal(p.mode, "subscription");
  assert.equal(p.customer_creation, undefined);
  assert.equal(p.line_items?.[0].price_data?.unit_amount, 4900);
  assert.equal(p.line_items?.[0].price_data?.recurring?.interval, "month");
  assert.deepEqual(p.metadata, { signup: "1", referred_by_org_id: "org_1", signup_plan: "pro" });
  assert.equal(p.cancel_url, `${ORIGIN}/signup?ref=TONYTO-K7F3`);
});

test("iOS: platform marker rides on both return URLs and in metadata.source", () => {
  const p = buildSignupSessionParams({ origin: ORIGIN, referralCode: "", referredByOrgId: "", platform: "ios", campaign: "" });
  assert.equal(p.success_url, `${ORIGIN}/signup/success?session_id={CHECKOUT_SESSION_ID}&platform=ios`);
  assert.equal(p.cancel_url, `${ORIGIN}/signup/success?platform=ios&cancelled=1`);
  assert.equal(p.metadata?.source, "ios");
});

test("campaign is recorded in metadata only when present", () => {
  const with_ = buildSignupSessionParams({ origin: ORIGIN, referralCode: "", referredByOrgId: "", platform: "", campaign: "barbershops" });
  assert.equal(with_.metadata?.campaign, "barbershops");
  const without = buildSignupSessionParams({ origin: ORIGIN, referralCode: "", referredByOrgId: "", platform: "", campaign: "" });
  assert.equal("campaign" in (without.metadata ?? {}), false);
});

test("sanitizeCampaign keeps slugs and drops everything else", () => {
  assert.equal(sanitizeCampaign("barbershops"), "barbershops");
  assert.equal(sanitizeCampaign("Hair-Salons_2"), "hair-salons_2");
  assert.equal(sanitizeCampaign("<script>alert(1)</script>"), "scriptalert1script");
  assert.equal(sanitizeCampaign("x".repeat(100)).length, 40);
  assert.equal(sanitizeCampaign(null), "");
  assert.equal(sanitizeCampaign(42), "");
});

test("normalizeReferralCode trims and upper-cases, and ignores non-strings", () => {
  assert.equal(normalizeReferralCode("  tonyto-k7f3 "), "TONYTO-K7F3");
  assert.equal(normalizeReferralCode(""), "");
  assert.equal(normalizeReferralCode(undefined), "");
  assert.equal(normalizeReferralCode({ code: "x" }), "");
});
