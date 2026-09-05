/**
 * POST { token, password } — the customer chooses their password.
 *
 * Reached from /signup/success (token from signup-claim) or /welcome?t=
 * (token from the welcome text). Single-use and time-boxed: the row must
 * still have NO password and an unexpired matching token hash. The update
 * is conditional on `password_hash IS NULL`, so two tabs racing can only
 * succeed once.
 *
 * On success it answers with the SAME shape as auth-login (token + user),
 * so the client adopts the session through the existing AuthContext and
 * lands in /engage without a second sign-in.
 */
import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { hashPassword, signToken } from "./utils/auth";
import {
  hashSetupToken,
  isPlausibleSetupToken,
  isSetupTokenExpired,
} from "./utils/signup-token";

const MIN_PASSWORD_LENGTH = 8;

export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { token, password } = await req.json();

    if (!isPlausibleSetupToken(token)) {
      return jsonResponse({ error: "This setup link isn't valid" }, 400);
    }
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return jsonResponse(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        400
      );
    }

    const supabase = getSupabase();
    const tokenHash = hashSetupToken(token);

    const { data: user } = await supabase
      .from("users")
      .select(
        "id, username, email, org_id, first_name, last_name, role, password_hash, setup_token_expires_at, token_version, super_admin"
      )
      .eq("setup_token_hash", tokenHash)
      .maybeSingle();

    if (!user) {
      return jsonResponse({ error: "This setup link isn't valid or was already used" }, 404);
    }
    if (user.password_hash) {
      return jsonResponse({ error: "A password is already set — just log in" }, 409);
    }
    if (isSetupTokenExpired(user.setup_token_expires_at)) {
      return jsonResponse(
        { error: "This setup link has expired. Text us and we'll send a fresh one." },
        410
      );
    }

    const password_hash = await hashPassword(password);

    // Conditional on the password still being unset: the losing tab of a
    // race gets zero rows back and a clean 409, never a silent overwrite.
    const { data: updated, error } = await supabase
      .from("users")
      .update({
        password_hash,
        setup_token_hash: null,
        setup_token_expires_at: null,
      })
      .eq("id", user.id)
      .is("password_hash", null)
      .select("id");

    if (error) {
      console.error("signup-set-password: update failed", error);
      return jsonResponse({ error: "Something went wrong" }, 500);
    }
    if (!updated || updated.length === 0) {
      return jsonResponse({ error: "A password is already set — just log in" }, 409);
    }

    const payload = {
      id: user.id,
      email: user.email,
      org_id: user.org_id,
      first_name: user.first_name,
      role: user.role,
      token_version: user.token_version ?? 0,
    };

    return jsonResponse({
      token: signToken(payload),
      user: {
        ...payload,
        username: user.username,
        last_name: user.last_name,
        super_admin: user.super_admin === true,
      },
    });
  } catch (err) {
    console.error("signup-set-password error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
