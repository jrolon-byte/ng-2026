/**
 * Formats an ISO date string into a human-readable format.
 * Example: "Mar 24, 2026 at 3:45 PM"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).replace(',', '').replace(/(\d{4})/, '$1 at');
}

/**
 * Formats an ISO date string into a short date.
 * Example: "Mar 24, 2026"
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
