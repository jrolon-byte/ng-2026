import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";
import { normalizePhone } from "./utils/phone";
import twilio from "twilio";

/**
 * Super admin: grant (or clear) a one-time bonus gift on a target org.
 * Pass extra_texts=0 with expires_at=null / note=null to end a gift early.
 *
 * Optional: pass `send_sms: true` with `sms_message` to also text the org's
 * phone of record. SMS failure is surfaced as a warning — it does NOT fail
 * the DB update, because the gift itself is the primary action.
 */
export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const supabase = getSupabase();

    const { data: currentUser } = await supabase
      .from("users")
      .select("super_admin")
      .eq("id", auth.id)
      .single();

    if (!currentUser?.super_admin) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const body = await req.json();
    const org_id = body.org_id as string | undefined;
    const extra_texts = Number(body.extra_texts);
    const expires_at = (body.expires_at as string | null | undefined) ?? null;
    const note = (body.note as string | null | undefined) ?? null;
    const send_sms = body.send_sms === true;
    const sms_message = typeof body.sms_message === "string" ? body.sms_message : "";

    if (!org_id || Number.isNaN(extra_texts) || extra_texts < 0) {
      return jsonResponse({ error: "Missing or invalid fields" }, 400);
    }

    const clearing = extra_texts === 0;

    const { error } = await supabase
      .from("organizations")
      .update({
        bonus_extra_texts: extra_texts,
        bonus_expires_at:  clearing ? null : expires_at,
        bonus_note:        clearing ? null : note,
      })
      .eq("id", org_id);

    if (error) {
      return jsonResponse({ error: "Failed to update org" }, 500);
    }

    // SMS notification — only when granting a gift, not when clearing.
    // Failure is non-fatal: the gift is already saved; we just tell the
    // caller the text didn't go.
    let sms_warning: string | null = null;
    if (send_sms && !clearing && sms_message.trim().length > 0) {
      try {
        const { data: org } = await supabase
          .from("organizations")
          .select("phone")
          .eq("id", org_id)
          .single();

        const rawPhone = org?.phone ?? "";
        const phoneResult = rawPhone ? normalizePhone(rawPhone) : null;
        const to = phoneResult && "e164" in phoneResult ? phoneResult.e164 : null;

        if (!to) {
          sms_warning = "Gift saved, but the org has no valid phone on file — SMS skipped.";
        } else {
          const accountSid = process.env.TWILIO_ACCOUNT_SID;
          const authToken  = process.env.TWILIO_AUTH_TOKEN;
          // Deliberately the SHARED platform number, not the org's own.
          // This is NotifyGrid telling a shop owner about a gift — sending it
          // from their own number would look like they texted themselves.
          const fromNumber = process.env.TWILIO_PHONE_NUMBER;

          if (!accountSid || !authToken || !fromNumber) {
            sms_warning = "Gift saved, but Twilio isn't configured in this environment — SMS skipped.";
          } else {
            const client = twilio(accountSid, authToken);
            await client.messages.create({
              from: fromNumber,
              to,
              body: sms_message,
            });
          }
        }
      } catch (err) {
        sms_warning = `Gift saved, but SMS failed: ${err instanceof Error ? err.message : "unknown error"}`;
      }
    }

    return jsonResponse({ success: true, sms_warning });
  } catch {
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
