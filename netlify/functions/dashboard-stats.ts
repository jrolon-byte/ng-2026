import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";
import { computeGraceLimit, currentMonthWindow } from "./utils/usage";

const COST_PER_SMS = 0.011; // $0.0079 Twilio + ~$0.003 carrier fees
const PHONE_MONTHLY = 1.15;

export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = authenticateRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const supabase = getSupabase();

    const now = new Date();
    const { monthStart, monthEnd } = currentMonthWindow(now);
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [smsThisMonth, smsLifetime, contactsCount, campaignsCount, orgData, userData] =
      await Promise.all([
        // .neq failed on both: rejected sends never reached anyone — they
        // don't consume allowance (mirrors the campaign-send gate) and
        // shouldn't inflate lifetime bragging numbers either.
        supabase
          .from("message_logs")
          .select("id", { count: "exact", head: true })
          .eq("org_id", auth.org_id)
          .neq("status", "failed")
          .gte("sent_at", monthStart)
          .lt("sent_at", monthEnd),

        supabase
          .from("message_logs")
          .select("id", { count: "exact", head: true })
          .eq("org_id", auth.org_id)
          .neq("status", "failed"),

        supabase
          .from("contacts")
          .select("id", { count: "exact", head: true })
          .eq("org_id", auth.org_id)
          .eq("active", true),

        supabase
          .from("campaigns")
          .select("id", { count: "exact", head: true })
          .eq("org_id", auth.org_id),

        supabase
          .from("organizations")
          .select("text_limit, bonus_extra_texts, bonus_expires_at, bonus_note, locale")
          .eq("id", auth.org_id)
          .single(),

        supabase
          .from("users")
          .select("super_admin")
          .eq("id", auth.id)
          .single(),
      ]);

    const textLimit = orgData.data?.text_limit ?? 600;
    const textsUsed = smsThisMonth.count ?? 0;
    const activeContacts = contactsCount.count ?? 0;

    // Shared formula — utils/usage.ts (same math the send gate enforces).
    const bonusExtra = orgData.data?.bonus_extra_texts ?? 0;
    const bonusExpiresAt = orgData.data?.bonus_expires_at as string | null;
    const bonusNote = (orgData.data?.bonus_note as string | null) ?? null;
    const { graceLimit, bonusActive } = computeGraceLimit({
      textLimit,
      contactCount: activeContacts,
      bonusExtra,
      bonusExpiresAt,
      now,
    });
    const isSuperAdmin = userData.data?.super_admin === true;

    const response: Record<string, unknown> = {
      sms_this_month: textsUsed,
      sms_lifetime: smsLifetime.count ?? 0,
      total_contacts: activeContacts,
      total_campaigns: campaignsCount.count ?? 0,
      text_limit: textLimit,
      grace_limit: graceLimit,
      reset_date: resetDate.toISOString(),
      bonus: bonusActive && bonusNote
        ? { extra_texts: bonusExtra, expires_at: bonusExpiresAt, note: bonusNote }
        : null,
      locale: (orgData.data?.locale as string | null) ?? 'en',
    };

    // Super admin gets global cost data across ALL orgs
    if (isSuperAdmin) {
      const [globalMonth, globalLifetime, totalOrgs, orgsWithNumbers] = await Promise.all([
        // Failed sends cost ~$0 at Twilio — excluding them makes the cost
        // estimator track real spend.
        supabase
          .from("message_logs")
          .select("id", { count: "exact", head: true })
          .neq("status", "failed")
          .gte("sent_at", monthStart)
          .lt("sent_at", monthEnd),

        supabase
          .from("message_logs")
          .select("id", { count: "exact", head: true })
          .neq("status", "failed"),

        supabase
          .from("organizations")
          .select("id", { count: "exact", head: true })
          .eq("active", true),

        // Each org with its own Twilio number is a separate ~$1.15/mo line.
        supabase
          .from("organizations")
          .select("id", { count: "exact", head: true })
          .not("twilio_phone_number", "is", null),
      ]);

      const globalMonthCount = globalMonth.count ?? 0;
      const globalLifetimeCount = globalLifetime.count ?? 0;
      const orgCount = totalOrgs.count ?? 0;

      // Phone rental used to be a flat $1.15 because the whole platform shared
      // one number. With per-org numbers it scales, plus the shared fallback
      // number if one is still configured.
      const provisionedNumbers = orgsWithNumbers.count ?? 0;
      const sharedNumbers = process.env.TWILIO_PHONE_NUMBER ? 1 : 0;
      const phoneCost = parseFloat(
        ((provisionedNumbers + sharedNumbers) * PHONE_MONTHLY).toFixed(2)
      );

      response.admin = {
        global_sms_this_month: globalMonthCount,
        global_sms_lifetime: globalLifetimeCount,
        cost_this_month: parseFloat((globalMonthCount * COST_PER_SMS + phoneCost).toFixed(2)),
        cost_lifetime: parseFloat((globalLifetimeCount * COST_PER_SMS).toFixed(2)),
        phone_monthly: phoneCost,
        total_orgs: orgCount,
      };
    }

    return jsonResponse(response);
  } catch {
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
