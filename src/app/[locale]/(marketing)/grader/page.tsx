import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GraderTool } from "@/components/marketing/grader-tool";
import { localeAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("site.grader");
  return {
    title: t("title"),
    description: t("sub"),
    alternates: localeAlternates(locale, "/grader"),
  };
}

export default async function GraderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.grader");

  return (
    <div className="mx-auto max-w-2xl px-4 pt-28 pb-14 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-olive sm:text-4xl">{t("title")}</h1>
      <p className="mt-2 text-stone">{t("sub")}</p>
      <div className="mt-8">
        <GraderTool />
      </div>
    </div>
  );
}
