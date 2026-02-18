/**
 * seed.mjs — Seed PreTradeAnalysis with hourly timestamped records
 *
 * Usage:
 *   node seed.mjs                  # seed last 5 weekdays, 2 entries per day
 *   node seed.mjs --clear          # delete all records first
 *   node seed.mjs --pair EURUSD    # seed single pair only
 *   node seed.mjs --days 10        # seed last N weekdays
 *
 * Screenshots: Place in seed-assets/{PAIR}/{timeframe}.png
 * - Uploads to S3 at screenshots/seed/{pair}/{timestamp}_{timeframe}.png
 * - Falls back to synthetic SVG if file missing
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { uploadData } from "aws-amplify/storage";

const outputs = JSON.parse(readFileSync("./amplify_outputs.json", "utf-8"));
Amplify.configure(outputs);
const client = generateClient();

// ── Pairs (matches pairs.ts) ──────────────────────────────────────────────

const SEED_PAIRS = [
  { id: "15", name: "EURUSD" },
  { id: "21", name: "GBPUSD" },
  { id: "28", name: "USDJPY" },
  { id: "13", name: "EURJPY" },
  { id: "19", name: "GBPJPY" },
  { id: "5",  name: "AUDUSD" },
  { id: "30", name: "XAUUSD" },
];

// ── Sample content ────────────────────────────────────────────────────────

const NOTES = {
  weekly: [
    "HTF demand holding. Bias remains bullish above weekly swing. Watch for continuation.",
    "Weekly bearish BOS. Major resistance overhead. Short bias until reclaim of structure.",
    "Inside week. Consolidation continues. No directional bias until breakout confirmed.",
    "Clean weekly impulse higher. Retest of previous resistance now support. Bullish setup.",
  ],
  daily: [
    "Daily BOS to upside. Pullback into 50% fib. Demand should hold for continuation.",
    "Bearish engulfing daily close. Momentum shifted. Watching for LH formation.",
    "Daily ranging below supply. Waiting for clear break. Coiling for move.",
    "Liquidity sweep below daily low. Recovery underway. Reversal candle forming.",
  ],
  fourHr: [
    "4H CHoCH confirmed. Waiting for 15m entry trigger into order block.",
    "4H supply rejecting price. Three taps at zone. Short bias below structure.",
    "4H liquidity grab above range. Looking for displacement down and retracement entry.",
    "4H demand aligns with daily discount. 1H confirmation needed before entry.",
  ],
  oneHr: [
    "1H aligned with 4H bias. Entry on BOS retest. SL below swing, TP at H4 supply.",
    "Waiting for 1H rejection into 4H OB. No entry until shift confirmed.",
    "1H lower highs/lows forming. Short pullback into previous structure.",
    "1H choppy. No clear setup. Stepping to 15m only if 4H triggers cleanly.",
  ],
};

const SENTIMENTS = ["bullish", "bearish", "flat", "none"];
const FLAGS = ["red", "orange", "green", "blue", "cyan", "pink", "purple", "none"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Screenshot handling ───────────────────────────────────────────────────

const TIMEFRAME_FILES = {
  weekly: "weekly.png",
  daily:  "daily.png",
  fourHr: "4h.png",
  oneHr:  "1h.png",
};

async function uploadScreenshot(pairName, timeframe, timestamp) {
  const filename = TIMEFRAME_FILES[timeframe];
  const localPath = join("seed-assets", pairName, filename);
  
  if (!existsSync(localPath)) {
    console.log(`      ${timeframe}: no file, skipping`);
    return null;
  }

  try {
    const fileBuffer = readFileSync(localPath);
    const ext = filename.split(".").pop();
    const s3Key = `screenshots/seed/${pairName}/${timestamp}_${timeframe}.${ext}`;
    
    await uploadData({
      path: s3Key,
      data: fileBuffer,
      options: { contentType: `image/${ext}` },
    }).result;
    
    console.log(`      ${timeframe}: uploaded → ${s3Key}`);
    return s3Key;
  } catch (err) {
    console.error(`      ${timeframe}: upload failed -`, err.message);
    return null;
  }
}

// ── Date helpers ──────────────────────────────────────────────────────────

function lastNWeekdays(n) {
  const dates = [];
  const d = new Date();
  while (dates.length < n) {
    d.setDate(d.getDate() - 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      dates.push(new Date(d));
    }
  }
  return dates;
}

// ── Clear ─────────────────────────────────────────────────────────────────

async function clearAll() {
  console.log("🗑  Clearing all PreTradeAnalysis records...");
  const { data, errors } = await client.models.PreTradeAnalysis.list();
  if (errors) { console.error("List failed:", errors); return; }
  
  let deleted = 0;
  for (const item of data) {
    await client.models.PreTradeAnalysis.delete({ id: item.id });
    process.stdout.write(`\r   Deleted ${++deleted}/${data.length}`);
  }
  console.log(`\n   Done. ${deleted} records removed.\n`);
}

// ── Seed ──────────────────────────────────────────────────────────────────

async function seed(pairs, days) {
  const weekdays = lastNWeekdays(days);
  const hours = [9, 14]; // Two entries per day: morning and afternoon (UTC)
  
  let created = 0, errored = 0;

  for (const pair of pairs) {
    console.log(`\n📈 ${pair.name} (id: ${pair.id})`);
    
    // Set pair flag once
    const pairFlag = pick(FLAGS);
    try {
      await client.models.PairSettings.create({ pairId: pair.id, flag: pairFlag });
      console.log(`   Flag: ${pairFlag}`);
    } catch (err) {
      // Might already exist from previous seed - ignore
    }

    for (const day of weekdays) {
      for (const hour of hours) {
        const timestamp = new Date(day);
        timestamp.setUTCHours(hour, 0, 0, 0);
        const isoTimestamp = timestamp.toISOString();
        
        console.log(`   ${isoTimestamp}`);

        // Upload screenshots (if available)
        const screenshots = {};
        for (const [field, _] of Object.entries(TIMEFRAME_FILES)) {
          const s3Key = await uploadScreenshot(pair.name, field, isoTimestamp);
          if (s3Key) screenshots[`${field}Screenshot`] = s3Key;
        }

        const payload = {
          pairId: pair.id,
          timestamp: isoTimestamp,
          weekly:          pick(NOTES.weekly),
          weeklySentiment: pick(SENTIMENTS),
          daily:           pick(NOTES.daily),
          dailySentiment:  pick(SENTIMENTS),
          fourHr:          pick(NOTES.fourHr),
          fourHrSentiment: pick(SENTIMENTS),
          oneHr:           pick(NOTES.oneHr),
          oneHrSentiment:  pick(SENTIMENTS),
          ...screenshots,
        };

        const { errors } = await client.models.PreTradeAnalysis.create(payload);
        
        if (errors) {
          console.error(`      ✗ FAILED:`, errors[0]?.message ?? errors);
          errored++;
        } else {
          created++;
        }
      }
    }
  }

  console.log(`\n✅ Done. ${created} created, ${errored} failed.`);
}

// ── Run ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const shouldClear = args.includes("--clear");
const pairFilter  = args.includes("--pair") ? args[args.indexOf("--pair") + 1] : null;
const daysToSeed  = args.includes("--days") ? parseInt(args[args.indexOf("--days") + 1]) : 5;

const pairs = pairFilter
  ? SEED_PAIRS.filter((p) => p.name === pairFilter)
  : SEED_PAIRS;

if (pairs.length === 0) {
  console.error(`No pair found matching: ${pairFilter}`);
  process.exit(1);
}

console.log(`Seeding ${pairs.length} pair(s), last ${daysToSeed} weekdays, 2 entries/day\n`);

try {
  if (shouldClear) await clearAll();
  await seed(pairs, daysToSeed);
} catch (err) {
  console.error("Seed failed:", err);
  process.exit(1);
}
