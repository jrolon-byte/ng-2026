#!/usr/bin/env node
/**
 * One-time: pull historical inbound replies out of Twilio into
 * `inbound_messages`, and point an org at the number that received them.
 *
 * WHY
 *   Customers have been replying to blasts since June 2025 — asking for a
 *   chair, asking if Tony's open — and nothing in the product ever looked.
 *   Twilio has them all. The webhook only catches replies from the moment
 *   it's live, so without this the conversation threads open empty on a year
 *   of real messages that already exist.
 *
 * USAGE
 *   Dry run (default — writes nothing):
 *     node --env-file=.env scripts/import-twilio-replies.mjs <org-id>
 *
 *   Apply:
 *     node --env-file=.env scripts/import-twilio-replies.mjs <org-id> --apply
 *
 * WHAT --apply DOES
 *   1. Sets organizations.twilio_phone_number = TWILIO_PHONE_NUMBER for the
 *      given org, so twilio-inbound.ts can route future replies to it.
 *   2. Inserts every historical inbound message for that number, matched to
 *      contacts by phone where possible.
 *
 *   Idempotent: inbound_messages.twilio_sid is UNIQUE and inserts ignore
 *   duplicates, so re-running imports only what's new.
 */

import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const orgId = args.find((a) => !a.startsWith("--"));

if (!orgId) {
  console.error("Usage: node --env-file=.env scripts/import-twilio-replies.mjs <org-id> [--apply]");
  process.exit(1);
}

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } =
  process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.error("Missing env. Run with: node --env-file=.env ...");
  process.exit(1);
}

/** Mirrors netlify/functions/utils/phone.ts closely enough for E.164 input. */
function normalize(raw) {
  if (!raw) return null;
  const plus = String(raw).trim().startsWith("+");
  const d = String(raw).replace(/\D/g, "");
  if (!d) return null;
  if (plus) return d.length >= 8 && d.length <= 15 ? "+" + d : null;
  if (d.length === 10) return "+1" + d;
  if (d.length === 11 && d[0] === "1") return "+" + d;
  return null;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// ── Verify the org ───────────────────────────────────────────────────────────
const { data: org } = await supabase
  .from("organizations")
  .select("id, name, twilio_phone_number")
  .eq("id", orgId)
  .maybeSingle();

if (!org) {
  console.error(`No organization ${orgId}`);
  process.exit(1);
}

console.log(`\nOrg      : ${org.name}`);
console.log(`Number   : ${TWILIO_PHONE_NUMBER}`);
console.log(`Currently: ${org.twilio_phone_number ?? "NULL"}`);

// Another org already owns this number — assigning it twice would misroute
// every future reply, so stop rather than guess.
const { data: conflict } = await supabase
  .from("organizations")
  .select("id, name")
  .eq("twilio_phone_number", TWILIO_PHONE_NUMBER)
  .neq("id", orgId)
  .maybeSingle();

if (conflict) {
  console.error(`\nABORT: ${conflict.name} (${conflict.id}) already owns ${TWILIO_PHONE_NUMBER}.`);
  process.exit(1);
}

// ── Pull inbound history ─────────────────────────────────────────────────────
console.log("\nFetching inbound messages from Twilio…");
const inbound = await client.messages.list({ to: TWILIO_PHONE_NUMBER, limit: 5000 });
console.log(`Found ${inbound.length} inbound message(s).`);

if (inbound.length === 0) {
  console.log("Nothing to import.\n");
  process.exit(0);
}

// ── Match senders to contacts ────────────────────────────────────────────────
const senders = [...new Set(inbound.map((m) => normalize(m.from)).filter(Boolean))];
const { data: contacts } = await supabase
  .from("contacts")
  .select("id, first_name, phone")
  .eq("org_id", orgId)
  .in("phone", senders);

const byPhone = new Map((contacts ?? []).map((c) => [c.phone, c]));

const rows = [];
for (const m of inbound) {
  const from = normalize(m.from);
  if (!from) continue;
  rows.push({
    org_id: orgId,
    contact_id: byPhone.get(from)?.id ?? null,
    from_phone: from,
    to_phone: TWILIO_PHONE_NUMBER,
    body: m.body ?? "",
    twilio_sid: m.sid,
    received_at: (m.dateSent ?? m.dateCreated ?? new Date()).toISOString(),
    // Historical messages arrive already unread — that's the honest state,
    // and it's what makes them float to the top of the list on first launch.
    read_at: null,
  });
}

const knownCount = rows.filter((r) => r.contact_id).length;

console.log(`  matched to a contact : ${knownCount}`);
console.log(`  unknown sender       : ${rows.length - knownCount}`);

const dates = rows.map((r) => r.received_at).sort();
console.log(`  date range           : ${dates[0]?.slice(0, 10)} → ${dates[dates.length - 1]?.slice(0, 10)}`);

console.log("\nSample:");
for (const r of rows.slice(0, 10)) {
  const who = r.contact_id ? byPhone.get(r.from_phone)?.first_name : "(not a contact)";
  console.log(`  ${r.received_at.slice(0, 10)}  ${String(who).padEnd(16)} ${JSON.stringify(r.body.slice(0, 46))}`);
}

if (!apply) {
  console.log(`\nDRY RUN — nothing written.`);
  console.log(`Would set ${org.name}.twilio_phone_number = ${TWILIO_PHONE_NUMBER}`);
  console.log(`Would insert ${rows.length} inbound message(s).`);
  console.log(`Re-run with --apply to commit.\n`);
  process.exit(0);
}

// ── Apply ────────────────────────────────────────────────────────────────────
const { error: orgErr } = await supabase
  .from("organizations")
  .update({ twilio_phone_number: TWILIO_PHONE_NUMBER })
  .eq("id", orgId);

if (orgErr) {
  console.error("\nFailed to set the org's number:", orgErr.message);
  process.exit(1);
}
console.log(`\n✓ ${org.name} now owns ${TWILIO_PHONE_NUMBER} — future replies will route here.`);

let inserted = 0;
const CHUNK = 200;
for (let i = 0; i < rows.length; i += CHUNK) {
  const { error } = await supabase
    .from("inbound_messages")
    .upsert(rows.slice(i, i + CHUNK), { onConflict: "twilio_sid", ignoreDuplicates: true });
  if (error) {
    console.error(`Insert failed at chunk ${i / CHUNK}:`, error.message);
    process.exit(1);
  }
  inserted += Math.min(CHUNK, rows.length - i);
}

console.log(`✓ Imported ${inserted} inbound message(s).`);
console.log(`  They'll appear in customer threads, and unread ones float to the top of the list.\n`);
