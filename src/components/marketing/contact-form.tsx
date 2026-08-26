"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CircleCheck, Send } from "lucide-react";
import { submitLeadAction } from "@/app/[locale]/(marketing)/actions";

/**
 * General contact form (design-pass-7 §C). Writes a `contact` lead
 * through the existing action, which keeps the honeypot, the rate
 * limit, and the never-lose-a-lead file fallback. Needs migration 0014
 * for the widened kind constraint; before that the DB rejects it and
 * the local backup catches it, so nothing is lost either way.
 */
export function ContactForm() {
  const t = useTranslations("site.contact");
  const locale = useLocale() as "en" | "ar";
  const [name, setName] = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setState("sending");
    const res = await submitLeadAction({
      kind: "contact",
      name,
      phone,
      restaurant: restaurant || null,
      message: message || null,
      website,
      locale,
    });
    if (res.ok) {
      setState("sent");
      return;
    }
    setState("error");
    setError(
      res.error === "name" ? t("errorName") : res.error === "phone" ? t("errorPhone") : t("errorGeneric"),
    );
  };

  if (state === "sent") {
    return (
      <div className="card-crisp flex items-center gap-3 rounded-card bg-white p-6">
        <CircleCheck className="size-6 shrink-0 text-positive" aria-hidden />
        <p className="font-semibold text-charcoal">{t("sent")}</p>
      </div>
    );
  }

  const field =
    "h-12 w-full rounded-field border border-olive/20 bg-white px-3.5 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25";

  return (
    <form onSubmit={submit} className="card-crisp flex flex-col gap-3 rounded-card bg-white p-6 sm:p-8">
      <p className="font-display text-xl font-bold text-olive">{t("formTitle")}</p>
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
      <label className="flex flex-col gap-1 text-sm font-semibold text-charcoal">
        {t("name")}
        <input required value={name} onChange={(e) => setName(e.target.value)} className={field} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-charcoal">
        {t("restaurant")}
        <input value={restaurant} onChange={(e) => setRestaurant(e.target.value)} className={field} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-charcoal">
        {t("phone")}
        <input
          required
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={field}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-charcoal">
        {t("message")}
        <textarea
          rows={4}
          maxLength={500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-field border border-olive/20 bg-white p-3.5 text-[15px] font-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm font-semibold text-error">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={state === "sending"}
        className="press btn-shine mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-btn bg-brass font-bold text-ivory disabled:opacity-50"
      >
        <Send className="size-4 rtl:-scale-x-100" aria-hidden />
        {state === "sending" ? t("sending") : t("send")}
      </button>
    </form>
  );
}
