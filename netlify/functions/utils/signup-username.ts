/**
 * Username derivation for pay-first signups.
 *
 * The customer never types a username any more — Stripe Checkout collects
 * their business name, and we derive a login handle from it
 * ("Tony Touch Barbershop" → "tonytouchbarbershop"). They can also sign in
 * with the email Stripe collected, so the derived handle is a convenience,
 * not a hurdle. Collisions get a numeric suffix.
 *
 * Pure module on purpose: no imports, so `node --test` can load it without
 * a bundler, and so the rules here are testable in isolation.
 */

/** Same shape rule the rest of the app enforces (admin-org-create, checkout). */
export const USERNAME_RE = /^[a-z0-9](?:[a-z0-9._-]{1,30})$/;

const MIN_LEN = 3;
const MAX_BASE_LEN = 24; // leaves room for a numeric suffix under the 31 cap
const FALLBACK_BASE = "shop";

/**
 * Collapse a business name to a lowercase alphanumeric handle.
 * Diacritics are folded ("Café Olé" → "cafeole"), everything that is not
 * [a-z0-9] is dropped, and names that end up too short fall back to "shop".
 */
export function usernameBase(businessName: string): string {
  const folded = (businessName ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // combining marks left by NFKD
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, MAX_BASE_LEN);

  return folded.length >= MIN_LEN ? folded : FALLBACK_BASE;
}

/**
 * Lazily yields candidates in preference order: the base, then base2,
 * base3 … The caller stops at the first one that is free. Bounded so a
 * pathological collision storm cannot loop forever; after the bound the
 * caller should give up and surface an error rather than invent randomness.
 */
export function* usernameCandidates(
  businessName: string,
  maxSuffix = 200
): Generator<string, void, void> {
  const base = usernameBase(businessName);
  yield base;
  for (let n = 2; n <= maxSuffix; n++) {
    yield `${base}${n}`;
  }
}

/** Split a Stripe cardholder name into the users.first_name / last_name pair. */
export function splitFullName(
  fullName: string | null | undefined,
  fallbackFirst: string
): { first_name: string; last_name: string } {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { first_name: fallbackFirst, last_name: "" };
  }
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}
