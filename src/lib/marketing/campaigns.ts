import "server-only";
import { getStore } from "@/lib/db/store";
import { getEmailChannel } from "@/lib/email";
import { getSmsChannel } from "@/lib/sms";
import { customersFromOrders, customersBySegment } from "@/lib/crm/customers";
import { renderCampaignEmail } from "./email-template";
import { withinSmsQuietHours } from "./compliance";
import type { Campaign, Restaurant } from "@/lib/db/types";

const digits = (phone: string) => phone.replace(/\D/g, "");

export type SendCampaignResult =
  | { ok: true; sentCount: number; failedCount: number; recipientCount: number }
  | { ok: false; error: string };

/**
 * Recipients = the CRM segment (vip/lapsed/new/all, computed from order
 * history) intersected with who's actually opted in to marketing on this
 * channel — a customer's order history alone is never enough to market
 * to them (see marketing_optins, separate from transactional smsOptIn).
 */
export async function sendCampaign(
  restaurant: Restaurant,
  campaign: Campaign,
  locale: "en" | "ar",
): Promise<SendCampaignResult> {
  if (campaign.channel === "sms" && !withinSmsQuietHours(restaurant.timezone)) {
    return {
      ok: false,
      error: "Outside SMS quiet hours (8am–9pm, restaurant local time) — try again then.",
    };
  }

  const store = getStore();
  const orders = await store.listOrders(restaurant.id);
  const segmentCustomers = customersBySegment(customersFromOrders(orders), campaign.segment);
  const optedIn = await store.listOptedIn(restaurant.id, campaign.channel);
  const optedInByPhone = new Map(optedIn.map((o) => [digits(o.phone), o]));

  const recipients = segmentCustomers
    .map((c) => optedInByPhone.get(digits(c.phone)))
    .filter((o): o is NonNullable<typeof o> => Boolean(o));

  let sent = 0;
  let failed = 0;

  if (campaign.channel === "sms") {
    for (const optIn of recipients) {
      try {
        await getSmsChannel().send({ to: optIn.phone, body: campaign.body });
        sent++;
      } catch (err) {
        console.error("[marketing] sms send failed", err);
        failed++;
      }
    }
  } else {
    const html = renderCampaignEmail(restaurant, locale, campaign.body);
    for (const optIn of recipients) {
      if (!optIn.email) {
        failed++;
        continue;
      }
      try {
        await getEmailChannel().send({
          to: optIn.email,
          subject: campaign.subject ?? restaurant.name[locale],
          text: campaign.body,
          html,
        });
        sent++;
      } catch (err) {
        console.error("[marketing] email send failed", err);
        failed++;
      }
    }
  }

  await store.markCampaignSent(campaign.id, recipients.length, sent, failed);
  return { ok: true, sentCount: sent, failedCount: failed, recipientCount: recipients.length };
}
