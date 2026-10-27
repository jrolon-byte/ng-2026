/**
 * Builds the pay-first signup Checkout Session.
 *
 * Shared by two doors into the same checkout:
 *   - stripe-checkout.ts (POST, type "signup"): the /signup page and the iOS
 *     app, which get the session URL back as JSON and navigate themselves.
 *   - start.ts (GET /start): the marketing site's "Try for $5" buttons, which
 *     skip the /signup interstitial entirely and are 302'd straight into
 *     Stripe (James, 2026-10-27: "needs to be easy").
 *
 * Both doors produce an identical session, so provisioning
 * (utils/provision-signup.ts), referrals and the iOS return path are
 * untouched. The customer still types nothing before Stripe: Checkout
 * collects email, phone, cardholder name and the business name.
 */
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
// Explicit extension: node --test runs these files unbundled.
import { BUSINESS_NAME_FIELD_KEY } from "./signup-session.ts";

export class InvalidReferralError extends Error {
  constructor() {
    super("That referral code isn't valid");
    this.name = "InvalidReferralError";
  }
}

export interface SignupSessionInput {
  /** Public origin of the app, e.g. https://app.notifygrid.com */
  origin: string;
  /** Normalized (upper-cased, trimmed) referral code, or "" for none. */
  referralCode: string;
  /** Referrer org id when the code resolved, "" otherwise. */
  referredByOrgId: string;
  /** "ios" for the native app, "" for the web. */
  platform: "ios" | "";
  /** Where the click came from (utm_campaign), already sanitized. */
  campaign: string;
}

/** Trim a referral code to the shape the lookup expects; "" when absent. */
export function normalizeReferralCode(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toUpperCase() : "";
}

/**
 * utm_campaign arrives from a query string, so keep only what a campaign
 * slug looks like and cap it: this lands in Stripe metadata, nowhere else.
 */
export function sanitizeCampaign(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
}

/** The exact SessionCreateParams for a signup, pure and unit-testable. */
export function buildSignupSessionParams(input: SignupSessionInput): Stripe.Checkout.SessionCreateParams {
  const { origin, referralCode, referredByOrgId, platform, campaign } = input;

  const cancelUrl = platform
    ? `${origin}/signup/success?platform=ios&cancelled=1`
    : referredByOrgId
      ? `${origin}/signup?ref=${encodeURIComponent(referralCode)}`
      : `${origin}/signup`;

  const shared: Stripe.Checkout.SessionCreateParams = {
    // Everything provisioning needs, collected by Stripe's own form —
    // which already knows the customer if they use Link / Apple Pay.
    phone_number_collection: { enabled: true },
    custom_fields: [
      {
        key: BUSINESS_NAME_FIELD_KEY,
        label: { type: "custom", custom: "Business name" },
        type: "text",
        text: { minimum_length: 2, maximum_length: 60 },
      },
    ],
    metadata: {
      signup: "1",
      ...(referredByOrgId ? { referred_by_org_id: referredByOrgId } : {}),
      ...(platform ? { source: platform } : {}),
      ...(campaign ? { campaign } : {}),
    },
    success_url: `${origin}/signup/success?session_id={CHECKOUT_SESSION_ID}${platform ? "&platform=ios" : ""}`,
    cancel_url: cancelUrl,
  };

  // Referred signups go STRAIGHT to Pro (James, 2026-07-30): no First
  // Blast trial — the friend subscribes at checkout and the referrer's
  // credit lands on day one. Non-referred signups keep the $5 trial funnel.
  if (referredByOrgId) {
    return {
      ...shared,
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "NotifyGrid Pro – 1,500 texts/mo" },
            unit_amount: 4900,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: { ...shared.metadata, signup_plan: "pro" },
    };
  }

  return {
    ...shared,
    mode: "payment",
    // Always create a Customer: First Blast is a one-time payment and
    // would otherwise leave stripe_customer_id null until the first
    // upgrade (invoice.paid / payment_failed key off it).
    customer_creation: "always",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "NotifyGrid Signup – First Blast" },
          unit_amount: 500, // $5.00
        },
        quantity: 1,
      },
    ],
  };
}

/**
 * Resolves the referral code (a bad code throws InvalidReferralError so it
 * fails loudly at signup, not silently in the webhook) and creates the
 * session. Returns the hosted Checkout URL.
 */
export async function createSignupSession(
  stripe: Stripe,
  supabase: SupabaseClient,
  opts: { origin: string; referralCode?: unknown; platform?: unknown; campaign?: unknown }
): Promise<string> {
  const referralCode = normalizeReferralCode(opts.referralCode);
  // Anything but the exact literal "ios" is ignored.
  const platform: "ios" | "" = opts.platform === "ios" ? "ios" : "";
  const campaign = sanitizeCampaign(opts.campaign);

  let referredByOrgId = "";
  if (referralCode) {
    const { data: referrer } = await supabase
      .from("organizations")
      .select("id, active")
      .eq("referral_code", referralCode)
      .maybeSingle();
    if (!referrer || !referrer.active) throw new InvalidReferralError();
    referredByOrgId = referrer.id;
  }

  const session = await stripe.checkout.sessions.create(
    buildSignupSessionParams({ origin: opts.origin, referralCode, referredByOrgId, platform, campaign })
  );
  if (!session.url) throw new Error("Stripe returned a session without a URL");
  return session.url;
}
