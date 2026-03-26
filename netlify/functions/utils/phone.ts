/**
 * Normalize a phone number to E.164 format.
 * Strips all non-digit characters, then prepends +1 if no country code present.
 * Returns null if the result is not a valid length.
 */
export function normalizePhone(raw: string): string | null {
  // Strip everything except digits and a leading +
  let digits = raw.replace(/[^\d]/g, "");

  if (digits.length === 0) return null;

  // If 10 digits, assume US/CA and prepend country code
  if (digits.length === 10) {
    digits = "1" + digits;
  }

  // Must be 11 digits for North America or 7-15 for international
  if (digits.length < 7 || digits.length > 15) return null;

  return "+" + digits;
}
