import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";

/**
 * The conversation with one customer.
 *
 * NOT the full message log. A contact who's been on the list for two years has
 * ~28 near-identical broadcasts and, if you're lucky, one reply — and dumping
 * all of it buries the only line that matters. So this returns the
 * conversation: the blast that prompted them, and everything from there on.
 *
 * `?mark_read=1` clears the unread flag on their replies, which is what makes
 * the "new" badge in the customer list disappear once you've actually read it.
 */

/** Broadcasts to show before the first reply, for context. */
const LEAD_IN = 2;
/** What to show when they've never replied — just the recent sends. */
const NO_REPLY_TAIL = 5;
/** Hard ceiling regardless. */
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
    const url = new URL(req.url);
    const contactId = url.searchParams.get("contact_id");
    const markRead = url.searchParams.get("mark_read") === "1";

    if (!contactId) {
      return jsonResponse({ error: "contact_id query param is required" }, 400);
    }

    const supabase = getSupabase();

    // The id comes straight off the query string, so confirm it belongs to the
    // caller's org BEFORE reading any messages. Without this, any signed-in
    // user could read another tenant's conversations by guessing a uuid.
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

    const totalCount = outbound.length + inbound.length;

    // --- Window to the conversation ---
    let kept: ThreadMessage[];

    if (inbound.length > 0) {
      // Anchor on their FIRST reply. Everything from there on is dialogue;
      // before it is just broadcast history.
      const firstReplyAt = Math.min(...inbound.map((m) => time(m.created_at)));

      const before = outbound
        .filter((m) => time(m.created_at) < firstReplyAt)
        .sort((a, b) => time(b.created_at) - time(a.created_at))
        .slice(0, LEAD_IN);

      const after = outbound.filter((m) => time(m.created_at) >= firstReplyAt);

      kept = [...before, ...after, ...inbound];
    } else {
      kept = outbound.slice(0, NO_REPLY_TAIL);
    }

    const messages = kept
      .sort((a, b) => time(a.created_at) - time(b.created_at))
      .slice(-MAX_MESSAGES);

    // --- Mark their replies read ---
    // A side effect on GET, but only when the client explicitly asks: opening
    // the thread IS reading it, and a second round trip to say so would just
    // be ceremony.
    if (markRead && inbound.length > 0) {
      const { error: readError } = await supabase
        .from("inbound_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("org_id", auth.org_id)
        .eq("contact_id", contactId)
        .is("read_at", null);

      if (readError) {
        console.error("contact-messages: mark-read failed", readError);
      }
    }

    return jsonResponse({
      messages,
      /** Older broadcasts left out, so the client can say so honestly. */
      omitted_count: Math.max(0, totalCount - messages.length),
    });
  } catch (err) {
    console.error("contact-messages error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};

function time(value: string | null): number {
  return value ? new Date(value).getTime() : 0;
}
