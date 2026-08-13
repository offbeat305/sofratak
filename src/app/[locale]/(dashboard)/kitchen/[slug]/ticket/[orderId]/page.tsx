import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getStore } from "@/lib/db/store";
import { formatCents } from "@/lib/money";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { robots: { index: false } };

/** Printable kitchen ticket — the SMS fallback links here. */
export default async function TicketPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; orderId: string }>;
}) {
  const { locale, slug, orderId } = await params;
  setRequestLocale(locale);

  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(slug);
  if (!restaurant) notFound();
  const order = await store.getOrder(orderId);
  if (!order || order.restaurantId !== restaurant.id) notFound();

  const timeFmt = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-sm bg-white p-6 font-mono text-sm text-charcoal print:max-w-none print:p-0">
      <div className="border-b-2 border-dashed border-charcoal pb-3 text-center">
        <p className="text-lg font-bold">{restaurant.name.en}</p>
        <p className="mt-1 text-2xl font-bold" dir="ltr">{order.number}</p>
        <p className="mt-1 uppercase">
          {order.fulfillment}
          {order.scheduledFor
            ? ` · ${timeFmt.format(new Date(order.scheduledFor))}`
            : " · ASAP"}
        </p>
        <p>{timeFmt.format(new Date(order.createdAt))}</p>
      </div>

      <ul className="border-b-2 border-dashed border-charcoal py-3">
        {order.lines.map((line, i) => (
          <li key={i} className="mb-2">
            <p className="font-bold" dir="ltr">
              {line.qty}× {line.name.en}
            </p>
            {line.modifiers.map((m, j) => (
              <p key={j} className="ps-4">- {m.optionName.en}</p>
            ))}
            {line.notes && <p className="ps-4 font-bold">! {line.notes}</p>}
          </li>
        ))}
      </ul>

      <div className="py-3">
        <p>{order.customer.name}</p>
        <p dir="ltr">{order.customer.phone}</p>
        {order.deliveryAddress && <p>{order.deliveryAddress}</p>}
        <p className="mt-2 font-bold" dir="ltr">
          TOTAL {formatCents(order.totalCents, "en")}
        </p>
      </div>

      <PrintButton />
    </div>
  );
}
