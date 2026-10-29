import { randomBytes } from "node:crypto";
import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";
import { REFERRAL_CREDIT_CENTS, isSuccessfulReferral } from "./utils/referrals";

/**
 * The current org's referral card: its shareable code (lazily generated on
 * first open — no backfill needed for existing orgs), the referrals it has
 * made with their status, and the one-time credit they earned.
 *
 * Statuses: "credited" (the referrer got their $5 for this one), "pending"
 * (signed up, not a paying subscriber yet, or the referrer has no Stripe
 * customer to credit), "ended" (cancelled or deactivated before ever being
 * credited). A credited referral stays credited after it cancels: the $5
 * was one-time and is already theirs.
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
      .select("name, plan_status, active, created_at, referral_credited_at")
      .eq("referred_by_org_id", org.id)
      .order("created_at", { ascending: false });

    const rows = (referrals ?? []).map((r) => {
      const status = r.referral_credited_at
        ? "credited"
        : !r.active || r.plan_status === "cancelled"
          ? "ended"
          : isSuccessfulReferral(r)
            ? "pending" // paying, but the referrer has no Stripe customer yet
            : "pending";
      return { name: r.name, status, since: r.created_at };
    });

    const creditedCount = rows.filter((r) => r.status === "credited").length;
    const creditCents = creditedCount * REFERRAL_CREDIT_CENTS;

    return jsonResponse({
      code,
      locale: org.locale ?? "en",
      referrals: rows,
      credited_count: creditedCount,
      credit_cents: creditCents,
      // Kept for clients built against the recurring-credit shape; same
      // numbers, one-time meaning.
      earning_count: creditedCount,
      monthly_credit_cents: creditCents,
    });
  } catch (err) {
    console.error("referrals-stats error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
