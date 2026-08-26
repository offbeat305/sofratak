import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AtSign, CalendarCheck, ConciergeBell, MapPin, MessageSquare, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ContactForm } from "@/components/marketing/contact-form";
import { CursorGlow } from "@/components/marketing/tech";
import { WhatsAppLink } from "@/components/marketing/whatsapp-link";
import { Reveal } from "@/components/marketing/reveal";
import { localeAlternates } from "@/lib/seo";

const ROUTE_ICONS = [CalendarCheck, ConciergeBell, MessageSquare];
const ROUTE_HREFS = ["/demo", "/login", "#contact-form"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("site.contact");
  return {
    title: t("title"),
    description: t("heroSub"),
    alternates: localeAlternates(locale, "/contact"),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.contact");
  const routes = t.raw("routes") as Array<{ title: string; body: string; cta: string }>;
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE;
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const instagram = process.env.NEXT_PUBLIC_INSTAGRAM_URL;

  return (
    <>
      {/* hero, WhatsApp is the hero action */}
      <section className="hero-ambient grid-blueprint relative bg-olive text-ivory">
        <CursorGlow />
        <div className="relative mx-auto max-w-3xl px-4 pt-28 pb-16 text-center sm:px-6 md:pt-36 md:pb-20">
          <h1 className="font-display text-[clamp(30px,5vw,52px)] leading-[1.08] font-bold">
            {t("heroH1")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ivory/75">{t("heroSub")}</p>

          <div className="mt-8 flex flex-col items-center gap-2">
            <p className="data-label text-brass brightness-150">{t("whatsappTitle")}</p>
            <WhatsAppLink className="glow-brass glow-hover h-13 px-8 text-lg" />
            <p className="text-sm text-ivory/60">{t("whatsappSub")}</p>
          </div>

          <p className="mt-8 inline-block rounded-full border border-sand/40 px-4 py-2 text-sm font-semibold text-sand">
            {t("promise")}
          </p>
        </div>
      </section>

      {/* three routes */}
      <section className="texture-dots bg-ivory">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-20">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-olive sm:text-4xl">
              {t("routesTitle")}
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {routes.map((route, i) => {
              const Icon = ROUTE_ICONS[i] ?? MessageSquare;
              const href = ROUTE_HREFS[i] ?? "#contact-form";
              const internal = href.startsWith("/");
              const body = (
                <>
                  <Icon className="size-6 text-brass" aria-hidden />
                  <p className="mt-3 font-display text-lg font-bold text-olive">{route.title}</p>
                  <p className="mt-1 flex-1 text-[15px] text-charcoal">{route.body}</p>
                  <span className="mt-4 inline-block text-sm font-bold text-brass-deep underline-offset-4 group-hover:underline">
                    {route.cta} →
                  </span>
                </>
              );
              return (
                <Reveal key={route.title} delay={i * 80}>
                  {internal ? (
                    <Link
                      href={href}
                      className="card-crisp glow-hover group flex h-full flex-col rounded-card bg-white p-6"
                    >
                      {body}
                    </Link>
                  ) : (
                    <a
                      href={href}
                      className="card-crisp glow-hover group flex h-full flex-col rounded-card bg-white p-6"
                    >
                      {body}
                    </a>
                  )}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* form + other ways */}
      <section id="contact-form" className="scroll-mt-20 bg-sand/25">
        <div className="mx-auto grid max-w-[1200px] items-start gap-8 px-4 py-16 sm:px-6 md:grid-cols-[1.2fr_1fr] md:py-20">
          <Reveal>
            <ContactForm />
          </Reveal>
          <Reveal delay={100}>
            <div className="card-crisp rounded-card bg-white p-6 sm:p-8">
              <p className="data-label text-stone">{t("otherWays")}</p>
              <div className="mt-4 flex flex-col gap-3">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    dir="ltr"
                    className="flex items-center gap-2.5 font-semibold text-charcoal hover:text-olive"
                  >
                    <Phone className="size-4 shrink-0 text-olive" aria-hidden />
                    {phone}
                  </a>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    dir="ltr"
                    className="flex items-center gap-2.5 font-semibold text-charcoal hover:text-olive"
                  >
                    <AtSign className="size-4 shrink-0 text-olive" aria-hidden />
                    {email}
                  </a>
                )}
                {instagram && (
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 font-semibold text-charcoal hover:text-olive"
                  >
                    <AtSign className="size-4 shrink-0 text-olive" aria-hidden />
                    {t("instagramLabel")}
                  </a>
                )}
              </div>
              <p className="receipt-rule mt-5 flex items-start gap-2.5 pt-4 text-sm text-stone">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                {t("location")}
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
