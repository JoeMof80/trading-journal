import { NextResponse } from "next/server";

export async function OPTIONS() {
  // Handles the "preflight" request Chrome sends before the POST
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*", // For production, use your extension ID
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-webhook-secret",
    },
  });
}

export async function POST(request: Request) {
  // Add the same headers to your POST response
  const response = NextResponse.json({ received: true });
  response.headers.set("Access-Control-Allow-Origin", "*");

  const data = await request.json();

  // Log the data to see it in AWS CloudWatch later
  console.log("Webhook received:", data);

  // Perform your logic here (update DB, send email, etc.)

  return NextResponse.json({ received: true }, { status: 200 });
}
