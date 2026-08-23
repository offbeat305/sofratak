import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/db/store";

const STOP_KEYWORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);

const EMPTY_TWIML = () =>
  new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    headers: { "Content-Type": "text/xml" },
  });

/**
 * Twilio request validation (Phase 8A): X-Twilio-Signature is
 * base64(HMAC-SHA1(auth token, full URL + POST params concatenated
 * key+value in sorted-key order)). Without a valid signature anyone
 * could POST here and mass-unsubscribe numbers. Enforced whenever
 * TWILIO_AUTH_TOKEN is configured; in local dev (no token) requests
 * pass so the route stays testable.
 * The URL must match what Twilio requested byte-for-byte — set
 * TWILIO_WEBHOOK_URL in prod (see docs/LAUNCH.md) rather than trusting
 * proxy-rewritten host headers.
 */
function isValidTwilioSignature(request: NextRequest, form: FormData, authToken: string): boolean {
  const signature = request.headers.get("x-twilio-signature");
  if (!signature) return false;

  const url =
    process.env.TWILIO_WEBHOOK_URL ??
    `${request.headers.get("x-forwarded-proto") ?? "https"}://${request.headers.get("host")}${request.nextUrl.pathname}`;

  const params = [...form.entries()]
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => k + v)
    .join("");

  const expected = createHmac("sha1", authToken).update(url + params).digest("base64");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

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

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (authToken && !isValidTwilioSignature(request, form, authToken)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 403 });
  }

  const from = String(form.get("From") ?? "");
  const body = String(form.get("Body") ?? "").trim().toUpperCase();
  if (!from) return EMPTY_TWIML();

  if (STOP_KEYWORDS.has(body)) {
    await getStore().unsubscribeSmsEverywhere(from);
  }

  return EMPTY_TWIML();
}
