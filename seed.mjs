/**
 * seed.mjs — Seed the Amplify PreTradeAnalysis table with sample data.
 *
 * Usage:
 *   node seed.mjs                  # seeds last 5 weekdays for key pairs
 *   node seed.mjs --clear          # deletes all existing records first
 *   node seed.mjs --pair EURUSD    # seed a single pair only
 *   node seed.mjs --no-screenshots # skip screenshot generation
 *
 * Requirements:
 *   - Run from the project root (needs amplify_outputs.json)
 *   - `npx ampx sandbox` must be running (or deployed environment set)
 *   - node >= 18 (native fetch)
 *
 * Screenshots are tiny synthetic SVG charts (~2-4KB each), well within
 * DynamoDB's 400KB item limit. Real screenshots should be stored in S3.
 */

import { readFileSync } from "fs";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";

// ── Bootstrap ─────────────────────────────────────────────────────────────────

const outputs = JSON.parse(readFileSync("./amplify_outputs.json", "utf-8"));
Amplify.configure(outputs);
const client = generateClient();

// ── Pairs (IDs match pairs.ts — no duplicates) ────────────────────────────────

const SEED_PAIRS = [
  { id: "15", name: "EURUSD" },
  { id: "21", name: "GBPUSD" },
  { id: "28", name: "USDJPY" },
  { id: "13", name: "EURJPY" },
  { id: "19", name: "GBPJPY" },
  { id: "5", name: "AUDUSD" },
  { id: "30", name: "XAUUSD" },
];

// ── Sample notes ──────────────────────────────────────────────────────────────

const WEEKLY_NOTES = [
  "Price respecting weekly demand zone. HTF structure remains bullish. Looking for continuation higher after consolidation completes.",
  "Strong bearish weekly candle closed below key structure. Major resistance overhead. Bias is short until reclaim.",
  "Inside week. No clear directional bias. Wait for Monday's range to establish before committing to a direction.",
  "Clean weekly break and retest of previous resistance now acting as support. Bullish above key level.",
];

const DAILY_NOTES = [
  "Daily BOS to the upside. Current pullback into 50% of the last impulse. Looking for demand to hold here.",
  "Bearish engulfing on the daily. Momentum shifted. Watching for lower high formation before shorting.",
  "Consolidating below daily supply. No trade until a clear break occurs. Volume drying up — coiling.",
  "Price swept the previous daily low and is now recovering. Potential reversal forming. Wait for confirmation candle.",
];

const FOUR_HR_NOTES = [
  "CHoCH confirmed on 4H. Entry model forming — waiting for 15m trigger into the 4H order block.",
  "4H supply holding price. Three rejections at the zone. Short bias below resistance, target previous low.",
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

// ── Synthetic chart screenshot generator ─────────────────────────────────────
// Generates a tiny SVG candlestick chart encoded as a data URI.
// Each chart is ~2-4KB — safe for DynamoDB (400KB limit).

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function generateChartSvg(label, trend = "neutral") {
  const W = 320,
    H = 160;
  const candleCount = 20;
  const candleW = 10;
  const gap = (W - 40) / candleCount;

  // Generate OHLC data with a trend bias
  let price = 100;
  const candles = [];
  for (let i = 0; i < candleCount; i++) {
    const bias = trend === "bull" ? 0.6 : trend === "bear" ? 0.4 : 0.5;
    const move = randomBetween(-3, 3) + (Math.random() < bias ? 1 : -1);
    const open = price;
    const close = price + move;
    const high = Math.max(open, close) + randomBetween(0.5, 2);
    const low = Math.min(open, close) - randomBetween(0.5, 2);
    candles.push({ open, close, high, low });
    price = close;
  }

  // Normalise to SVG coords
  const allPrices = candles.flatMap((c) => [c.high, c.low]);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || 1;
  const pad = { top: 15, bottom: 15, left: 20, right: 20 };
  const chartH = H - pad.top - pad.bottom;
  const chartW = W - pad.left - pad.right;

  const toY = (p) => pad.top + chartH - ((p - minP) / range) * chartH;
  const toX = (i) => pad.left + i * gap + gap / 2;

  // Build candle SVG elements
  const candlesSvg = candles
    .map((c, i) => {
      const x = toX(i);
      const openY = toY(c.open);
      const closeY = toY(c.close);
      const highY = toY(c.high);
      const lowY = toY(c.low);
      const bull = c.close >= c.open;
      const color = bull ? "#4ade80" : "#f87171";
      const bodyTop = Math.min(openY, closeY);
      const bodyH = Math.max(Math.abs(closeY - openY), 1);

      return [
        // Wick
        `<line x1="${x}" y1="${highY}" x2="${x}" y2="${lowY}" stroke="${color}" stroke-width="1"/>`,
        // Body
        `<rect x="${x - candleW / 2}" y="${bodyTop}" width="${candleW}" height="${bodyH}" fill="${color}" opacity="0.9"/>`,
      ].join("");
    })
    .join("");

  // Grid lines
  const gridLines = [0.25, 0.5, 0.75]
    .map((f) => {
      const y = pad.top + chartH * (1 - f);
      return `<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="#334155" stroke-width="0.5" stroke-dasharray="3,3"/>`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="background:#0f172a;border-radius:4px">
  ${gridLines}
  ${candlesSvg}
  <text x="${pad.left}" y="12" font-family="monospace" font-size="9" fill="#64748b">${label}</text>
</svg>`;

  // Encode as data URI (SVG is text — no need for canvas/sharp)
  const encoded = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${encoded}`;
}

// Trend per timeframe for variety
const TRENDS = ["bull", "bear", "neutral"];

function generateScreenshots() {
  return {
    weeklyScreenshot: generateChartSvg("Weekly", pick(TRENDS)),
    dailyScreenshot: generateChartSvg("Daily", pick(TRENDS)),
    fourHrScreenshot: generateChartSvg("4H", pick(TRENDS)),
    oneHrScreenshot: generateChartSvg("1H", pick(TRENDS)),
  };
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function toISODate(date) {
  return date.toISOString().split("T")[0];
}

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

// ── Clear ─────────────────────────────────────────────────────────────────────

async function clearAll() {
  console.log("🗑  Clearing existing PreTradeAnalysis records...");
  const { data, errors } = await client.models.PreTradeAnalysis.list();
  if (errors) {
    console.error("Failed to list:", errors);
    return;
  }
  let deleted = 0;
  for (const item of data) {
    await client.models.PreTradeAnalysis.delete({ id: item.id });
    process.stdout.write(`\r   Deleted ${++deleted}/${data.length}`);
  }
  console.log(`\n   Done. ${deleted} records removed.\n`);
}

// ── Seed ──────────────────────────────────────────────────────────────────────

async function seed(withScreenshots) {
  const dates = lastNWeekdays(5);
  let created = 0,
    skipped = 0,
    errored = 0;

  for (const pair of pairs) {
    console.log(`📈 ${pair.name} (id: ${pair.id})`);

    for (const date of dates) {
      const { data: existing } = await client.models.PreTradeAnalysis.list({
        filter: { and: [{ pairId: { eq: pair.id } }, { date: { eq: date } }] },
      });

      if (existing?.length > 0) {
        console.log(`   ${date} — already exists, skipping`);
        skipped++;
        continue;
      }

      const screenshots = withScreenshots ? generateScreenshots() : {};

      // Log approximate item size so we can catch limit issues early
      const payload = {
        pairId: pair.id,
        date,
        weekly: pick(WEEKLY_NOTES),
        daily: pick(DAILY_NOTES),
        fourHr: pick(FOUR_HR_NOTES),
        oneHr: pick(ONE_HR_NOTES),
        ...screenshots,
      };

      const approxKB = Math.round(JSON.stringify(payload).length / 1024);
      process.stdout.write(`   ${date} — ~${approxKB}KB ... `);

      const { errors } = await client.models.PreTradeAnalysis.create(payload);

      if (errors) {
        console.error(`FAILED:`, errors[0]?.message ?? errors);
        errored++;
      } else {
        console.log(`✓`);
        created++;
      }
    }
    console.log();
  }

  console.log(
    `✅ Done. ${created} created, ${skipped} skipped, ${errored} failed.`,
  );
}

// ── Run ───────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const shouldClear = args.includes("--clear");
const pairFilter = args.includes("--pair")
  ? args[args.indexOf("--pair") + 1]
  : null;
const withScreenshots = !args.includes("--no-screenshots");

const pairs = pairFilter
  ? SEED_PAIRS.filter((p) => p.name === pairFilter)
  : SEED_PAIRS;

if (pairs.length === 0) {
  console.error(`No pair found matching: ${pairFilter}`);
  process.exit(1);
}

console.log(
  `Screenshots: ${withScreenshots ? "yes (SVG ~2-4KB each)" : "no"}\n`,
);

try {
  if (shouldClear) await clearAll();
  await seed(withScreenshots);
} catch (err) {
  console.error("Seed failed:", err);
  process.exit(1);
}
