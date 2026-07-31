import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Who a blast actually goes to.
 *
 * The ONE definition, shared by campaign-send (which validates and counts) and
 * campaign-send-background (which sends). If these two ever disagreed, the
 * pre-send usage check would reserve allowance for a different set of people
 * than the send loop texts, and the paywall math would drift.
 *
 * Beyond active + opted_in, this excludes numbers that have failed
 * consecutively. Tony's list carried six of them — one had swallowed 28
 * straight blasts without a single message ever arriving, and nothing in the
 * product could see it, because `messages.create()` succeeding was mistaken
 * for delivery.
 */

/**
 * Consecutive delivery failures before a number is considered dead.
 *
 * Three forgives a handset that was simply switched off during one blast,
 * which is the common and recoverable case. Kept in step with
 * `Contact.isUndeliverable` in the iOS client.
 */
export const DEAD_NUMBER_THRESHOLD = 3;

export interface SendableContact {
  id: string;
  first_name: string | null;
  phone: string;
}

export interface Audience {
  contacts: SendableContact[];
  /** Excluded for consecutive delivery failures — surfaced, never silent. */
  excludedUnreachable: number;
}

export async function getAudience(
  supabase: SupabaseClient,
  orgId: string
): Promise<{ audience: Audience | null; error: unknown }> {
  // Paginate: Supabase caps un-ranged selects at 1000 rows, which would
  // silently drop every contact past #1000 from the blast.
  const PAGE = 1000;
  const all: SendableContact[] = [];

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("contacts")
      .select("id, first_name, phone")
      .eq("org_id", orgId)
      .eq("active", true)
      .eq("opted_in", true)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) return { audience: null, error };
    all.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }

  // Delivery health. Best-effort: if the RPC is missing (migration 020 not
  // run) we send to everyone rather than failing the campaign — the old
  // behaviour, which is wasteful but not broken.
  const dead = new Set<string>();
  const { data: signals, error: signalError } = await supabase.rpc("contact_signals", {
    p_org_id: orgId,
  });

  if (signalError) {
    console.warn("getAudience: contact_signals unavailable —", signalError.message);
  } else if (Array.isArray(signals)) {
    for (const row of signals) {
      if (Number(row.consecutive_failures ?? 0) >= DEAD_NUMBER_THRESHOLD) {
        dead.add(row.contact_id);
      }
    }
  }

  const contacts = all.filter((c) => !dead.has(c.id));

  return {
    audience: {
      contacts,
      excludedUnreachable: all.length - contacts.length,
    },
    error: null,
  };
}
