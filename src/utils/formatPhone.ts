/**
 * Formats a phone number string for display.
 * Accepts 10-digit or 11-digit (with leading 1) numbers.
 * Returns formatted string like (407) 555-1234.
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  const normalized = digits.length === 11 && digits.startsWith('1')
    ? digits.slice(1)
    : digits;

  if (normalized.length !== 10) {
    return phone;
  }

  const area = normalized.slice(0, 3);
  const prefix = normalized.slice(3, 6);
  const line = normalized.slice(6, 10);

  return `(${area}) ${prefix}-${line}`;
}
