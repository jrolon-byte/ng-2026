# App shell and Engage redesign (2026-10)

Branch `redesign/app-shell`. Matches the product frame on notifygrid.com and the
calm, one-accent system of the marketing site (`notifygrid-landing-2026/css/site.css`).

## What changed

- **Shell** (`src/components/Shell.tsx`) replaces `TopNav`, `BottomNav` and `Navbar`.
  Desktop: left sidebar with the plane mark (links to /engage, never to the marketing site), shop name, Dashboard / Engage / Campaigns
  (+ Companies and the org switcher for super-admins), the signed-in first name and
  Sign out. Phones (≤ 860px): compact top bar plus bottom tabs. `Layout.tsx` is a thin
  wrapper kept for the pages that import it. Engage now renders inside `Layout` too.
- **Tokens** in `src/index.css` `:root`: warm page surface `--ng-paper` (#FBFAF6),
  white cards `--ng-white`, soft tiles `--ng-paper-2`, ink at 60/45 percent, one accent
  (`--ng-brand-deep` on primary buttons and links only), `--ng-ok/warn/danger`,
  radii 12/18. The paywall's `--plan-*` tokens now point at these.
- **Engage** (`src/pages/Engage.tsx`): same handlers and audience math, new layout.
  "New message" head with the day and time; plan chip; composer card with a **To**
  line that shows three real first names, the count, new replies, opted out and
  unreachable; the message; the preview as the phone will show it (header + body +
  footer); three tiles; Schedule (disabled, web scheduling is not shipped) and
  **Send to N**. Customers below as a table with search, reply and opt-out badges,
  member-since, remove. Dead numbers stay in their collapsible section. The contact
  detail modal is unchanged.
- **Dashboard** and **Campaigns**: plain tiles and a list, no colored icon chips.
- **Auth pages**: markup untouched; an override block at the end of `index.css`
  removes the glow, the eyebrow pill and the mono ticker, and sets weight 600.
  `Login.tsx` copy simplified ("Welcome back." / "Sign in to send your next message.").
- **i18n** (`src/i18n/engage.ts`): new keys for the composer in English and Spanish.

## Counting rule (do not drift)

The plan allowance deducts **one per contact per send**, whatever the carrier does
(`campaign-send`, `dashboard-stats`). The composer therefore:

- shows **Segments per text** as carrier information (GSM-7 160 chars, otherwise 70),
  with a hint when it is above 1;
- computes the cost line ("N texts from your plan") and the "Left this month" warning
  from `sendable.length`, never from segments.

If the quota ever moves to segments (planned for enterprise), change both in one commit.

## Running locally against the real API

`npx netlify dev` (not `npm run dev`): it starts Vite on 5173, loads the functions with
`.env`, and serves everything on http://localhost:8888. Plain Vite has no functions, so
every API call 404s and the screens stay empty.

## Removed

`src/components/TopNav.tsx`, `BottomNav.tsx`, `Navbar.tsx`, and the stylesheet sections
for the old top bar, hamburger, mobile menu, grey customer cards and colored stat cards.
