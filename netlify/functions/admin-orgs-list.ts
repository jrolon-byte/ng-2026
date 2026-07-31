import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";

/**
 * Super admin: the full companies roster for the admin CRUD page —
 * including deactivated orgs (unlike orgs-list, which feeds the switcher
 * and only shows active ones).
 *
 * Unlike orgs-list, this DOES return the org phone: it's a super-admin-only
 * endpoint and the admin managing these customers needs the number on file.
 *
 * Usage counts are exact per-org head counts for the current calendar month —
 * same month window as dashboard-stats. Fine at tens of orgs; revisit with a
 * grouped query if the roster ever grows past hundreds.
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

    const { data: orgs, error } = await supabase
      .from("organizations")
      .select(
        "id, name, slug, phone, locale, plan_status, text_limit, active, created_at, stripe_customer_id, stripe_subscription_id, bonus_extra_texts, bonus_expires_at, referral_code, referred_by_org_id"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("admin-orgs-list: org query failed:", error);
      return jsonResponse({ error: "Failed to load companies" }, 500);
    }

    const orgList = orgs ?? [];

    // First login per org (creation order) — the credential the owner uses.
    const { data: users } = await supabase
      .from("users")
      .select("org_id, username, email, created_at")
      .order("created_at", { ascending: true });

    const usernameByOrg = new Map<string, string>();
    for (const u of users ?? []) {
      if (!usernameByOrg.has(u.org_id)) {
        usernameByOrg.set(u.org_id, u.username ?? u.email);
      }
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const usageCounts = await Promise.all(
      orgList.map((o) =>
        supabase
          .from("message_logs")
          .select("id", { count: "exact", head: true })
          .eq("org_id", o.id)
          .gte("sent_at", monthStart)
          .lt("sent_at", monthEnd)
      )
    );

    // Referral rollups — the full roster is already in memory, so who-referred
    // -whom and per-referrer earning counts are pure lookups. "Earning" uses
    // the same rule as the discount engine (utils/referrals.ts).
    const nameById = new Map(orgList.map((o) => [o.id, o.name]));
    const isEarning = (o: (typeof orgList)[number]) =>
      o.active && ["active", "past_due"].includes(o.plan_status);
    const earningReferralsByReferrer = new Map<string, number>();
    for (const o of orgList) {
      if (o.referred_by_org_id && isEarning(o)) {
        earningReferralsByReferrer.set(
          o.referred_by_org_id,
          (earningReferralsByReferrer.get(o.referred_by_org_id) ?? 0) + 1
        );
      }
    }

    const companies = orgList.map((o, i) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      phone: o.phone,
      locale: o.locale ?? "en",
      plan_status: o.plan_status,
      text_limit: o.text_limit,
      active: o.active,
      created_at: o.created_at,
      username: usernameByOrg.get(o.id) ?? null,
      texts_this_month: usageCounts[i].count ?? 0,
      has_stripe: Boolean(o.stripe_subscription_id),
      bonus_extra_texts: o.bonus_extra_texts,
      bonus_expires_at: o.bonus_expires_at,
      referral_code: o.referral_code,
      referred_by_name: o.referred_by_org_id
        ? (nameById.get(o.referred_by_org_id) ?? null)
        : null,
      earning_referrals: earningReferralsByReferrer.get(o.id) ?? 0,
    }));

    return jsonResponse({ companies });
  } catch (err) {
    console.error("admin-orgs-list error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
