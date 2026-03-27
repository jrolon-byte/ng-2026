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

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const supabase = getSupabase();
    const origin = new URL(req.url).origin;

    // Get the org's Stripe customer ID
    const { data: org, error } = await supabase
      .from("organizations")
      .select("stripe_customer_id")
      .eq("id", auth.org_id)
      .single();

    if (error || !org) {
      return jsonResponse({ error: "Organization not found" }, 404);
    }

    if (!org.stripe_customer_id) {
      return jsonResponse({ error: "No Stripe customer linked to this organization" }, 400);
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${origin}/engage`,
    });

    return jsonResponse({ url: session.url });
  } catch (err: unknown) {
    console.error("stripe-portal error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
