import Stripe from "stripe";
import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";
import { BUSINESS_NAME_FIELD_KEY } from "./utils/signup-session";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const { type } = body;
    const origin = new URL(req.url).origin;

    // ── Signup: pay first, set a password after ──
    // The customer types NOTHING before Stripe. Checkout collects email,
    // phone, cardholder name and the business name (custom field); the
    // webhook / success page provision the account from the session itself
    // (utils/provision-signup.ts). No PII rides through metadata.
    if (type === "signup") {
      const { referralCode } = body;
      // Native apps land back in the app: the success/cancel pages carry a
      // platform marker so /signup/success can bounce to the app's URL
      // scheme. Anything but the exact literal "ios" is ignored.
      const platform = body.platform === "ios" ? "ios" : "";

      // Optional referral code — resolve to the referrer org up front so a
      // typo'd code fails loudly at signup, not silently in the webhook.
      let referred_by_org_id = "";
      if (typeof referralCode === "string" && referralCode.trim()) {
        const supabase = getSupabase();
        const { data: referrer } = await supabase
          .from("organizations")
          .select("id, active")
          .eq("referral_code", referralCode.trim().toUpperCase())
          .maybeSingle();

        if (!referrer || !referrer.active) {
          return jsonResponse({ error: "That referral code isn't valid" }, 400);
        }
        referred_by_org_id = referrer.id;
      }

      const cancelUrl = platform
        ? `${origin}/signup/success?platform=ios&cancelled=1`
        : referred_by_org_id
          ? `${origin}/signup?ref=${encodeURIComponent(referralCode.trim().toUpperCase())}`
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
          ...(referred_by_org_id ? { referred_by_org_id } : {}),
          ...(platform ? { source: platform } : {}),
        },
        success_url: `${origin}/signup/success?session_id={CHECKOUT_SESSION_ID}${platform ? "&platform=ios" : ""}`,
        cancel_url: cancelUrl,
      };

      // Referred signups go STRAIGHT to Pro (James, 2026-07-30): no First
      // Blast trial — the friend subscribes at checkout and the referrer's
      // $5 starts on day one. Non-referred signups keep the $5 trial funnel.
      const session = referred_by_org_id
        ? await stripe.checkout.sessions.create({
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
          })
        : await stripe.checkout.sessions.create({
            ...shared,
            mode: "payment",
            // Always create a Customer: First Blast is a one-time payment
            // and would otherwise leave stripe_customer_id null until the
            // first upgrade (invoice.paid / payment_failed key off it).
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
          });

      return jsonResponse({ url: session.url });
    }

    // ── Upgrade: monthly recurring subscription ──
    if (type === "upgrade") {
      const auth = authenticateRequest(req);
      if (auth instanceof Response) return auth;

      const { plan } = body;

      const PLAN_CATALOG: Record<string, { name: string; unit_amount: number }> = {
        starter: { name: "NotifyGrid Starter – 600 texts/mo", unit_amount: 2900 },
        pro: { name: "NotifyGrid Pro – 1,500 texts/mo", unit_amount: 4900 },
        enterprise: { name: "NotifyGrid Enterprise – 4,000 texts/mo", unit_amount: 14900 },
      };

      if (!plan || !(plan in PLAN_CATALOG)) {
        return jsonResponse(
          { error: "Invalid plan. Must be 'starter', 'pro', or 'enterprise'" },
          400
        );
      }

      const tier = PLAN_CATALOG[plan];

      // Reuse the org's existing Stripe customer so an upgrade doesn't mint a
      // second customer record. The webhook cancels the previous subscription
      // once the new one completes — see stripe-webhook.ts.
      const supabase = getSupabase();
      const { data: org } = await supabase
        .from("organizations")
        .select("stripe_customer_id")
        .eq("id", auth.org_id)
        .single();

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        ...(org?.stripe_customer_id ? { customer: org.stripe_customer_id } : {}),
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: tier.name },
              unit_amount: tier.unit_amount,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        metadata: {
          org_id: auth.org_id,
          plan,
        },
        success_url: `${origin}/engage?upgraded=true`,
        cancel_url: `${origin}/engage`,
      });

      return jsonResponse({ url: session.url });
    }

    return jsonResponse({ error: "Invalid type. Must be 'signup' or 'upgrade'" }, 400);
  } catch (err: unknown) {
    console.error("stripe-checkout error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
