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

    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("org_id", auth.org_id)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonResponse({ error: "Failed to load campaigns" }, 500);
    }

    return jsonResponse({ campaigns });
  } catch {
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
