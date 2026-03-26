import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";

export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { message_prefix, message_suffix } = await req.json();

    const supabase = getSupabase();

    const { error } = await supabase
      .from("organizations")
      .update({
        message_prefix: message_prefix ?? null,
        message_suffix: message_suffix ?? null,
      })
      .eq("id", auth.org_id);

    if (error) {
      return jsonResponse({ error: "Failed to update settings" }, 500);
    }

    return jsonResponse({ success: true });
  } catch {
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
