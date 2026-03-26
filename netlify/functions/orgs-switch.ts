import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest, signToken } from "./utils/auth";

/**
 * Switch to a different organization. Super admin only.
 * Re-issues a JWT with the new org_id.
 */
export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { org_id } = await req.json();

    if (!org_id) {
      return jsonResponse({ error: "org_id is required" }, 400);
    }

    const supabase = getSupabase();

    // Verify user is super_admin
    const { data: currentUser } = await supabase
      .from("users")
      .select("super_admin, first_name, last_name, email")
      .eq("id", auth.id)
      .single();

    if (!currentUser?.super_admin) {
      return jsonResponse({ error: "Unauthorized" }, 403);
    }

    // Verify org exists
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name, slug")
      .eq("id", org_id)
      .single();

    if (!org) {
      return jsonResponse({ error: "Organization not found" }, 404);
    }

    // Issue new token with switched org_id
    const payload = {
      id: auth.id,
      email: currentUser.email,
      org_id: org.id,
      first_name: currentUser.first_name,
      role: auth.role,
    };

    const token = signToken(payload);

    return jsonResponse({
      token,
      user: { ...payload, last_name: currentUser.last_name },
      org,
    });
  } catch {
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
