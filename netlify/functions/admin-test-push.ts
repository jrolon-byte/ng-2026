import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";
import { apnsDiagnostics } from "./utils/apns";

/**
 * Super admin: fire a test push at your own devices and report what Apple said.
 *
 * Push is the one feature that fails silently by design — `pushToOrg` and
 * `pushToSuperAdmins` never throw, so a missing key, an unregistered phone and
 * a stale token all look identical from the outside: nothing happens. This is
 * the window into that. It answers three questions in one request:
 *
 *   1. Is the APNs key configured at all?           → `configured`
 *   2. Does this operator have a phone registered?  → `devices`
 *   3. What did Apple actually say per token?       → `results`
 *
 * A 200 with `devices: 0` means the app was never opened with notifications
 * granted while signed in as this user. A `BadDeviceToken` means the token is
 * from the other APNs environment — a debug build's sandbox token against the
 * production host, usually — and it has now been pruned, so reopening the
 * TestFlight build re-registers a good one.
 *
 * Diagnostic only. Sends nothing to customers and touches no shop data.
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

    const diagnostics = await apnsDiagnostics(supabase, {
      title: "NotifyGrid test",
      body: "Push is working. This is a test from the admin endpoint.",
      threadId: "test",
    });

    return jsonResponse(diagnostics);
  } catch (err) {
    console.error("admin-test-push error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
