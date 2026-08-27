"use client";

import { Button } from "@/components/marketing/button";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PlusCircle } from "lucide-react";
import { suggestRestaurantAction } from "@/app/[locale]/(marketing)/eat/actions";
import { EAT_METROS } from "@/content/eat-metros";

const inputCls =
  "mt-1 h-11 w-full rounded-field border border-olive/20 bg-white px-3.5 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25";
const labelCls = "text-sm font-bold text-olive";

/**
 * Community "Add a restaurant" (docs/marketplace-vision.md): suggestions
 * go to leads for manual approval — the community builds the directory,
 * Zizo curates it. Collapsed behind a button so it never competes with
 * the listings themselves.
 */
export function SuggestForm({ defaultCity }: { defaultCity?: string }) {
  const t = useTranslations("site.eat");
  const locale = useLocale() as "en" | "ar";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    restaurantName: "",
    city: defaultCity ?? EAT_METROS[0].slug,
    address: "",
    phone: "",
    note: "",
    website: "", // honeypot
  });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [key]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    const result = await suggestRestaurantAction({ ...form, locale });
    setState(result.ok ? "sent" : "error");
  };

  if (state === "sent") {
    return (
      <p role="status" className="rounded-card border border-positive/25 bg-positive/8 p-5 font-semibold text-charcoal">
        {t("suggestSuccess")}
      </p>
    );
  }

  if (!open) {
    return (
      <Button variant="secondary" tone="light" onClick={() => setOpen(true)}>
        <PlusCircle className="size-4" aria-hidden />
        {t("suggestCta")}
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-card border border-olive/10 bg-white p-5 sm:p-6">
      <h2 className="font-display text-xl font-bold text-olive">{t("suggestTitle")}</h2>
      <p className="mt-1 text-sm text-stone">{t("suggestSub")}</p>
      <div className="mt-4 flex flex-col gap-3">
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
            <span className={labelCls}>{t("suggestName")}</span>
            <input value={form.restaurantName} onChange={set("restaurantName")} required className={inputCls} />
          </label>
          <label>
            <span className={labelCls}>{t("suggestCity")}</span>
            <select value={form.city} onChange={set("city")} className={`${inputCls} appearance-none`}>
              {EAT_METROS.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name[locale]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <span className={labelCls}>{t("suggestAddress")}</span>
          <input value={form.address} onChange={set("address")} className={inputCls} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className={labelCls}>{t("suggestPhone")}</span>
            <input value={form.phone} onChange={set("phone")} type="tel" inputMode="tel" dir="ltr" className={inputCls} />
          </label>
          <label>
            <span className={labelCls}>{t("suggestNote")}</span>
            <input value={form.note} onChange={set("note")} className={inputCls} />
          </label>
        </div>
        <Button type="submit" disabled={state === "sending"} className="mt-1">
          {state === "sending" ? t("claimSending") : t("suggestSubmit")}
        </Button>
        {state === "error" && (
          <p role="alert" className="text-sm font-semibold text-error">
            {t("claimError")}
          </p>
        )}
      </div>
    </form>
  );
}
