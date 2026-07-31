import twilio from "twilio";

/**
 * Text James when something needs a human.
 *
 * NotifyGrid is a two-person operation, so a handful of operational steps are
 * deliberately manual rather than automated — buying a Twilio number for a new
 * shop costs real money every month and isn't worth automating at this volume.
 * The tradeoff is that James has to *find out*, which is what this is for.
 *
 * Never throws. An alert failing must never fail the signup that triggered it.
 */

/**
 * Where alerts go.
 *
 * ⚠️ Set `ADMIN_ALERT_PHONE` in the Netlify environment. The literal below is
 * only a fallback so alerts can't silently vanish if the env var is missing —
 * but if `ng-2026` is a public repo, move it to the env var and delete this.
 */
const FALLBACK_ADMIN_PHONE = "+14072366630";

function adminPhone(): string {
  return process.env.ADMIN_ALERT_PHONE || FALLBACK_ADMIN_PHONE;
}

export async function alertAdmin(message: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  const to = adminPhone();

  if (!accountSid || !authToken || !from) {
    // Loud, because a missed operational alert is the whole failure mode.
    console.error(`alertAdmin: Twilio not configured — ALERT NOT SENT: ${message}`);
    return;
  }

  try {
    await twilio(accountSid, authToken).messages.create({ from, to, body: message });
    console.log(`alertAdmin: sent to ${to}`);
  } catch (err) {
    console.error(`alertAdmin: FAILED to send — ${message}`, err);
  }
}
