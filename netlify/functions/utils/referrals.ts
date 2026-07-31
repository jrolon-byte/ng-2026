import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Referral discount engine.
 *
 * Rule (James, 2026-07-30): every ACTIVE paying referral earns the referrer
 * $5/mo off for as long as that referral stays subscribed; a cancelled or
 * deactivated referral's $5 disappears. Stacks without limit — Stripe floors
 * the invoice at $0, which is exactly the "5-10 referrals = free" incentive.
 *
 * Implementation: one dynamic coupon per referrer, amount_off = 500 × count,
 * swapped onto their subscription on every qualifying event (referral
 * upgraded / cancelled / admin-deactivated). A coupon (not customer-balance
 * credits) because it self-applies to every future invoice and reads as
 * "Referral credit" on the bill.
 *
 * Qualifying referral: referred_by_org_id = referrer, active = true,
 * plan_status IN ('active','past_due') — past_due still counts (Stripe
 * dunning usually recovers); only a real cancel or deactivation drops it.
 */

export const REFERRAL_CREDIT_CENTS = 500;

/**
 * Returns the qualifying-referral count, or null on query failure. Callers
 * MUST abort on null: treating a transient DB error as zero would strip a
 * legitimate discount (`discounts: []`) that nothing re-applies until the
 * next qualifying event — potentially months of full-price invoices.
 */
export async function countActiveReferrals(
  supabase: SupabaseClient,
  referrerOrgId: string
): Promise<number | null> {
  const { count, error } = await supabase
    .from("organizations")
    .select("id", { count: "exact", head: true })
    .eq("referred_by_org_id", referrerOrgId)
    .eq("active", true)
    .in("plan_status", ["active", "past_due"]);

  if (error) {
    console.error(`referrals: count query failed for ${referrerOrgId}:`, error);
    return null;
  }
  return count ?? 0;
}

/**
 * Recalculate and apply the referrer's discount. Never throws — a failed
 * discount sync must not break the webhook/admin action that triggered it;
 * failures are logged and self-heal on the next qualifying event.
 */
export async function recalcReferrerDiscount(
  supabase: SupabaseClient,
  stripe: Stripe,
  referrerOrgId: string
): Promise<void> {
  try {
    const { data: referrer } = await supabase
      .from("organizations")
      .select("id, name, stripe_subscription_id")
      .eq("id", referrerOrgId)
      .single();

    if (!referrer) return;

    const count = await countActiveReferrals(supabase, referrerOrgId);
    if (count === null) {
      console.error(
        `referrals: aborting recalc for ${referrer.name} — count unavailable, discount left untouched`
      );
      return;
    }

    // Comped / manually billed referrers have no Stripe subscription to
    // discount — the admin companies page shows their referral count so
    // James can settle it however their arrangement works.
    if (!referrer.stripe_subscription_id) {
      console.log(
        `referrals: ${referrer.name} has ${count} active referral(s) but no Stripe subscription — nothing to apply`
      );
      return;
    }

    // Capture the coupon currently on the subscription so it can be deleted
    // after the swap — every recalc used to orphan a forever-coupon in
    // Stripe. Only coupons WE created ("Referral credit …") are ever
    // deleted; a manually-applied dashboard coupon is left alone.
    const previousCouponIds: string[] = [];
    try {
      const sub = (await stripe.subscriptions.retrieve(referrer.stripe_subscription_id, {
        expand: ["discounts"],
      })) as unknown as {
        discounts?: Array<string | { coupon?: string | { id: string; name?: string | null } }>;
      };
      for (const d of sub.discounts ?? []) {
        if (typeof d === "object" && d.coupon) {
          if (typeof d.coupon === "object" && d.coupon.name?.startsWith("Referral credit")) {
            previousCouponIds.push(d.coupon.id);
          }
        }
      }
    } catch {
      // Cleanup is best-effort — never block the recalc on it.
    }

    const cleanupPrevious = async (keepId?: string) => {
      for (const id of previousCouponIds) {
        if (id === keepId) continue;
        try {
          await stripe.coupons.del(id);
        } catch {
          // Already deleted / in use elsewhere — fine.
        }
      }
    };

    if (count === 0) {
      await stripe.subscriptions.update(referrer.stripe_subscription_id, {
        discounts: [],
      });
      await cleanupPrevious();
      console.log(`referrals: cleared discount for ${referrer.name} (0 active referrals)`);
      return;
    }

    const amount = REFERRAL_CREDIT_CENTS * count;
    const coupon = await stripe.coupons.create({
      amount_off: amount,
      currency: "usd",
      duration: "forever",
      name: `Referral credit — ${count} active referral${count === 1 ? "" : "s"}`,
    });

    await stripe.subscriptions.update(referrer.stripe_subscription_id, {
      discounts: [{ coupon: coupon.id }],
    });
    await cleanupPrevious(coupon.id);

    console.log(
      `referrals: applied $${(amount / 100).toFixed(2)}/mo to ${referrer.name} (${count} active referral(s))`
    );
  } catch (err) {
    console.error(`referrals: discount recalc failed for org ${referrerOrgId}:`, err);
  }
}

/**
 * Given any org, recalc its REFERRER's discount (no-op when the org wasn't
 * referred). Call after anything that changes the org's qualifying status.
 */
export async function recalcDiscountForReferrerOf(
  supabase: SupabaseClient,
  stripe: Stripe,
  orgId: string
): Promise<void> {
  try {
    const { data: org } = await supabase
      .from("organizations")
      .select("referred_by_org_id")
      .eq("id", orgId)
      .single();

    if (org?.referred_by_org_id) {
      await recalcReferrerDiscount(supabase, stripe, org.referred_by_org_id);
    }
  } catch (err) {
    console.error(`referrals: referrer lookup failed for org ${orgId}:`, err);
  }
}
