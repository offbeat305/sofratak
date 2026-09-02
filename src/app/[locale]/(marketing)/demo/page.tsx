import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarCheck, Calculator, MonitorSmartphone, MessageSquareText } from "lucide-react";
import { DemoForm } from "@/components/marketing/demo-form";
import { WhatsAppLink } from "@/components/marketing/whatsapp-link";
import { FOUNDER_STORY } from "@/content/founder-story";
import { localeAlternates } from "@/lib/seo";

const POINT_ICONS = [MonitorSmartphone, Calculator, CalendarCheck, MessageSquareText];

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

/**
 * Rebuilt per Zizo (Sep 2026): the old page was a bare form. Now it sells
 * the 15 minutes — what you'll actually see, in owner terms — with the
 * form as the payoff, not the whole page.
 */
export default async function DemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.demo");
  const points = t.raw("points") as Array<{ title: string; body: string }>;

  return (
    <div>
      {/* olive hero band — same visual language as the rest of the site */}
      <section className="grid-blueprint relative bg-olive pt-28 pb-12 text-ivory">
        <div className="relative mx-auto max-w-[1100px] px-4 sm:px-6">
          <h1 className="font-display max-w-2xl text-4xl leading-tight font-bold sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-3 max-w-xl text-lg text-ivory/80">{t("sub")}</p>
          <p className="data-label mt-5 text-brass brightness-150">{t("trustRow")}</p>
        </div>
      </section>

      <div className="texture-dots bg-ivory">
        <div className="mx-auto grid max-w-[1100px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          {/* left: what the 15 minutes buys */}
          <div>
            <h2 className="font-display text-2xl font-bold text-olive">{t("expectTitle")}</h2>
            <ul className="mt-6 flex flex-col gap-4">
              {points.map((point, i) => {
                const Icon = POINT_ICONS[i] ?? CalendarCheck;
                return (
                  <li key={point.title} className="flex gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-olive/[0.07]">
                      <Icon className="size-5 text-brass-deep" aria-hidden />
                    </span>
                    <div>
                      <p className="font-bold text-olive">{point.title}</p>
                      <p className="mt-0.5 text-[15px] text-charcoal">{point.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {locale === "en" && (
              // founder-story reuse: family-business reassurance near the form
              <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-sand-soft/70 px-4 py-2 text-sm font-semibold text-olive">
                {FOUNDER_STORY.reuse.demoReassurance}
              </p>
            )}

            <div className="mt-8 flex flex-col items-start gap-3">
              <p className="text-sm font-semibold text-stone">{t("whatsappNote")}</p>
              <WhatsAppLink />
            </div>
          </div>

          {/* right: the form — the page's single glowing object */}
          <div>
            <div className="glow-brass edge-light rounded-card border border-olive/10 bg-white p-5 sm:p-7">
              <h2 className="font-display text-xl font-bold text-olive">{t("formTitle")}</h2>
              <div className="mt-4">
                <Suspense fallback={null}>
                  <DemoForm />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
