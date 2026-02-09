import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const data = await request.json();

  // Log the data to see it in AWS CloudWatch later
  console.log("Webhook received:", data);

  // Perform your logic here (update DB, send email, etc.)

  return NextResponse.json({ received: true }, { status: 200 });
}
