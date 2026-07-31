import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { normalizePhone } from "./utils/phone";
import { authenticateRequest } from "./utils/auth";

export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { first_name, last_name, phone, email } = await req.json();

    if (!first_name || !phone) {
      return jsonResponse(
        { error: "first_name and phone are required" },
        400
      );
    }

    const phoneResult = normalizePhone(phone);
    if ("error" in phoneResult) {
      return jsonResponse({ error: `Invalid phone number: ${phoneResult.error}` }, 400);
    }
    const normalizedPhone = phoneResult.e164;

    const supabase = getSupabase();

    // Duplicate check within the org — MUST look at active too. Deletes are
    // soft (active=false) and the list hides inactive rows, so a plain
    // existence check makes a removed customer permanently unaddable: 409
    // forever with no visible row. An inactive match is reactivated instead.
    const { data: existing } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, email, active")
      .eq("org_id", auth.org_id)
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (existing && existing.active) {
      return jsonResponse(
        { error: "A contact with this phone number already exists" },
        409
      );
    }

    if (existing && !existing.active) {
      // Reactivate — fill blanks only, never overwrite a stored name with
      // the newly typed one (the DB name is the shop's history).
      const { data: contact, error } = await supabase
        .from("contacts")
        .update({
          active: true,
          opted_in: true,
          ...(existing.first_name ? {} : { first_name }),
          ...(existing.last_name || !last_name ? {} : { last_name }),
          ...(existing.email || !email ? {} : { email }),
        })
        .eq("id", existing.id)
        .eq("org_id", auth.org_id)
        .select()
        .single();

      if (error) {
        return jsonResponse({ error: "Failed to re-add contact" }, 500);
      }

      return jsonResponse({ contact, reactivated: true }, 200);
    }

    const { data: contact, error } = await supabase
      .from("contacts")
      .insert({
        org_id: auth.org_id,
        first_name,
        last_name: last_name || null,
        phone: normalizedPhone,
        email: email || null,
        active: true,
        opted_in: true,
      })
      .select()
      .single();

    if (error) {
      return jsonResponse({ error: "Failed to create contact" }, 500);
    }

    return jsonResponse({ contact }, 201);
  } catch {
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
