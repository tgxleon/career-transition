import { NextRequest, NextResponse } from "next/server";

// Proxies tracker rows to the user's Google Apps Script web app, avoiding
// browser CORS restrictions. The webhook URL comes from the user's settings.

export async function POST(req: NextRequest) {
  let body: { webhookUrl?: string; headers?: string[]; rows?: string[][] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { webhookUrl, headers, rows } = body;
  if (!webhookUrl || !Array.isArray(rows)) {
    return NextResponse.json(
      { error: "webhookUrl and rows are required" },
      { status: 400 }
    );
  }

  let url: URL;
  try {
    url = new URL(webhookUrl);
  } catch {
    return NextResponse.json({ error: "Invalid webhook URL" }, { status: 400 });
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== "script.google.com"
  ) {
    return NextResponse.json(
      { error: "Webhook must be a https://script.google.com Apps Script URL" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headers, rows }),
      redirect: "follow", // Apps Script responds via a 302 redirect
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Google Sheets webhook responded with ${res.status}` },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, count: rows.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json(
      { error: `Could not reach the webhook: ${message}` },
      { status: 502 }
    );
  }
}
