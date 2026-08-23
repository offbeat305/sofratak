import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ImportIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getStore } from "@/lib/db/store";
import { PLANS } from "@/lib/billing/plans";
import { ImpersonateButton } from "@/components/admin/impersonate-button";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const loc = locale as "en" | "ar";

  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(slug);
  if (!restaurant) notFound();

  const [orders, auditLog] = await Promise.all([
    store.listOrders(restaurant.id),
    store.listAuditLog(restaurant.id),
  ]);
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const ordersLast7d = orders.filter((o) => new Date(o.createdAt).getTime() >= cutoff).length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-olive">{restaurant.name[loc]}</h1>
        <p className="text-sm text-stone">{restaurant.slug}</p>
      </div>

      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <section className="rounded-card border border-olive/10 bg-white p-5">
          <h2 className="font-bold text-olive">{t("colBilling")}</h2>
          <p className="mt-2 text-sm text-charcoal">
            {restaurant.billing.tier ? PLANS[restaurant.billing.tier].name : t("noPlan")} ·{" "}
            {t(`billingStatus.${restaurant.billing.status}`)}
          </p>
          {restaurant.billing.periodEnd && (
            <p className="mt-1 text-xs text-stone">
              {t("periodEnd", {
                date: new Date(restaurant.billing.periodEnd).toLocaleDateString(loc === "ar" ? "ar" : "en-US"),
              })}
            </p>
          )}
        </section>

        <section className="rounded-card border border-olive/10 bg-white p-5">
          <h2 className="font-bold text-olive">{t("colOrdering")}</h2>
          <p className="mt-2 text-sm text-charcoal">
            {restaurant.ordering.paused ? t("pausedTag") : t("liveTag")}
          </p>
          <p className="mt-1 text-xs text-stone">{t("ordersLast7d", { count: ordersLast7d })}</p>
        </section>
      </div>

      <div className="flex max-w-2xl flex-wrap items-center gap-3">
        <ImpersonateButton slug={slug} />
        <Link
          href={`/admin/${slug}/menu-import`}
          className="inline-flex h-10 items-center gap-2 rounded-btn border border-olive/20 px-4 text-sm font-bold text-olive transition-colors hover:bg-olive/5"
        >
          <ImportIcon className="size-4" aria-hidden />
          {t("menuImport")}
        </Link>
      </div>

      <section className="max-w-2xl rounded-card border border-olive/10 bg-white p-5">
        <h2 className="font-bold text-olive">{t("auditLog")}</h2>
        {auditLog.length === 0 ? (
          <p className="mt-2 text-sm text-stone">{t("noAuditLog")}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {auditLog.map((entry) => (
              <li key={entry.id} className="border-b border-olive/5 pb-2 text-sm last:border-0">
                <p className="font-semibold text-charcoal">{entry.action}</p>
                <p className="text-xs text-stone">
                  {entry.actorEmail} · {new Date(entry.createdAt).toLocaleString(loc === "ar" ? "ar" : "en-US")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
