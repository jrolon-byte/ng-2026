import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";

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
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [smsThisMonth, smsLifetime, contactsCount, campaignsCount, orgData, userData] =
      await Promise.all([
        supabase
          .from("message_logs")
          .select("id", { count: "exact", head: true })
          .eq("org_id", auth.org_id)
          .gte("sent_at", monthStart)
          .lt("sent_at", monthEnd),

        supabase
          .from("message_logs")
          .select("id", { count: "exact", head: true })
          .eq("org_id", auth.org_id),

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
          .select("text_limit")
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
    const graceLimit = textLimit + (activeContacts * 2);
    const isSuperAdmin = userData.data?.super_admin === true;

    const response: Record<string, unknown> = {
      sms_this_month: textsUsed,
      sms_lifetime: smsLifetime.count ?? 0,
      total_contacts: activeContacts,
      total_campaigns: campaignsCount.count ?? 0,
      text_limit: textLimit,
      grace_limit: graceLimit,
      reset_date: resetDate.toISOString(),
    };

    // Super admin gets global cost data across ALL orgs
    if (isSuperAdmin) {
      const [globalMonth, globalLifetime, totalOrgs] = await Promise.all([
        supabase
          .from("message_logs")
          .select("id", { count: "exact", head: true })
          .gte("sent_at", monthStart)
          .lt("sent_at", monthEnd),

        supabase
          .from("message_logs")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("organizations")
          .select("id", { count: "exact", head: true })
          .eq("active", true),
      ]);

      const globalMonthCount = globalMonth.count ?? 0;
      const globalLifetimeCount = globalLifetime.count ?? 0;
      const orgCount = totalOrgs.count ?? 0;

      response.admin = {
        global_sms_this_month: globalMonthCount,
        global_sms_lifetime: globalLifetimeCount,
        cost_this_month: parseFloat((globalMonthCount * COST_PER_SMS + PHONE_MONTHLY).toFixed(2)),
        cost_lifetime: parseFloat((globalLifetimeCount * COST_PER_SMS).toFixed(2)),
        phone_monthly: PHONE_MONTHLY,
        total_orgs: orgCount,
      };
    }

    return jsonResponse(response);
  } catch {
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
