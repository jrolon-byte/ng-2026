import Stripe from "stripe";
import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";
import { InvalidReferralError, createSignupSession } from "./utils/signup-checkout";

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
    // The session itself is built in utils/signup-checkout.ts, shared with
    // GET /start (start.ts), the marketing site's direct door.
    if (type === "signup") {
      try {
        const url = await createSignupSession(stripe, getSupabase(), {
          origin,
          referralCode: body.referralCode,
          platform: body.platform,
        });
        return jsonResponse({ url });
      } catch (err) {
        if (err instanceof InvalidReferralError) {
          return jsonResponse({ error: err.message }, 400);
        }
        throw err;
      }
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
