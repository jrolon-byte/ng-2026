import Stripe from "stripe";
import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest, hashPassword } from "./utils/auth";

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
      const { businessName, name, username, password, phone, referralCode } = body;

      if (!businessName || !name || !username || !password || !phone) {
        return jsonResponse({ error: "Missing required signup fields" }, 400);
      }

      // Username must be valid AND free BEFORE the customer pays. Without
      // this, a taken username meant: money charged (a live subscription on
      // the referral path), then the webhook's user insert fails on the
      // unique constraint forever — a paying customer with no account.
      const usernameNorm = String(username).trim().toLowerCase();
      if (!/^[a-z0-9](?:[a-z0-9._-]{1,30})$/.test(usernameNorm)) {
        return jsonResponse(
          { error: "Username must be 2–31 characters: letters, numbers, dots, dashes, underscores" },
          400
        );
      }
      {
        const supabase = getSupabase();
        const { data: taken } = await supabase
          .from("users")
          .select("id")
          .or(`username.eq.${usernameNorm},email.eq.${usernameNorm}@notifygrid.app`)
          .maybeSingle();
        if (taken) {
          return jsonResponse({ error: "That username is taken — try another" }, 409);
        }
      }

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

      // Split name into first/last
      const nameParts = name.trim().split(/\s+/);
      const first_name = nameParts[0];
      const last_name = nameParts.slice(1).join(" ") || "";

      // bcrypt BEFORE Stripe: metadata is visible in the Stripe dashboard,
      // event logs, and every connected integration — the plaintext password
      // must never ride through it. The webhook stores this hash directly
      // (starts with $2, so login treats it as bcrypt — no lazy-upgrade
      // plaintext window either).
      const password_hash = await hashPassword(password);

      const metadata = {
        business_name: businessName,
        first_name,
        last_name,
        username: usernameNorm,
        password_hash,
        phone,
        ...(referred_by_org_id ? { referred_by_org_id } : {}),
      };

      // Referred signups go STRAIGHT to Pro (James, 2026-07-30): no First
      // Blast trial — the friend subscribes at checkout and the referrer's
      // $5 starts on day one. Non-referred signups keep the $5 trial funnel.
      const session = referred_by_org_id
        ? await stripe.checkout.sessions.create({
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
            metadata: { ...metadata, signup_plan: "pro" },
            success_url: `${origin}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/signup`,
          })
        : await stripe.checkout.sessions.create({
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
            metadata,
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
