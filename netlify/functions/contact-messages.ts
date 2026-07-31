import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";

/**
 * The full conversation with one customer — what the shop sent, and what the
 * customer said back — merged into one chronological thread.
 *
 * Outbound alone is useful: `message_logs` has carried `contact_id` and `body`
 * since the first schema, so this endpoint returns real history the day it
 * ships, before a single reply exists.
 */

const MAX_MESSAGES = 200;

interface ThreadMessage {
  id: string;
  direction: "outbound" | "inbound";
  body: string;
  created_at: string | null;
  status: string | null;
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const contactId = new URL(req.url).searchParams.get("contact_id");
    if (!contactId) {
      return jsonResponse({ error: "contact_id query param is required" }, 400);
    }

    const supabase = getSupabase();

    // The id arrives straight from the query string, so confirm it belongs to
    // the caller's org BEFORE reading any message rows. Without this the
    // endpoint would hand any authenticated user another tenant's
    // conversations by guessing a uuid.
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", contactId)
      .eq("org_id", auth.org_id)
      .maybeSingle();

    if (!contact) {
      return jsonResponse({ error: "Contact not found" }, 404);
    }

    const [outboundResult, inboundResult] = await Promise.all([
      supabase
        .from("message_logs")
        .select("id, body, status, sent_at, created_at")
        .eq("org_id", auth.org_id)
        .eq("contact_id", contactId)
        .order("sent_at", { ascending: false })
        .limit(MAX_MESSAGES),

      supabase
        .from("inbound_messages")
        .select("id, body, received_at")
        .eq("org_id", auth.org_id)
        .eq("contact_id", contactId)
        .order("received_at", { ascending: false })
        .limit(MAX_MESSAGES),
    ]);

    const outbound: ThreadMessage[] = (outboundResult.data ?? []).map((row) => ({
      id: row.id,
      direction: "outbound",
      body: row.body,
      created_at: row.sent_at ?? row.created_at ?? null,
      status: row.status ?? null,
    }));

    const inbound: ThreadMessage[] = (inboundResult.data ?? []).map((row) => ({
      id: row.id,
      direction: "inbound",
      body: row.body,
      created_at: row.received_at ?? null,
      // Delivery status is an outbound concept; a received message just is.
      status: null,
    }));

    // Take the most recent MAX_MESSAGES across BOTH directions, then hand the
    // client oldest-first so it can render top-to-bottom without re-sorting.
    const messages = [...outbound, ...inbound]
      .sort((a, b) => time(b.created_at) - time(a.created_at))
      .slice(0, MAX_MESSAGES)
      .reverse();

    return jsonResponse({ messages });
  } catch (err) {
    console.error("contact-messages error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};

function time(value: string | null): number {
  return value ? new Date(value).getTime() : 0;
}
