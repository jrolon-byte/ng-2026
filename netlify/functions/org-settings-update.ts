import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";

/**
 * Shop-owner settings: the header/footer wrapped around every text, and the
 * language the apps speak.
 *
 * Both are optional — send only what changed.
 */

/**
 * Combined prefix + suffix ceiling.
 *
 * The wrapper is prepended and appended to EVERY message, so it eats directly
 * into the 160-character single-segment budget. The web enforced 60 in the
 * browser only; nothing stopped a crafted request from storing a 10,000-char
 * prefix, which would push each message to dozens of segments and multiply
 * the Twilio bill for an entire blast by the same factor.
 */
const MAX_WRAPPER = 50;

const LOCALES = new Set(["en", "es"]);

export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { message_prefix, message_suffix, locale } = await req.json();

    const updates: Record<string, unknown> = {};

    // Prefix and suffix are validated together: the cap is on their combined
    // length, so one can't be checked without the other.
    if (message_prefix !== undefined || message_suffix !== undefined) {
      const prefix = typeof message_prefix === "string" ? message_prefix : "";
      const suffix = typeof message_suffix === "string" ? message_suffix : "";
      const combined = prefix.length + suffix.length;

      if (combined > MAX_WRAPPER) {
        return jsonResponse(
          {
            error: `The header and footer can be ${MAX_WRAPPER} characters together. Yours is ${combined}.`,
          },
          400
        );
      }

      updates.message_prefix = prefix || null;
      updates.message_suffix = suffix || null;
    }

    if (locale !== undefined) {
      if (typeof locale !== "string" || !LOCALES.has(locale)) {
        return jsonResponse({ error: "Unsupported language" }, 400);
      }
      updates.locale = locale;
    }

    if (Object.keys(updates).length === 0) {
      return jsonResponse({ error: "Nothing to update" }, 400);
    }

    const supabase = getSupabase();

    const { data: org, error } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", auth.org_id)
      .select("id, name, message_prefix, message_suffix, text_limit, plan_status, locale")
      .single();

    if (error) {
      console.error("org-settings-update: update failed", error);
      return jsonResponse({ error: "Failed to update settings" }, 500);
    }

    // Return the saved row so the client renders what the server actually
    // stored, not what it hoped it stored.
    return jsonResponse({ success: true, org });
  } catch (err) {
    console.error("org-settings-update error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
