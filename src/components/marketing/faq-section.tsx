import { getTranslations } from "next-intl/server";
import { Reveal } from "./reveal";

type Faq = { q: string; a: string };

/**
 * Homepage FAQ (objection handling + FAQPage schema). Combines the core
 * five questions with the homepage-specific ones.
 */
export async function FaqSection() {
  const t = await getTranslations("site");
  const faqs = [
    ...(t.raw("faq.items") as Faq[]),
    ...(t.raw("citiesPage.faqs") as Faq[]),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid gap-x-10 gap-y-2 md:grid-cols-2">
        {faqs.map((faq, i) => (
          <Reveal key={faq.q} delay={(i % 4) * 60}>
            <details className="group rounded-field border border-olive/10 bg-white px-5 py-1">
              <summary className="cursor-pointer list-none py-3.5 font-bold text-charcoal marker:content-none">
                <span className="flex items-center justify-between gap-3">
                  {faq.q}
                  <span
                    className="text-xl leading-none font-semibold text-brass transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                    aria-hidden
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="pb-4 text-[15px] leading-relaxed text-stone">{faq.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
