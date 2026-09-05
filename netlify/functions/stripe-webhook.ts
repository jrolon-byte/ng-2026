import Stripe from "stripe";
import { getSupabase } from "./utils/supabase";
import { jsonResponse } from "./utils/cors";
import { recalcDiscountForReferrerOf, recalcReferrerDiscount } from "./utils/referrals";
import { provisionSignup } from "./utils/provision-signup";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

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

        // Signup flow — pay-first (metadata.signup) or legacy (metadata.username).
        // Provisioning lives in utils/provision-signup.ts because the success
        // page provisions too; both paths are idempotent on the session id.
        // A thrown error → 500 → Stripe retries, which is what we want.
        if (metadata.signup === "1" || metadata.username) {
          await provisionSignup(supabase, stripe, session);
          break;
        }

        // Upgrade flow – metadata contains org_id
        if (metadata.org_id) {
          const plan = metadata.plan;
          const PLAN_TEXT_LIMITS: Record<string, number> = {
            starter: 600,
            pro: 1500,
            enterprise: 4000,
          };
          const textLimit = PLAN_TEXT_LIMITS[plan] ?? 600;
          const newSubscriptionId = session.subscription as string;

          // Capture the previous subscription BEFORE overwriting — an upgrade
          // replaces it, and leaving it live means double-billing.
          const { data: existingOrg } = await supabase
            .from("organizations")
            .select("stripe_subscription_id")
            .eq("id", metadata.org_id)
            .single();
          const previousSubscriptionId = existingOrg?.stripe_subscription_id;

          const { error: updateError } = await supabase
            .from("organizations")
            .update({
              plan_status: "active",
              stripe_subscription_id: newSubscriptionId,
              text_limit: textLimit,
              // First Blast is mode:"payment" and doesn't always create a
              // Stripe customer, so orgs can reach their first upgrade with a
              // null customer id — and invoice.paid / payment_failed key off
              // it. The subscription checkout always has one; capture it.
              ...(session.customer
                ? { stripe_customer_id: session.customer as string }
                : {}),
            })
            .eq("id", metadata.org_id);

          if (updateError) {
            console.error("Failed to update organization:", updateError);
            return jsonResponse({ error: "Failed to update organization" }, 500);
          }

          // Cancel the replaced subscription. Safe ordering: the org already
          // points at the new id, so the resulting customer.subscription.deleted
          // event (matched by subscription id) won't touch this org. Failure is
          // logged, not fatal — the upgrade itself succeeded; a stray old sub
          // is a Stripe-dashboard cleanup, not a broken customer.
          if (previousSubscriptionId && previousSubscriptionId !== newSubscriptionId) {
            // Proration: the upgrade charged a full first invoice while the
            // old plan's paid period still had time on it. Compute the unused
            // fraction BEFORE cancelling and grant it as a customer-balance
            // credit — it auto-applies to the next invoice. Best-effort:
            // failure logs loudly but never blocks the upgrade.
            // (Field access is defensive: pinned API 2024-06-20 carries
            // current_period_* on the subscription; newer API shapes moved
            // them to the item.)
            let prorationCredit = 0;
            try {
              const prevSub = (await stripe.subscriptions.retrieve(
                previousSubscriptionId
              )) as unknown as {
                status: string;
                current_period_start?: number;
                current_period_end?: number;
                items: { data: Array<{ price?: { unit_amount?: number | null }; current_period_start?: number; current_period_end?: number }> };
              };
              const item = prevSub.items?.data?.[0];
              const unit = item?.price?.unit_amount ?? 0;
              const start = prevSub.current_period_start ?? item?.current_period_start ?? 0;
              const end = prevSub.current_period_end ?? item?.current_period_end ?? 0;
              const nowS = Math.floor(Date.now() / 1000);
              if (prevSub.status === "active" && unit > 0 && end > nowS && end > start) {
                prorationCredit = Math.min(
                  unit,
                  Math.floor((unit * (end - nowS)) / (end - start))
                );
              }
            } catch (prorationErr) {
              console.error("Proration lookup failed (no credit granted):", prorationErr);
            }

            // Three attempts — a single failed cancel is PERMANENT double
            // billing (the org already points at the new sub, so no retry
            // path ever revisits this). "already canceled" from Stripe is
            // success, not failure.
            let cancelled = false;
            for (let attempt = 0; attempt < 3 && !cancelled; attempt++) {
              try {
                await stripe.subscriptions.cancel(previousSubscriptionId);
                cancelled = true;
              } catch (cancelErr) {
                const msg = cancelErr instanceof Error ? cancelErr.message : "";
                if (/canceled/i.test(msg)) {
                  cancelled = true;
                  break;
                }
                console.error(
                  `Cancel attempt ${attempt + 1} for replaced subscription ${previousSubscriptionId} failed:`,
                  cancelErr
                );
                await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
              }
            }
            if (cancelled) {
              console.log(
                `Cancelled replaced subscription ${previousSubscriptionId} for org ${metadata.org_id}`
              );
              if (prorationCredit > 0 && session.customer) {
                try {
                  await stripe.customers.createBalanceTransaction(
                    session.customer as string,
                    {
                      amount: -prorationCredit,
                      currency: "usd",
                      description: "Credit for unused time on your previous plan",
                    }
                  );
                  console.log(
                    `Granted $${(prorationCredit / 100).toFixed(2)} unused-time credit to org ${metadata.org_id}`
                  );
                } catch (creditErr) {
                  console.error(
                    `BILLING NOTE: org ${metadata.org_id} upgrade succeeded but the $${(prorationCredit / 100).toFixed(2)} proration credit failed — grant manually:`,
                    creditErr
                  );
                }
              }
            } else {
              console.error(
                `BILLING ALERT: org ${metadata.org_id} is DOUBLE-SUBSCRIBED — cancel ${previousSubscriptionId} manually in the Stripe dashboard`
              );
            }
          }

          // This org just became (or stayed) a paying subscriber — if someone
          // referred them, the referrer's $5/referral discount kicks in now.
          await recalcDiscountForReferrerOf(supabase, stripe, metadata.org_id);

          // And if this org is itself a REFERRER, its credit was attached to
          // the subscription we just replaced — reapply it to the new one, or
          // a plan change would silently eat their referral discount.
          await recalcReferrerDiscount(supabase, stripe, metadata.org_id);
        }

        break;
      }

      // ── Invoice paid – mark active ──
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Only promote past_due→active (or refresh active). A stale retried
        // invoice.paid arriving AFTER a cancellation must not resurrect a
        // cancelled org — that would re-arm referral credit for a dead
        // customer with nothing to ever turn it off again.
        const { error } = await supabase
          .from("organizations")
          .update({ plan_status: "active" })
          .eq("stripe_customer_id", customerId)
          .in("plan_status", ["active", "past_due"]);

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

        // Resolve the org BEFORE the update so the referrer recalc knows who
        // cancelled — a cancelled referral's $5 comes off the referrer's bill.
        const { data: cancelledOrg } = await supabase
          .from("organizations")
          .select("id")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle();

        const { error } = await supabase
          .from("organizations")
          .update({ plan_status: "cancelled", text_limit: 0 })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) {
          console.error("Failed to update org on subscription.deleted:", error);
        }

        if (cancelledOrg) {
          await recalcDiscountForReferrerOf(supabase, stripe, cancelledOrg.id);
        }
        break;
      }

      // ── Dispute opened – hostile signal, shut the org down ──
      // A chargeback means the cardholder told their bank the charge is
      // fraudulent. Deactivate (login + sending blocked, history kept),
      // cancel their subscription, and drop them from any referrer's credit.
      // Reactivation is one click on /admin/companies if it's a mistake.
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        try {
          const charge = await stripe.charges.retrieve(dispute.charge as string);
          const customerId = charge.customer as string | null;
          if (!customerId) break;

          const { data: org } = await supabase
            .from("organizations")
            .select("id, name, stripe_subscription_id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          if (!org) break;

          await supabase
            .from("organizations")
            .update({ active: false })
            .eq("id", org.id);

          if (org.stripe_subscription_id) {
            try {
              await stripe.subscriptions.cancel(org.stripe_subscription_id);
            } catch (cancelErr) {
              console.error(
                `Dispute shutdown: cancelling sub for ${org.name} failed:`,
                cancelErr
              );
            }
          }
          await recalcDiscountForReferrerOf(supabase, stripe, org.id);
          console.error(
            `BILLING ALERT: dispute ${dispute.id} — org "${org.name}" deactivated and subscription cancelled. Review in Stripe.`
          );
        } catch (err) {
          console.error("charge.dispute.created handling failed:", err);
        }
        break;
      }

      // ── Refund issued – surface it, don't auto-punish ──
      // Refunds are often goodwill (James refunding a customer he wants to
      // keep) — auto-killing the account would be wrong. Log loudly with the
      // org name; deactivation is one click on /admin/companies if deserved.
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const customerId = charge.customer as string | null;
        if (customerId) {
          const { data: org } = await supabase
            .from("organizations")
            .select("name, plan_status")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          console.log(
            `BILLING NOTE: refund of $${(charge.amount_refunded / 100).toFixed(2)} to "${org?.name ?? customerId}" (plan_status: ${org?.plan_status ?? "?"}) — account left untouched; deactivate via /admin/companies if warranted.`
          );
        }
        break;
      }

      default:
        // MUST be 200: Stripe treats non-2xx as delivery failure and retries
        // for days; sustained failures get the whole endpoint disabled —
        // after which customers pay at checkout but no org is ever created.
        // Unhandled event types are acknowledged, not errors.
        console.log(`Unhandled event type: ${event.type} — acked`);
        return jsonResponse({ received: true, unhandled: event.type }, 200);
    }

    return jsonResponse({ received: true }, 200);
  } catch (err: unknown) {
    console.error("stripe-webhook error:", err);
    return jsonResponse({ error: "Webhook handler failed" }, 500);
  }
};
