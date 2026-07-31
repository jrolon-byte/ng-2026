import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";
import { computeGraceLimit, currentMonthWindow } from "./utils/usage";
import { getAudience } from "./utils/audience";

/**
 * FAST PATH of the campaign send (2026-07-30 rework).
 *
 * The old handler awaited one Twilio call per contact serially inside a sync
 * function (10s cap) — any org past ~50-130 contacts died mid-send, with all
 * message_logs lost and no idempotency, so a retry double-billed the blast.
 *
 * Now this function only: authenticates, validates (deactivated org,
 * contacts exist, grace limit), creates the campaign row as "queued", kicks
 * the background worker (campaign-send-background.ts, 15-min cap), and
 * returns { campaign_id, total_recipients } immediately.
 *
 * Idempotency: the client sends idempotency_key per logical send; a retry
 * finds the existing campaign (unique per org — migration 015) and returns
 * it instead of queuing a second blast.
 */
export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { body, image_url, idempotency_key } = await req.json();

    if (!body || typeof body !== "string") {
      return jsonResponse({ error: "Message body is required" }, 400);
    }
    // Server-side cap — the 160-char budget is client-enforced; this is the
    // backstop against a 10K-char body billing ~65 Twilio segments per contact.
    if (body.length > 1000) {
      return jsonResponse({ error: "Message is too long" }, 400);
    }

    const idemKey =
      typeof idempotency_key === "string" && idempotency_key.trim()
        ? idempotency_key.trim().slice(0, 100)
        : null;

    const supabase = getSupabase();

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      return jsonResponse({ error: "SMS service is not configured" }, 500);
    }

    const origin = new URL(req.url).origin;
    const invokeWorker = (campaignId: string) =>
      fetch(`${origin}/.netlify/functions/campaign-send-background`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.get("Authorization") ?? "",
        },
        body: JSON.stringify({ campaign_id: campaignId }),
      });

    // Retry of a send we already accepted? Return it — don't blast twice.
    // If it's still "queued", the previous worker invocation may never have
    // landed (thrown fetch, cold-start death) — RE-KICK it here; the worker's
    // atomic claim makes a duplicate kick harmless. Without this, a campaign
    // whose first invoke failed would sit queued forever.
    if (idemKey) {
      const { data: existing } = await supabase
        .from("campaigns")
        .select("id, total_recipients, status")
        .eq("org_id", auth.org_id)
        .eq("idempotency_key", idemKey)
        .maybeSingle();

      if (existing) {
        if (existing.status === "queued") {
          try {
            await invokeWorker(existing.id);
          } catch (err) {
            console.error("campaign-send: re-kick failed:", err);
          }
        }
        return jsonResponse({
          campaign_id: existing.id,
          total_recipients: existing.total_recipients,
          already_queued: true,
        });
      }
    }

    const { data: orgSettings } = await supabase
      .from("organizations")
      .select("active, text_limit, bonus_extra_texts, bonus_expires_at")
      .eq("id", auth.org_id)
      .single();

    // Deactivated company — a still-valid JWT must not be able to blast.
    // Login is also blocked; this covers sessions issued before deactivation.
    if (orgSettings && orgSettings.active === false) {
      return jsonResponse(
        { error: "This account has been deactivated. Contact NotifyGrid support." },
        403
      );
    }

    // Shared with campaign-send-background so the count validated here is
    // exactly the set that gets texted — including the exclusion of numbers
    // that have failed consecutively.
    const { audience, error: contactsError } = await getAudience(supabase, auth.org_id);

    if (contactsError || !audience) {
      return jsonResponse({ error: "Failed to load contacts" }, 500);
    }

    const contactCount = audience.contacts.length;

    if (audience.excludedUnreachable > 0) {
      console.log(
        `campaign-send: org ${auth.org_id} — skipping ${audience.excludedUnreachable} unreachable number(s)`
      );
    }

    if (!contactCount) {
      return jsonResponse({ error: "No active contacts to send to" }, 400);
    }

    // --- Usage limit check (shared formula — utils/usage.ts) ---
    const { monthStart, monthEnd } = currentMonthWindow();
    // .neq failed: Twilio-rejected messages never reached anyone — they must
    // not consume the customer's monthly allowance. (Mirrored in
    // dashboard-stats so the gate and the usage bar agree.)
    const usageResult = await supabase
      .from("message_logs")
      .select("id", { count: "exact", head: true })
      .eq("org_id", auth.org_id)
      .neq("status", "failed")
      .gte("sent_at", monthStart)
      .lt("sent_at", monthEnd);

    const textsUsed = usageResult.count ?? 0;
    const { graceLimit } = computeGraceLimit({
      textLimit: orgSettings?.text_limit ?? 600,
      contactCount,
      bonusExtra: orgSettings?.bonus_extra_texts ?? 0,
      bonusExpiresAt: (orgSettings?.bonus_expires_at as string | null) ?? null,
    });

    if (textsUsed + contactCount > graceLimit) {
      return jsonResponse({
        error: "You've reached everyone this cycle — upgrade to keep going, or wait for the next refresh.",
      }, 403);
    }

    // Create the campaign as QUEUED — the worker owns it from here.
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        org_id: auth.org_id,
        user_id: auth.id,
        body,
        image_url: image_url || null,
        status: "queued",
        total_recipients: contactCount,
        sent_at: new Date().toISOString(),
        ...(idemKey ? { idempotency_key: idemKey } : {}),
      })
      .select("id, total_recipients")
      .single();

    if (campaignError || !campaign) {
      // Unique violation = a concurrent retry won the race — return theirs.
      if (idemKey && campaignError?.code === "23505") {
        const { data: raced } = await supabase
          .from("campaigns")
          .select("id, total_recipients")
          .eq("org_id", auth.org_id)
          .eq("idempotency_key", idemKey)
          .maybeSingle();
        if (raced) {
          return jsonResponse({
            campaign_id: raced.id,
            total_recipients: raced.total_recipients,
            already_queued: true,
          });
        }
      }
      console.error("campaign-send: failed to create campaign:", campaignError);
      return jsonResponse({ error: "Failed to create campaign" }, 500);
    }

    // Kick the background worker (its own 202-immediately invocation; the
    // actual sending runs up to 15 minutes there). The user's JWT rides
    // along so the worker authenticates the same way as every function.
    //
    // On ANY invoke failure (thrown fetch or bad status) the campaign is
    // deliberately LEFT "queued", not marked failed: the client keeps its
    // idempotency key on errors, and the retry's idempotency branch above
    // re-kicks queued campaigns — the failure self-heals instead of dead-
    // ending a campaign no worker will ever own.
    try {
      const invoke = await invokeWorker(campaign.id);
      if (!invoke.ok && invoke.status !== 202) {
        console.error(`campaign-send: worker invoke failed (${invoke.status})`);
        return jsonResponse({ error: "Failed to start the send — please try again." }, 500);
      }
    } catch (err) {
      console.error("campaign-send: worker invoke threw:", err);
      return jsonResponse({ error: "Failed to start the send — please try again." }, 500);
    }

    return jsonResponse({
      campaign_id: campaign.id,
      total_recipients: campaign.total_recipients,
    });
  } catch (err) {
    console.error("campaign-send error:", err);
    return jsonResponse({ error: "Something went wrong. Please try again." }, 500);
  }
};
