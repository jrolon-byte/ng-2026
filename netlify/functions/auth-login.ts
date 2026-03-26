import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { comparePassword, signToken } from "./utils/auth";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return jsonResponse({ error: "Username and password are required" }, 400);
    }

    const supabase = getSupabase();

    // --- Rate limiting: check recent failed attempts ---
    const windowStart = new Date(
      Date.now() - LOCKOUT_MINUTES * 60 * 1000
    ).toISOString();

    const { count: recentAttempts } = await supabase
      .from("login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("username", username.toLowerCase())
      .gte("attempted_at", windowStart);

    if (recentAttempts !== null && recentAttempts >= MAX_ATTEMPTS) {
      return jsonResponse(
        { error: "Too many failed attempts. Try again in 15 minutes." },
        429
      );
    }

    // --- Find user by username, fall back to email ---
    let { data: user, error } = await supabase
      .from("users")
      .select("id, username, email, org_id, first_name, last_name, role, password_hash")
      .eq("username", username)
      .single();

    if (error || !user) {
      const fallback = await supabase
        .from("users")
        .select("id, username, email, org_id, first_name, last_name, role, password_hash")
        .eq("email", username)
        .single();
      user = fallback.data;
      error = fallback.error;
    }

    if (error || !user) {
      // Log failed attempt
      await supabase
        .from("login_attempts")
        .insert({ username: username.toLowerCase() });
      return jsonResponse({ error: "Invalid credentials" }, 401);
    }

    // --- Verify password ---
    let passwordValid = false;
    if (user.password_hash.startsWith("$2")) {
      passwordValid = await comparePassword(password, user.password_hash);
    } else {
      passwordValid = user.password_hash === password;
      if (passwordValid) {
        const { hashPassword } = await import("./utils/auth");
        const hashed = await hashPassword(password);
        await supabase
          .from("users")
          .update({ password_hash: hashed })
          .eq("id", user.id);
      }
    }

    if (!passwordValid) {
      // Log failed attempt
      await supabase
        .from("login_attempts")
        .insert({ username: username.toLowerCase() });
      return jsonResponse({ error: "Invalid credentials" }, 401);
    }

    // --- Success: clean up old attempts for this user ---
    await supabase
      .from("login_attempts")
      .delete()
      .eq("username", username.toLowerCase());

    const payload = {
      id: user.id,
      email: user.email,
      org_id: user.org_id,
      first_name: user.first_name,
      role: user.role,
    };

    const token = signToken(payload);

    return jsonResponse({
      token,
      user: { ...payload, username: user.username, last_name: user.last_name },
    });
  } catch {
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
