import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";

/**
 * Returns all organizations the current user has access to.
 * Super admins can see all orgs. Regular users see only their own.
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

    // Check if user is super_admin
    const { data: currentUser } = await supabase
      .from("users")
      .select("super_admin")
      .eq("id", auth.id)
      .single();

    if (!currentUser?.super_admin) {
      // Regular user — just return their own org
      const { data: org } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .eq("id", auth.org_id)
        .single();

      return jsonResponse({ orgs: org ? [org] : [] });
    }

    // Super admin — return all orgs
    const { data: orgs, error } = await supabase
      .from("organizations")
      .select("id, name, slug")
      .eq("active", true)
      .order("name");

    if (error) {
      return jsonResponse({ error: "Failed to load organizations" }, 500);
    }

    return jsonResponse({ orgs: orgs ?? [] });
  } catch {
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
