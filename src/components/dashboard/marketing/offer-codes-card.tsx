"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Tag } from "lucide-react";
import {
  createOfferCodeAction,
  setOfferCodeActiveAction,
} from "@/app/[locale]/(dashboard)/dashboard/[slug]/marketing/actions";
import type { OfferCode, OfferCodeType } from "@/lib/db/types";

const inputCls =
  "h-10 rounded-field border border-olive/20 bg-white px-3 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25";

export function OfferCodesCard({ slug, offerCodes }: { slug: string; offerCodes: OfferCode[] }) {
  const t = useTranslations("dash.marketing");
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [type, setType] = useState<OfferCodeType>("percent");
  const [value, setValue] = useState("10");
  const [maxUses, setMaxUses] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = () => {
    setError(null);
    startTransition(async () => {
      const result = await createOfferCodeAction(slug, {
        code,
        type,
        value: Number(value),
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: null,
      });
      if (result.ok) {
        setCode("");
        setValue("10");
        setMaxUses("");
      } else {
        setError(result.error);
      }
    });
  };

  const toggle = (id: string, active: boolean) =>
    startTransition(async () => {
      await setOfferCodeActiveAction(slug, id, active);
    });

  return (
    <section className="rounded-card border border-olive/10 bg-white p-5">
      <h2 className="flex items-center gap-2 font-bold text-olive">
        <Tag className="size-4" aria-hidden />
        {t("offerCodesTitle")}
      </h2>
      <p className="mt-1 text-sm text-stone">{t("offerCodesSub")}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={t("codePlaceholder")}
          dir="ltr"
          className={`${inputCls} col-span-2 uppercase sm:col-span-1`}
        />
        <select value={type} onChange={(e) => setType(e.target.value as OfferCodeType)} className={inputCls}>
          <option value="percent">{t("typePercent")}</option>
          <option value="flat">{t("typeFlatCents")}</option>
        </select>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          dir="ltr"
          className={inputCls}
        />
        <input
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          placeholder={t("maxUsesPlaceholder")}
          dir="ltr"
          className={inputCls}
        />
      </div>
      <button
        type="button"
        onClick={create}
        disabled={pending || !code.trim()}
        className="mt-3 h-10 rounded-btn bg-brass px-5 text-sm font-bold text-ivory transition-colors hover:bg-brass-deep disabled:opacity-50"
      >
        {t("createCode")}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-error">
          {error}
        </p>
      )}

      {offerCodes.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2 border-t border-olive/10 pt-4">
          {offerCodes.map((oc) => (
            <li key={oc.id} className="flex items-center justify-between text-sm">
              <span dir="ltr" className="font-mono font-bold text-charcoal">
                {oc.code}
              </span>
              <span className="text-stone">
                {oc.type === "percent" ? `${oc.value}%` : `${(oc.value / 100).toFixed(2)}`} ·{" "}
                {oc.useCount}/{oc.maxUses ?? "∞"}
              </span>
              <button
                type="button"
                onClick={() => toggle(oc.id, !oc.active)}
                className={`text-xs font-bold ${oc.active ? "text-positive" : "text-stone"}`}
              >
                {oc.active ? t("active") : t("inactive")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
