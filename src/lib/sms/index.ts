import "server-only";
import { getStore } from "@/lib/db/store";
import type { SmsRecord } from "@/lib/db/types";
import { TwilioSmsChannel } from "./twilio";

/**
 * SMS adapter. Real implementation: Twilio (TCPA rules apply from Phase 5:
 * opt-in at checkout, STOP handling, quiet hours). Transactional order
 * updates go out only when the diner gave a phone number at checkout.
 */
export interface SmsChannel {
  send(input: { to: string; body: string; orderId?: string }): Promise<void>;
}

/** Logs + persists to the store so dev flows are verifiable. */
class ConsoleSmsChannel implements SmsChannel {
  async send({ to, body, orderId }: { to: string; body: string; orderId?: string }) {
    const record: SmsRecord = {
      id: crypto.randomUUID(),
      to,
      body,
      orderId: orderId ?? null,
      sentAt: new Date().toISOString(),
    };
    console.log(`[sms → ${to}] ${body}`);
    await getStore().recordSms(record);
  }
}

export function getSmsChannel(): SmsChannel {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (sid && token && from) {
    return new TwilioSmsChannel(sid, token, from);
  }
  return new ConsoleSmsChannel();
}
