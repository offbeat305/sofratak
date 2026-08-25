import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { AtSign, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { WhatsAppLink } from "@/components/marketing/whatsapp-link";
import { CITIES } from "@/content/cities";
import { FOUNDER_STORY } from "@/content/founder-story";

const ARCH_LINE = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='72' height='16'><path d='M12 16 V10 a24 24 0 0 1 48 0 V16' fill='none' stroke='%23A9792B' stroke-opacity='0.25' stroke-width='2'/></svg>`,
)}")`;

export async function Footer() {
  const t = await getTranslations();
  const locale = (await getLocale()) as "en" | "ar";
  const year = new Date().getFullYear();
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE;
  const instagram = process.env.NEXT_PUBLIC_INSTAGRAM_URL;

  const productLinks = [
    { href: "/eat", label: t("site.eat.title") },
    { href: "/stories", label: t("site.stories.title") },
    { href: "/pricing", label: t("site.nav.pricing") },
    { href: "/calculator", label: t("site.nav.estimator") },
    { href: "/how-it-works", label: t("site.nav.howItWorks") },
    { href: "/demo", label: t("site.nav.demo") },
    { href: "/about", label: t("site.nav.about") },
  ];

  return (
    <footer className="bg-olive-deep text-ivory">
      {/* thin brass arch motif line (design-pass §8) */}
      <div className="h-4 w-full" style={{ backgroundImage: ARCH_LINE }} aria-hidden />

      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        {/* brand + mission */}
        <div className="flex flex-col gap-3">
          <Image
            src="/brand/logo-ivory.png"
            alt="Sofratak"
            width={261}
            height={60}
            className="h-12 w-auto self-start"
          />
          {/* founder-story mission line (EN until AR review) */}
          <p className="text-sm text-ivory/75">
            {locale === "en" ? FOUNDER_STORY.reuse.footerMission : t("site.footerTagline")}
          </p>
          <p className="text-sm font-semibold text-sand">
            {t("brand.slogan")}
            <span className="mx-2 text-ivory/40">·</span>
            <span dir={locale === "ar" ? "ltr" : "rtl"}>
              {locale === "ar" ? "Take Control. Own Your Growth." : "شغلك تحت سيطرتك"}
            </span>
          </p>
        </div>

        {/* links */}
        <div className="grid grid-cols-2 gap-8">
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
            <div className="flex flex-col gap-1.5">
              {CITIES.slice(0, 6).map((city) => (
                <Link
                  key={city.slug}
                  href={`/cities/${city.slug}`}
                  className="w-fit rounded-btn text-sm text-ivory/80 transition-colors hover:text-ivory"
                >
                  {city.name[locale]}
                </Link>
              ))}
              <Link
                href="/cities"
                className="w-fit rounded-btn text-sm font-semibold text-sand hover:text-ivory"
              >
                {t("site.citiesPage.otherCities")} →
              </Link>
            </div>
          </div>
        </div>

        {/* contact */}
        <div className="flex flex-col items-start gap-3">
          <h3 className="text-sm font-bold tracking-wide text-sand uppercase">
            {t("footer.contact")}
          </h3>
          <WhatsAppLink className="h-11 px-5 text-sm" />
          {phone && (
            <a
              href={`tel:${phone}`}
              dir="ltr"
              className="flex items-center gap-2 text-sm text-ivory/80 hover:text-ivory"
            >
              <Phone className="size-4" aria-hidden />
              {phone}
            </a>
          )}
          {instagram && (
            <a
              href={instagram}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-ivory/80 hover:text-ivory"
            >
              <AtSign className="size-4" aria-hidden />
              Instagram
            </a>
          )}
        </div>
      </div>

      <div className="border-t border-ivory/12">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <p className="text-xs text-ivory/60">
            {t("footer.rights", { year })} · {t("site.company")}
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/privacy" className="text-ivory/60 hover:text-ivory">
              {t("site.legal.privacyTitle")}
            </Link>
            <Link href="/terms" className="text-ivory/60 hover:text-ivory">
              {t("site.legal.termsTitle")}
            </Link>
            <LocaleSwitcher className="-my-2 text-ivory/80 hover:bg-ivory/10" />
          </div>
        </div>
      </div>
    </footer>
  );
}
