/**
 * Turns a paid Stripe Checkout Session into an organization + owner user.
 *
 * Called from TWO places, and must be safe from both:
 *   - stripe-webhook.ts on `checkout.session.completed`
 *   - signup-claim.ts when the customer lands on /signup/success
 * Whichever the network delivers first provisions; the other finds the org
 * already keyed to the session id (partial unique index, migration 023)
 * and returns it. Neither path ever double-creates, and neither path ever
 * leaves a PAID customer without an account.
 *
 * Pay-first accounts are born WITHOUT a password. The customer sets one on
 * the success page or via the one-time link in the welcome text; until
 * then auth-login answers "finish setting up". See signup-token.ts.
 */
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import twilio from "twilio";
import { recalcReferrerDiscount } from "./referrals";
import { alertAdmin } from "./admin-alert";
import { pushToSuperAdmins } from "./apns";
import { normalizePhone } from "./phone";
import { siteBaseUrl } from "./twilio-numbers";
import {
  parseSignupSession,
  type LegacySignupSessionData,
  type SignupSessionData,
} from "./signup-session";
import { splitFullName, usernameCandidates } from "./signup-username";
import { generateSetupToken } from "./signup-token";

export interface ProvisionResult {
  orgId: string;
  userId: string;
  username: string;
  businessName: string;
  /** True when THIS call created the org (side effects ran); false on replay. */
  created: boolean;
  /** Raw one-time token, present only when this call created a passwordless user. */
  setupToken: string | null;
}

const FIRST_BLAST_TEXT_LIMIT = 100;
const PRO_TEXT_LIMIT = 1500;
const USER_INSERT_ATTEMPTS = 12;
const UNIQUE_VIOLATION = "23505";

function generateSlug(businessName: string): string {
  const base = businessName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");

  const rand = Math.random().toString(36).substring(2, 6);
  return `${base || "shop"}-${rand}`;
}

/** Public app origin for links in customer-facing texts. */
function appBaseUrl(): string {
  return process.env.APP_PUBLIC_URL || siteBaseUrl() || "https://app.notifygrid.com";
}

/**
 * Welcome text from the SHARED platform number (same reasoning as the gift
 * SMS in admin-set-bonus: this is NotifyGrid talking to a shop owner, not
 * the shop talking to itself). Transactional — the recipient just bought.
 * Never throws: the success page is the primary path; this is the backup.
 */
async function sendWelcomeText(
  to: string,
  businessName: string,
  setupToken: string
): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !from) {
    console.error("provisionSignup: Twilio not configured — welcome text NOT sent");
    return;
  }
  const link = `${appBaseUrl()}/welcome?t=${setupToken}`;
  const body =
    `Welcome to NotifyGrid, ${businessName}! Set your password and send your ` +
    `first blast here: ${link} (link expires in 7 days). Reply STOP to opt out.`;
  try {
    await twilio(accountSid, authToken).messages.create({ from, to, body });
  } catch (err) {
    console.error(`provisionSignup: welcome text to ${to} FAILED`, err);
  }
}

async function notifyOperator(
  supabase: SupabaseClient,
  businessName: string,
  slug: string,
  orgId: string,
  isPro: boolean,
  referred: boolean,
  phone: string | null
): Promise<void> {
  const plan = isPro ? "Pro $49/mo" : "First Blast $5";
  const ref = referred ? " · referred" : "";

  // Number provisioning is MANUAL at current volume — buying a Twilio
  // number is ~$1.15/mo forever, and signups are rare enough that
  // automating the spend isn't worth it. So: text James instead.
  // `ensureOrgNumber` in utils/twilio-numbers.ts does the work when ready.
  await alertAdmin(
    `NotifyGrid: new signup — ${businessName} (${slug}). ${plan}${ref}. ` +
      `${phone ?? "no phone"}. Set up a Twilio number to enable replies. Org ${orgId}`
  );

  // Same news, on the phone he actually looks at. Additive: push depends on
  // a registered device and a live APNs key, and a signup is the one event
  // that must not be missed because a token went stale.
  await pushToSuperAdmins(supabase, {
    title: "New signup",
    body: `${businessName} — ${plan}${ref}. Needs a Twilio number.`,
    threadId: "signup",
  });
}

async function findExistingBySession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<ProvisionResult | null> {
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  if (!org) return null;

  const { data: user } = await supabase
    .from("users")
    .select("id, username")
    .eq("org_id", org.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!user) {
    // Org exists but its user insert lost — the creating path rolls the org
    // back on that failure, so this is a transient mid-flight read.
    return null;
  }

  return {
    orgId: org.id,
    userId: user.id,
    username: user.username,
    businessName: org.name,
    created: false,
    setupToken: null,
  };
}

async function usernameIsFree(supabase: SupabaseClient, candidate: string): Promise<boolean> {
  const { data } = await supabase
    .from("users")
    .select("id")
    .or(`username.eq.${candidate},email.eq.${candidate}@notifygrid.app`)
    .limit(1)
    .maybeSingle();
  return !data;
}

async function provisionPayFirst(
  supabase: SupabaseClient,
  stripe: Stripe,
  data: SignupSessionData
): Promise<ProvisionResult> {
  const existing = await findExistingBySession(supabase, data.sessionId);
  if (existing) return existing;

  const slug = generateSlug(data.businessName);
  const phone = data.phone ? normalizePhone(data.phone) : null;
  const phoneE164 = phone && "e164" in phone ? phone.e164 : data.phone;

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: data.businessName,
      slug,
      phone: phoneE164,
      plan_status: data.isPro ? "active" : "first_blast",
      stripe_customer_id: data.customerId,
      stripe_checkout_session_id: data.sessionId,
      text_limit: data.isPro ? PRO_TEXT_LIMIT : FIRST_BLAST_TEXT_LIMIT,
      ...(data.isPro && data.subscriptionId
        ? { stripe_subscription_id: data.subscriptionId }
        : {}),
      ...(data.referredByOrgId ? { referred_by_org_id: data.referredByOrgId } : {}),
    })
    .select("id")
    .single();

  if (orgError) {
    if (orgError.code === UNIQUE_VIOLATION) {
      // Lost the race to the other provisioning path — read its result.
      const winner = await findExistingBySession(supabase, data.sessionId);
      if (winner) return winner;
    }
    throw new Error(`provisionSignup: org insert failed — ${orgError.message}`);
  }

  const { first_name, last_name } = splitFullName(data.fullName, data.businessName);
  const setup = generateSetupToken();

  let username: string | null = null;
  let userId: string | null = null;
  let attempts = 0;

  for (const candidate of usernameCandidates(data.businessName)) {
    if (attempts++ >= USER_INSERT_ATTEMPTS) break;
    if (!(await usernameIsFree(supabase, candidate))) continue;

    // Real email when Stripe collected one and nobody else owns it; the
    // synthetic address otherwise (users.email is UNIQUE NOT NULL and a
    // paid signup must never fail on it).
    const emailCandidates = [data.email, `${candidate}@notifygrid.app`].filter(
      (e): e is string => !!e
    );

    for (const email of emailCandidates) {
      const { data: user, error } = await supabase
        .from("users")
        .insert({
          org_id: org.id,
          username: candidate,
          email,
          password_hash: null,
          setup_token_hash: setup.hash,
          setup_token_expires_at: setup.expiresAt,
          first_name,
          last_name,
          role: "admin",
        })
        .select("id")
        .single();

      if (!error && user) {
        username = candidate;
        userId = user.id;
        break;
      }
      if (error?.code !== UNIQUE_VIOLATION) {
        await supabase.from("organizations").delete().eq("id", org.id);
        throw new Error(`provisionSignup: user insert failed — ${error?.message}`);
      }
      // Unique violation: on the email → try the synthetic one; on the
      // username → the outer loop moves to the next candidate.
      if (!(error.details ?? "").includes("(email)")) break;
    }
    if (userId) break;
  }

  if (!userId || !username) {
    // An orphan org must never survive (referred orphans are born "active"
    // and would count toward the referrer's discount).
    await supabase.from("organizations").delete().eq("id", org.id);
    throw new Error("provisionSignup: could not find a free username");
  }

  // ── Side effects, first provision only ──
  if (data.isPro && data.referredByOrgId) {
    // A referred Pro signup is EARNING from day one.
    await recalcReferrerDiscount(supabase, stripe, data.referredByOrgId);
  }

  if (phoneE164) {
    await sendWelcomeText(phoneE164, data.businessName, setup.token);
  } else {
    console.error(`provisionSignup: org ${org.id} has no phone — welcome text skipped`);
  }

  await notifyOperator(
    supabase,
    data.businessName,
    slug,
    org.id,
    data.isPro,
    !!data.referredByOrgId,
    phoneE164
  );

  return {
    orgId: org.id,
    userId,
    username,
    businessName: data.businessName,
    created: true,
    setupToken: setup.token,
  };
}

/**
 * Sessions minted by the pre-2026-09 signup form: metadata carries the
 * username and a bcrypt hash, the customer already chose a password, no
 * setup token is needed. Idempotent on username (the old natural key).
 * Delete this branch once every such session has expired (24 h after the
 * pay-first deploy).
 */
async function provisionLegacy(
  supabase: SupabaseClient,
  stripe: Stripe,
  data: LegacySignupSessionData
): Promise<ProvisionResult> {
  const { metadata } = data;

  const { data: alreadyProvisioned } = await supabase
    .from("users")
    .select("id, org_id, username")
    .eq("username", metadata.username)
    .maybeSingle();

  if (alreadyProvisioned) {
    return {
      orgId: alreadyProvisioned.org_id,
      userId: alreadyProvisioned.id,
      username: alreadyProvisioned.username,
      businessName: metadata.business_name,
      created: false,
      setupToken: null,
    };
  }

  const slug = generateSlug(metadata.business_name);
  const isPro = metadata.signup_plan === "pro";

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: metadata.business_name,
      slug,
      phone: metadata.phone,
      plan_status: isPro ? "active" : "first_blast",
      stripe_customer_id: data.customerId,
      stripe_checkout_session_id: data.sessionId,
      text_limit: isPro ? PRO_TEXT_LIMIT : FIRST_BLAST_TEXT_LIMIT,
      ...(isPro && data.subscriptionId ? { stripe_subscription_id: data.subscriptionId } : {}),
      ...(metadata.referred_by_org_id ? { referred_by_org_id: metadata.referred_by_org_id } : {}),
    })
    .select("id")
    .single();

  if (orgError) throw new Error(`provisionSignup(legacy): org insert failed — ${orgError.message}`);

  const placeholderEmail = `${metadata.username}@notifygrid.app`;
  const newUser = {
    org_id: org.id,
    username: metadata.username,
    password_hash: metadata.password_hash || metadata.password,
    first_name: metadata.first_name,
    last_name: metadata.last_name,
    role: "admin",
  };

  let { data: user, error: userError } = await supabase
    .from("users")
    .insert({ ...newUser, email: data.email || placeholderEmail })
    .select("id")
    .single();

  if (userError?.code === UNIQUE_VIOLATION && data.email) {
    ({ data: user, error: userError } = await supabase
      .from("users")
      .insert({ ...newUser, email: placeholderEmail })
      .select("id")
      .single());
  }

  if (userError || !user) {
    await supabase.from("organizations").delete().eq("id", org.id);
    throw new Error(`provisionSignup(legacy): user insert failed — ${userError?.message}`);
  }

  if (isPro && metadata.referred_by_org_id) {
    await recalcReferrerDiscount(supabase, stripe, metadata.referred_by_org_id);
  }

  await notifyOperator(
    supabase,
    metadata.business_name,
    slug,
    org.id,
    isPro,
    !!metadata.referred_by_org_id,
    metadata.phone ?? null
  );

  return {
    orgId: org.id,
    userId: user.id,
    username: metadata.username,
    businessName: metadata.business_name,
    created: true,
    setupToken: null,
  };
}

/**
 * Returns null when the session is not a signup (e.g. an upgrade).
 * Throws on a hard failure so the caller can 500 (webhook → Stripe retries;
 * claim → success page keeps polling).
 */
export async function provisionSignup(
  supabase: SupabaseClient,
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<ProvisionResult | null> {
  const parsed = parseSignupSession(session);
  if (!parsed) return null;
  return parsed.kind === "legacy"
    ? provisionLegacy(supabase, stripe, parsed)
    : provisionPayFirst(supabase, stripe, parsed);
}
