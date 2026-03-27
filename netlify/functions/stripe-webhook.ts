import Stripe from "stripe";
import { getSupabase } from "./utils/supabase";
import { jsonResponse } from "./utils/cors";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

function generateSlug(businessName: string): string {
  const base = businessName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");

  const rand = Math.random().toString(36).substring(2, 6);
  return `${base}-${rand}`;
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return jsonResponse({ error: "Webhook not configured" }, 500);
  }

  // Read body as raw text for signature verification
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return jsonResponse({ error: "Missing stripe-signature header" }, 400);
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    console.error("Webhook signature verification failed:", err);
    return jsonResponse({ error: "Invalid signature" }, 400);
  }

  const supabase = getSupabase();

  try {
    switch (event.type) {
      // ── Checkout completed ──
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};

        // Signup flow – metadata contains username
        if (metadata.username) {
          const slug = generateSlug(metadata.business_name);

          // Create organization
          const { data: org, error: orgError } = await supabase
            .from("organizations")
            .insert({
              name: metadata.business_name,
              slug,
              phone: metadata.phone,
              plan_status: "first_blast",
              stripe_customer_id: session.customer as string,
              text_limit: 500,
            })
            .select("id")
            .single();

          if (orgError) {
            console.error("Failed to create organization:", orgError);
            return jsonResponse({ error: "Failed to create organization" }, 500);
          }

          // Create user
          const { error: userError } = await supabase.from("users").insert({
            org_id: org.id,
            username: metadata.username,
            email: `${metadata.username}@notifygrid.app`,
            password_hash: metadata.password, // plaintext, auto-upgrades on first login
            first_name: metadata.first_name,
            last_name: metadata.last_name,
            role: "admin",
          });

          if (userError) {
            console.error("Failed to create user:", userError);
            return jsonResponse({ error: "Failed to create user" }, 500);
          }
        }

        // Upgrade flow – metadata contains org_id
        if (metadata.org_id) {
          const plan = metadata.plan;
          const textLimit = plan === "pro" ? 1500 : 600;

          const { error: updateError } = await supabase
            .from("organizations")
            .update({
              plan_status: "active",
              stripe_subscription_id: session.subscription as string,
              text_limit: textLimit,
            })
            .eq("id", metadata.org_id);

          if (updateError) {
            console.error("Failed to update organization:", updateError);
            return jsonResponse({ error: "Failed to update organization" }, 500);
          }
        }

        break;
      }

      // ── Invoice paid – mark active ──
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { error } = await supabase
          .from("organizations")
          .update({ plan_status: "active" })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Failed to update org on invoice.paid:", error);
        }
        break;
      }

      // ── Invoice payment failed – mark past due ──
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { error } = await supabase
          .from("organizations")
          .update({ plan_status: "past_due" })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Failed to update org on invoice.payment_failed:", error);
        }
        break;
      }

      // ── Subscription deleted – cancel ──
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        const { error } = await supabase
          .from("organizations")
          .update({ plan_status: "cancelled", text_limit: 0 })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) {
          console.error("Failed to update org on subscription.deleted:", error);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
        return jsonResponse({ received: false }, 400);
    }

    return jsonResponse({ received: true }, 200);
  } catch (err: unknown) {
    console.error("stripe-webhook error:", err);
    return jsonResponse({ error: "Webhook handler failed" }, 500);
  }
};
