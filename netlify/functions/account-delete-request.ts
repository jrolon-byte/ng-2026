import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";
import { alertAdmin } from "./utils/admin-alert";

/**
 * "Delete my account", filed from the app.
 *
 * Closing an org for real means cancelling its Stripe subscription, releasing
 * its Twilio number, and recalculating any referrer's discount — three things
 * that cost money to get wrong and that no one should trigger by mis-tapping a
 * phone. So this records the request, texts James, and stops. He finishes it.
 *
 * The org stays fully active in the meantime. That is deliberate: a shop that
 * changes its mind between tapping the button and answering the phone must
 * still be able to reach its customers. Nothing here is destructive.
 *
 * See `supabase/migrations/022_account_deletion_requests.sql` — the columns
 * MUST exist before this deploys or every request 500s.
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

    const { data: org, error: readError } = await supabase
      .from("organizations")
      .select("id, name, slug, plan_status, deletion_requested_at")
      .eq("id", auth.org_id)
      .single();

    if (readError || !org) {
      console.error("account-delete-request: org lookup failed", readError);
      return jsonResponse({ error: "Something went wrong" }, 500);
    }

    // Already on the list. Report success rather than an error — from the
    // shop owner's side the account is going away either way, and a second
    // tap must not text James a second time.
    if (org.deletion_requested_at) {
      return jsonResponse({
        success: true,
        requested_at: org.deletion_requested_at,
        already_requested: true,
      });
    }

    const requestedAt = new Date().toISOString();

    const { error: stampError } = await supabase
      .from("organizations")
      .update({
        deletion_requested_at: requestedAt,
        deletion_requested_by: auth.id,
      })
      .eq("id", auth.org_id)
      // Only claim an unclaimed request: two devices tapping at once must
      // produce one stamp and one text, not a race over whose wins.
      .is("deletion_requested_at", null);

    if (stampError) {
      console.error("account-delete-request: stamp failed", stampError);
      return jsonResponse({ error: "Something went wrong" }, 500);
    }

    // Loud and permanent, independent of whether the SMS lands — this log is
    // the audit trail for a request the shop owner was told we received.
    console.log(
      `ACCOUNT DELETION REQUESTED — org=${org.name} (${org.slug}) ` +
        `plan=${org.plan_status} by=${auth.email} at=${requestedAt}`
    );

    // Never throws by contract, so the request can't fail on a Twilio hiccup
    // after the stamp is already committed.
    await alertAdmin(
      `NotifyGrid: ${org.name} (${org.slug}) requested account deletion. ` +
        `Requested by ${auth.email}. Plan: ${org.plan_status}. ` +
        `Cancel Stripe, release their Twilio number, recalc any referrer.`
    );

    return jsonResponse({ success: true, requested_at: requestedAt });
  } catch (err) {
    console.error("account-delete-request error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
