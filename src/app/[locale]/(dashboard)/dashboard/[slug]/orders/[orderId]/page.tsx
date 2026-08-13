import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getStore } from "@/lib/db/store";
import { formatCents } from "@/lib/money";
import { refundedSoFarCents } from "@/lib/orders/refunds";
import { Badge } from "@/components/ui/Badge";
import { RefundPanel } from "@/components/dashboard/refund-panel";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; orderId: string }>;
}) {
  const { locale, slug, orderId } = await params;
  setRequestLocale(locale);
  const loc = locale as "en" | "ar";
  const t = await getTranslations("dash");
  const tSf = await getTranslations("storefront");

  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(slug);
  if (!restaurant) notFound();
  const order = await store.getOrder(orderId);
  if (!order || order.restaurantId !== restaurant.id) notFound();

  const refunded = refundedSoFarCents(order);
  const dateFmt = new Intl.DateTimeFormat(loc === "ar" ? "ar-u-nu-latn" : loc, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-olive">
          {t("orderDetail", { number: order.number })}
        </h1>
        <Badge
          variant={
            order.paymentStatus === "paid"
              ? "success"
              : order.paymentStatus === "pending"
                ? "clay"
                : "brass"
          }
        >
          {t(`paymentStatus.${order.paymentStatus}`)}
        </Badge>
        <Badge variant="olive">{tSf(`status.${order.status}`)}</Badge>
      </div>

      <div className="rounded-card border border-olive/10 bg-white p-5 text-sm text-charcoal">
        <p className="font-semibold">{order.customer.name}</p>
        <p dir="ltr" className="text-stone">{order.customer.phone}</p>
        <p className="text-stone">
          {tSf(order.fulfillment)} · {dateFmt.format(new Date(order.createdAt))}
        </p>
        {order.deliveryAddress && <p className="text-stone">{order.deliveryAddress}</p>}
      </div>

      <div className="rounded-card border border-olive/10 bg-white p-5">
        <ul className="flex flex-col divide-y divide-charcoal/8 text-[15px]">
          {order.lines.map((line, i) => (
            <li key={i} className="flex justify-between gap-3 py-2.5">
              <div>
                <p className="font-semibold text-charcoal">
                  <span dir="ltr">{line.qty}×</span> {line.name[loc]}
                </p>
                {line.modifiers.length > 0 && (
                  <p className="text-sm text-stone">
                    {line.modifiers.map((m) => m.optionName[loc]).join(" · ")}
                  </p>
                )}
              </div>
              <span className="tabular-nums" dir="ltr">
                {formatCents(line.lineTotalCents, loc)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 flex flex-col gap-1.5 border-t border-charcoal/10 pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone">{tSf("subtotal")}</dt>
            <dd className="tabular-nums" dir="ltr">{formatCents(order.subtotalCents, loc)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone">{tSf("serviceFee")}</dt>
            <dd className="tabular-nums" dir="ltr">{formatCents(order.serviceFeeCents, loc)}</dd>
          </div>
          {order.deliveryFeeCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-stone">{tSf("deliveryFee")}</dt>
              <dd className="tabular-nums" dir="ltr">{formatCents(order.deliveryFeeCents, loc)}</dd>
            </div>
          )}
          {order.tipCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-stone">{tSf("tip")}</dt>
              <dd className="tabular-nums" dir="ltr">{formatCents(order.tipCents, loc)}</dd>
            </div>
          )}
          <div className="flex justify-between pt-1 text-base font-bold">
            <dt>{tSf("total")}</dt>
            <dd className="tabular-nums" dir="ltr">{formatCents(order.totalCents, loc)}</dd>
          </div>
          {refunded > 0 && (
            <p className="text-end text-sm font-semibold text-clay">
              {t("refundedSoFar", { amount: formatCents(refunded, loc) })}
            </p>
          )}
        </dl>
      </div>

      {order.paymentStatus !== "pending" && (
        <RefundPanel order={order} slug={slug} />
      )}
    </div>
  );
}
