import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getStore } from "@/lib/db/store";
import { SettingsForm } from "@/components/dashboard/settings-form";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dash");

  const restaurant = await getStore().getRestaurantBySlug(slug);
  if (!restaurant) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-olive">{t("settings")}</h1>
      <SettingsForm slug={slug} restaurant={restaurant} />
    </div>
  );
}
