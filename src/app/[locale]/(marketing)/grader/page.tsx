import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GraderTool } from "@/components/marketing/grader-tool";
import { localeAlternates, SITE_URL } from "@/lib/seo";

/** GEO/SEO: lets AI answer engines and Google cite this as a real, free tool. */
function graderJsonLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Sofratak Restaurant Grader",
    url: `${SITE_URL}/${locale}/grader`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any (web-based)",
    description:
      "Free tool that scores a restaurant's Google Business Profile, website, and online ordering setup, with an estimated monthly dollar impact.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

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
    <div className="texture-dots mx-auto max-w-2xl px-4 pt-28 pb-14 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graderJsonLd(locale)) }}
      />
      <h1 className="font-display text-3xl font-bold text-olive sm:text-4xl">{t("title")}</h1>
      <p className="mt-2 text-stone">{t("sub")}</p>
      <div className="mt-8">
        <GraderTool />
      </div>
    </div>
  );
}
