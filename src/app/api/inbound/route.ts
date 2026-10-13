import { NextRequest, NextResponse } from "next/server";

// POST /api/inbound - Resend Inbound Webhook handler (email.received event)
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    if (!rawBody) {
      return NextResponse.json({ message: "Empty body" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    // Forward event directly to EasyHR Go backend webhook for processing & database persistence
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.EASYHR_API_URL ||
      "https://easyhr-api-180870038176.us-central1.run.app";

    try {
      const backendRes = await fetch(`${backendUrl}/api/v1/messaging/inbound/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: rawBody,
      });

      if (backendRes.ok) {
        const json = await backendRes.json();
        return NextResponse.json({ success: true, forwarded: true, result: json });
      }
    } catch (forwardErr) {
      console.error("[Inbound Webhook Forward Error]", forwardErr);
    }

    // Fallback response for Resend webhook delivery acknowledgment
    if (event.type === "email.received") {
      return NextResponse.json({ success: true, email_id: event.data?.email_id });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Inbound Webhook Error]", error);
    return NextResponse.json({ error: error.message || "Failed to process webhook" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "EasyHR Resend Inbound Webhook", docs: "https://resend.com/docs/dashboard/receiving" });
}
