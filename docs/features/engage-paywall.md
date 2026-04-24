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

## First-blast users

Users with `plan_status === 'first_blast'` see `UpgradePrompt` instead of `PlanUsage`. That's their own journey — post-trial with a single $5 payment behind them — and the conversion narrative is different.

## What we explicitly did not ship

- **"Prorated first month" copy** — false under current Stripe flow. `stripe-checkout.ts` creates a new subscription rather than updating an existing one, so no proration happens. Footer copy says *"Change anytime. We'll always have your back."* until a real upgrade path (`subscription_items.update` with `proration_behavior`) ships.
- **Plus Jakarta Sans** — design bundle used it; we used **Geist** since it's already loaded (from the landing fonts) and the family is close enough. Revisit when the app-wide redesign lands.
- **Enterprise upgrade path** — no tier above Enterprise. Chip shows status, no CTA. Multi-location customers are handled outside checkout per `pricing-tiers.md`.
