import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Download } from "lucide-react";
import { getStore } from "@/lib/db/store";
import { customersForRestaurant } from "@/lib/crm/customers";
import { formatCents } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as "en" | "ar";
  const t = await getTranslations("dash");

  const restaurant = await getStore().getRestaurantBySlug(slug);
  if (!restaurant) notFound();
  const customers = await customersForRestaurant(restaurant.id);

  const dateFmt = new Intl.DateTimeFormat(loc === "ar" ? "ar-u-nu-latn" : loc, {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-olive">{t("customers")}</h1>
        <a
          href={`/api/dashboard/${slug}/customers.csv`}
          className="inline-flex items-center gap-2 rounded-btn border-[1.5px] border-olive px-4 py-2 text-sm font-bold text-olive hover:bg-olive/5"
        >
          <Download className="size-4" aria-hidden />
          {t("exportCsv")}
        </a>
      </div>

      {customers.length === 0 ? (
        <p className="rounded-card border border-olive/10 bg-white p-6 text-sm text-stone">
          {t("noCustomers")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {customers.map((c) => (
            <li
              key={c.phone}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-card border border-olive/10 bg-white p-4"
            >
              <div className="min-w-32 flex-1">
                <p className="font-bold text-charcoal">{c.name}</p>
                <p className="text-sm text-stone" dir="ltr">
                  {c.phone}
                </p>
              </div>
              <div className="flex gap-1.5">
                {c.tags.includes("vip") && <Badge variant="brass">{t("tagVip")}</Badge>}
                {c.tags.includes("lapsed") && <Badge variant="clay">{t("tagLapsed")}</Badge>}
                {c.tags.includes("new") && <Badge variant="success">{t("tagNew")}</Badge>}
              </div>
              <div className="text-end text-sm">
                <p className="font-bold text-charcoal tabular-nums" dir="ltr">
                  {formatCents(c.totalSpentCents, loc)}
                </p>
                <p className="text-stone">
                  {t("orderCount")}: <span dir="ltr">{c.orderCount}</span> ·{" "}
                  {t("lastOrder")}: {dateFmt.format(new Date(c.lastOrderAt))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
