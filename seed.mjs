/**
 * seed.mjs — Seed the Amplify PreTradeAnalysis table with sample data.
 *
 * Usage:
 *   node seed.mjs                  # seeds last 5 days for key pairs
 *   node seed.mjs --clear          # deletes all existing records first
 *   node seed.mjs --pair EURUSD    # seed a single pair only
 *
 * Requirements:
 *   - Run from the project root (needs amplify_outputs.json)
 *   - `npx ampx sandbox` must be running (or deployed environment set)
 *   - node >= 18 (native fetch)
 */

import { readFileSync } from "fs";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";

// ── Bootstrap Amplify ─────────────────────────────────────────────────────────

const outputs = JSON.parse(readFileSync("./amplify_outputs.json", "utf-8"));
Amplify.configure(outputs);
const client = generateClient();

// ── Pairs to seed ─────────────────────────────────────────────────────────────

const SEED_PAIRS = [
  { id: "9",  name: "EURUSD" },
  { id: "12", name: "GBPUSD" },
  { id: "17", name: "USDJPY" },
  { id: "8",  name: "EURJPY" },
  { id: "11", name: "GBPJPY" },
  { id: "2",  name: "AUDUSD" },
  { id: "30", name: "XAUUSD" },
];

// ── Sample note content ───────────────────────────────────────────────────────

const WEEKLY_NOTES = [
  "Price respecting weekly demand zone. HTF structure remains bullish. Looking for continuation higher after consolidation completes.",
  "Strong bearish weekly candle closed below key structure. Major resistance overhead at 1.0950. Bias is short until reclaim.",
  "Inside week. No clear directional bias. Wait for Monday's range to establish before committing to a direction.",
  "Clean weekly break and retest of previous resistance now acting as support. Bullish above 1.0800.",
];

const DAILY_NOTES = [
  "Daily BOS to the upside. Current pullback into 50% of the last impulse. Looking for demand to hold here.",
  "Bearish engulfing on the daily. Momentum shifted. Watching for lower high formation before shorting.",
  "Consolidating below daily supply. No trade until a clear break occurs. Volume drying up — coiling.",
  "Price swept the previous daily low and is now recovering. Potential reversal forming. Wait for confirmation candle.",
];

const FOUR_HR_NOTES = [
  "CHoCH confirmed on 4H. Entry model forming — waiting for 15m trigger into the 4H order block at 1.0842.",
  "4H supply holding price. Three rejections at the zone. Short bias below 1.0910, target previous low.",
  "4H liquidity grab above range high. Now looking for displacement and entry on retracement.",
  "Clean 4H demand zone aligns with daily discount. Watching for 1H confirmation before entry.",
];

const ONE_HR_NOTES = [
  "1H structure aligned with 4H. Entry on 1H BOS retest. SL below swing low, TP at next H4 supply.",
  "Waiting for 1H open rejection candle into the 4H OB. Not entering until clear shift.",
  "1H momentum bearish. Series of lower highs/lows. Short on pullback to previous 1H structure.",
  "1H choppy — no clear bias. Will step down to 15m only if 4H setup triggers cleanly.",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function toISODate(date) {
  return date.toISOString().split("T")[0];
}

function subtractDays(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toISODate(d);
}

// Last 5 weekdays (skip Saturday=6, Sunday=0)
function lastNWeekdays(n) {
  const dates = [];
  const d = new Date();
  while (dates.length < n) {
    d.setDate(d.getDate() - 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      dates.push(toISODate(new Date(d)));
    }
  }
  return dates;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const shouldClear = args.includes("--clear");
const pairFilter = args.includes("--pair") ? args[args.indexOf("--pair") + 1] : null;

const pairs = pairFilter
  ? SEED_PAIRS.filter((p) => p.name === pairFilter)
  : SEED_PAIRS;

if (pairs.length === 0) {
  console.error(`No pair found matching: ${pairFilter}`);
  process.exit(1);
}

async function clearAll() {
  console.log("🗑  Clearing existing records...");
  const { data, errors } = await client.models.PreTradeAnalysis.list();
  if (errors) {
    console.error("Failed to list records:", errors);
    return;
  }
  let deleted = 0;
  for (const item of data) {
    await client.models.PreTradeAnalysis.delete({ id: item.id });
    deleted++;
    process.stdout.write(`\r   Deleted ${deleted}/${data.length}`);
  }
  console.log(`\n   Done. ${deleted} records removed.`);
}

async function seed() {
  const dates = lastNWeekdays(5);
  let created = 0;
  let skipped = 0;

  for (const pair of pairs) {
    console.log(`\n📈 Seeding ${pair.name} (id: ${pair.id})`);

    for (const date of dates) {
      // Check if a record already exists for this pair + date
      const { data: existing } = await client.models.PreTradeAnalysis.list({
        filter: { and: [{ pairId: { eq: pair.id } }, { date: { eq: date } }] },
      });

      if (existing?.length > 0) {
        console.log(`   ${date} — already exists, skipping`);
        skipped++;
        continue;
      }

      const { errors } = await client.models.PreTradeAnalysis.create({
        pairId: pair.id,
        date,
        weekly: pick(WEEKLY_NOTES),
        daily: pick(DAILY_NOTES),
        fourHr: pick(FOUR_HR_NOTES),
        oneHr: pick(ONE_HR_NOTES),
      });

      if (errors) {
        console.error(`   ${date} — ERROR:`, errors);
      } else {
        console.log(`   ${date} — created ✓`);
        created++;
      }
    }
  }

  console.log(`\n✅ Done. ${created} created, ${skipped} skipped.`);
}

// ── Run ───────────────────────────────────────────────────────────────────────

try {
  if (shouldClear) await clearAll();
  await seed();
} catch (err) {
  console.error("Seed failed:", err);
  process.exit(1);
}
