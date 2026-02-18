/**
 * Test if AnalysisSummary should show for seeded data
 */

import { readFileSync } from "fs";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";

const outputs = JSON.parse(readFileSync("./amplify_outputs.json", "utf-8"));
Amplify.configure(outputs);
const client = generateClient();

const { data } = await client.models.PreTradeAnalysis.list();

// Take first record
const first = data[0];
if (!first) {
  console.log("No records found");
  process.exit(0);
}

console.log("\nFirst record:");
console.log("pairId:", first.pairId);
console.log("timestamp:", first.timestamp);
console.log("\nNotes content:");
console.log("  weekly:", first.weekly?.substring(0, 50) + "...");
console.log("  daily:", first.daily?.substring(0, 50) + "...");
console.log("  fourHr:", first.fourHr?.substring(0, 50) + "...");
console.log("  oneHr:", first.oneHr?.substring(0, 50) + "...");
console.log("\nSentiments:");
console.log("  weekly:", first.weeklySentiment);
console.log("  daily:", first.dailySentiment);
console.log("  fourHr:", first.fourHrSentiment);
console.log("  oneHr:", first.oneHrSentiment);

// Check hasAny logic from AnalysisSummary
const SUMMARY_FIELDS = [
  { key: "weekly" },
  { key: "daily" },
  { key: "fourHr" },
  { key: "oneHr" },
];

const hasAny = SUMMARY_FIELDS.some((f) => !!first[f.key]?.trim());
console.log("\nAnalysisSummary hasAny check:", hasAny ? "✓ PASS" : "✗ FAIL");

if (!hasAny) {
  console.log("This is why AnalysisSummary is not showing!");
}
