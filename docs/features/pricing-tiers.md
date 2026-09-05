# Pricing Tiers

The NotifyGrid app has four billable surfaces: one first-time trial plus three monthly subscriptions. Contacts are always unlimited; the metered resource is SMS sends per month.

## Tiers

| Plan | Price | Billing | `text_limit` | plan_status |
|---|---|---|---|---|
| First Blast | $5 | one-time payment (no subscription) | 100 | `first_blast` |
| Starter | $29/mo | recurring subscription | 600 | `active` |
| Pro | $49/mo | recurring subscription | 1,500 | `active` |
| Enterprise | $149/mo | recurring subscription | 4,000 | `active` |

All prices are defined **inline** in `stripe-checkout.ts` — no pre-created Stripe Price IDs required. Changing a price is a code edit + deploy, not a Stripe dashboard step.

## Where the numbers live

- **Plan → price/name map** — `netlify/functions/stripe-checkout.ts`, `PLAN_CATALOG` record. Each entry has `name` (shown on Stripe invoice) and `unit_amount` (cents). Subscriptions are created with inline `price_data`, not pre-created Price IDs — changing a price is a code edit.
- **Plan validation** — same file. Accepts `starter | pro | enterprise` only. Any other value returns 400.
- **Signup `text_limit: 100`** — `netlify/functions/utils/provision-signup.ts` (`FIRST_BLAST_TEXT_LIMIT`; Pro-referred signups use `PRO_TEXT_LIMIT`). Moved out of `stripe-webhook.ts` on 2026-09-02 when provisioning became shared with the success page — see `docs/features/pay-first-signup.md`. Changed from `500` on 2026-04-18.
- **Plan → text_limit map** — `netlify/functions/stripe-webhook.ts` in the "Upgrade flow" branch. Record: `{ starter: 600, pro: 1500, enterprise: 4000 }`. Unknown plan falls back to 600.
- **In-app upgrade UI** — `src/components/UpgradePrompt.tsx` renders three buttons (Starter/Pro/Enterprise) shown to `first_blast` orgs who hit their 100-text limit.
- **Contact cap** — none. No schema column, no validation path, no UI surface. Every plan is unlimited contacts. Do not add a cap without a deliberate product decision.

### Changing a price

Prices live in **two** places that must stay in sync:

1. `netlify/functions/stripe-checkout.ts` — `PLAN_CATALOG[plan].unit_amount` (in cents)
2. `notifygrid-landing-2026/index.html` — the `#pricing` section copy AND the `SoftwareApplication.offers[]` JSON-LD

Updating one without the other means the landing advertises a price different from what Stripe charges. Always grep both projects for the price before shipping a change.

## Why these numbers

Cost per SMS is `$0.011` total (Twilio $0.0079 + carrier $0.003) — see `netlify/functions/dashboard-stats.ts:5`. Dedicated phone numbers cost `$1.15/mo`.

| Plan | Revenue | SMS cost at cap | Phone | Gross margin |
|---|---|---|---|---|
| First Blast | $5 | $1.10 | $1.15 | $2.75 (55%) |
| Starter | $29 | $6.60 | $1.15 | $21.25 (73%) |
| Pro | $49 | $16.50 | $1.15 | $31.35 (64%) |
| Enterprise | $149 | $44.00 | $1.15 | $103.85 (70%) |

Enterprise is a flat $149 with no "contact sales" escape — decision in chat 2026-04-18. Multi-location operators whose usage exceeds 4,000/mo would need per-location orgs or a custom arrangement outside the checkout flow.

## Grace limit (a.k.a. "growth bonus")

`dashboard-stats.ts` returns `grace_limit = text_limit + (active_contacts × 2)`. This is a soft buffer on top of the plan — 2 extra texts per active customer.

**Surfacing decision reversed 2026-04-24.** The prior intent was to keep the grace invisible. The current intent is to **surface it as a visible gift** — a "growth bonus" the user sees, framed as "2 extra per customer, on us." Rationale: the value of letting a user exceed their plan is lost if they can't see it. Making it visible turns silent mercy into explicit care — and trains users (who were previously on effectively unlimited sending) to understand their real allowance.

The UI surface for this is the Engage paywall — see `engage-paywall.md`. Any copy change to how the grace is described should also update that component and the app's campaign-send error message.

## Existing data considerations

Orgs created before 2026-04-18 got `text_limit: 500` on signup (the old First Blast limit). The 2026-04-18 change only affects new signups. Do not retroactively drop existing `first_blast` orgs from 500 → 100 — they bought in at the old limit.

## Relationship to the landing page

The landing at `notifygrid-landing-2026/index.html` shows these same four tiers. Any price or limit change here requires a matching update there — the `SoftwareApplication.offers[]` JSON-LD and the `#pricing` section copy must match the values in this doc, or SEO/Google rich results will diverge from reality. See `notifygrid-landing-2026/docs/features/landing-2026.md`.

## Required before live Enterprise checkout

All wired in code as of 2026-04-18 using inline `price_data`:
- `stripe-checkout.ts` has the `$149/mo` Enterprise entry in `PLAN_CATALOG`
- `stripe-webhook.ts` sets `text_limit: 4000` for `enterprise`
- `UpgradePrompt.tsx` surfaces the Enterprise button

No Stripe dashboard step needed — the first Enterprise checkout will create its own Price object on the fly. Only env requirement is the base `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, which already support Starter and Pro.
