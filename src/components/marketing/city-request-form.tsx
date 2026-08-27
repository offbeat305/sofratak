"use client";
import { Button } from "@/components/marketing/button";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CircleCheck, Send } from "lucide-react";
import { submitLeadAction } from "@/app/[locale]/(marketing)/actions";

/**
 * "Not in your city yet? Tell us" (design-pass-7 §B). Writes a
 * `city_request` lead, which tells us where demand is before we spend
 * on a metro. Needs migration 0014 for the widened kind constraint.
 */
export function CityRequestForm() {
  const t = useTranslations("site.citiesPage");
  const locale = useLocale() as "en" | "ar";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    await submitLeadAction({ kind: "city_request", name, phone, city, website, locale });
    setState("sent");
  };

  if (state === "sent") {
    return (
      <div className="glass-pill flex items-center gap-3 rounded-card p-6 text-ivory">
        <CircleCheck className="size-6 shrink-0 text-brass brightness-150" aria-hidden />
        <p className="font-semibold">{t("requestSent")}</p>
      </div>
    );
  }

  const field =
    "h-11 w-full rounded-field border border-ivory/25 bg-ivory/10 px-3.5 text-[15px] text-ivory placeholder:text-ivory/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-sand/40";

  return (
    <form onSubmit={submit} className="glass-pill edge-light rounded-card p-6 text-ivory sm:p-8">
      <p className="font-display text-xl font-bold">{t("requestTitle")}</p>
      <p className="mt-1 text-sm text-ivory/70">{t("requestSub")}</p>
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />
      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("requestName")}
          className={field}
        />
        <input
          required
          dir="ltr"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("requestPhone")}
          className={field}
        />
        <input
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={t("requestCity")}
          className={field}
        />
      </div>
      <Button type="submit" disabled={state === "sending"} size="sm" className="mt-3">
        <Send className="size-4 rtl:-scale-x-100" aria-hidden />
        {state === "sending" ? t("requestSending") : t("requestSend")}
      </Button>
    </form>
  );
}
