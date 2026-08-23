import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getStore } from "@/lib/db/store";
import { MenuImportForm } from "@/components/admin/menu-import-form";

export default async function MenuImportPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const restaurant = await getStore().getRestaurantBySlug(slug);
  if (!restaurant) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-olive">{t("menuImport")}</h1>
        <p className="text-sm text-stone">{restaurant.name.en}</p>
      </div>
      <MenuImportForm slug={slug} />
    </div>
  );
}
