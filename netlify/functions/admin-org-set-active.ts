import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";

/**
 * Super admin: deactivate or reactivate a company. This is the "archive,
 * don't delete" lever — contacts, campaigns, and message history stay
 * intact; hard org deletion would cascade all of it away.
 *
 * `organizations.active` was a dead flag until this feature: it is now
 * enforced at both chokepoints — auth-login (owners of a deactivated org
 * can't sign in) and campaign-send (a live session can't blast). Existing
 * JWTs can still *view* until they expire (7d); the actions that matter
 * are blocked immediately.
 *
 * plan_status is left untouched so reactivation restores the org exactly
 * as it was.
 */
export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST") {
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

    const body = await req.json();
    const org_id = typeof body.org_id === "string" ? body.org_id : "";
    const active = body.active;

    if (!org_id || typeof active !== "boolean") {
      return jsonResponse({ error: "org_id and active (boolean) are required" }, 400);
    }

    // Never let the admin lock themselves out of their own org.
    if (org_id === auth.org_id && !active) {
      return jsonResponse({ error: "You can't deactivate the org you're currently in" }, 400);
    }

    const { error } = await supabase
      .from("organizations")
      .update({ active })
      .eq("id", org_id);

    if (error) {
      console.error("admin-org-set-active failed:", error);
      return jsonResponse({ error: "Failed to update company" }, 500);
    }

    console.log(
      `admin-org-set-active: ${org_id} ${active ? "reactivated" : "deactivated"} by ${auth.email}`
    );

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("admin-org-set-active error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
