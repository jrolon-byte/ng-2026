import Stripe from "stripe";
import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";

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

    // ── Signup: one-time $5 payment ──
    if (type === "signup") {
      const { businessName, name, username, password, phone } = body;

      if (!businessName || !name || !username || !password || !phone) {
        return jsonResponse({ error: "Missing required signup fields" }, 400);
      }

      // Split name into first/last
      const nameParts = name.trim().split(/\s+/);
      const first_name = nameParts[0];
      const last_name = nameParts.slice(1).join(" ") || "";

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
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
        metadata: {
          business_name: businessName,
          first_name,
          last_name,
          username,
          password,
          phone,
        },
        success_url: `${origin}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/signup`,
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
