import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { authenticateRequest } from "./utils/auth";

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

    // Next month reset date
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [smsThisMonth, smsLifetime, contactsCount, campaignsCount, orgData] =
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
      ]);

    const textLimit = orgData.data?.text_limit ?? 600;
    const textsUsed = smsThisMonth.count ?? 0;
    const activeContacts = contactsCount.count ?? 0;
    // Grace: 2 extra campaigns worth of contacts
    const graceLimit = textLimit + (activeContacts * 2);

    return jsonResponse({
      sms_this_month: textsUsed,
      sms_lifetime: smsLifetime.count ?? 0,
      total_contacts: activeContacts,
      total_campaigns: campaignsCount.count ?? 0,
      text_limit: textLimit,
      grace_limit: graceLimit,
      reset_date: resetDate.toISOString(),
    });
  } catch {
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
