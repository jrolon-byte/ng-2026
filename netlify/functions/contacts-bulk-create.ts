import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { normalizePhone } from "./utils/phone";
import { authenticateRequest } from "./utils/auth";

/**
 * Bulk contact import — built for the iOS address-book flow (dozens of
 * contacts in one shot), works for any batch source.
 *
 * Semantics:
 * - Phones normalized through the SAME normalizePhone as single-create —
 *   dedup correctness depends on both paths normalizing identically.
 * - In-batch dedup first (address books contain the same person twice).
 * - Existing match on (org_id, normalized phone): MERGE by filling blanks
 *   only — never overwrite a stored name because an address book spells it
 *   differently. Inactive matches are reactivated (same rule as
 *   contacts-create).
 * - One bad entry never fails the batch: unusable rows land in `invalid`
 *   with a human-readable reason, response is 200.
 * - Hard cap 500 per request (400 above it).
 */

const MAX_BATCH = 500;

interface IncomingContact {
  first_name?: unknown;
  last_name?: unknown;
  phone?: unknown;
  email?: unknown;
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const incoming = body?.contacts;

    if (!Array.isArray(incoming) || incoming.length === 0) {
      return jsonResponse({ error: "contacts must be a non-empty array" }, 400);
    }
    if (incoming.length > MAX_BATCH) {
      return jsonResponse(
        { error: `Too many contacts — max ${MAX_BATCH} per request` },
        400
      );
    }

    const invalid: { first_name: string; phone: string; reason: string }[] = [];
    // In-batch dedup by normalized phone — first occurrence wins.
    const byPhone = new Map<
      string,
      { first_name: string; last_name: string | null; email: string | null }
    >();

    for (const raw of incoming as IncomingContact[]) {
      const first_name = typeof raw.first_name === "string" ? raw.first_name.trim() : "";
      const last_name = typeof raw.last_name === "string" ? raw.last_name.trim() : "";
      const email = typeof raw.email === "string" ? raw.email.trim() : "";
      const phoneRaw = typeof raw.phone === "string" ? raw.phone : "";

      if (!first_name) {
        invalid.push({ first_name, phone: phoneRaw, reason: "Missing name" });
        continue;
      }
      if (!phoneRaw.trim()) {
        invalid.push({ first_name, phone: phoneRaw, reason: "Missing phone number" });
        continue;
      }

      const phoneResult = normalizePhone(phoneRaw);
      if ("error" in phoneResult) {
        invalid.push({ first_name, phone: phoneRaw, reason: phoneResult.error });
        continue;
      }

      if (!byPhone.has(phoneResult.e164)) {
        byPhone.set(phoneResult.e164, {
          first_name,
          last_name: last_name || null,
          email: email || null,
        });
      }
      // Silent skip of in-batch duplicates: not an error, the person made it in.
    }

    if (byPhone.size === 0) {
      return jsonResponse({ created: 0, merged: 0, reactivated: 0, invalid });
    }

    const supabase = getSupabase();
    const phones = [...byPhone.keys()];

    // Existing rows for these phones — active AND inactive both matter here.
    const { data: existingRows, error: lookupError } = await supabase
      .from("contacts")
      .select("id, phone, first_name, last_name, email, active")
      .eq("org_id", auth.org_id)
      .in("phone", phones);

    if (lookupError) {
      console.error("contacts-bulk-create: lookup failed:", lookupError);
      return jsonResponse({ error: "Failed to check existing contacts" }, 500);
    }

    const existingByPhone = new Map((existingRows ?? []).map((r) => [r.phone, r]));

    let created = 0;
    let merged = 0;
    let reactivated = 0;
    const inserts: Record<string, unknown>[] = [];

    for (const [phone, entry] of byPhone) {
      const existing = existingByPhone.get(phone);

      if (!existing) {
        inserts.push({
          org_id: auth.org_id,
          first_name: entry.first_name,
          last_name: entry.last_name,
          phone,
          email: entry.email,
          active: true,
          opted_in: true,
        });
        continue;
      }

      // Merge: fill blanks, never overwrite what the shop already has.
      const updates: Record<string, unknown> = {};
      if (!existing.first_name && entry.first_name) updates.first_name = entry.first_name;
      if (!existing.last_name && entry.last_name) updates.last_name = entry.last_name;
      if (!existing.email && entry.email) updates.email = entry.email;

      if (!existing.active) {
        updates.active = true;
        updates.opted_in = true;
        reactivated++;
      } else if (Object.keys(updates).length === 0) {
        merged++; // already present, nothing to fill — still a successful merge
        continue;
      } else {
        merged++;
      }

      const { error: updateError } = await supabase
        .from("contacts")
        .update(updates)
        .eq("id", existing.id)
        .eq("org_id", auth.org_id);

      if (updateError) {
        console.error(`contacts-bulk-create: update failed for ${phone}:`, updateError);
        if (!existing.active) reactivated--;
        else merged--;
        invalid.push({
          first_name: entry.first_name,
          phone,
          reason: "Failed to update existing contact",
        });
      }
    }

    if (inserts.length > 0) {
      const { error: insertError, count } = await supabase
        .from("contacts")
        .insert(inserts, { count: "exact" });

      if (insertError) {
        console.error("contacts-bulk-create: insert failed:", insertError);
        for (const row of inserts) {
          invalid.push({
            first_name: row.first_name as string,
            phone: row.phone as string,
            reason: "Failed to save",
          });
        }
      } else {
        created = count ?? inserts.length;
      }
    }

    return jsonResponse({ created, merged, reactivated, invalid });
  } catch (err) {
    console.error("contacts-bulk-create error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
