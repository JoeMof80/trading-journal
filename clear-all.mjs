/**
 * clear-all.mjs — Delete all PreTradeAnalysis records
 * Usage: node clear-all.mjs
 */

import { readFileSync } from "fs";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";

const outputs = JSON.parse(readFileSync("./amplify_outputs.json", "utf-8"));
Amplify.configure(outputs);
const client = generateClient();

console.log("🗑️  Deleting all PreTradeAnalysis records...");

const { data, errors } = await client.models.PreTradeAnalysis.list();

if (errors) {
  console.error("List failed:", errors);
  process.exit(1);
}

if (!data.length) {
  console.log("No records found.");
  process.exit(0);
}

let deleted = 0;
for (const item of data) {
  await client.models.PreTradeAnalysis.delete({ id: item.id });
  process.stdout.write(`\r   Deleted ${++deleted}/${data.length}`);
}

console.log(`\n✅ Done. ${deleted} records removed.`);
