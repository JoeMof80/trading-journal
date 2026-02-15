/**
 * list-records.mjs
 * Lists all PreTradeAnalysis records, grouped by pairId and date.
 * Run from project root: node list-records.mjs
 */

import { readFileSync } from "fs";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";

const outputs = JSON.parse(readFileSync("./amplify_outputs.json", "utf-8"));
Amplify.configure(outputs);
const client = generateClient();

const { data, errors } = await client.models.PreTradeAnalysis.list();

if (errors) {
  console.error("Failed:", errors);
  process.exit(1);
}

if (!data.length) {
  console.log("No records found.");
  process.exit(0);
}

// Sort by pairId then date
data.sort(
  (a, b) => a.pairId.localeCompare(b.pairId) || a.date.localeCompare(b.date),
);

console.log(`Found ${data.length} records:\n`);
console.log("pairId  date          id");
console.log("------  ----------    ------------------------------------");
for (const r of data) {
  const hasNotes = [r.weekly, r.daily, r.fourHr, r.oneHr].some(Boolean);
  const hasScreenshots = [
    r.weeklyScreenshot,
    r.dailyScreenshot,
    r.fourHrScreenshot,
    r.oneHrScreenshot,
  ].some(Boolean);
  const flags = [hasNotes ? "notes" : "", hasScreenshots ? "screenshots" : ""]
    .filter(Boolean)
    .join(", ");
  console.log(`${r.pairId.padEnd(7)} ${r.date}    ${r.id}  ${flags}`);
}
