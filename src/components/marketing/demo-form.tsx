"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { submitLeadAction } from "@/app/[locale]/(marketing)/actions";

export function DemoForm() {
  const t = useTranslations("site.demo");
  const tEst = useTranslations("site.estimator");
  const locale = useLocale() as "en" | "ar";
  const [form, setForm] = useState({
    name: "",
    restaurant: "",
    phone: "",
    email: "",
    city: "",
    message: "",
    website: "", // honeypot
  });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    const result = await submitLeadAction({ kind: "demo", locale, ...form });
    setState(result.ok ? "sent" : "error");
  };

  if (state === "sent") {
    return (
      <p className="rounded-card border border-positive/25 bg-positive/8 p-5 font-semibold text-charcoal" role="status">
        {t("success")}
      </p>
    );
  }

  const inputCls =
    "mt-1 h-11 w-full rounded-field border border-olive/20 bg-white px-3.5 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25";
  const labelCls = "text-sm font-bold text-olive";

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input
        type="text"
        value={form.website}
        onChange={set("website")}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
        name="website"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className={labelCls}>{t("name")}</span>
          <input value={form.name} onChange={set("name")} required autoComplete="name" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>{t("restaurant")}</span>
          <input value={form.restaurant} onChange={set("restaurant")} required className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>{t("phone")}</span>
          <input value={form.phone} onChange={set("phone")} type="tel" inputMode="tel" dir="ltr" required autoComplete="tel" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>{t("email")}</span>
          <input value={form.email} onChange={set("email")} type="email" dir="ltr" autoComplete="email" className={inputCls} />
        </label>
      </div>
      <label>
        <span className={labelCls}>{t("city")}</span>
        <input value={form.city} onChange={set("city")} required className={inputCls} />
      </label>
      <label>
        <span className={labelCls}>{t("message")}</span>
        <textarea
          value={form.message}
          onChange={set("message")}
          rows={3}
          className="mt-1 w-full rounded-field border border-olive/20 bg-white px-3.5 py-2.5 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
        />
      </label>
      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-1 h-12 rounded-btn bg-brass font-bold text-ivory transition-colors hover:bg-brass-deep disabled:opacity-50"
      >
        {state === "sending" ? t("sending") : t("submit")}
      </button>
      {state === "error" && (
        <p className="text-sm font-semibold text-error" role="alert">
          {tEst("error")}
        </p>
      )}
    </form>
  );
}
