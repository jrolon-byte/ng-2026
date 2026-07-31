import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";

/**
 * Lightweight status poll for an async campaign send: the web client (and
 * the iOS app) call this after campaign-send queues a blast, until status
 * leaves queued/sending.
 */
export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const campaignId = new URL(req.url).searchParams.get("campaign_id");
    if (!campaignId) {
      return jsonResponse({ error: "campaign_id query param is required" }, 400);
    }

    const supabase = getSupabase();

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, status, total_recipients, total_delivered, total_failed, sent_at")
      .eq("id", campaignId)
      .eq("org_id", auth.org_id)
      .maybeSingle();

    if (!campaign) {
      return jsonResponse({ error: "Campaign not found" }, 404);
    }

    // Lazy reconciliation: a worker killed mid-send (crash, 15-min cap)
    // leaves "sending" forever — nothing else ever finalizes it. If it's
    // been sending well past any plausible duration, settle it from the
    // message_logs that WERE flushed (they're the ground truth of what
    // Twilio actually did) so the UI and usage stop lying.
    const STALE_MS = 20 * 60 * 1000;
    if (
      campaign.status === "sending" &&
      campaign.sent_at &&
      Date.now() - new Date(campaign.sent_at).getTime() > STALE_MS
    ) {
      const [sent, failed] = await Promise.all([
        supabase
          .from("message_logs")
          .select("id", { count: "exact", head: true })
          .eq("org_id", auth.org_id)
          .eq("campaign_id", campaign.id)
          .neq("status", "failed"),
        supabase
          .from("message_logs")
          .select("id", { count: "exact", head: true })
          .eq("org_id", auth.org_id)
          .eq("campaign_id", campaign.id)
          .eq("status", "failed"),
      ]);

      const totals = {
        total_delivered: sent.count ?? 0,
        total_failed: failed.count ?? 0,
        status: "failed", // partial at best — never claim completed
      };
      await supabase
        .from("campaigns")
        .update(totals)
        .eq("id", campaign.id)
        .eq("org_id", auth.org_id)
        .eq("status", "sending");

      console.error(
        `campaign-status: reconciled stale campaign ${campaign.id} — ${totals.total_delivered} delivered, ${totals.total_failed} failed of ${campaign.total_recipients}`
      );
      return jsonResponse({ campaign: { ...campaign, ...totals } });
    }

    return jsonResponse({ campaign });
  } catch (err) {
    console.error("campaign-status error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
