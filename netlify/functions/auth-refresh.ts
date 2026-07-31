import jwt from "jsonwebtoken";
import { getSupabase } from "./utils/supabase";
import { corsResponse, jsonResponse } from "./utils/cors";
import { signToken, type JwtPayload } from "./utils/auth";

/**
 * Token refresh — additive, built for the iOS app (a 7-day JWT with no
 * refresh path means a forced re-login every week). The web client's
 * sessionStorage behavior is unchanged; it simply doesn't call this.
 *
 * Accepts a currently-valid token OR one expired within the grace window,
 * then re-verifies against the database before minting: the user must still
 * exist and be active, and their org must still be active — mirroring the
 * deactivated-org 403 in auth-login, otherwise a deactivated org could
 * refresh itself back to life forever. Claims are re-read fresh from the DB
 * so renames/role changes propagate on refresh.
 */

// How long past expiry a token can still be exchanged. Two weeks: an app
// opened at least every 3 weeks (7d validity + 14d grace) never re-logins.
const EXPIRY_GRACE_SECONDS = 14 * 24 * 60 * 60;

export default async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Missing or invalid Authorization header" }, 401);
  }
  const token = authHeader.slice(7);

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("auth-refresh: missing JWT_SECRET");
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  // Verify signature while tolerating expiry, then apply our own grace
  // window — a forged or ancient token never gets past this.
  let payload: JwtPayload & { exp?: number };
  try {
    payload = jwt.verify(token, secret, { ignoreExpiration: true }) as JwtPayload & {
      exp?: number;
    };
  } catch {
    return jsonResponse({ error: "Invalid token" }, 401);
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp && nowSeconds > payload.exp + EXPIRY_GRACE_SECONDS) {
    return jsonResponse({ error: "Token expired too long ago — please log in again" }, 401);
  }

  try {
    const supabase = getSupabase();

    // Fresh truth from the DB — never re-mint from stale claims alone.
    const { data: user } = await supabase
      .from("users")
      .select("id, email, org_id, first_name, last_name, username, role, active, token_version")
      .eq("id", payload.id)
      .maybeSingle();

    if (!user || user.active === false) {
      return jsonResponse({ error: "Account no longer available — please log in again" }, 401);
    }

    // Revocation check: a bumped users.token_version invalidates every
    // outstanding token at its next refresh. Tokens minted before the claim
    // existed (no token_version) pass — they age out within 7 days anyway.
    if (
      payload.token_version !== undefined &&
      payload.token_version !== (user.token_version ?? 0)
    ) {
      return jsonResponse({ error: "Session revoked — please log in again" }, 401);
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("active")
      .eq("id", user.org_id)
      .single();

    if (org && org.active === false) {
      return jsonResponse(
        { error: "This account has been deactivated. Contact NotifyGrid support." },
        403
      );
    }

    const freshPayload = {
      id: user.id,
      email: user.email,
      org_id: user.org_id,
      first_name: user.first_name,
      role: user.role,
      token_version: user.token_version ?? 0,
    };

    return jsonResponse({
      token: signToken(freshPayload),
      user: { ...freshPayload, username: user.username, last_name: user.last_name },
    });
  } catch (err) {
    console.error("auth-refresh error:", err);
    return jsonResponse({ error: "Something went wrong" }, 500);
  }
};
