"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/marketing/button";
import { submitLeadAction } from "@/app/[locale]/(marketing)/actions";

/**
 * "Get new guides when they drop" (design-pass-6 A) — writes a
 * story_signup lead (migration 0014). SMS, not email: matches the
 * text-first capture pattern already used by the estimator/grader.
 */
export function NewsletterStrip() {
  const t = useTranslations("site.stories");
  const locale = useLocale() as "en" | "ar";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    const result = await submitLeadAction({ kind: "story_signup", name, phone, website, locale });
    setState(result.ok ? "sent" : "error");
  };

  return (
    <section className="grid-blueprint relative mt-16 overflow-hidden rounded-card bg-olive px-6 py-10 text-ivory sm:px-10 sm:py-12">
      <div className="relative mx-auto max-w-lg text-center">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">{t("newsletterTitle")}</h2>
        <p className="mt-2 text-sm text-ivory/70 sm:text-base">{t("newsletterSub")}</p>

        {state === "sent" ? (
          <p role="status" className="mt-6 font-semibold text-sand">
            {t("newsletterSent")}
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-center">
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="hidden"
              name="website"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("newsletterName")}
              required
              className="h-12 rounded-field border border-ivory/25 bg-ivory/10 px-4 text-[15px] text-ivory placeholder:text-ivory/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass sm:w-48"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="tel"
              dir="ltr"
              placeholder={t("newsletterPhone")}
              required
              className="h-12 rounded-field border border-ivory/25 bg-ivory/10 px-4 text-[15px] text-ivory placeholder:text-ivory/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass sm:w-44"
            />
            <Button type="submit" disabled={state === "sending"} tone="dark" className="shrink-0">
              {state === "sending" ? t("newsletterSending") : t("newsletterSubmit")}
            </Button>
          </form>
        )}
        {state === "error" && (
          <p role="alert" className="mt-3 text-sm font-semibold text-error">
            {t("newsletterError")}
          </p>
        )}
      </div>
    </section>
  );
}
