import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { ArchDivider } from "@/components/marketing/arch-divider";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("site.about");
  return { title: t("title") };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site");

  return (
    <div className="mx-auto max-w-2xl px-4 pt-28 pb-14 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-olive sm:text-4xl">
        {t("about.title")}
      </h1>

      {/* TODO: founder photo from Zizo — family-business tone, no corporate
          bio (website spec). Swap this block when the photo arrives. */}
      <div className="mt-8 flex h-56 items-center justify-center rounded-card border border-dashed border-olive/25 bg-sand-soft/40 text-sm font-semibold text-stone">
        {t("about.photoNote") === "PHOTO_PLACEHOLDER" ? "Photo — coming from Zizo" : null}
      </div>

      <div className="mt-8 flex flex-col gap-5 text-[17px] leading-relaxed text-charcoal">
        <p>{t("about.p1")}</p>
        <p>{t("about.p2")}</p>
        <p className="font-semibold">{t("about.p3")}</p>
      </div>
      <p className="mt-8 font-bold text-olive">{t("about.founder")}</p>

      <ArchDivider className="mt-10" />
      <div className="mt-4 flex justify-center">
        <Link href="/demo" className={buttonClasses({ size: "lg" })}>
          {t("nav.demo")}
        </Link>
      </div>
    </div>
  );
}
