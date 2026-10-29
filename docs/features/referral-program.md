# Referral program

**Rule (James, 2026-10-26):** every successful referral is **$5 off, once. No cap.** Ten
referrals in a month is $50 off that month, and nothing after. This replaced the 2026-07-30
rule (a recurring $5/mo coupon per active referral, "free at 10"), which is gone from the code.

## The flow

1. Every org has a `referral_code` (lazily generated on the first open of the card, e.g.
   `TONYTO-K7F3`). The invite link is `https://app.notifygrid.com/signup?ref=CODE`.
2. The link lands on `/signup` with the offer flipped to **Pro ($49/mo)** and the code filled in.
   `stripe-checkout` resolves the code to the referrer before creating the session; a bad code
   fails there ("That referral code isn't valid"). The referrer id rides in session metadata.
3. Provisioning stores `referred_by_org_id` on the new org. A referred Pro signup is a successful
   referral the moment it is provisioned.
4. `utils/referrals.ts` → `grantReferralCredit(referredOrgId)`: claims
   `organizations.referral_credited_at` with a conditional update (exactly once, race-safe),
   then adds a **$5 Stripe customer balance credit** to the referrer
   (`customers.createBalanceTransaction`, idempotency key `referral-credit-<referredOrgId>`).
   Stripe applies the balance to the referrer's next invoice and carries any remainder forward.
   If the Stripe call fails the claim is released and a `BILLING NOTE` is logged.
5. No clawback. A referral that cancels, disputes, or is deactivated keeps the $5 it earned.
   The webhook's cancel/dispute branches and `admin-org-set-active` no longer touch referrals.

**First Blast referrers** earn too: the $5 checkout runs with `customer_creation: "always"`, so
they have a Stripe customer and the credit waits on its balance for their first monthly invoice.
If a referrer somehow has no Stripe customer (comped accounts), the credit stays unclaimed and
`grantPendingReferralCredits` settles it the next time that referrer completes a checkout.

## Surfaces

- **Web** `src/components/ReferralCard.tsx` on Engage: star, pill ("3 referrals credited · $15
  off", or "$15 credit waiting for your first monthly bill" on First Blast), code + copy link,
  ladder (1 → $5, 3 → $15, 5 → $25, 10 → $50 off), referral list with Credited / Signed up / Ended.
- **iOS** `Features/Send/ReferralCard.swift`: compact card on Engage opening `ReferralSheet`;
  the sheet also opens by itself once per shop (`ReferralWalkthrough`, UserDefaults-gated,
  never on top of What's New) because people do not read a card. Share goes through the system
  share sheet. Bilingual through `NGStrings`.
- **Admin** `/admin/companies`: "N ref → $N credited" per referrer.
- **API** `referrals-stats`: `code`, `locale`, `referrals[] {name, status, since}`,
  `credited_count`, `credit_cents` (+ `earning_count` / `monthly_credit_cents` kept as aliases
  for older clients, same numbers).

## Switching over (one-time, by hand)

1. Apply `supabase/migrations/024_referral_one_time_credit.sql` in the Supabase SQL editor
   (adds `referral_credited_at`). The functions fail soft without it, but nothing gets credited.
2. In Stripe, remove the old "Referral credit — N active referrals" coupons from any referrer's
   subscription. The new engine does not manage coupons.
3. Decide whether referrals that were already "earning" under the old rule get a one-time $5 now:
   set their `referral_credited_at` by hand if not, or leave NULL and let the next checkout by
   their referrer sweep them (`grantPendingReferralCredits`).

## Not verified

Whether anyone has used a referral link in production: a read of
`count(referral_code is not null)` / `count(referred_by_org_id is not null)` on `organizations`
answers it.
