import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getStore } from "@/lib/db/store";
import { formatCents } from "@/lib/money";
import { OrderStatusView } from "@/components/storefront/order-status-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("storefront");
  return { title: t("statusTitle"), robots: { index: false } };
}

export default async function OrderStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string; orderId: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { locale, slug, orderId } = await params;
  const { new: isNew } = await searchParams;
  setRequestLocale(locale);
  const loc = locale as "en" | "ar";
  const t = await getTranslations("storefront");

  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(slug);
  if (!restaurant) notFound();
  const order = await store.getOrder(orderId);
  if (!order || order.restaurantId !== restaurant.id) {
    return (
      <div className="py-20 text-center text-stone">{t("orderNotFound")}</div>
    );
  }

  const fmt = (cents: number) => formatCents(cents, loc);
  const sectionCls =
    "rounded-card border border-charcoal/8 bg-white p-5 shadow-[0_1px_3px_rgba(31,31,31,0.05)]";

  return (
    <div className="flex flex-col gap-4 pt-6 pb-10">
      {isNew && (
        <div className="flex items-center gap-3 rounded-card border border-positive/25 bg-positive/8 p-4">
          <CheckCircle2 className="size-6 shrink-0 text-positive" aria-hidden />
          <div>
            <p className="font-bold text-charcoal">{t("orderPlaced")}</p>
            <p className="text-sm text-stone">
              {t("confirmationSent", { phone: order.customer.phone })}
            </p>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-charcoal">
        {t("orderNumber", { number: order.number })}
      </h1>

      <section className={sectionCls} aria-label={t("statusTitle")}>
        <OrderStatusView order={order} />
      </section>

      <section className={sectionCls} aria-label={t("yourOrder")}>
        <h2 className="mb-3 text-lg font-bold text-charcoal">{t("yourOrder")}</h2>
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
                {line.notes && <p className="text-sm text-stone italic">{line.notes}</p>}
              </div>
              <span className="font-semibold tabular-nums" dir="ltr">
                {fmt(line.lineTotalCents)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 flex flex-col gap-1.5 border-t border-charcoal/10 pt-3 text-[15px]">
          <div className="flex justify-between">
            <dt className="text-stone">{t("subtotal")}</dt>
            <dd className="tabular-nums" dir="ltr">{fmt(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone">{t("serviceFee")}</dt>
            <dd className="tabular-nums" dir="ltr">{fmt(order.serviceFeeCents)}</dd>
          </div>
          {order.deliveryFeeCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-stone">{t("deliveryFee")}</dt>
              <dd className="tabular-nums" dir="ltr">{fmt(order.deliveryFeeCents)}</dd>
            </div>
          )}
          {order.tipCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-stone">{t("tip")}</dt>
              <dd className="tabular-nums" dir="ltr">{fmt(order.tipCents)}</dd>
            </div>
          )}
          <div className="flex justify-between pt-1 text-lg font-bold">
            <dt>{t("total")}</dt>
            <dd className="tabular-nums" dir="ltr">{fmt(order.totalCents)}</dd>
          </div>
        </dl>
      </section>

      <Link
        href={`/s/${slug}`}
        className="mx-auto mt-2 rounded-btn border-[1.5px] border-[var(--sf-primary)] px-6 py-3 text-center font-bold text-[var(--sf-primary)]"
      >
        {t("backToMenu")}
      </Link>
    </div>
  );
}
