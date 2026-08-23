import "server-only";
import { getStore } from "@/lib/db/store";
import type { SmsRecord } from "@/lib/db/types";
import type { SmsChannel } from "./index";

/**
 * Plain REST call against Twilio's Messages API (no SDK dependency, same
 * choice made throughout this codebase — see scripts/create-owner.ts).
 * Shared number pool for v1: every restaurant sends from the one
 * TWILIO_PHONE_NUMBER configured on the platform account. Per-restaurant
 * numbers (better deliverability/branding, real added cost) are a later
 * upgrade, not this one.
 */
export class TwilioSmsChannel implements SmsChannel {
  constructor(
    private accountSid: string,
    private authToken: string,
    private from: string,
  ) {}

  async send({ to, body, orderId }: { to: string; body: string; orderId?: string }): Promise<void> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");
    const params = new URLSearchParams({ To: to, From: this.from, Body: body });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Twilio send failed (${res.status}): ${text}`);
    }

    const record: SmsRecord = {
      id: crypto.randomUUID(),
      to,
      body,
      orderId: orderId ?? null,
      sentAt: new Date().toISOString(),
    };
    await getStore().recordSms(record);
  }
}
