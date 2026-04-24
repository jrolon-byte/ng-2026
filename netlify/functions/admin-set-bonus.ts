import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";

/**
 * Super admin: grant (or clear) a one-time bonus gift on a target org.
 * Pass extra_texts=0 with expires_at=null / note=null to end a gift early.
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
    const org_id = body.org_id as string | undefined;
    const extra_texts = Number(body.extra_texts);
    const expires_at = (body.expires_at as string | null | undefined) ?? null;
    const note = (body.note as string | null | undefined) ?? null;

    if (!org_id || Number.isNaN(extra_texts) || extra_texts < 0) {
      return jsonResponse({ error: "Missing or invalid fields" }, 400);
    }

    // When ending a gift (extra_texts=0), clear the other fields too so the
    // UI doesn't show a stale banner with 0 texts attached.
    const clearing = extra_texts === 0;

    const { error } = await supabase
      .from("organizations")
      .update({
        bonus_extra_texts: extra_texts,
        bonus_expires_at:  clearing ? null : expires_at,
        bonus_note:        clearing ? null : note,
      })
      .eq("id", org_id);

    if (error) {
      return jsonResponse({ error: "Failed to update org" }, 500);
    }

    return jsonResponse({ success: true });
  } catch {
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
