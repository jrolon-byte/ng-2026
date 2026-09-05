/**
 * Reads what provisioning needs out of a completed Stripe Checkout Session.
 *
 * Pay-first signups carry NO personal data in metadata — Stripe collects
 * the email, phone and cardholder name itself (`customer_details`) and the
 * business name via a Checkout custom field. Metadata only says "this is a
 * signup" plus the referral linkage decided at checkout time.
 *
 * The legacy shape (metadata.username + password_hash, minted by the
 * pre-2026-09 form) is recognised so that sessions created minutes before
 * a deploy still provision correctly. Checkout sessions live 24 h; the
 * legacy branch can be deleted after that window.
 *
 * Pure module: `import type` only, so `node --test` loads it directly.
 */
import type Stripe from "stripe";

export const BUSINESS_NAME_FIELD_KEY = "business_name";

export interface SignupSessionData {
  kind: "pay_first";
  sessionId: string;
  businessName: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  isPro: boolean;
  referredByOrgId: string | null;
  customerId: string | null;
  subscriptionId: string | null;
}

export interface LegacySignupSessionData {
  kind: "legacy";
  sessionId: string;
  metadata: Record<string, string>;
  email: string | null;
  customerId: string | null;
  subscriptionId: string | null;
}

export type ParsedSignupSession = SignupSessionData | LegacySignupSessionData;

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/**
 * Returns null when the session is not a signup at all (an upgrade session
 * carries metadata.org_id instead — the webhook routes those separately).
 */
export function parseSignupSession(
  session: Stripe.Checkout.Session
): ParsedSignupSession | null {
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const email = session.customer_details?.email?.trim().toLowerCase() || null;
  const customerId = idOf(session.customer);
  const subscriptionId = idOf(session.subscription);

  if (metadata.username) {
    return {
      kind: "legacy",
      sessionId: session.id,
      metadata,
      email,
      customerId,
      subscriptionId,
    };
  }

  if (metadata.signup !== "1") return null;

  const field = (session.custom_fields ?? []).find(
    (f) => f.key === BUSINESS_NAME_FIELD_KEY
  );
  const businessName = field?.text?.value?.trim() || "";

  return {
    kind: "pay_first",
    sessionId: session.id,
    // Stripe enforces the custom field as required, but a defensive
    // fallback keeps a PAID customer from ever failing to provision.
    businessName:
      businessName || session.customer_details?.name?.trim() || "My Shop",
    email,
    phone: session.customer_details?.phone?.trim() || null,
    fullName: session.customer_details?.name?.trim() || null,
    isPro: metadata.signup_plan === "pro",
    referredByOrgId: metadata.referred_by_org_id || null,
    customerId,
    subscriptionId,
  };
}

/**
 * "Paid" for provisioning purposes. One-time First Blast sessions report
 * payment_status "paid"; subscription sessions do too once the first
 * invoice settles. `no_payment_required` covers 100%-off promotions, which
 * we do not run today but must not strand a customer if we ever do.
 */
export function isSessionPaid(session: Stripe.Checkout.Session): boolean {
  return (
    session.status === "complete" &&
    (session.payment_status === "paid" ||
      session.payment_status === "no_payment_required")
  );
}
