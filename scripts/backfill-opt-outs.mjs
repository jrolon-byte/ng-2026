#!/usr/bin/env node
/**
 * One-time backfill: reflect Twilio's opt-out list into `contacts.opted_in`.
 *
 * WHY THIS EXISTS
 *   Nothing in this codebase ever set `opted_in = false`. When a customer
 *   texts STOP, Twilio blocks them at its own layer and the database never
 *   finds out — so they stay in every audience, every blast burns a
 *   guaranteed-to-fail API call on them, and the "failed" count on every
 *   campaign is permanently inflated by the same people. `twilio-inbound.ts`
 *   fixes this going forward. This fixes the history.
 *
 * WHY A CSV AND NOT THE API
 *   A STOP'd number never produces a Message resource — the create call fails
 *   with 21610 before one exists — and the catch block in
 *   campaign-send-background.ts records `status: "failed"` without the error
 *   code, so existing message_logs can't tell an opt-out apart from a network
 *   blip. Twilio's console export is the only source that actually knows.
 *
 *   Get it from: Twilio Console → Phone Numbers → your number →
 *   Opt-Out Management  (or Messaging → Opt-Outs if you use a Messaging
 *   Service). Export/copy the opted-out numbers to a file.
 *
 * USAGE
 *   Dry run (default — writes nothing):
 *     node --env-file=.env scripts/backfill-opt-outs.mjs opt-outs.csv
 *
 *   Apply:
 *     node --env-file=.env scripts/backfill-opt-outs.mjs opt-outs.csv --apply
 *
 * SAFETY
 *   - Dry run unless you pass --apply. Read the report first.
 *   - Only ever sets opted_in FALSE. It cannot opt anyone back in, so the
 *     worst case is reach you can restore by hand, not consent you fabricated.
 *   - Idempotent: re-running changes nothing new.
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ── Args ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const file = args.find((a) => !a.startsWith("--"));

if (!file) {
  console.error("Usage: node --env-file=.env scripts/backfill-opt-outs.mjs <file> [--apply]");
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_KEY. Try: node --env-file=.env ...");
  process.exit(1);
}

// ── Phone normalization ──────────────────────────────────────────────────────
// Mirrors netlify/functions/utils/phone.ts. Stored numbers are already clean
// E.164, so this only has to cope with however Twilio formats its export.
function normalize(raw) {
  if (!raw) return null;
  const hasPlus = String(raw).trim().startsWith("+");
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  if (hasPlus) return digits.length >= 8 && digits.length <= 15 ? "+" + digits : null;
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits[0] === "1") return "+" + digits;
  return null;
}

// ── Parse the export ─────────────────────────────────────────────────────────
// Deliberately forgiving: Twilio's export shape varies by console page, and a
// hand-pasted column of numbers should work just as well as a proper CSV.
function extractNumbers(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const header = lines[0].toLowerCase();
  const looksLikeHeader = /phone|number|^to\b|,to,|from/.test(header) && !/^\+?\d/.test(lines[0].trim());

  let phoneIndex = 0;
  let rows = lines;

  if (looksLikeHeader) {
    const cols = lines[0].split(",").map((c) => c.trim().toLowerCase().replace(/^"|"$/g, ""));
    const found = cols.findIndex((c) => /phone|number|^to$|^from$/.test(c));
    phoneIndex = found >= 0 ? found : 0;
    rows = lines.slice(1);
  }

  const out = [];
  for (const row of rows) {
    const cells = row.split(",");
    const cell = (cells[phoneIndex] ?? cells[0] ?? "").trim().replace(/^"|"$/g, "");
    const e164 = normalize(cell);
    if (e164) out.push(e164);
  }
  return [...new Set(out)];
}

// ── Run ──────────────────────────────────────────────────────────────────────
const raw = readFileSync(file, "utf8");
const numbers = extractNumbers(raw);

console.log(`\nRead ${file}`);
console.log(`Parsed ${numbers.length} unique phone number(s) from the export.\n`);

if (numbers.length === 0) {
  console.error("Nothing parseable. Expected a CSV with a phone column, or one number per line.");
  process.exit(1);
}

const supabase = createClient(url, key);

// Chunked so a long opt-out list doesn't blow past URL length limits on .in()
const CHUNK = 200;
const matched = [];

for (let i = 0; i < numbers.length; i += CHUNK) {
  const slice = numbers.slice(i, i + CHUNK);
  const { data, error } = await supabase
    .from("contacts")
    .select("id, org_id, first_name, phone, opted_in, active")
    .in("phone", slice);

  if (error) {
    console.error("Lookup failed:", error.message);
    process.exit(1);
  }
  matched.push(...(data ?? []));
}

const toFlip = matched.filter((c) => c.opted_in);
const already = matched.filter((c) => !c.opted_in);
const unmatchedCount = numbers.length - new Set(matched.map((c) => c.phone)).size;

// Per-org breakdown — with a single shared Twilio number, a STOP blocks that
// number for every sender using it, so an opt-out legitimately applies across
// every org the person appears in. Worth seeing before you commit to it.
const byOrg = new Map();
for (const c of toFlip) byOrg.set(c.org_id, (byOrg.get(c.org_id) ?? 0) + 1);

console.log("──────────────────────────────────────────────");
console.log(`  Contacts to opt out : ${toFlip.length}`);
console.log(`  Already opted out   : ${already.length}`);
console.log(`  In Twilio, not in DB: ${unmatchedCount}`);
console.log("──────────────────────────────────────────────");

if (byOrg.size > 0) {
  console.log("\nBy organization:");
  for (const [orgId, count] of byOrg) console.log(`  ${orgId}  →  ${count}`);
}

if (toFlip.length > 0) {
  console.log("\nWho changes:");
  for (const c of toFlip.slice(0, 40)) {
    console.log(`  ${c.phone}  ${c.first_name ?? "(no name)"}${c.active ? "" : "  [already removed]"}`);
  }
  if (toFlip.length > 40) console.log(`  … and ${toFlip.length - 40} more`);
}

if (!apply) {
  console.log("\nDRY RUN — nothing written. Re-run with --apply to commit.\n");
  process.exit(0);
}

if (toFlip.length === 0) {
  console.log("\nNothing to do.\n");
  process.exit(0);
}

let updated = 0;
for (let i = 0; i < toFlip.length; i += CHUNK) {
  const ids = toFlip.slice(i, i + CHUNK).map((c) => c.id);
  const { error } = await supabase.from("contacts").update({ opted_in: false }).in("id", ids);
  if (error) {
    console.error(`\nUpdate failed on chunk ${i / CHUNK}:`, error.message);
    console.error(`${updated} contact(s) were already updated before this failure.`);
    process.exit(1);
  }
  updated += ids.length;
}

console.log(`\n✓ Opted out ${updated} contact(s).`);
console.log("  Reach counts and campaign failure counts will be accurate from the next blast.\n");
