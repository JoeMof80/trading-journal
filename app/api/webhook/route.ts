import { NextResponse } from "next/server";
import { generateClient } from "aws-amplify/api";
import config from "@/amplify_outputs.json";
import { Amplify } from "aws-amplify";
import { type Schema } from "@/amplify/data/resource";

Amplify.configure(config);

const client = generateClient<Schema>();

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
  );
}

export async function POST(request: Request) {
  console.log("🚀 [WEBHOOK] Request received!");

  try {
    const rawData = await request.json();
    console.log(
      "📦 [WEBHOOK] Payload from Extension:",
      JSON.stringify(rawData, null, 2),
    );

    // Validation Log
    if (!rawData.symbol || !rawData.price) {
      console.warn("⚠️ [WEBHOOK] Missing required fields in payload");
    }

    const { data: newTrade, errors } = await client.models.Trade.create(
      {
        symbol: rawData.symbol,
        price: parseFloat(rawData.price),
        quantity: parseFloat(rawData.quantity),
        side: rawData.side,
        type: rawData.type,
        stopLoss: rawData.stopLoss,
        takeProfit: rawData.takeProfit,
        timestamp: rawData.timestamp,
      },
      {
        authMode: "apiKey",
      },
    );

    if (errors) {
      console.error(
        "❌ [WEBHOOK] AWS Database Error:",
        JSON.stringify(errors, null, 2),
      );
      return NextResponse.json({ errors }, { status: 500 });
    }

    console.log("✅ [WEBHOOK] Success! Saved Trade ID:", newTrade?.id);

    return NextResponse.json(
      { received: true, id: newTrade?.id },
      {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
      },
    );
  } catch (err) {
    console.error("🔥 [WEBHOOK] Critical System Error:", err);
    return NextResponse.json(
      { error: "System Failure", details: err },
      { status: 500 },
    );
  }
}
