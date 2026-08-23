import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DemoForm } from "@/components/marketing/demo-form";
import { WhatsAppLink } from "@/components/marketing/whatsapp-link";
import { FOUNDER_STORY } from "@/content/founder-story";
import { localeAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("site.demo");
  return {
    title: t("title"),
    description: t("sub"),
    alternates: localeAlternates(locale, "/demo"),
  };
}

export default async function DemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.demo");

  return (
    <div className="mx-auto max-w-xl px-4 pt-28 pb-14 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-olive sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-2 text-stone">{t("sub")}</p>
      {locale === "en" && (
        // founder-story reuse: family-business reassurance near the form
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-sand-soft/70 px-4 py-2 text-sm font-semibold text-olive">
          {FOUNDER_STORY.reuse.demoReassurance}
        </p>
      )}
      <div className="mt-8 rounded-card border border-olive/10 bg-white p-5 sm:p-6">
        <Suspense fallback={null}>
          <DemoForm />
        </Suspense>
      </div>
      <div className="mt-6 flex flex-col items-center gap-3 text-center">
        <p className="text-sm font-semibold text-stone">{t("whatsappNote")}</p>
        <WhatsAppLink />
      </div>
    </div>
  );
}
