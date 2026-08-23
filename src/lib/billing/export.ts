import "server-only";
import { getStore } from "@/lib/db/store";
import type { Restaurant } from "@/lib/db/types";
import { ordersToCsv, customersFromOrdersCsv } from "@/lib/exports/csv";
import { getEmailChannel } from "@/lib/email";
import { getSmsChannel } from "@/lib/sms";

/**
 * The cancel-flow sales weapon (CLAUDE.md): "on cancel, auto-email the
 * owner their full CSV exports; keeping this promise is a sales weapon."
 * Called once from the subscription-canceled webhook — markCancelExportSent
 * is atomic so a duplicate webhook delivery can never send it twice.
 */
export async function sendCancellationExport(restaurant: Restaurant): Promise<void> {
  const store = getStore();
  const shouldSend = await store.markCancelExportSent(restaurant.id);
  if (!shouldSend) return;

  const orders = await store.listOrders(restaurant.id);
  const ownerEmail = await store.getOwnerEmail(restaurant.id);
  if (!ownerEmail) {
    console.error(`[billing] no owner email for ${restaurant.slug} — export not sent`);
    return;
  }

  await getEmailChannel().send({
    to: ownerEmail,
    subject: `Your Sofratak data — ${restaurant.name.en}`,
    text: [
      `Hi,`,
      ``,
      `Your Sofratak subscription for ${restaurant.name.en} has been canceled. As promised, here is a complete export of your data — every order and every customer, yours to keep.`,
      ``,
      `Orders: ${orders.length}`,
      `Attached: orders.csv, customers.csv`,
      ``,
      `If you ever want to come back, your storefront and menu are still here waiting. Thank you for trying Sofratak.`,
      ``,
      `— The Sofratak team`,
    ].join("\n"),
    attachments: [
      { filename: `${restaurant.slug}-orders.csv`, content: ordersToCsv(orders) },
      { filename: `${restaurant.slug}-customers.csv`, content: customersFromOrdersCsv(orders) },
    ],
  });
}

/** Dunning: payment failed → notify the owner, nudge them to update the card. */
export async function notifyPaymentFailed(restaurant: Restaurant): Promise<void> {
  const ownerEmail = await getStore().getOwnerEmail(restaurant.id);
  const portalNote = "Update your card from Dashboard → Settings → Billing.";
  if (ownerEmail) {
    await getEmailChannel().send({
      to: ownerEmail,
      subject: `Action needed: payment failed for ${restaurant.name.en}`,
      text: `Your latest Sofratak subscription payment didn't go through. ${portalNote} Your storefront keeps running for now, but please update your card soon to avoid interruption.`,
    });
  }
  if (restaurant.phone) {
    await getSmsChannel().send({
      to: restaurant.phone,
      body: `Sofratak: your subscription payment failed. ${portalNote}`,
    });
  }
}

export async function notifyPaymentRecovered(restaurant: Restaurant): Promise<void> {
  const ownerEmail = await getStore().getOwnerEmail(restaurant.id);
  if (!ownerEmail) return;
  await getEmailChannel().send({
    to: ownerEmail,
    subject: `Payment received — ${restaurant.name.en}`,
    text: `Thanks — your card went through and your Sofratak subscription is active again.`,
  });
}
