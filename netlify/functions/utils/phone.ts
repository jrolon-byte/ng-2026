/**
 * Normalize a phone number to E.164, or say exactly why it can't be.
 *
 * Returns { e164 } on success, { error } with a human-readable reason on
 * failure — bulk import surfaces these reasons per entry, so "reject with a
 * reason" always beats "guess and mangle". Hardened for address-book data
 * (2026-07-30): no more 7-digit "+5551234" unsendables, no silently wrong
 * country codes on 11-digit non-NANP input, extensions stripped, vanity
 * letters rejected.
 *
 * Existing DB values are already clean E.164 — do NOT migrate them.
 */

export type PhoneResult = { e164: string } | { error: string };

export function normalizePhone(raw: string): PhoneResult {
  if (!raw || !raw.trim()) return { error: "Empty phone number" };

  // Strip a trailing extension (x123 / ext. 4 / extension 22 / #9) — the base
  // number is still textable; the extension isn't part of E.164.
  const withoutExt = raw.trim().replace(/\s*(?:x|ext\.?|extension|#)\s*\d{1,6}\s*$/i, "");

  // Vanity/alphanumeric numbers (1-800-FLOWERS): mapping letters to digits is
  // a guess about intent — reject with a clear reason instead.
  if (/[a-z]/i.test(withoutExt)) {
    return { error: "Contains letters — vanity numbers aren't supported" };
  }

  const hasExplicitCountry = withoutExt.startsWith("+");
  const digits = withoutExt.replace(/\D/g, "");

  if (digits.length === 0) return { error: "No digits found" };

  // An explicit + means the caller ALREADY gave the country code — honor it
  // before any NANP assumption. This branch must run first: "+64 9 123 4567"
  // totals 10 digits and would otherwise be rewritten into a valid-looking
  // US number belonging to a stranger.
  if (hasExplicitCountry) {
    if (digits.length < 8 || digits.length > 15) {
      return { error: "International number must be 8–15 digits after the +" };
    }
    return { e164: "+" + digits };
  }

  if (digits.length < 10) {
    return { error: `Only ${digits.length} digits — a full 10-digit number is required` };
  }

  // Exactly 10 digits, no + → assume US/CA. NANP area codes and exchanges
  // never start with 0 or 1; catching that beats storing an unsendable number.
  if (digits.length === 10) {
    if (digits[0] === "0" || digits[0] === "1") {
      return { error: "Not a valid US/CA number (area code can't start with 0 or 1)" };
    }
    return { e164: "+1" + digits };
  }

  // 11 digits with the NANP country code — the classic "1 (321) 204-1239".
  if (digits.length === 11 && digits[0] === "1") {
    return { e164: "+" + digits };
  }

  // Longer without a + — prepending or passing through is a coin flip on the
  // country code. Reject instead of guessing.
  return {
    error: "Can't determine the country code — use +country format for non-US numbers",
  };
}
