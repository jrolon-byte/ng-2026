/**
 * GET /start — the marketing site's "Try for $5" door.
 *
 * notifygrid.com used to send every button to /signup, a page whose only
 * job was one more "Pay $5 and start" click. James (2026-10-27): that click
 * is friction. This endpoint creates the very same Checkout Session the
 * /signup page would and 302s the browser straight into Stripe, so the
 * path is landing page → card form. A permanent Stripe link would not do:
 * Checkout Session URLs are single-use and expire in 24 hours, and a
 * Payment Link could not carry the referral code or the campaign.
 *
 *   /start                         → First Blast ($5 one-time)
 *   /start?ref=TONYTO-K7F3         → Pro, credited to the referrer
 *   /start?utm_campaign=barbershops → First Blast, campaign in metadata
 *
 * A bad referral code falls back to /signup?ref=… where the page explains;
 * any other failure falls back to /signup so the customer is never stuck
 * on an error page from a marketing click.
 */
import type { Config } from "@netlify/functions";
import Stripe from "stripe";
import { getSupabase } from "./utils/supabase";
import { InvalidReferralError, createSignupSession } from "./utils/signup-checkout";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

function redirect(to: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: to,
      // Every visit is a fresh session; nothing here may be cached by a
      // CDN or a browser.
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export default async (req: Request) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const origin = url.origin;
  const ref = url.searchParams.get("ref") ?? "";

  try {
    const checkoutUrl = await createSignupSession(stripe, getSupabase(), {
      origin,
      referralCode: ref,
      campaign: url.searchParams.get("utm_campaign") ?? url.searchParams.get("c") ?? "",
    });
    return redirect(checkoutUrl);
  } catch (err) {
    if (err instanceof InvalidReferralError) {
      return redirect(`${origin}/signup?ref=${encodeURIComponent(ref.trim().toUpperCase())}`);
    }
    console.error("start: could not create signup session:", err);
    return redirect(`${origin}/signup`);
  }
};

export const config: Config = {
  path: "/start",
};
