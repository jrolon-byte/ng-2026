import type { Config } from "@netlify/functions";
import { getSupabase } from "./utils/supabase";
import { jsonResponse } from "./utils/cors";

export async function ping() {
  const supabase = getSupabase();
  const { error } = await supabase.from("contacts").select("id").limit(1);

  if (error) {
    return jsonResponse({ ok: false, error: error.message }, 500);
  }

  return jsonResponse({ ok: true, message: "Keep-alive ping successful" });
}

export default async function handler() {
  return ping();
}

export const config: Config = {
  schedule: "@daily",
};
