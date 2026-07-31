import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { normalizePhone } from "./utils/phone";
import { authenticateRequest } from "./utils/auth";

/**
 * Edit a customer's name, phone, or email.
 *
 * Until now nothing could update a contact — create, list, bulk-create and
 * (soft) delete were the whole surface, so a typo in a phone number was
 * permanent. The iOS customer detail screen is built against this.
 */
export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { contact_id, first_name, last_name, phone, email } = await req.json();

    if (!contact_id) {
      return jsonResponse({ error: "contact_id is required" }, 400);
    }
    if (!first_name || !String(first_name).trim()) {
      return jsonResponse({ error: "first_name is required" }, 400);
    }
    if (!phone) {
      return jsonResponse({ error: "phone is required" }, 400);
    }

    const normalized = normalizePhone(String(phone));
    if ("error" in normalized) {
      return jsonResponse({ error: normalized.error }, 400);
    }

    const supabase = getSupabase();

    // Scope to the caller's org before anything else — contact_id comes
    // straight off the request body.
    const { data: existing } = await supabase
      .from("contacts")
      .select("id, active")
      .eq("id", contact_id)
      .eq("org_id", auth.org_id)
      .maybeSingle();

    if (!existing) {
      return jsonResponse({ error: "Contact not found" }, 404);
    }

    // Changing a number onto one already held by a DIFFERENT active contact
    // would collide with uq_contacts_org_phone. Fail with a message the shop
    // owner can act on rather than a raw constraint violation.
    const { data: clash } = await supabase
      .from("contacts")
      .select("id, active")
      .eq("org_id", auth.org_id)
      .eq("phone", normalized.e164)
      .neq("id", contact_id)
      .maybeSingle();

    if (clash?.active) {
      return jsonResponse(
        { error: "Another customer already uses this phone number" },
        409
      );
    }
    if (clash && !clash.active) {
      // A soft-deleted row is squatting on the number. It's invisible to the
      // owner, so silently failing here would look like a bug — free the
      // number by blanking nothing and instead refusing with a clear reason.
      return jsonResponse(
        { error: "That number belongs to a removed customer. Re-add them instead." },
        409
      );
    }

    const { data: contact, error } = await supabase
      .from("contacts")
      .update({
        first_name: String(first_name).trim(),
        last_name: last_name ? String(last_name).trim() : null,
        phone: normalized.e164,
        email: email ? String(email).trim() : null,
        // Editing a customer you can see implies they should stay visible.
        active: true,
      })
      .eq("id", contact_id)
      .eq("org_id", auth.org_id)
      .select()
      .single();

    if (error) {
      console.error("contacts-update: update failed", error);
      return jsonResponse({ error: "Failed to update contact" }, 500);
    }

    return jsonResponse({ contact });
  } catch (err) {
    console.error("contacts-update error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
