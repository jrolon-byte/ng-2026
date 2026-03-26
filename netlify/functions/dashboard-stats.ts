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

    const [smsThisMonth, smsLifetime, contactsCount, campaignsCount] =
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
      ]);

    return jsonResponse({
      sms_this_month: smsThisMonth.count ?? 0,
      sms_lifetime: smsLifetime.count ?? 0,
      total_contacts: contactsCount.count ?? 0,
      total_campaigns: campaignsCount.count ?? 0,
    });
  } catch {
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
