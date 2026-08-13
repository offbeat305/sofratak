import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Wordmark } from "@/components/Wordmark";
import { WhatsAppLink } from "@/components/marketing/whatsapp-link";
import { CITIES } from "@/content/cities";

export async function Footer() {
  const t = await getTranslations();
  const locale = (await getLocale()) as "en" | "ar";
  const year = new Date().getFullYear();

  const productLinks = [
    { href: "/pricing", label: t("site.nav.pricing") },
    { href: "/calculator", label: t("site.nav.estimator") },
    { href: "/how-it-works", label: t("site.nav.howItWorks") },
    { href: "/demo", label: t("site.nav.demo") },
    { href: "/about", label: t("site.nav.about") },
  ];

  return (
    <footer className="bg-olive text-ivory">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="flex flex-col gap-3">
          <Wordmark tone="ivory" />
          <p className="text-sm text-ivory/80">{t("brand.slogan")}</p>
          <p className="text-sm text-ivory/60">{t("site.footerTagline")}</p>
          <WhatsAppLink className="mt-2 h-10 self-start px-4 text-sm" />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold tracking-wide text-sand uppercase">
            {t("footer.product")}
          </h3>
          {productLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="w-fit rounded-btn text-sm text-ivory/80 transition-colors hover:text-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold tracking-wide text-sand uppercase">
            {t("site.nav.cities")}
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/cities/${city.slug}`}
                className="w-fit rounded-btn text-sm text-ivory/80 transition-colors hover:text-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand"
              >
                {city.name[locale]}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start gap-2">
          <h3 className="text-sm font-bold tracking-wide text-sand uppercase">
            {t("footer.language")}
          </h3>
          <LocaleSwitcher className="-ms-3 text-ivory/90 hover:bg-ivory/10" />
        </div>
      </div>
      <div className="border-t border-ivory/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 sm:px-6">
          <p className="text-xs text-ivory/60">
            {t("footer.rights", { year })} · {t("site.company")}
          </p>
          <p className="flex gap-4 text-xs">
            <Link href="/privacy" className="text-ivory/60 hover:text-ivory">
              {t("site.legal.privacyTitle")}
            </Link>
            <Link href="/terms" className="text-ivory/60 hover:text-ivory">
              {t("site.legal.termsTitle")}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
