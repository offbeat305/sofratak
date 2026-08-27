"use client";

import { Button } from "@/components/marketing/button";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { submitClaimAction } from "@/app/[locale]/(marketing)/eat/actions";

const inputCls =
  "mt-1 h-11 w-full rounded-field border border-olive/20 bg-white px-3.5 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25";
const labelCls = "text-sm font-bold text-olive";

/**
 * The claim/takedown form (docs/directory-spec.md). A claim is a sales
 * lead Zizo closes by phone — no self-serve editing in v1.
 */
export function ClaimForm({
  listingId,
  listingName,
  city,
  takedown = false,
}: {
  listingId: string;
  listingName: string;
  city: string;
  takedown?: boolean;
}) {
  const t = useTranslations("site.eat");
  const locale = useLocale() as "en" | "ar";
  const [form, setForm] = useState({ name: "", role: "", phone: "", email: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    const result = await submitClaimAction({
      listingId,
      listingName,
      city,
      takedown,
      locale,
      ...form,
    });
    setState(result.ok ? "sent" : "error");
  };

  if (state === "sent") {
    return (
      <p role="status" className="rounded-card border border-positive/25 bg-positive/8 p-5 font-semibold text-charcoal">
        {takedown ? t("takedownSuccess") : t("claimSuccess")}
      </p>
    );
  }

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
          <span className={labelCls}>{t("claimName")}</span>
          <input value={form.name} onChange={set("name")} required autoComplete="name" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>{t("claimRole")}</span>
          <input value={form.role} onChange={set("role")} required placeholder={t("claimRolePlaceholder")} className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>{t("claimPhone")}</span>
          <input value={form.phone} onChange={set("phone")} type="tel" inputMode="tel" dir="ltr" required autoComplete="tel" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>{t("claimEmail")}</span>
          <input value={form.email} onChange={set("email")} type="email" dir="ltr" autoComplete="email" className={inputCls} />
        </label>
      </div>
      <Button type="submit" disabled={state === "sending"} className="mt-1">
        {state === "sending" ? t("claimSending") : takedown ? t("takedownSubmit") : t("claimSubmit")}
      </Button>
      {state === "error" && (
        <p role="alert" className="text-sm font-semibold text-error">
          {t("claimError")}
        </p>
      )}
    </form>
  );
}
