import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";
import twilio from "twilio";

export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { body, image_url } = await req.json();

    if (!body) {
      return jsonResponse({ error: "Message body is required" }, 400);
    }

    const supabase = getSupabase();

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return jsonResponse({ error: "SMS service is not configured" }, 500);
    }

    const twilioClient = twilio(accountSid, authToken);

    // Fetch active, opted-in contacts for the org
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("id, first_name, phone")
      .eq("org_id", auth.org_id)
      .eq("active", true)
      .eq("opted_in", true);

    if (contactsError) {
      return jsonResponse({ error: "Failed to load contacts" }, 500);
    }

    if (!contacts || contacts.length === 0) {
      return jsonResponse({ error: "No active contacts to send to" }, 400);
    }

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        org_id: auth.org_id,
        user_id: auth.id,
        body,
        image_url: image_url || null,
        status: "sending",
        total_recipients: contacts.length,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (campaignError || !campaign) {
      return jsonResponse({ error: "Failed to create campaign" }, 500);
    }

    let totalSent = 0;
    let totalFailed = 0;
    const messageLogs: Array<Record<string, unknown>> = [];

    // Send SMS to each contact
    for (const contact of contacts) {
      const name = contact.first_name || "Friend";
      const personalizedBody = body.replace(/@Name/g, name);

      try {
        const messageOptions: Record<string, unknown> = {
          body: personalizedBody,
          from: fromNumber,
          to: contact.phone,
        };

        if (image_url) {
          messageOptions.mediaUrl = [image_url];
        }

        const message = await twilioClient.messages.create(messageOptions);

        messageLogs.push({
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
        messageLogs.push({
          campaign_id: campaign.id,
          contact_id: contact.id,
          org_id: auth.org_id,
          body: personalizedBody,
          status: "failed",
          sent_at: new Date().toISOString(),
        });

        totalFailed++;
      }
    }

    // Insert message logs in bulk
    if (messageLogs.length > 0) {
      await supabase.from("message_logs").insert(messageLogs);
    }

    // Always update campaign to final status
    await supabase
      .from("campaigns")
      .update({
        total_delivered: totalSent,
        total_failed: totalFailed,
        status: totalFailed === contacts.length ? "failed" : "completed",
      })
      .eq("id", campaign.id);

    return jsonResponse({
      campaign_id: campaign.id,
      total_contacts: contacts.length,
      total_sent: totalSent,
      total_failed: totalFailed,
    });
  } catch {
    return jsonResponse({ error: "Something went wrong. Please try again." }, 500);
  }
};
