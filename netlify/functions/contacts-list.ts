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

    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("org_id", auth.org_id)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonResponse({ error: "Failed to load contacts" }, 500);
    }

    return jsonResponse({ contacts });
  } catch (err: unknown) {
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
