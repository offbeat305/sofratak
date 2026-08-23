import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getStore } from "@/lib/db/store";
import { formatCents } from "@/lib/money";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { dayNumber, netCents } from "@/lib/orders/stats";
import type { Order } from "@/lib/db/types";

export default async function TodayPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as "en" | "ar";
  const t = await getTranslations("dash");
  const tKitchen = await getTranslations("kitchen");

  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(slug);
  if (!restaurant) notFound();
  const orders = (await store.listOrders(restaurant.id)).filter(
    (o) => o.paymentStatus !== "pending",
  );

  const tz = restaurant.timezone;
  const nowDay = dayNumber(new Date(), tz);
  const ageDays = (o: Order) => nowDay - dayNumber(o.createdAt, tz);
  const today = orders.filter((o) => ageDays(o) === 0);
  const thisWeek = orders.filter((o) => ageDays(o) <= 6);
  const lastWeek = orders.filter((o) => {
    const age = ageDays(o);
    return age >= 7 && age <= 13;
  });

  const todayRevenue = today.reduce((n, o) => n + netCents(o), 0);
  const thisWeekRevenue = thisWeek.reduce((n, o) => n + netCents(o), 0);
  const lastWeekRevenue = lastWeek.reduce((n, o) => n + netCents(o), 0);
  const avgTicket = today.length ? Math.round(todayRevenue / today.length) : 0;
  const weekDelta =
    lastWeekRevenue > 0
      ? Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100)
      : undefined;

  const live = orders.filter(
    (o) => o.status !== "completed" && o.status !== "canceled",
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("todayRevenue")} value={todayRevenue / 100} format="currency" animate={false} />
        <StatCard label={t("todayOrders")} value={today.length} animate={false} />
        <StatCard label={t("avgTicket")} value={avgTicket / 100} format="currency" animate={false} />
        <StatCard
          label={t("weekVsLast")}
          value={thisWeekRevenue / 100}
          format="currency"
          delta={weekDelta}
          animate={false}
        />
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-olive">{t("liveOrders")}</h2>
          <Link
            href={`/kitchen/${slug}`}
            className="text-sm font-semibold text-brass-deep hover:underline"
          >
            {t("kitchen")} →
          </Link>
        </div>
        {live.length === 0 ? (
          <p className="rounded-card border border-olive/10 bg-white p-6 text-sm text-stone">
            {t("noLiveOrders")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {live.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/dashboard/${slug}/orders/${order.id}`}
                  className="flex items-center justify-between gap-3 rounded-card border border-olive/10 bg-white p-4 hover:border-olive/30"
                >
                  <span className="font-bold text-charcoal" dir="ltr">
                    {order.number}
                  </span>
                  <span className="text-sm text-stone">{order.customer.name}</span>
                  <Badge variant="olive">{tKitchen(`columns.${order.status === "received" ? "received" : order.status === "preparing" ? "preparing" : "ready"}`)}</Badge>
                  <span className="font-bold text-charcoal tabular-nums" dir="ltr">
                    {formatCents(order.totalCents, loc)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
