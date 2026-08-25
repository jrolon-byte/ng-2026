import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";

/**
 * Register (or re-home) a device's APNs token.
 *
 * Called by the iOS app after login once notification permission is granted.
 * Upserts on the token itself: a device that re-registers after an org
 * switch MOVES to the new org — the alternative is one phone buzzing for a
 * shop its owner already switched away from.
 */
export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { token, platform } = await req.json();

    if (!token || typeof token !== "string" || token.length > 200) {
      return jsonResponse({ error: "token is required" }, 400);
    }

    const supabase = getSupabase();

    const { error } = await supabase.from("device_tokens").upsert(
      {
        token,
        org_id: auth.org_id,
        user_id: auth.id,
        platform: platform === "ios" ? "ios" : String(platform ?? "ios").slice(0, 20),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "token" }
    );

    if (error) {
      console.error("device-register: upsert failed", error);
      return jsonResponse({ error: "Failed to register device" }, 500);
    }

    return jsonResponse({ ok: true });
  } catch {
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
