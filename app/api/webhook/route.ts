import { NextResponse } from "next/server";

// 1. Handle the "Preflight" handshake
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*", // Allows your extension to talk to the server
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, x-webhook-secret",
    },
  });
}

// 2. Handle the actual Webhook
export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Payload received:", data);

    // Your logic here...

    return NextResponse.json(
      { received: true },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // Required for the response to be readable
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to parse JSON" },
      { status: 400 },
    );
  }
}
