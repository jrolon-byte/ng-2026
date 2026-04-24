import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";

/**
 * Super admin: list orgs with an active bonus gift
 * (bonus_extra_texts > 0 AND bonus_expires_at > now()).
 */
export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const supabase = getSupabase();

    const { data: currentUser } = await supabase
      .from("users")
      .select("super_admin")
      .eq("id", auth.id)
      .single();

    if (!currentUser?.super_admin) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const nowIso = new Date().toISOString();

    const { data: gifts, error } = await supabase
      .from("organizations")
      .select("id, name, bonus_extra_texts, bonus_expires_at, bonus_note")
      .gt("bonus_extra_texts", 0)
      .gt("bonus_expires_at", nowIso)
      .order("bonus_expires_at", { ascending: true });

    if (error) {
      return jsonResponse({ error: "Failed to load gifts" }, 500);
    }

    return jsonResponse({ gifts: gifts ?? [] });
  } catch {
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
