import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Referral credit engine.
 *
 * Rule (James, 2026-10-26, replacing the 2026-07-30 recurring coupon): every
 * successful referral is worth **$5 off, once**. No cap. Ten referrals in a
 * month is $50 off that month, and nothing after. "Successful" means the
 * referred shop is an active paying subscriber (referral links always land
 * on Pro).
 *
 * Implementation: a one-time Stripe customer balance credit on the referrer
 * (`customers.createBalanceTransaction`, negative amount). Stripe applies the
 * balance to the next invoice automatically and carries any remainder
 * forward, which is exactly "no cap". A First Blast referrer has a Stripe
 * customer too (checkout runs with `customer_creation: "always"`), so their
 * credit waits on the balance and lands on their first monthly invoice.
 *
 * Exactly once per referred org: `organizations.referral_credited_at` is the
 * claim, taken with a conditional update so two webhooks racing cannot both
 * grant, and the Stripe call carries an idempotency key keyed on the referred
 * org for the same reason on Stripe's side.
 *
 * There is no clawback. A referral that later cancels keeps the $5 it earned
 * the referrer; that is the point of "only for the month".
 */

export const REFERRAL_CREDIT_CENTS = 500;

type ReferredOrg = {
  id: string;
  name: string;
  active: boolean;
  plan_status: string | null;
  referred_by_org_id: string | null;
  referral_credited_at: string | null;
};

/** The referred shop counts once it is a paying subscriber in good standing. */
export function isSuccessfulReferral(org: Pick<ReferredOrg, "active" | "plan_status">): boolean {
  return org.active && ["active", "past_due"].includes(org.plan_status ?? "");
}

/**
 * Grants the referrer their $5 for `referredOrgId`, if it has not been
 * granted yet and the referral is successful. Never throws — a failed credit
 * must not break the webhook or provisioning that triggered it; failures are
 * logged with "BILLING NOTE" so they can be settled by hand.
 */
export async function grantReferralCredit(
  supabase: SupabaseClient,
  stripe: Stripe,
  referredOrgId: string
): Promise<void> {
  try {
    const { data: referred, error } = await supabase
      .from("organizations")
      .select("id, name, active, plan_status, referred_by_org_id, referral_credited_at")
      .eq("id", referredOrgId)
      .maybeSingle<ReferredOrg>();

    if (error) {
      console.error(`referrals: lookup failed for ${referredOrgId}:`, error);
      return;
    }
    if (!referred?.referred_by_org_id || referred.referral_credited_at) return;
    if (!isSuccessfulReferral(referred)) return;

    const { data: referrer } = await supabase
      .from("organizations")
      .select("id, name, stripe_customer_id")
      .eq("id", referred.referred_by_org_id)
      .maybeSingle<{ id: string; name: string; stripe_customer_id: string | null }>();

    if (!referrer) return;
    if (!referrer.stripe_customer_id) {
      // Comped / manually billed referrer with no Stripe customer. Left
      // uncredited on purpose so `grantPendingReferralCredits` can settle it
      // the day they do get one; the admin companies page shows the count.
      console.log(
        `referrals: ${referrer.name} earned $5 for ${referred.name} but has no Stripe customer — left pending`
      );
      return;
    }

    // Claim first. Zero rows means another path already granted it.
    const { data: claimed } = await supabase
      .from("organizations")
      .update({ referral_credited_at: new Date().toISOString() })
      .eq("id", referred.id)
      .is("referral_credited_at", null)
      .select("id")
      .maybeSingle();
    if (!claimed) return;

    try {
      await stripe.customers.createBalanceTransaction(
        referrer.stripe_customer_id,
        {
          amount: -REFERRAL_CREDIT_CENTS,
          currency: "usd",
          description: `Referral credit: ${referred.name}`,
        },
        { idempotencyKey: `referral-credit-${referred.id}` }
      );
      console.log(
        `referrals: $${(REFERRAL_CREDIT_CENTS / 100).toFixed(2)} credited to ${referrer.name} for ${referred.name}`
      );
    } catch (stripeErr) {
      // Release the claim so a retry can grant; say so loudly.
      await supabase
        .from("organizations")
        .update({ referral_credited_at: null })
        .eq("id", referred.id);
      console.error(
        `BILLING NOTE: referral credit for ${referrer.name} (referred ${referred.name}) failed — grant $5 manually on customer ${referrer.stripe_customer_id}:`,
        stripeErr
      );
    }
  } catch (err) {
    console.error(`referrals: grant failed for referred org ${referredOrgId}:`, err);
  }
}

/**
 * Settles every credit this referrer is owed but has not received: referrals
 * that became successful while the referrer had no Stripe customer. Called
 * when the referrer completes a checkout. A no-op for everyone else.
 */
export async function grantPendingReferralCredits(
  supabase: SupabaseClient,
  stripe: Stripe,
  referrerOrgId: string
): Promise<void> {
  try {
    const { data: pending } = await supabase
      .from("organizations")
      .select("id")
      .eq("referred_by_org_id", referrerOrgId)
      .is("referral_credited_at", null)
      .eq("active", true)
      .in("plan_status", ["active", "past_due"]);

    for (const org of pending ?? []) {
      await grantReferralCredit(supabase, stripe, org.id);
    }
  } catch (err) {
    console.error(`referrals: pending sweep failed for referrer ${referrerOrgId}:`, err);
  }
}
