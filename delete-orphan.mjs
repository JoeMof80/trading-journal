/**
 * delete-orphan.mjs
 * Deletes a specific orphaned PreTradeAnalysis record from the live database.
 *
 * Usage:
 *   node delete-orphan.mjs --pairId 13 --date 2026-02-15
 *
 * Run from the project root (needs amplify_outputs.json).
 */

import { readFileSync } from "fs";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";

const outputs = JSON.parse(readFileSync("./amplify_outputs.json", "utf-8"));
Amplify.configure(outputs);
const client = generateClient();

const args = process.argv.slice(2);
const pairId = args[args.indexOf("--pairId") + 1];
const date = args[args.indexOf("--date") + 1];

if (!pairId || !date) {
  console.error(
    "Usage: node delete-orphan.mjs --pairId <id> --date <YYYY-MM-DD>",
  );
  process.exit(1);
}

console.log(`Looking for pairId="${pairId}" date="${date}"...`);

const { data, errors } = await client.models.PreTradeAnalysis.list({
  filter: {
    and: [{ pairId: { eq: pairId } }, { date: { eq: date } }],
  },
});

if (errors) {
  console.error("List failed:", errors);
  process.exit(1);
}

if (!data.length) {
  console.log("No matching records found.");
  process.exit(0);
}

console.log(`Found ${data.length} record(s):`);
for (const record of data) {
  console.log(
    `  id=${record.id}  date=${record.date}  pairId=${record.pairId}`,
  );
  const { errors: delErrors } = await client.models.PreTradeAnalysis.delete({
    id: record.id,
  });
  if (delErrors) {
    console.error(`  Failed to delete:`, delErrors);
  } else {
    console.log(`  Deleted ✓`);
  }
}
