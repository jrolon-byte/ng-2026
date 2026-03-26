import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";

export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "DELETE") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const url = new URL(req.url);
    const contactId = url.searchParams.get("contact_id");

    if (!contactId) {
      return jsonResponse({ error: "contact_id query param is required" }, 400);
    }

    const supabase = getSupabase();

    // Only allow deleting contacts within the user's own org
    const { error } = await supabase
      .from("contacts")
      .update({ active: false })
      .eq("id", contactId)
      .eq("org_id", auth.org_id);

    if (error) {
      return jsonResponse({ error: "Failed to delete contact" }, 500);
    }

    return jsonResponse({ success: true });
  } catch {
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
