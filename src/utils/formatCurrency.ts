/**
 * Formats a number as USD currency.
 * Example: 0.0075 -> "$0.01", 123.5 -> "$123.50"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}
