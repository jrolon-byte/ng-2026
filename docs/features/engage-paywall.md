# Engage Paywall (V4)

The always-visible usage chip + bottom-sheet upgrade moment on the Engage page. Replaces the prior red "over-limit" bar.

Implements V4 from the Claude Design handoff (bundle id `wkRym6FO3StW01BLLiMt0Q`) — the "Paywall sheet (merged)" variant — adapted to the app's real data and voice.

## Files

- `src/components/PlanUsage.tsx` — chip + sheet component. Controlled `open` state.
- `src/pages/Engage.tsx` — renders `PlanUsage`, owns the `planSheetOpen` state so the locked Send button can open the sheet.
- `src/index.css` — `.plan-chip` / `.plan-sheet-*` / `.plan-impact-*` / `.plan-card*` blocks. Tokens are scoped inside those selectors; nothing leaks globally.

## States

Derived from `usage` in `PlanUsage.getChipState(sent, cap, grace)`:

| state | condition | chip style | auto-opens sheet |
|---|---|---|---|
| `soft` | `sent < cap` | blue info | no |
| `near` | `cap ≤ sent < grace` | amber (in bonus zone) | no |
| `over` | `sent ≥ grace` | red (full send) | **yes** (if upgrade path exists) |

Where `cap = usage.text_limit` and `grace = usage.grace_limit = cap + active_contacts × 2`.

## Chip

Always rendered (no "hide when low usage" gate) so the user builds a mental model of their reach from day 1 of the cycle. Copy is warm — "on us," "refreshes," "growth bonus" — never "limit reached" or "quota exceeded." The chip's "View options" button is hidden at `over` (sheet is forced) and for Enterprise users (no upgrade path).

## Sheet

- Bottom-anchored, 92vh max-height, slide-up 320ms cubic-bezier(0.22, 1, 0.36, 1).
- Rendered via `createPortal` to `document.body` so overflow/transform ancestors in the page can't clip it.
- Contains: emoji hero, display headline, subhead with bold numbers, impact card, plan cards (hero layout, Pro recommended for Starter users), sticky black CTA.
- Dismissible via backdrop tap or "Maybe later" button **except** at `over` state — there, dismiss is suppressed because sending is blocked and the only path forward is upgrade or wait for reset.

## Dynamic copy

Everything in the sheet and chip adapts to the user's real plan:

- **Current plan name** from `PLAN_NAME_BY_LIMIT` map on `text_limit` (100 → First Blast, 600 → Starter, 1500 → Pro, 4000 → Enterprise).
- **Upgrade options** from `getUpgradeOptions(currentLimit)` — Starter users see Pro + Enterprise, Pro users see Enterprise only, Enterprise users see nothing (sheet suppressed).
- **Multiplier** (`impact note`) is `primaryUpgrade.textLimit / cap` — e.g., Starter→Pro = 2.5×.
- **Times reachable** is `floor(primaryUpgrade.textLimit / contacts)` — the concrete "you could text everyone N times" number.
- **Contact count** uses `usage.total_contacts` (active contacts only, per `dashboard-stats.ts`).

## Wiring with the Send button

When a blast would exceed `grace_limit` (`isHardLocked` in `Engage.tsx`), the Send button does not submit the form — instead it calls `setPlanSheetOpen(true)` and shows `🔒 Upgrade to send to everyone`. This is the primary path by which near-state users (who never see an auto-opened sheet) encounter the paywall.

The server still enforces `grace_limit` in `campaign-send.ts` — the client-side sheet is UX, not security.

## Per-org one-time bonus ("gift the customer")

Three columns on `organizations` let us grant a time-limited gift of extra texts to a specific org, with a warm message shown in the UI until the expiry timestamp passes.

| Column | Type | Purpose |
|---|---|---|
| `bonus_extra_texts` | `INTEGER NOT NULL DEFAULT 0` | Texts added on top of `standardGrace = text_limit + (active_contacts × 2)` |
| `bonus_expires_at` | `TIMESTAMPTZ NULL` | When the bonus stops being applied. No cron — backend just checks `> now()` on every read. |
| `bonus_note` | `TEXT NULL` | Warm message shown above the usage chip while active. Copy lives in the DB so James can personalize without a code change. |

Migration: `supabase/migrations/012_bonus_fields.sql`.

**Grace math (both `dashboard-stats.ts` and `campaign-send.ts`):**

```
grace_limit =
    text_limit
  + (active_contacts × 2)                    // standard growth bonus
  + (bonus_active ? bonus_extra_texts : 0)   // per-org gift, time-limited
```

Where `bonus_active = bonus_extra_texts > 0 && bonus_expires_at > now()`.

**UI surfacing:**

- `dashboard-stats.ts` includes `bonus: { extra_texts, expires_at, note } | null` in the response. Null when inactive.
- `PlanUsage.tsx` renders `<BonusBanner>` above the usage chip whenever `usage.bonus` is non-null. Banner copy: `note` on top line, `+{extra_texts} texts · until {date}` below.
- Banner styling (`.plan-gift` in `index.css`) is warm amber/cream with a 🎁 — visually distinct from the chip's blue/amber/red status palette so it reads as "a gift" rather than a status indicator.

**Granting a bonus** (the "script"):

```sql
UPDATE organizations
SET bonus_extra_texts = 274,
    bonus_expires_at  = '2026-05-01 00:00:00+00',
    bonus_note        = 'A little extra this month, Tony — 274 more on us. Just because.'
WHERE id = '<org-uuid>';
```

No cleanup required. When `bonus_expires_at` passes, the grace math stops applying the bonus and the banner disappears on next refresh.

**What we explicitly did not build:**
- Admin UI for granting bonuses. One SQL update is fine until there are more than a handful of customers.
- Audit log of who granted what when.
- Bonus history across cycles.

## Locale (paywall-scoped i18n)

Paywall surface supports EN and Dominican-register ES today. Everything else in the app is still English.

**Schema:** `organizations.locale TEXT NOT NULL DEFAULT 'en'` (migration `013_org_locale.sql`). Currently supported values: `'en'`, `'es'`. Unknown values fall through to English.

**Data flow:** `dashboard-stats.ts` returns `locale` on the stats response. `PlanUsage.tsx` reads `usage.locale` at the top of the component, resolves a `PaywallCopy` object via `getCopy(locale)` from `src/i18n/paywall.ts`, then every chip/banner/sheet string is a function call into that dictionary. No React context, no hook, no runtime dependency — just a pure lookup.

**Adding a locale:** add a new object in `src/i18n/paywall.ts` with the same `PaywallCopy` shape, extend `getCopy()`. Zero schema change.

**Emphasis markers:** strings in the dictionary use `**text**` to mark bold segments. `PlanUsage.tsx` has a tiny `boldify()` helper that splits on those markers and wraps in `<strong>`. This lets the dictionary express emphasis declaratively without templating JSX into the strings file.

**Dates:** `formatResetDate(iso, locale, 'short'|'long')` in `paywall.ts` routes to `Intl.DateTimeFormat` with `en-US` or `es-DO`. Keeps date formatting consistent with locale.

**What's NOT translated yet:**
- Engage page chrome outside the paywall (Send Mass Text button, Add Customer, character counter, Message Preview, etc.)
- Dashboard, Campaigns, Signup, Login
- Admin gift manager
- Alert() fallbacks (error.message surfaces the server's English)
- Server-side error messages (`campaign-send.ts` returns English)
- The landing page — stays English per the separate marketing strategy

If/when the full app goes bilingual, the same `getCopy`/dictionary pattern extends cleanly; just add more top-level keys alongside `bonus`, `chip`, `sheet`.

## First-blast users

Users with `plan_status === 'first_blast'` see `UpgradePrompt` instead of `PlanUsage`. That's their own journey — post-trial with a single $5 payment behind them — and the conversion narrative is different.

## What we explicitly did not ship

- **"Prorated first month" copy** — false under current Stripe flow. `stripe-checkout.ts` creates a new subscription rather than updating an existing one, so no proration happens. Footer copy says *"Change anytime. We'll always have your back."* until a real upgrade path (`subscription_items.update` with `proration_behavior`) ships.
- **Plus Jakarta Sans** — design bundle used it; we used **Geist** since it's already loaded (from the landing fonts) and the family is close enough. Revisit when the app-wide redesign lands.
- **Enterprise upgrade path** — no tier above Enterprise. Chip shows status, no CTA. Multi-location customers are handled outside checkout per `pricing-tiers.md`.
