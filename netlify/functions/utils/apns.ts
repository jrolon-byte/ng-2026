import * as http2 from "node:http2";
import * as crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * APNs sender — Apple push, no SDK.
 *
 * APNs only speaks HTTP/2, which Node's `fetch` (undici) doesn't do, so this
 * uses `node:http2` directly. Auth is a JWT signed ES256 with the .p8 key
 * from the Apple developer portal.
 *
 * Env (feature is DARK until these are set — every entry point no-ops
 * gracefully so a missing key can never break the webhook that called it):
 *   APNS_TEAM_ID      Apple team (matches DEVELOPMENT_TEAM in the iOS repo)
 *   APNS_KEY_ID       the .p8 key's id
 *   APNS_PRIVATE_KEY  the .p8 file contents (PEM; \n-escaped is fine)
 *   APNS_TOPIC        bundle id — defaults to com.roloniumcapital.notifygrid
 *   APNS_ENV          "production" (default) | "sandbox". TestFlight and the
 *                     App Store are PRODUCTION; only Xcode debug builds are
 *                     sandbox. A sandbox token pushed to the wrong host gets
 *                     BadDeviceToken, is pruned, and re-registers on next
 *                     launch — annoying in dev, harmless in prod.
 *
 * Never throws. A push failing must never fail the reply/campaign that
 * triggered it.
 */

interface ApnsConfig {
  teamId: string;
  keyId: string;
  privateKey: string;
  topic: string;
  host: string;
}

function getConfig(): ApnsConfig | null {
  const teamId = process.env.APNS_TEAM_ID;
  const keyId = process.env.APNS_KEY_ID;
  const rawKey = process.env.APNS_PRIVATE_KEY;
  if (!teamId || !keyId || !rawKey) return null;

  return {
    teamId,
    keyId,
    privateKey: rawKey.replace(/\\n/g, "\n"),
    topic: process.env.APNS_TOPIC || "com.roloniumcapital.notifygrid",
    host:
      process.env.APNS_ENV === "sandbox"
        ? "https://api.sandbox.push.apple.com"
        : "https://api.push.apple.com",
  };
}

/** ES256 provider JWT. APNs wants raw R||S signatures (ieee-p1363), not DER. */
function providerToken(config: ApnsConfig): string {
  const b64 = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  const unsigned =
    b64({ alg: "ES256", kid: config.keyId }) +
    "." +
    b64({ iss: config.teamId, iat: Math.floor(Date.now() / 1000) });
  const signature = crypto
    .sign("sha256", Buffer.from(unsigned), {
      key: config.privateKey,
      dsaEncoding: "ieee-p1363",
    })
    .toString("base64url");
  return `${unsigned}.${signature}`;
}

interface PushResult {
  token: string;
  status: number;
  reason: string | null;
}

/** One HTTP/2 session for the batch, one stream per token. */
function pushToTokens(
  config: ApnsConfig,
  jwt: string,
  tokens: string[],
  payload: object
): Promise<PushResult[]> {
  return new Promise((resolve) => {
    const client = http2.connect(config.host);
    const results: PushResult[] = [];
    let settled = 0;

    const finish = () => {
      if (++settled === tokens.length) {
        client.close();
        resolve(results);
      }
    };

    client.on("error", (err) => {
      // Connection-level failure — report every unsettled token and bail.
      console.error("apns: connection error", err);
      client.close();
      resolve(results);
    });

    const body = JSON.stringify(payload);

    for (const token of tokens) {
      const stream = client.request({
        ":method": "POST",
        ":path": `/3/device/${token}`,
        authorization: `bearer ${jwt}`,
        "apns-topic": config.topic,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "content-type": "application/json",
      });

      let status = 0;
      let responseBody = "";
      stream.on("response", (headers) => {
        status = Number(headers[":status"] ?? 0);
      });
      stream.on("data", (chunk) => {
        responseBody += chunk;
      });
      stream.on("end", () => {
        let reason: string | null = null;
        if (status !== 200 && responseBody) {
          try {
            reason = JSON.parse(responseBody).reason ?? null;
          } catch {
            reason = responseBody.slice(0, 80);
          }
        }
        results.push({ token, status, reason });
        finish();
      });
      stream.on("error", (err) => {
        results.push({ token, status: 0, reason: String(err) });
        finish();
      });
      stream.end(body);
    }
  });
}

/**
 * Push an alert to every registered device in an org.
 *
 * Tokens Apple reports as dead (410 Unregistered — uninstalled app — or
 * 400 BadDeviceToken — wrong environment) are pruned; a live device simply
 * re-registers on its next launch.
 */
export async function pushToOrg(
  supabase: SupabaseClient,
  orgId: string,
  alert: { title: string; body: string; threadId?: string }
): Promise<void> {
  try {
    const config = getConfig();
    if (!config) return; // feature dark — no key configured yet

    const { data: rows } = await supabase
      .from("device_tokens")
      .select("token")
      .eq("org_id", orgId);

    const tokens = (rows ?? []).map((r) => r.token);
    if (tokens.length === 0) return;

    const payload = {
      aps: {
        alert: { title: alert.title, body: alert.body },
        sound: "default",
        ...(alert.threadId ? { "thread-id": alert.threadId } : {}),
      },
    };

    const results = await pushToTokens(config, providerToken(config), tokens, payload);

    const dead = results.filter(
      (r) => r.status === 410 || (r.status === 400 && r.reason === "BadDeviceToken")
    );
    if (dead.length > 0) {
      await supabase
        .from("device_tokens")
        .delete()
        .in("token", dead.map((r) => r.token));
      console.log(`apns: pruned ${dead.length} dead token(s)`);
    }

    const failed = results.filter((r) => r.status !== 200 && !dead.some((d) => d.token === r.token));
    if (failed.length > 0) {
      console.error("apns: failures", failed.map((f) => `${f.status}:${f.reason}`).join(", "));
    }
  } catch (err) {
    console.error("apns: unhandled", err);
  }
}
