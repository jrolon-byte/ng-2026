#!/usr/bin/env node
/**
 * One-time: repair `message_logs` delivery status from Twilio's own record.
 *
 * WHY
 *   `messages.create()` resolves when Twilio *accepts* a message, not when a
 *   carrier delivers it. Nothing consumed the async verdict, so all 3,836 rows
 *   claim "sent" — including 113 attempts to a number that has never once
 *   received. Campaign History therefore reports 100% delivery on every
 *   campaign, and no dead number is distinguishable from a live one.
 *
 *   `twilio-status.ts` fixes this going forward. This fixes what's already
 *   there: message_logs stores `twilio_sid`, and Twilio still knows the final
 *   status of every one of them.
 *
 * HOW
 *   Pulls the account's full outbound history ONCE and matches locally by SID.
 *   Per-message API lookups would be thousands of round trips.
 *
 * USAGE
 *   Dry run (default — writes nothing):
 *     node --env-file=.env scripts/backfill-delivery-status.mjs
 *
 *   Apply:
 *     node --env-file=.env scripts/backfill-delivery-status.mjs --apply
 *
 * SAFETY
 *   Only touches rows whose status or error_code actually disagrees with
 *   Twilio. Idempotent — a second run reports nothing to do.
 */

import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";

const apply = process.argv.includes("--apply");

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  console.error("Missing env. Run with: node --env-file=.env ...");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// ── Twilio's record ──────────────────────────────────────────────────────────
console.log("\nFetching message history from Twilio (this takes a minute)…");
const twilioBySid = new Map();
let page = await client.messages.page({ pageSize: 1000 });
while (page) {
  for (const m of page.instances) {
    twilioBySid.set(m.sid, { status: (m.status ?? "").toLowerCase(), errorCode: m.errorCode ?? null });
  }
  page = page.getNextPageUrl() ? await page.nextPage() : null;
  process.stdout.write(`\r  ${twilioBySid.size} messages…`);
  if (twilioBySid.size > 100000) break;
}
console.log(`\r  ${twilioBySid.size} messages fetched.        `);

// ── Our rows ─────────────────────────────────────────────────────────────────
const rows = [];
const PAGE = 1000;
for (let from = 0; ; from += PAGE) {
  const { data, error } = await supabase
    .from("message_logs")
    .select("id, twilio_sid, status, error_code")
    .not("twilio_sid", "is", null)
    .range(from, from + PAGE - 1);
  if (error) {
    console.error("Read failed:", error.message);
    process.exit(1);
  }
  rows.push(...(data ?? []));
  if (!data || data.length < PAGE) break;
}
console.log(`${rows.length} message_logs row(s) with a Twilio SID.`);

// ── Diff ─────────────────────────────────────────────────────────────────────
const changes = [];
let notInTwilio = 0;
const statusCounts = {};

for (const row of rows) {
  const truth = twilioBySid.get(row.twilio_sid);
  if (!truth) {
    notInTwilio++;
    continue;
  }
  statusCounts[truth.status] = (statusCounts[truth.status] ?? 0) + 1;
  if (row.status !== truth.status || (row.error_code ?? null) !== (truth.errorCode ?? null)) {
    changes.push({ id: row.id, status: truth.status, error_code: truth.errorCode ?? null });
  }
}

console.log("\nTwilio's actual outcomes for our rows:");
for (const [status, n] of Object.entries(statusCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${status.padEnd(14)} ${n}`);
}

console.log("\n──────────────────────────────────────────────");
console.log(`  Rows to correct   : ${changes.length}`);
console.log(`  Already correct   : ${rows.length - changes.length - notInTwilio}`);
console.log(`  Not found in Twilio: ${notInTwilio}`);
console.log("──────────────────────────────────────────────");

const failures = changes.filter((c) => c.status === "undelivered" || c.status === "failed");
console.log(`\nOf the corrections, ${failures.length} are real delivery failures.`);

if (!apply) {
  console.log("\nDRY RUN — nothing written. Re-run with --apply to commit.\n");
  process.exit(0);
}

if (changes.length === 0) {
  console.log("\nNothing to do.\n");
  process.exit(0);
}

// ── Apply ────────────────────────────────────────────────────────────────────
// Grouped by identical (status, error_code) so a few thousand rows become a
// handful of statements instead of one request each.
const groups = new Map();
for (const c of changes) {
  const key = `${c.status}|${c.error_code ?? ""}`;
  if (!groups.has(key)) groups.set(key, { status: c.status, error_code: c.error_code, ids: [] });
  groups.get(key).ids.push(c.id);
}

const now = new Date().toISOString();
let updated = 0;
for (const g of groups.values()) {
  for (let i = 0; i < g.ids.length; i += 200) {
    const slice = g.ids.slice(i, i + 200);
    const { error } = await supabase
      .from("message_logs")
      .update({ status: g.status, error_code: g.error_code, status_updated_at: now })
      .in("id", slice);
    if (error) {
      console.error(`\nUpdate failed (${g.status}):`, error.message);
      console.error(`${updated} row(s) were already corrected before this failure.`);
      process.exit(1);
    }
    updated += slice.length;
  }
  console.log(`  ${g.status}${g.error_code ? ` (${g.error_code})` : ""}: ${g.ids.length}`);
}

console.log(`\n✓ Corrected ${updated} row(s).`);
console.log("  Campaign History now reflects real delivery, and dead numbers surface in the app.\n");
