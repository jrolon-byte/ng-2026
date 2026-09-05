/**
 * POST { session_id } — called by /signup/success the moment Stripe
 * redirects back.
 *
 * Two jobs:
 *   1. Make sure the account exists. The webhook usually wins, but Stripe
 *      redirects the browser before it has necessarily delivered the event,
 *      so this endpoint provisions too (idempotently — see
 *      utils/provision-signup.ts). The customer never sees a spinner that
 *      depends on webhook timing.
 *   2. Hand the browser a one-time setup token when the account has no
 *      password yet, so the very next screen is "choose a password" and
 *      then straight into the app.
 *
 * The Checkout session id is the bearer here. It is an unguessable secret
 * that only the paying browser was redirected with, Stripe's own docs use
 * it exactly this way on success pages, and it stops granting anything the
 * instant a password exists (`already_set`). Retrieval also proves payment:
 * we read the session from Stripe, never trust the query string.
 */
import Stripe from "stripe";
import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { provisionSignup } from "./utils/provision-signup";
import { isSessionPaid } from "./utils/signup-session";
import { generateSetupToken } from "./utils/signup-token";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const SESSION_ID_RE = /^cs_(live|test)_[A-Za-z0-9]{10,}$/;

export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { session_id } = await req.json();
    if (typeof session_id !== "string" || !SESSION_ID_RE.test(session_id)) {
      return jsonResponse({ error: "Invalid session" }, 400);
    }

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(session_id);
    } catch {
      return jsonResponse({ error: "Invalid session" }, 404);
    }

    if (!isSessionPaid(session)) {
      // Not paid (yet). The page keeps polling; Stripe finalises async
      // payment methods within seconds.
      return jsonResponse({ status: "pending" }, 202);
    }

    const supabase = getSupabase();
    const result = await provisionSignup(supabase, stripe, session);
    if (!result) {
      return jsonResponse({ error: "Not a signup session" }, 400);
    }

    const { data: user } = await supabase
      .from("users")
      .select("id, password_hash, first_name")
      .eq("id", result.userId)
      .single();

    if (!user) {
      // Mid-flight: the other path is between org insert and user insert.
      return jsonResponse({ status: "pending" }, 202);
    }

    // Amount + currency ride along so the success page can report the
    // `purchase` event with the real charge, not a hard-coded $5.
    const receipt = {
      amount_total: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
    };

    if (user.password_hash) {
      return jsonResponse({
        status: "ready",
        already_set: true,
        business_name: result.businessName,
        username: result.username,
        ...receipt,
      });
    }

    // Fresh token each time the success page asks. Last issued wins — the
    // SMS link and this page are the same screen, and a customer who
    // refreshes must not be locked out by their own earlier load.
    const setup = generateSetupToken();
    const { error } = await supabase
      .from("users")
      .update({
        setup_token_hash: setup.hash,
        setup_token_expires_at: setup.expiresAt,
      })
      .eq("id", user.id)
      .is("password_hash", null);

    if (error) {
      console.error("signup-claim: token rotate failed", error);
      return jsonResponse({ error: "Something went wrong" }, 500);
    }

    return jsonResponse({
      status: "ready",
      already_set: false,
      setup_token: setup.token,
      business_name: result.businessName,
      username: result.username,
      first_name: user.first_name,
      ...receipt,
    });
  } catch (err) {
    console.error("signup-claim error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
