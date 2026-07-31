import twilio from "twilio";
import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";
import { sendingNumberFor } from "./utils/twilio-numbers";
import { statusCallbackUrl } from "./twilio-status";
import { getAudience } from "./utils/audience";

/**
 * BACKGROUND WORKER for campaign sends — the `-background` suffix gives it
 * Netlify's 15-minute cap instead of the 10s sync limit. Invoked by
 * campaign-send.ts after validation, with the user's JWT forwarded.
 *
 * Trust model: the client-facing payload is just { campaign_id }. Everything
 * that matters (body, image, org) is re-read from the campaign row, which
 * must belong to auth.org_id and still be status "queued" — a duplicate
 * invocation finds it already "sending" and exits without re-blasting.
 *
 * message_logs are flushed every 25 sends, not once at the end: if this
 * process dies mid-send, Twilio has already delivered real messages and the
 * usage accounting must reflect them.
 */

const LOG_FLUSH_EVERY = 25;

export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { campaign_id } = await req.json();
    if (!campaign_id || typeof campaign_id !== "string") {
      return jsonResponse({ error: "campaign_id is required" }, 400);
    }

    const supabase = getSupabase();

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    // Blasts go out from the org's OWN number when it has one, so replies
    // route back to the right shop (twilio-inbound resolves the tenant from
    // `To`). Orgs provisioned before per-org numbers fall back to the shared
    // platform number — send-only, but unbroken.
    const fromNumber = await sendingNumberFor(auth.org_id);

    if (!accountSid || !authToken || !fromNumber) {
      console.error("campaign-send-background: Twilio not configured");
      return jsonResponse({ error: "SMS service is not configured" }, 500);
    }

    // ATOMIC claim: a single conditional update — queued→sending — with the
    // status in the WHERE clause. Two concurrent invocations (double kick,
    // or a user POSTing here directly in parallel) race on this one
    // statement; exactly one gets the row back, the loser exits without
    // sending. A SELECT-then-UPDATE here was a double-blast bug.
    const { data: claimed } = await supabase
      .from("campaigns")
      .update({ status: "sending" })
      .eq("id", campaign_id)
      .eq("org_id", auth.org_id)
      .eq("status", "queued")
      .select("id, body, image_url")
      .maybeSingle();

    if (!claimed) {
      console.log(
        `campaign-send-background: campaign ${campaign_id} not claimable (already claimed, finished, or foreign) — exiting`
      );
      return jsonResponse({ skipped: true });
    }
    const campaign = claimed;

    const { data: orgSettings } = await supabase
      .from("organizations")
      .select("message_prefix, message_suffix")
      .eq("id", auth.org_id)
      .single();

    const prefix = orgSettings?.message_prefix ?? "";
    const suffix = orgSettings?.message_suffix ?? "";

    // Same helper campaign-send validated against, so the set that was
    // counted and gated is exactly the set that gets texted — paginated, and
    // with consecutively-failing numbers excluded.
    const { audience, error: contactsError } = await getAudience(supabase, auth.org_id);
    const contacts = audience?.contacts ?? [];

    if (audience && audience.excludedUnreachable > 0) {
      console.log(
        `campaign-send-background: campaign ${campaign.id} — skipping ${audience.excludedUnreachable} unreachable number(s)`
      );
    }

    if (contactsError || contacts.length === 0) {
      await supabase
        .from("campaigns")
        .update({ status: "failed" })
        .eq("id", campaign.id)
        .eq("org_id", auth.org_id);
      return jsonResponse({ error: "No contacts to send to" }, 400);
    }

    const twilioClient = twilio(accountSid, authToken);
    const statusCallback = statusCallbackUrl();
    if (!statusCallback) {
      console.warn(
        "campaign-send-background: no SITE_URL/URL — delivery status won't be tracked for this campaign"
      );
    }

    let totalSent = 0;
    let totalFailed = 0;
    let pendingLogs: Array<Record<string, unknown>> = [];

    const flushLogs = async () => {
      if (pendingLogs.length === 0) return;
      const batch = pendingLogs;
      pendingLogs = [];
      // One retry — a dropped flush is up to 25 already-sent messages
      // vanishing from usage accounting (free texts, undercounted cost).
      for (let attempt = 0; attempt < 2; attempt++) {
        const { error } = await supabase.from("message_logs").insert(batch);
        if (!error) return;
        console.error(
          `campaign-send-background: log flush failed (attempt ${attempt + 1}):`,
          error
        );
      }
    };

    for (const contact of contacts) {
      const name = contact.first_name || "Friend";
      const personalizedBody = prefix + campaign.body.replace(/@Name/g, name) + suffix;

      try {
        const messageOptions: {
          body: string;
          from: string;
          to: string;
          mediaUrl?: string[];
          statusCallback?: string;
        } = {
          body: personalizedBody,
          from: fromNumber,
          to: contact.phone,
          // Without this, `status: "sent"` below is the last word on every
          // message — Twilio accepted it, and the carrier's verdict never
          // comes back. twilio-status.ts writes the real outcome.
          ...(statusCallback ? { statusCallback } : {}),
        };
        if (campaign.image_url) {
          messageOptions.mediaUrl = [campaign.image_url];
        }

        const message = await twilioClient.messages.create(messageOptions);

        pendingLogs.push({
          campaign_id: campaign.id,
          contact_id: contact.id,
          org_id: auth.org_id,
          twilio_sid: message.sid,
          body: personalizedBody,
          status: "sent",
          sent_at: new Date().toISOString(),
        });
        totalSent++;
      } catch {
        pendingLogs.push({
          campaign_id: campaign.id,
          contact_id: contact.id,
          org_id: auth.org_id,
          body: personalizedBody,
          status: "failed",
          sent_at: new Date().toISOString(),
        });
        totalFailed++;
      }

      if (pendingLogs.length >= LOG_FLUSH_EVERY) {
        await flushLogs();
      }
    }

    await flushLogs();

    await supabase
      .from("campaigns")
      .update({
        total_delivered: totalSent,
        total_failed: totalFailed,
        status: totalFailed === contacts.length ? "failed" : "completed",
      })
      .eq("id", campaign.id)
      .eq("org_id", auth.org_id);

    console.log(
      `campaign-send-background: campaign ${campaign.id} done — ${totalSent} sent, ${totalFailed} failed of ${contacts.length}`
    );

    return jsonResponse({
      campaign_id: campaign.id,
      total_sent: totalSent,
      total_failed: totalFailed,
    });
  } catch (err) {
    console.error("campaign-send-background error:", err);
    return jsonResponse({ error: "Send worker failed" }, 500);
  }
};
