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

      if (!plan || !["starter", "pro"].includes(plan)) {
        return jsonResponse({ error: "Invalid plan. Must be 'starter' or 'pro'" }, 400);
      }

      const priceId =
        plan === "starter"
          ? process.env.STRIPE_PRICE_STARTER
          : process.env.STRIPE_PRICE_PRO;

      if (!priceId) {
        return jsonResponse({ error: "Stripe price not configured for this plan" }, 500);
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
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
