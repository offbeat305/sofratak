import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getStore } from "@/lib/db/store";
import { PLANS } from "@/lib/billing/plans";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default async function AdminTenantsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const loc = locale as "en" | "ar";

  const store = getStore();
  const restaurants = await store.listAllRestaurants();
  const rows = await Promise.all(
    restaurants.map(async (restaurant) => {
      const orders = await store.listOrders(restaurant.id);
      const cutoff = Date.now() - SEVEN_DAYS_MS;
      const recent = orders.filter((o) => new Date(o.createdAt).getTime() >= cutoff);
      const lastOrderAt = orders[0]?.createdAt ?? null;
      return { restaurant, ordersLast7d: recent.length, lastOrderAt };
    }),
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-olive">{t("tenants")}</h1>

      {rows.length === 0 ? (
        <p className="text-sm text-stone">{t("noTenants")}</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-olive/10 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-olive/10 text-left text-stone">
                <th className="px-4 py-3 font-semibold">{t("colTenant")}</th>
                <th className="px-4 py-3 font-semibold">{t("colBilling")}</th>
                <th className="px-4 py-3 font-semibold">{t("colOrdering")}</th>
                <th className="px-4 py-3 font-semibold">{t("colOrders7d")}</th>
                <th className="px-4 py-3 font-semibold">{t("colLastOrder")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ restaurant, ordersLast7d, lastOrderAt }) => (
                <tr key={restaurant.id} className="border-b border-olive/5 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-olive">{restaurant.name[loc]}</p>
                    <p className="text-xs text-stone">{restaurant.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    {restaurant.billing.tier ? (
                      <span className="text-olive">{PLANS[restaurant.billing.tier].name}</span>
                    ) : (
                      <span className="text-stone">n/a</span>
                    )}
                    <span
                      className={`ms-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        restaurant.billing.status === "active"
                          ? "bg-positive/10 text-positive"
                          : restaurant.billing.status === "past_due"
                            ? "bg-error/10 text-error"
                            : "bg-olive/10 text-stone"
                      }`}
                    >
                      {t(`billingStatus.${restaurant.billing.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {restaurant.ordering.paused ? (
                      <span className="font-semibold text-error">{t("pausedTag")}</span>
                    ) : (
                      <span className="text-positive">{t("liveTag")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-olive">{ordersLast7d}</td>
                  <td className="px-4 py-3 text-stone">
                    {lastOrderAt ? new Date(lastOrderAt).toLocaleDateString(loc === "ar" ? "ar" : "en-US") : ""}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Link
                      href={`/admin/${restaurant.slug}`}
                      className="font-semibold text-brass hover:text-brass-deep"
                    >
                      {t("manage")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
