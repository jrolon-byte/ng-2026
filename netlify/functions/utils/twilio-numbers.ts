import twilio from "twilio";
import { getSupabase } from "./supabase";

/**
 * Per-org Twilio number provisioning.
 *
 * Each organization owns one number. That's what makes inbound replies
 * routable — the webhook resolves the tenant from `To` — and it means a shop's
 * customers can save the number as the shop, not as NotifyGrid.
 *
 * Numbers cost ~$1.15/mo each and buying one is an irreversible recurring
 * charge, so every path through here is idempotent and refuses to guess.
 */

/** Public base URL of this deploy. Netlify sets `URL` automatically. */
export function siteBaseUrl(): string | null {
  return process.env.SITE_URL || process.env.URL || null;
}

/**
 * The webhook Twilio POSTs to on inbound SMS.
 *
 * Signature validation hashes this exact string, so provisioning and
 * verification must derive it from the same helper — if they ever drift,
 * every inbound message fails validation and silently disappears.
 */
export function inboundWebhookUrl(): string | null {
  const base = siteBaseUrl();
  return base ? `${base}/.netlify/functions/twilio-inbound` : null;
}

/** Area code of a shop's own phone, used to buy a local-feeling number. */
function areaCodeFrom(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return national.length === 10 ? national.slice(0, 3) : undefined;
}

/**
 * Return the org's Twilio number, buying one if it doesn't have it yet.
 *
 * ⚠️ NOT wired to any automatic path. At current volume James provisions
 * numbers by hand — a number is ~$1.15/mo forever and signups are rare, so
 * `stripe-webhook` texts him instead (see utils/admin-alert.ts). This is kept
 * ready for the moment that stops being true: call it from the signup path,
 * or from an admin endpoint, and it does the whole job idempotently.
 *
 * Never throws. A null return means "keep using the shared env number",
 * which is a working degraded state (send-only, no replies).
 */
export async function ensureOrgNumber(orgId: string): Promise<string | null> {
  const supabase = getSupabase();

  const { data: org } = await supabase
    .from("organizations")
    .select("twilio_phone_number, phone")
    .eq("id", orgId)
    .single();

  // Already provisioned — the common path, and the one that must never buy.
  if (org?.twilio_phone_number) return org.twilio_phone_number;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const smsUrl = inboundWebhookUrl();

  if (!accountSid || !authToken) {
    console.error("ensureOrgNumber: Twilio not configured — org", orgId);
    return null;
  }
  if (!smsUrl) {
    // Buying a number we can't point at a webhook would bill the account for
    // something that can't receive. Refuse.
    console.error("ensureOrgNumber: no SITE_URL/URL env — refusing to buy a number for", orgId);
    return null;
  }

  try {
    const client = twilio(accountSid, authToken);
    const areaCode = areaCodeFrom(org?.phone);

    // Prefer a number in the shop's own area code; fall back to any US local.
    let available = await client
      .availablePhoneNumbers("US")
      .local.list({ smsEnabled: true, limit: 1, ...(areaCode ? { areaCode: Number(areaCode) } : {}) });

    if (available.length === 0 && areaCode) {
      available = await client.availablePhoneNumbers("US").local.list({ smsEnabled: true, limit: 1 });
    }

    if (available.length === 0) {
      console.error("ensureOrgNumber: no available US numbers for org", orgId);
      return null;
    }

    const purchased = await client.incomingPhoneNumbers.create({
      phoneNumber: available[0].phoneNumber,
      smsUrl,
      smsMethod: "POST",
      friendlyName: `NotifyGrid org ${orgId}`,
    });

    // Persist immediately, and only where the column is still empty. If a
    // concurrent call won the race, we'd rather surface the leak loudly than
    // overwrite and orphan a number that's still being billed.
    const { data: saved, error } = await supabase
      .from("organizations")
      .update({ twilio_phone_number: purchased.phoneNumber })
      .eq("id", orgId)
      .is("twilio_phone_number", null)
      .select("twilio_phone_number")
      .maybeSingle();

    if (error || !saved) {
      console.error(
        `ensureOrgNumber: LEAKED NUMBER ${purchased.phoneNumber} (sid ${purchased.sid}) — ` +
          `bought for org ${orgId} but could not persist. Release it manually in the Twilio console.`,
        error
      );
      return null;
    }

    console.log(`ensureOrgNumber: provisioned ${purchased.phoneNumber} for org ${orgId}`);
    return purchased.phoneNumber;
  } catch (err) {
    console.error("ensureOrgNumber: provisioning failed for org", orgId, err);
    return null;
  }
}

/**
 * The number an org should send customer-facing blasts from.
 *
 * Falls back to the shared platform number so orgs provisioned before this
 * feature keep sending normally.
 */
export async function sendingNumberFor(orgId: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("organizations")
    .select("twilio_phone_number")
    .eq("id", orgId)
    .single();

  return data?.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER || null;
}
