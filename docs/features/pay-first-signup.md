# Pay-First Signup

Built 2026-09-02. Plan: `docs/plans/pay-first-checkout.md`.

## What the customer sees

1. Landing CTA → `app.notifygrid.com/signup` (`?ref=CODE` flips the offer to Pro).
2. `/signup` — one screen, one button. What you get + "Pay $5 and start". No fields.
   A "Have a referral code?" link reveals the code input for the rare manual case.
3. Stripe Checkout (hosted) collects email, phone, cardholder name and **Business name**
   (a Checkout custom field). Apple Pay / Google Pay / Link show automatically.
4. `/signup/success?session_id=…` — "Setting up your shop" for a few seconds, then
   **one field: choose a password**, then straight into `/engage?welcome=1`.
5. A welcome text from the shared platform number carries `/welcome?t=TOKEN`, the same
   set-password screen, for anyone who closed the tab.

Login accepts **email or username** (web + iOS). Legacy accounts keep their handle; pay-first
accounts get one derived from the business name and sign in with the email Stripe collected.

## Where the pieces live

| Concern | File |
|---|---|
| Checkout session (custom field, phone, `customer_creation`, no PII in metadata) | `netlify/functions/stripe-checkout.ts` (`type: "signup"`) |
| Read a session (pay-first vs legacy shape, paid check) — pure | `netlify/functions/utils/signup-session.ts` |
| Username derivation + name split — pure | `netlify/functions/utils/signup-username.ts` |
| One-time setup token (sha256 stored, 7-day TTL) — pure | `netlify/functions/utils/signup-token.ts` |
| **Provisioning (idempotent, shared by webhook + success page)** | `netlify/functions/utils/provision-signup.ts` |
| Webhook entry (`checkout.session.completed` → `provisionSignup`) | `netlify/functions/stripe-webhook.ts` |
| Success-page entry (verify paid via Stripe, provision, issue token) | `netlify/functions/signup-claim.ts` |
| Choose password → JWT (same shape as `auth-login`) | `netlify/functions/signup-set-password.ts` |
| Login: identifier normalised, NULL hash → 409 `setup_pending` | `netlify/functions/auth-login.ts` |
| Client calls | `src/services/signup.ts` |
| Pages | `src/pages/Signup.tsx`, `SignupSuccess.tsx`, `Welcome.tsx` |
| Shared post-payment UI | `src/components/SetPasswordCard.tsx`, `AuthShell.tsx` |
| Welcome banner in Engage (`?welcome=1`) | `src/pages/Engage.tsx` + `src/i18n/engage.ts` |
| GA4 events (`begin_checkout`, `purchase`) | `src/utils/analytics.ts`; tag loader in `index.html` |
| Schema | `supabase/migrations/023_pay_first_signup.sql` |
| Tests | `netlify/functions/utils/__tests__/*.test.ts` — `npm test` |

## Provisioning rules (the part that must not regress)

- **Idempotency key is `organizations.stripe_checkout_session_id`** (partial unique index).
  Webhook and `signup-claim` both call `provisionSignup`; the second caller hits the unique
  violation and re-reads. Never re-introduce a username-based check — there is no username in
  metadata any more.
- **Legacy sessions** (metadata carries `username` + `password_hash`) still provision via the
  `provisionLegacy` branch. Checkout sessions expire after 24 h; that branch can be deleted
  after 2026-09-04 (or whenever the last pre-deploy session is gone).
- **A paid customer never fails to provision.** Missing business name → cardholder name →
  "My Shop". Missing/duplicate email → `{username}@notifygrid.app`. Username collision →
  numeric suffix, bounded at 12 attempts; if that ever fails the org is rolled back and the
  function throws (webhook 500 → Stripe retries).
- **Side effects run once**, on the creating call only: referrer discount recalc (Pro),
  welcome text, `alertAdmin` text, super-admin push.
- **`customer_creation: "always"`** on the $5 session, so `stripe_customer_id` is set from
  day one (upgrade/dunning webhooks key off it).

## Token rules

- Raw token only ever exists in the `signup-claim` response and the welcome SMS.
  DB stores sha256. Unique partial index on the hash.
- `signup-claim` **rotates** the token on every call while the password is unset (last
  issued wins) so a refresh cannot lock the customer out of their own success page.
- `signup-set-password` is conditional on `password_hash IS NULL` → the losing tab of a race
  gets a clean 409, never a silent overwrite. Success clears the token.
- Expired (7 days) → 410 with a "text us" message. Resend endpoint is a follow-up.

## Login semantics

- `auth-login` lowercases + trims the identifier and uses it for the rate-limit key, the
  username lookup, the email fallback, and the attempt log.
- `password_hash IS NULL` → `409 { error, setup_pending: true }`. Not logged as a failed
  attempt. Web shows the message; iOS shows its single generic failure string (by design).

## Deploy order

1. Apply `023_pay_first_signup.sql` in the Supabase SQL editor.
2. Deploy `notifygrid-2026`. (Env: optional `APP_PUBLIC_URL` for the welcome-text link;
   defaults to `SITE_URL`/`URL` then `https://app.notifygrid.com`.)
3. Stripe Dashboard → Payment methods: Apple Pay, Google Pay, Link on (no code involved).
4. Set `NG_GA_ID` in `index.html` (app) and `js/ng-analytics.js` (landing) once the GA4
   property exists.

## Follow-ups (not built)

- Username change in settings (web + iOS).
- "Resend setup text" on the login 409 state.
- `/admin/companies` badge for owners with no password yet.
- Fold `Login.tsx` / `Signup.tsx` onto `AuthShell`.
- Delete `provisionLegacy` after the 24 h session window.
