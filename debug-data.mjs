/**
 * debug-data.mjs — Show what's actually in the database
 * Usage: node debug-data.mjs
 */

import { readFileSync } from "fs";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";

const outputs = JSON.parse(readFileSync("./amplify_outputs.json", "utf-8"));
Amplify.configure(outputs);
const client = generateClient();

const { data, errors } = await client.models.PreTradeAnalysis.list();

if (errors) {
  console.error("List failed:", errors);
  process.exit(1);
}

console.log(`\n📊 Found ${data.length} records:\n`);

// Group by pairId
const grouped = {};
for (const item of data) {
  if (!grouped[item.pairId]) grouped[item.pairId] = [];
  grouped[item.pairId].push(item);
}

for (const [pairId, items] of Object.entries(grouped)) {
  console.log(`Pair ${pairId}: ${items.length} records`);
  items
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 3)
    .forEach((item) => {
      const dt = new Date(item.timestamp);
      const hasNotes = [
        item.weekly,
        item.daily,
        item.fourHr,
        item.oneHr,
      ].filter(Boolean).length;
      const hasSentiment = [
        item.weeklySentiment,
        item.dailySentiment,
        item.fourHrSentiment,
        item.oneHrSentiment,
      ].filter((s) => s && s !== "none").length;
      console.log(
        `  ${dt.toISOString()} | notes: ${hasNotes}/4 | sentiment: ${hasSentiment}/4`,
      );
    });
  console.log();
}
