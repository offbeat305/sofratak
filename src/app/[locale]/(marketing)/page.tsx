import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center sm:px-6">
      <Badge>{t("home.title")}</Badge>
      <h1 className="font-display text-4xl font-bold text-olive sm:text-5xl">
        {t("brand.slogan")}
      </h1>
      <p className="max-w-xl text-lg text-stone">{t("home.body")}</p>
      <Link href="/styleguide" className={buttonClasses({ size: "lg" })}>
        {t("home.cta")}
      </Link>
    </section>
  );
}
