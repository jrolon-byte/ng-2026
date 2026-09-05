/**
 * GA4 event helper. The tag itself is loaded (or not) by the inline
 * snippet in index.html, which owns the measurement ID; this module only
 * pushes events and is a silent no-op when the tag isn't configured.
 *
 * Event names follow GA4's recommended vocabulary so the standard funnel
 * and monetisation reports work with zero custom definitions:
 *   begin_checkout — the customer clicks through to Stripe
 *   purchase       — /signup/success confirms a paid session (once per session id)
 * The landing site fires `select_promotion` for the click that got them here.
 */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(event: string, params: Record<string, unknown> = {}): void {
  try {
    window.gtag?.('event', event, params);
  } catch {
    // Analytics must never break the funnel it measures.
  }
}

/** Fire `purchase` exactly once per Stripe session, even across reloads. */
export function trackPurchaseOnce(
  transactionId: string,
  amountCents: number,
  currency: string,
): void {
  const key = `ng_purchase_${transactionId}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    // Storage blocked: fire anyway rather than lose the conversion.
  }
  track('purchase', {
    transaction_id: transactionId,
    value: amountCents / 100,
    currency: currency.toUpperCase(),
  });
}
