import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";

/**
 * Super admin: edit a company's profile and plan. Only the provided fields
 * are touched. Plan semantics match admin-org-create: 'comped' takes an
 * explicit text_limit; named plans set the same limits the Stripe webhook
 * writes (keep in sync with stripe-webhook.ts).
 *
 * Deliberately does NOT touch `active` (admin-org-set-active owns
 * deactivation — it has enforcement semantics, not just data) or Stripe ids
 * (those belong to the billing pipeline).
 */

const PLAN_TEXT_LIMITS: Record<string, number> = {
  starter: 600,
  pro: 1500,
  enterprise: 4000,
};

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
    if (!org_id) {
      return jsonResponse({ error: "org_id is required" }, 400);
    }

    const updates: Record<string, unknown> = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) return jsonResponse({ error: "Name cannot be empty" }, 400);
      updates.name = name;
    }
    if (typeof body.phone === "string") {
      updates.phone = body.phone.trim() || null;
    }
    if (body.locale === "en" || body.locale === "es") {
      updates.locale = body.locale;
    }

    if (typeof body.plan === "string") {
      if (body.plan === "comped") {
        const text_limit = Number(body.text_limit);
        if (!Number.isInteger(text_limit) || text_limit < 0 || text_limit > 100000) {
          return jsonResponse(
            { error: "Comped plan needs a text_limit between 0 and 100,000" },
            400
          );
        }
        updates.text_limit = text_limit;
        updates.plan_status = "active";
      } else if (body.plan in PLAN_TEXT_LIMITS) {
        updates.text_limit = PLAN_TEXT_LIMITS[body.plan];
        updates.plan_status = "active";
      } else {
        return jsonResponse(
          { error: "Invalid plan. Must be 'comped', 'starter', 'pro', or 'enterprise'" },
          400
        );
      }
    }

    if (Object.keys(updates).length === 0) {
      return jsonResponse({ error: "Nothing to update" }, 400);
    }

    const { error } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", org_id);

    if (error) {
      console.error("admin-org-update failed:", error);
      return jsonResponse({ error: "Failed to update company" }, 500);
    }

    console.log(
      `admin-org-update: ${org_id} updated by ${auth.email} — fields: ${Object.keys(updates).join(", ")}`
    );

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("admin-org-update error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
