import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";

interface SignalRow {
  contact_id: string;
  unread_replies: number | string;
  last_reply_at: string | null;
  send_attempts: number | string;
  send_failures: number | string;
  consecutive_failures: number | string;
}

/**
 * The customer list, with the signals that make it dynamic.
 *
 * Each contact carries derived state so the client can order the list by what
 * actually needs attention:
 *
 *   - `unread_replies` / `last_reply_at` — someone texted back. A customer
 *     asking for a chair today is the most actionable thing in the app.
 *   - `send_attempts` / `send_failures` — delivery health. A number that has
 *     failed every attempt is dead weight: it inflates the reach count, eats
 *     grace allowance, and puts a permanent tick in every campaign's failed
 *     column.
 *
 * Both come from `contact_signals()` (migration 018) in a single round trip.
 * Computing them here would mean either N+1 queries per contact or pulling
 * thousands of message_logs rows into JS to group them.
 *
 * Every field is ADDITIVE — nothing existing changed, so the web app and any
 * older client keep working untouched.
 */
export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const supabase = getSupabase();

    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("org_id", auth.org_id)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonResponse({ error: "Failed to load contacts" }, 500);
    }

    // Signals are best-effort. If migration 018 hasn't been run the RPC won't
    // exist — return the plain list rather than failing the whole screen. An
    // undecorated contact list is still a working contact list.
    let signals: Record<string, SignalRow> = {};
    const { data: signalRows, error: signalError } = await supabase.rpc("contact_signals", {
      p_org_id: auth.org_id,
    });

    if (signalError) {
      console.warn("contacts-list: contact_signals unavailable —", signalError.message);
    } else if (Array.isArray(signalRows)) {
      signals = Object.fromEntries((signalRows as SignalRow[]).map((row) => [row.contact_id, row]));
    }

    // Postgres bigint arrives as a string over PostgREST — coerce so the
    // client isn't comparing "0" to 0.
    const enriched = (contacts ?? []).map((contact) => {
      const signal = signals[contact.id];
      return {
        ...contact,
        unread_replies: Number(signal?.unread_replies ?? 0),
        last_reply_at: signal?.last_reply_at ?? null,
        send_attempts: Number(signal?.send_attempts ?? 0),
        send_failures: Number(signal?.send_failures ?? 0),
        consecutive_failures: Number(signal?.consecutive_failures ?? 0),
      };
    });

    return jsonResponse({ contacts: enriched });
  } catch (err) {
    console.error("contacts-list error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
