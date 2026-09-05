import { test } from "node:test";
import assert from "node:assert/strict";
import type Stripe from "stripe";
import { isSessionPaid, parseSignupSession } from "../signup-session.ts";

// Only the fields provisioning reads; cast because a real Session has ~80.
function session(over: Record<string, unknown>): Stripe.Checkout.Session {
  return {
    id: "cs_test_abc123",
    status: "complete",
    payment_status: "paid",
    metadata: {},
    customer: "cus_123",
    subscription: null,
    custom_fields: [],
    customer_details: null,
    ...over,
  } as unknown as Stripe.Checkout.Session;
}

test("pay-first session: reads business name from the custom field and PII from customer_details", () => {
  const parsed = parseSignupSession(
    session({
      metadata: { signup: "1" },
      custom_fields: [
        { key: "business_name", type: "text", text: { value: "  Tony Touch Barbershop " } },
      ],
      customer_details: {
        email: "Tony@TonyTouch.com",
        phone: "+14075550134",
        name: "Tony Rivera",
      },
    })
  );
  assert.ok(parsed && parsed.kind === "pay_first");
  assert.equal(parsed.businessName, "Tony Touch Barbershop");
  assert.equal(parsed.email, "tony@tonytouch.com");
  assert.equal(parsed.phone, "+14075550134");
  assert.equal(parsed.fullName, "Tony Rivera");
  assert.equal(parsed.isPro, false);
  assert.equal(parsed.referredByOrgId, null);
  assert.equal(parsed.customerId, "cus_123");
  assert.equal(parsed.subscriptionId, null);
});

test("pay-first session: referred Pro carries plan + referrer and expanded objects", () => {
  const parsed = parseSignupSession(
    session({
      metadata: { signup: "1", signup_plan: "pro", referred_by_org_id: "org_ref" },
      customer: { id: "cus_obj" },
      subscription: { id: "sub_obj" },
      custom_fields: [{ key: "business_name", type: "text", text: { value: "Cut & Crown" } }],
      customer_details: { email: "d@cutcrown.com", phone: null, name: null },
    })
  );
  assert.ok(parsed && parsed.kind === "pay_first");
  assert.equal(parsed.isPro, true);
  assert.equal(parsed.referredByOrgId, "org_ref");
  assert.equal(parsed.customerId, "cus_obj");
  assert.equal(parsed.subscriptionId, "sub_obj");
  assert.equal(parsed.phone, null);
  assert.equal(parsed.fullName, null);
});

test("pay-first session: a paid customer with a blank business name still provisions", () => {
  const fromName = parseSignupSession(
    session({
      metadata: { signup: "1" },
      custom_fields: [{ key: "business_name", type: "text", text: { value: "" } }],
      customer_details: { email: "x@y.com", name: "Dee Jones", phone: null },
    })
  );
  assert.ok(fromName && fromName.kind === "pay_first");
  assert.equal(fromName.businessName, "Dee Jones");

  const bare = parseSignupSession(session({ metadata: { signup: "1" } }));
  assert.ok(bare && bare.kind === "pay_first");
  assert.equal(bare.businessName, "My Shop");
  assert.equal(bare.email, null);
});

test("legacy session (pre pay-first form) is recognised by metadata.username", () => {
  const parsed = parseSignupSession(
    session({
      metadata: {
        username: "tonytouch",
        password_hash: "$2a$10$x",
        business_name: "Tony Touch",
        first_name: "Tony",
        last_name: "Rivera",
        phone: "(407) 555-0134",
      },
      customer_details: { email: "tony@tonytouch.com" },
    })
  );
  assert.ok(parsed && parsed.kind === "legacy");
  assert.equal(parsed.metadata.username, "tonytouch");
  assert.equal(parsed.email, "tony@tonytouch.com");
});

test("an upgrade session is not a signup", () => {
  assert.equal(parseSignupSession(session({ metadata: { org_id: "org_1", plan: "pro" } })), null);
  assert.equal(parseSignupSession(session({ metadata: {} })), null);
  assert.equal(parseSignupSession(session({ metadata: null })), null);
});

test("isSessionPaid requires a complete + paid session", () => {
  assert.equal(isSessionPaid(session({})), true);
  assert.equal(isSessionPaid(session({ payment_status: "no_payment_required" })), true);
  assert.equal(isSessionPaid(session({ payment_status: "unpaid" })), false);
  assert.equal(isSessionPaid(session({ status: "open" })), false);
  assert.equal(isSessionPaid(session({ status: "expired" })), false);
});
