"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/marketing/button";
import { submitComingSoonEmail } from "./actions";

export function ComingSoonEmailForm() {
  const t = useTranslations("site.comingSoon");
  const locale = useLocale() as "en" | "ar";
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    const result = await submitComingSoonEmail({ email, locale, website });
    setState(result.ok ? "sent" : "error");
  };

  if (state === "sent") {
    return (
      <p role="status" className="font-semibold text-olive">
        {t("sent")}
      </p>
    );
  }

  return (
    <div>
      <form onSubmit={submit} className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-center">
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
        <label className="sr-only" htmlFor="coming-soon-email">
          {t("emailPlaceholder")}
        </label>
        <input
          id="coming-soon-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          required
          className="h-12 rounded-field border border-olive/20 bg-white px-4 text-[15px] text-charcoal placeholder:text-stone focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25 sm:w-64"
        />
        <Button type="submit" disabled={state === "sending"} tone="light" className="shrink-0">
          {state === "sending" ? t("sending") : t("notifyMe")}
        </Button>
      </form>
      {state === "error" && (
        <p role="alert" className="mt-3 text-sm font-semibold text-error">
          {t("error")}
        </p>
      )}
    </div>
  );
}
