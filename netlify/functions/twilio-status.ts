import twilio from "twilio";
import { getSupabase } from "./utils/supabase";
import { siteBaseUrl, webhookUrlCandidates } from "./utils/twilio-numbers";

/**
 * Twilio delivery-status callback — the missing half of the send loop.
 *
 * `messages.create()` resolves the instant Twilio queues a message, so the
 * send path only ever learned that the request was *accepted*. The carrier's
 * actual verdict — delivered, undelivered, failed, and why — arrives here,
 * seconds to minutes later. Without this endpoint every message in the
 * database claims success forever.
 *
 * Same shape as twilio-inbound.ts, and the same three traps: form-encoded
 * body, no JWT (the signature is the authentication), and a TwiML/2xx reply
 * so Twilio doesn't retry.
 */

/** Terminal states worth acting on. `sent`/`queued` are just progress. */
const TERMINAL = new Set(["delivered", "undelivered", "failed"]);

function ack(status = 200): Response {
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status,
    headers: { "Content-Type": "text/xml" },
  });
}

export function statusCallbackUrl(): string | null {
  const base = siteBaseUrl();
  return base ? `${base}/.netlify/functions/twilio-status` : null;
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error("twilio-status: TWILIO_AUTH_TOKEN missing");
    return ack();
  }

  let params: Record<string, string>;
  try {
    params = Object.fromEntries(new URLSearchParams(await req.text()));
  } catch (err) {
    console.error("twilio-status: unparseable body", err);
    return ack();
  }

  const signature = req.headers.get("X-Twilio-Signature");
  const candidates = webhookUrlCandidates(req, "twilio-status");

  if (
    !signature ||
    !candidates.some((url) => twilio.validateRequest(authToken, signature, url, params))
  ) {
    // Unsigned callers could mark a shop's whole list undeliverable.
    console.error("twilio-status: signature validation FAILED — rejecting");
    return new Response("Forbidden", { status: 403 });
  }

  const sid = params.MessageSid ?? params.SmsSid ?? "";
  const status = (params.MessageStatus ?? params.SmsStatus ?? "").toLowerCase();
  const errorCode = params.ErrorCode ? Number(params.ErrorCode) : null;

  if (!sid || !status) return ack();
  // Ignore in-flight transitions — only the verdict is worth a write.
  if (!TERMINAL.has(status)) return ack();

  try {
    const supabase = getSupabase();

    // Keyed by twilio_sid, which is unique per message and already stored by
    // the send loop. No org filter is needed or possible here — Twilio is the
    // caller — but the SID is unguessable and signature-gated.
    const { error } = await supabase
      .from("message_logs")
      .update({
        status,
        error_code: errorCode,
        status_updated_at: new Date().toISOString(),
      })
      .eq("twilio_sid", sid);

    if (error) {
      console.error("twilio-status: update failed", error);
    }

    return ack();
  } catch (err) {
    // Still 2xx — a 500 makes Twilio retry, and a retry storm on a broken
    // query helps nobody. The log is the alarm.
    console.error("twilio-status: unhandled error", err);
    return ack();
  }
};
