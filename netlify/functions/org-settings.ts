import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";

export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const supabase = getSupabase();

    const { data: org, error } = await supabase
      .from("organizations")
      .select("id, name, message_prefix, message_suffix, text_limit")
      .eq("id", auth.org_id)
      .single();

    if (error || !org) {
      return jsonResponse({ error: "Organization not found" }, 404);
    }

    return jsonResponse({ org });
  } catch {
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
