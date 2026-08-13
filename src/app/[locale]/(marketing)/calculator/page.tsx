import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Estimator } from "@/components/marketing/estimator";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("site.estimator");
  return {
    title: t("title"),
    description: t("sub"),
  };
}

export default async function CalculatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.estimator");

  return (
    <div className="mx-auto max-w-2xl px-4 pt-28 pb-14 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-olive sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-2 text-stone">{t("sub")}</p>
      <div className="mt-8">
        <Estimator />
      </div>
    </div>
  );
}
