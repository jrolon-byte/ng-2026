import { randomBytes } from "node:crypto";
import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";
import { REFERRAL_CREDIT_CENTS } from "./utils/referrals";

/**
 * The current org's referral card: its shareable code (lazily generated on
 * first open — no backfill needed for existing orgs), the referrals it has
 * made with their status, and the resulting monthly credit.
 *
 * A referral shows as "earning" once it's an active paying subscriber
 * (plan_status active/past_due + org active) — same rule the discount
 * engine counts. Signed-up-but-not-upgraded referrals show as "pending"
 * so the referrer sees their pipeline, not just their payoff.
 */

function generateReferralCode(orgName: string): string {
  const prefix = orgName
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 6) || "GRID";
  // node:crypto, not globalThis.crypto — the webcrypto global isn't
  // guaranteed across Netlify's Node runtime versions.
  const alphabet = "ACDEFHJKLMNPRTUVWXY345679";
  const rand = Array.from(randomBytes(4))
    .map((b) => alphabet[b % alphabet.length])
    .join("");
  return `${prefix}-${rand}`;
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const supabase = getSupabase();

    const { data: org } = await supabase
      .from("organizations")
      .select("id, name, referral_code, locale")
      .eq("id", auth.org_id)
      .single();

    if (!org) {
      return jsonResponse({ error: "Organization not found" }, 404);
    }

    // Lazy code generation, retried once on the unlikely unique collision.
    // .is(referral_code, null) guards the write: a concurrent first-open
    // must never overwrite a code the owner may have already shared.
    let code = org.referral_code as string | null;
    for (let attempt = 0; attempt < 2 && !code; attempt++) {
      const candidate = generateReferralCode(org.name);
      const { data: updated, error } = await supabase
        .from("organizations")
        .update({ referral_code: candidate })
        .eq("id", org.id)
        .is("referral_code", null)
        .select("referral_code")
        .maybeSingle();
      if (error && error.code !== "23505") {
        console.error("referrals-stats: code generation failed:", error);
        return jsonResponse({ error: "Failed to generate referral code" }, 500);
      }
      if (updated?.referral_code) {
        code = updated.referral_code;
      } else if (!error) {
        // Zero rows updated — a concurrent request won; read their code.
        const { data: refetched } = await supabase
          .from("organizations")
          .select("referral_code")
          .eq("id", org.id)
          .single();
        if (refetched?.referral_code) code = refetched.referral_code;
      }
    }

    const { data: referrals } = await supabase
      .from("organizations")
      .select("name, plan_status, active, created_at")
      .eq("referred_by_org_id", org.id)
      .order("created_at", { ascending: false });

    const rows = (referrals ?? []).map((r) => {
      const earning = r.active && ["active", "past_due"].includes(r.plan_status);
      const status = earning
        ? "earning"
        : !r.active || r.plan_status === "cancelled"
          ? "ended"
          : "pending";
      return { name: r.name, status, since: r.created_at };
    });

    const earningCount = rows.filter((r) => r.status === "earning").length;

    return jsonResponse({
      code,
      locale: org.locale ?? "en",
      referrals: rows,
      earning_count: earningCount,
      monthly_credit_cents: earningCount * REFERRAL_CREDIT_CENTS,
    });
  } catch (err) {
    console.error("referrals-stats error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
