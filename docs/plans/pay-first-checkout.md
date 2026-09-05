# Plan: Frictionless Signup — Quick Wins + Pay-First Checkout

Status: **BUILT 2026-09-02** (James: "start everything"). Feature doc: `docs/features/pay-first-signup.md`. Not yet deployed — migration 023 must be hand-applied first.

Context: the first self-serve stranger paid $5 on 2026-08-24. The funnel that got them there is
landing → `/signup` (six fields incl. username + password) → Stripe Checkout → `/signup/success`
→ "Log in" → retype credentials → `/engage`. This plan removes the form in front of the money and
the second login after it, and adds the measurement we currently have none of.

Decisions already made by James (2026-09-02):
- Login accepts **email or username**. `auth-login.ts` already falls back to email; only labels and
  normalization change. Tony keeps typing `tony`.
- Signup collects **no username**. Stripe collects the email; we derive a username from the
  business name. Users may change it later (settings surface is a follow-up, not in this plan).

---

## Phase 1 — Quick wins (landing + app, no schema, ~half a day)

### 1.1 Analytics (both repos)
- GA4 `gtag.js` snippet in the `<head>` of `index.html`, `why-notifygrid.html`, `faqs.html`
  (landing) and `index.html` (app). Same root domain, so the `_ga` cookie on `.notifygrid.com`
  carries across to `app.notifygrid.com` with no linker config.
- Events, named per GA4's recommended-events vocabulary so the funnel report works out of the box:
  - landing: `select_promotion` on every `Try for $5` / `Start <plan>` click (`promotion_name`
    = tier, `location_id` = section anchor)
  - `/signup`: `begin_checkout` (`value` 5 or 49, `currency` USD)
  - `/signup/success`: `purchase` (`transaction_id` = Stripe session id, `value`, `currency`)
- **Needs from James:** GA4 property + Measurement ID (`G-…`). Then link Search Console to it
  and verify the domain in Bing Webmaster Tools (ChatGPT reads Bing's index).

### 1.2 Canonical + sitemap alignment (landing)
Netlify Pretty URLs is on, so `/faqs.html` 301s to `/faqs`, but every canonical tag and the
sitemap still say `.html`. Google sees a canonical that redirects. Fix:
- `sitemap.xml` → clean URLs (`/why-notifygrid`, `/faqs`, `/privacy`, `/terms`), fresh `lastmod`.
- `<link rel="canonical">` on the four subpages → clean URLs. OG `url` tags likewise.
- Internal nav links → clean URLs (avoids a 301 hop on every click).

### 1.3 Hero image (landing)
`images/tony-handshake.png` is 1.1 MB on the page we most want to rank. Convert with `cwebp -q 82`
(expected ~120–180 KB), wrap in `<picture>` with the PNG as fallback, add explicit `width`/`height`
to kill layout shift. It is already `loading="lazy"`; keep that.

### 1.4 Review schema (landing)
Remove `aggregateRating` (4.8 / 150) from the `SoftwareApplication` JSON-LD. It is not backed by
real reviews; Google's review-snippet policy and the FTC's 2024 fake-reviews rule both apply now
that strangers are converting. The three placeholder testimonials stay on the page pending
James's call, but they must not be in structured data. (Recommendation: replace them with the real
first-blast story as soon as one customer agrees to be quoted.)

### 1.5 Stripe Dashboard (James, 2 minutes)
Settings → Payment methods → confirm **Apple Pay**, **Google Pay**, and **Link** are on. Hosted
Checkout renders them automatically; no code or domain verification needed.

---

## Phase 2 — Pay-first checkout (app, one migration, ~2 days incl. tests)

### 2.1 The flow the customer sees
1. Landing CTA → `app.notifygrid.com/signup` (unchanged URL; `?ref=CODE` still works).
2. `/signup` is now **one screen, one button**: what you get ($5 · 100 texts · unlimited
   contacts · no auto-renew, or the Pro offer when referred) + "Continue to secure checkout".
   No fields. A small "Have a referral code?" link reveals an input for the rare manual case.
3. Stripe Checkout collects email, phone, cardholder name, and **Business name** (a Checkout
   custom field). On iPhone that is one Face ID tap via Apple Pay.
4. `/signup/success?session_id=…` provisions the account (if the webhook has not already),
   shows **one field: "Set your password"**, mints a JWT on submit, and lands them in
   `/engage?welcome=1`.
5. Simultaneously a **welcome text** goes to the phone they gave Stripe, with a one-time setup
   link (`/welcome?t=TOKEN`) that opens the same set-password screen. This is the recovery path
   if they close the tab, and it is the "we are an SMS company" moment.

### 2.2 Stripe session changes — `netlify/functions/stripe-checkout.ts`
`type: "signup"` body shrinks to `{ referralCode? }`. Session options added to both the $5
payment session and the referred Pro subscription session:
- `customer_creation: "always"` (payment mode only) — fixes the pre-existing "First Blast orgs
  reach their first upgrade with a null `stripe_customer_id`" gap noted in the webhook.
- `phone_number_collection: { enabled: true }`
- `custom_fields: [{ key: "business_name", label: { type: "custom", custom: "Business name" },
  type: "text", text: { minimum_length: 2, maximum_length: 60 } }]`
- `metadata: { signup: "1", referred_by_org_id?, signup_plan? }` — no PII in metadata any more
  (today the password hash and phone ride through it).
- Username pre-check at checkout is deleted (no username is asked). Referral validation stays.

### 2.3 Provisioning becomes one shared, idempotent unit — `utils/provision-signup.ts`
`provisionSignup(session: Stripe.Checkout.Session)` is called from **both** the webhook and the
new claim endpoint (2.4). Whichever runs first wins; the other is a no-op.
- Idempotency key: new column `organizations.stripe_checkout_session_id UNIQUE`. Insert org
  with it; on `23505` re-read the existing org+user and return them. This replaces the
  username-based idempotency check (there is no username in metadata any more).
- Inputs: `session.custom_fields[business_name].text.value`, `customer_details.email`,
  `customer_details.phone` (E.164 from Stripe), `customer_details.name` → first/last split.
- Username derivation: slug of business name with non-alphanumerics stripped
  (`tonytouchbarbershop`), lowercase, 3–31 chars; on collision append `2`, `3`, …. Pure
  function, unit-tested.
- User row: `password_hash = NULL`, `setup_token_hash = sha256(random 32 bytes)`,
  `setup_token_expires_at = now() + 7 days`. Raw token returned to the caller once.
- Legacy branch: sessions minted by the current code (metadata carries `username` +
  `password_hash`) keep provisioning exactly as today for the 24 h Checkout-session lifetime
  after deploy, then the branch is deleted.
- Side effects preserved: referral recalc for Pro signups, `alertAdmin` text, `pushToSuperAdmins`.
  Plus the new welcome SMS (2.6), sent only on first provision.

### 2.4 Two new functions
- `signup-claim.ts` — `POST { session_id }`. Retrieves the session from Stripe, requires
  `payment_status === "paid"` (or an active subscription for the referred Pro path), calls
  `provisionSignup`, and if the user still has no password returns `{ setup_token }` (a fresh
  one, overwriting the SMS token's hash — last issued wins; both screens are the same screen).
  If the password is already set, returns `{ already_set: true }`. The session id is the bearer
  here: it is an unguessable Stripe secret the customer just arrived with, and it stops
  granting anything the moment a password exists.
- `signup-set-password.ts` — `POST { token, password }`. Looks up `setup_token_hash`, checks
  expiry and `password_hash IS NULL`, bcrypts and stores, clears the token, and returns the
  **same shape as `auth-login`** (JWT + user + orgs) so `AuthContext` can adopt it unchanged.
  Password rule: 8+ chars (today there is no rule at all).

### 2.5 Login changes
- `auth-login.ts`: lowercase and trim the identifier before both lookups (email is stored
  lowercase; today the email fallback is case-sensitive). A user with `password_hash IS NULL`
  gets `409 { error: "Finish setting up your account — check your text for the setup link" }`,
  never a bcrypt compare against null.
- `Login.tsx`: label "Email or username", placeholder `you@shop.com or tonytouch`,
  `autoComplete="username"` stays (browsers treat it as the identifier field).
- iOS `NGStrings.swift`: `usernamePlaceholder` → "email or username" / "correo o usuario". No
  logic change; `textContentType: .username` is still correct.

### 2.6 Welcome SMS
From the **shared platform number** (`TWILIO_PHONE_NUMBER`, same choice `admin-set-bonus` makes
and for the same reason: this is NotifyGrid talking, not the shop). Body:
> Welcome to NotifyGrid, {Business}! Set your password and send your first blast:
> https://app.notifygrid.com/welcome?t=… (link expires in 7 days). Reply STOP to opt out.

Transactional to a customer who just purchased; TCPA-safe. Failure is logged, never fatal —
the success page is the primary path.

### 2.7 Frontend
- `Signup.tsx` rewritten to the one-button screen (2.1 step 2). `begin_checkout` event fires
  on click.
- `SignupSuccess.tsx` states: provisioning (polls `signup-claim` every 2 s for up to 20 s —
  covers the webhook/claim race and Stripe's redirect latency) → set-password form →
  already-set (link to `/login`) → error with the support phone. `purchase` event fires once.
- New route `/welcome` renders the same set-password component fed by `?t=`.
- `/engage?welcome=1` shows a one-time "Your 100 texts are ready — import your customers"
  banner. Small; reuses existing Engage empty-state styling.

### 2.8 Migration `023_pay_first_signup.sql` (hand-apply BEFORE deploy, house convention)
```sql
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN setup_token_hash text;
ALTER TABLE users ADD COLUMN setup_token_expires_at timestamptz;
ALTER TABLE organizations ADD COLUMN stripe_checkout_session_id text;
CREATE UNIQUE INDEX idx_orgs_checkout_session ON organizations (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
```
Deploy order: migration → app → (landing is unaffected; links do not change).

### 2.9 Tests (new — the repo has none today)
`npm test` → `node --test netlify/functions/**/*.test.ts` (Node 22.20 strips types natively).
- `provision-signup.test.ts`: username derivation (unicode, short names, collisions), custom
  field extraction, legacy-metadata branch, idempotent second call, missing email fallback to
  `{username}@notifygrid.app`.
- `signup-token.test.ts`: hash/verify, expiry, single-use.
- `auth-login` identifier normalization.
Manual e2e before reporting done: `netlify dev` + Stripe test mode + `stripe listen --forward-to`
for the webhook, on Safari (Apple Pay sheet visible) and on an iPhone.

---

## Out of scope / follow-ups (listed so they are not hidden)
- Username change in settings (web + iOS).
- "Resend setup text" button on the login 409 state.
- `/admin/companies` badge for orgs whose owner has not set a password.
- Astro migration + programmatic industry pages (Phase 3, separate plan).
- App Store smart banner on the landing (after the app is live).
- Placeholder testimonials → real quotes (James's call).

## Asks from James before build starts
1. GA4 Measurement ID.
2. Confirm Apple Pay / Google Pay / Link are on in the Stripe Dashboard.
3. Testimonials: keep the placeholders on-page for now, or pull them?
4. Go on Phase 1, Phase 2, or both.
