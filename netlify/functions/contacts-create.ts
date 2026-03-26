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

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return jsonResponse({ error: "Invalid phone number" }, 400);
    }

    const supabase = getSupabase();

    // Check for duplicate phone within the org
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("org_id", auth.org_id)
      .eq("phone", normalizedPhone)
      .single();

    if (existing) {
      return jsonResponse(
        { error: "A contact with this phone number already exists" },
        409
      );
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
