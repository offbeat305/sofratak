import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Wordmark } from "@/components/Wordmark";

export async function Footer() {
  const t = await getTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-olive text-ivory">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="flex flex-col gap-3">
          <Wordmark tone="ivory" />
          <p className="text-sm text-ivory/80">{t("brand.slogan")}</p>
          <p className="text-sm text-ivory/60">{t("footer.tagline")}</p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold tracking-wide text-sand uppercase">
            {t("footer.product")}
          </h3>
          <Link
            href="/calculator"
            className="w-fit rounded-btn text-sm text-ivory/80 transition-colors hover:text-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand"
          >
            {t("nav.calculator")}
          </Link>
          <Link
            href="/styleguide"
            className="w-fit rounded-btn text-sm text-ivory/80 transition-colors hover:text-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand"
          >
            {t("nav.styleguide")}
          </Link>
        </div>

        <div className="flex flex-col items-start gap-2">
          <h3 className="text-sm font-bold tracking-wide text-sand uppercase">
            {t("footer.language")}
          </h3>
          <LocaleSwitcher className="-ms-3 text-ivory/90 hover:bg-ivory/10" />
        </div>
      </div>
      <div className="border-t border-ivory/15">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-ivory/60 sm:px-6">
          {t("footer.rights", { year })}
        </p>
      </div>
    </footer>
  );
}
