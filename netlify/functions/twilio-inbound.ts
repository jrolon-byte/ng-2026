import twilio from "twilio";
import { getSupabase } from "./utils/supabase";
import { normalizePhone } from "./utils/phone";
import { inboundWebhookUrl } from "./utils/twilio-numbers";

/**
 * Twilio inbound-SMS webhook — a customer replying to a shop's blast.
 *
 * This function deliberately breaks the house skeleton, in three ways that
 * each cause silent failure if you follow the usual pattern:
 *
 *   1. Twilio POSTs `application/x-www-form-urlencoded`, NOT JSON.
 *      `req.json()` throws here.
 *   2. There is no JWT. Do not call `authenticateRequest` — the request comes
 *      from Twilio, not a signed-in user. The signature IS the authentication.
 *   3. The reply must be TwiML with `Content-Type: text/xml`, and must be 2xx
 *      even for messages we can't route. Twilio retries non-2xx responses,
 *      which turns one unroutable message into an endless retry loop.
 */

/** Whole-body commands. Matched case-insensitively after trimming. */
const OPT_OUT_KEYWORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);

/**
 * Opt-IN keywords are deliberately NOT extended to "YES".
 *
 * The whole product is "Reply YES to claim the chair" — it's the marketing
 * hero. Treating YES as a subscription command would swallow the single most
 * important reply a shop receives.
 */
const OPT_IN_KEYWORDS = new Set(["START", "UNSTOP", "SUBSCRIBE"]);

function twiml(status = 200): Response {
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status,
    headers: { "Content-Type": "text/xml" },
  });
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error("twilio-inbound: TWILIO_AUTH_TOKEN missing");
    return twiml();
  }

  // ── Parse (form-encoded, not JSON) ────────────────────────────────────────
  let params: Record<string, string>;
  try {
    const raw = await req.text();
    params = Object.fromEntries(new URLSearchParams(raw));
  } catch (err) {
    console.error("twilio-inbound: unparseable body", err);
    return twiml();
  }

  // ── Authenticate via signature ────────────────────────────────────────────
  // Without this, anyone who discovers the URL can inject fabricated replies —
  // including forged STOPs that would silently opt a shop's customers out.
  const signature = req.headers.get("X-Twilio-Signature");
  // Must be the exact URL Twilio hashed, i.e. the one set as `smsUrl` at
  // provisioning time — derived from the same helper so the two can't drift.
  const url = inboundWebhookUrl();

  if (!signature || !url) {
    console.error("twilio-inbound: missing signature or site URL — rejecting");
    return new Response("Forbidden", { status: 403 });
  }

  if (!twilio.validateRequest(authToken, signature, url, params)) {
    console.error("twilio-inbound: signature validation FAILED — rejecting");
    return new Response("Forbidden", { status: 403 });
  }

  const from = params.From ?? "";
  const to = params.To ?? "";
  const body = params.Body ?? "";
  const messageSid = params.MessageSid ?? params.SmsSid ?? "";

  if (!from || !to || !messageSid) {
    console.error("twilio-inbound: missing From/To/MessageSid");
    return twiml();
  }

  try {
    const supabase = getSupabase();

    // ── Route to the org that owns the receiving number ─────────────────────
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("twilio_phone_number", to)
      .maybeSingle();

    if (!org) {
      // Unknown number — a released number, or the shared platform number
      // that no org owns. Ack so Twilio stops retrying.
      console.warn(`twilio-inbound: no org owns ${to} — dropping message ${messageSid}`);
      return twiml();
    }

    // ── Match the sender to a contact (optional) ────────────────────────────
    const normalized = normalizePhone(from);
    const senderE164 = "e164" in normalized ? normalized.e164 : from;

    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("org_id", org.id)
      .eq("phone", senderE164)
      .maybeSingle();

    // ── Opt-out / opt-in keywords ───────────────────────────────────────────
    // Twilio blocks STOPped numbers at its own layer, but nothing in this
    // codebase ever set `opted_in = false`. Result: the contact stayed in
    // every audience, was counted in total_recipients, and burned monthly
    // allowance forever on a number that could never receive. Reflecting the
    // opt-out here is what makes the send audience honest.
    const command = body.trim().toUpperCase();

    if (contact) {
      if (OPT_OUT_KEYWORDS.has(command)) {
        await supabase
          .from("contacts")
          .update({ opted_in: false })
          .eq("id", contact.id)
          .eq("org_id", org.id);
        console.log(`twilio-inbound: opted OUT contact ${contact.id} (org ${org.id})`);
      } else if (OPT_IN_KEYWORDS.has(command)) {
        await supabase
          .from("contacts")
          .update({ opted_in: true })
          .eq("id", contact.id)
          .eq("org_id", org.id);
        console.log(`twilio-inbound: opted IN contact ${contact.id} (org ${org.id})`);
      }
    }

    // ── Store the message ───────────────────────────────────────────────────
    // Opt-outs are stored too: they're part of the conversation record and
    // the shop owner should be able to see why someone dropped off.
    const { error } = await supabase.from("inbound_messages").upsert(
      {
        org_id: org.id,
        contact_id: contact?.id ?? null,
        from_phone: senderE164,
        to_phone: to,
        body,
        twilio_sid: messageSid,
        received_at: new Date().toISOString(),
      },
      { onConflict: "twilio_sid", ignoreDuplicates: true }
    );

    if (error) {
      console.error("twilio-inbound: insert failed", error);
    }

    return twiml();
  } catch (err) {
    // Still 2xx: a 500 makes Twilio retry, and a retry storm on a broken
    // query helps nobody. The log is the alarm.
    console.error("twilio-inbound: unhandled error", err);
    return twiml();
  }
};
