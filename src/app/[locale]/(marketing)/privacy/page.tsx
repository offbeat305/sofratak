import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("site.legal");
  return { title: t("privacyTitle"), robots: { index: false } };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.legal");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-olive">{t("privacyTitle")}</h1>
      <p className="mt-1 text-sm text-stone">{t("updated", { date: "2026-08-13" })}</p>
      <p className="mt-6 leading-relaxed whitespace-pre-line text-charcoal">
        {t("privacyBody")}
      </p>
    </div>
  );
}
