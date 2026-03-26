/**
 * Auto-formats a phone number string as the user types.
 * Input: raw keystrokes (digits + whatever)
 * Output: formatted as (407) 754-8294
 */
export function formatPhoneInput(value: string): string {
  // Strip everything except digits
  const digits = value.replace(/\D/g, '');

  // Remove leading 1 if they typed it (US country code)
  const cleaned = digits.length === 11 && digits.startsWith('1')
    ? digits.slice(1)
    : digits;

  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
}
