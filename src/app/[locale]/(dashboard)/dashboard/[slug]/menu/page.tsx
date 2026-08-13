import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getStore } from "@/lib/db/store";
import { MenuManager } from "@/components/dashboard/menu-manager";

export default async function MenuPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dash");

  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(slug);
  if (!restaurant) notFound();
  const menu = await store.getMenu(restaurant.id);
  if (!menu) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-olive">{t("menu")}</h1>
      <MenuManager slug={slug} menu={menu} />
    </div>
  );
}
