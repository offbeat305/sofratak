import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { ArchDivider } from "@/components/marketing/arch-divider";
import { localeAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("site.how");
  const tNote = await getTranslations("site");
  return {
    title: t("title"),
    description: tNote("how.note"),
    alternates: localeAlternates(locale, "/how-it-works"),
  };
}

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site");
  const steps = t.raw("how.steps") as Array<{ title: string; body: string }>;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-14 sm:px-6">
      <h1 className="text-center font-display text-3xl font-bold text-olive sm:text-4xl">
        {t("how.title")}
      </h1>
      <ol className="mt-12 flex flex-col gap-10">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-olive text-lg font-bold text-ivory">
              {i + 1}
            </span>
            <div>
              <h2 className="text-xl font-bold text-charcoal">{step.title}</h2>
              <p className="mt-1.5 text-stone">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-10 text-center font-semibold text-stone">{t("how.note")}</p>
      <ArchDivider className="mt-8" />
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link href="/calculator" className={buttonClasses({ size: "lg" })}>
          {t("nav.estimator")}
        </Link>
        <Link href="/demo" className={buttonClasses({ variant: "secondary", size: "lg" })}>
          {t("nav.demo")}
        </Link>
      </div>
    </div>
  );
}
