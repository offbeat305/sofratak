import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/db/store";

const STOP_KEYWORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);

const EMPTY_TWIML = new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
  headers: { "Content-Type": "text/xml" },
});

/**
 * Point this URL at your Twilio phone number's "A message comes in"
 * webhook (console.twilio.com → Phone Numbers → your number → Messaging).
 * Every restaurant shares one Twilio number (see lib/sms/twilio.ts), so a
 * STOP reply is ambiguous about which restaurant it's for — the only
 * compliant read is to suppress marketing SMS from Sofratak everywhere,
 * not just the last restaurant that happened to text this number.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const from = String(form.get("From") ?? "");
  const body = String(form.get("Body") ?? "").trim().toUpperCase();
  if (!from) return EMPTY_TWIML;

  if (STOP_KEYWORDS.has(body)) {
    await getStore().unsubscribeSmsEverywhere(from);
  }

  return EMPTY_TWIML;
}
