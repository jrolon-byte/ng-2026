import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest, hashPassword } from "./utils/auth";

/**
 * Super admin: create a new company (organization) plus its first login.
 *
 * Until now orgs were only born through Stripe signup checkout or hand-written
 * SQL migrations. This is the third path: James onboards a customer directly —
 * comped or pre-arranged billing — and hands them working credentials.
 *
 * Unlike the webhook path, the password is bcrypt-hashed up front (no
 * plaintext-then-upgrade-on-first-login dance) and no Stripe records are
 * created: plan_status is set 'active' with the chosen text_limit, which the
 * rest of the app (grace math, paywall, campaign-send cap) understands as a
 * paid-and-working org. Wire Stripe later by setting stripe_customer_id /
 * stripe_subscription_id when real billing starts.
 */

const PLAN_TEXT_LIMITS: Record<string, number> = {
  starter: 600,
  pro: 1500,
  enterprise: 4000,
};

function generateSlug(businessName: string): string {
  const base = businessName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");

  const rand = Math.random().toString(36).substring(2, 6);
  return `${base}-${rand}`;
}

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
    const business_name = typeof body.business_name === "string" ? body.business_name.trim() : "";
    const first_name = typeof body.first_name === "string" ? body.first_name.trim() : "";
    const last_name = typeof body.last_name === "string" ? body.last_name.trim() : "";
    const usernameRaw = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const plan = typeof body.plan === "string" ? body.plan : "comped";
    const locale = body.locale === "es" ? "es" : "en";

    if (!business_name || !first_name || !usernameRaw || !password) {
      return jsonResponse(
        { error: "business_name, first_name, username, and password are required" },
        400
      );
    }
    if (!/^[a-z0-9](?:[a-z0-9._-]{1,30})$/.test(usernameRaw)) {
      return jsonResponse(
        { error: "Username must be 2–31 chars: letters, numbers, dots, dashes, underscores" },
        400
      );
    }
    if (password.length < 8) {
      return jsonResponse({ error: "Password must be at least 8 characters" }, 400);
    }

    // Comped orgs carry an admin-chosen limit; named plans use the same
    // limits the Stripe webhook writes (keep in sync with stripe-webhook.ts).
    let text_limit: number;
    if (plan === "comped") {
      text_limit = Number(body.text_limit);
      if (!Number.isInteger(text_limit) || text_limit < 0 || text_limit > 100000) {
        return jsonResponse({ error: "Comped plan needs a text_limit between 0 and 100,000" }, 400);
      }
    } else if (plan in PLAN_TEXT_LIMITS) {
      text_limit = PLAN_TEXT_LIMITS[plan];
    } else {
      return jsonResponse(
        { error: "Invalid plan. Must be 'comped', 'starter', 'pro', or 'enterprise'" },
        400
      );
    }

    // Username doubles as the synthetic login email — both must be free.
    const email = `${usernameRaw}@notifygrid.app`;
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .or(`username.eq.${usernameRaw},email.eq.${email}`)
      .maybeSingle();

    if (existingUser) {
      return jsonResponse({ error: `Username "${usernameRaw}" is already taken` }, 409);
    }

    // Slug collisions are ~1-in-1.7M with the random suffix, but the column
    // is UNIQUE, so retry once rather than surface a 500 for bad luck.
    let org: { id: string; slug: string } | null = null;
    for (let attempt = 0; attempt < 2 && !org; attempt++) {
      const { data, error } = await supabase
        .from("organizations")
        .insert({
          name: business_name,
          slug: generateSlug(business_name),
          phone: phone || null,
          plan_status: "active",
          text_limit,
          locale,
        })
        .select("id, slug")
        .single();

      if (error) {
        if (error.code === "23505" && attempt === 0) continue; // unique_violation → retry slug
        console.error("admin-org-create: org insert failed:", error);
        return jsonResponse({ error: "Failed to create organization" }, 500);
      }
      org = data;
    }
    if (!org) {
      return jsonResponse({ error: "Failed to create organization" }, 500);
    }

    const password_hash = await hashPassword(password);

    const { error: userError } = await supabase.from("users").insert({
      org_id: org.id,
      username: usernameRaw,
      email,
      password_hash,
      first_name,
      last_name,
      role: "admin",
    });

    if (userError) {
      // Don't leave a loginless org behind — the org insert is the half we
      // can undo. users.org_id cascades, so this is a clean rollback.
      await supabase.from("organizations").delete().eq("id", org.id);
      console.error("admin-org-create: user insert failed:", userError);
      return jsonResponse({ error: "Failed to create user — nothing was saved" }, 500);
    }

    console.log(
      `admin-org-create: "${business_name}" (${org.slug}) created by ${auth.email} — plan=${plan}, limit=${text_limit}`
    );

    return jsonResponse({
      success: true,
      org: { id: org.id, name: business_name, slug: org.slug, plan, text_limit },
      user: { username: usernameRaw, email, first_name, last_name },
    });
  } catch (err) {
    console.error("admin-org-create error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
