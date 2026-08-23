"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Gift } from "lucide-react";
import { savePostOrderPreferencesAction } from "@/app/[locale]/(storefront)/s/[slug]/actions";

export function PostOrderPreferences({
  restaurantSlug,
  phone,
}: {
  restaurantSlug: string;
  phone: string;
}) {
  const t = useTranslations("storefront");
  const [pending, startTransition] = useTransition();
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setError(null);
    startTransition(async () => {
      const result = await savePostOrderPreferencesAction({
        restaurantSlug,
        phone,
        smsOptIn,
        email,
        emailOptIn: Boolean(email.trim()),
        birthday,
      });
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  };

  const inputCls =
    "h-11 w-full rounded-field border border-charcoal/15 bg-white px-4 text-[15px] placeholder:text-stone/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-primary)]/40";

  if (saved) {
    return (
      <p role="status" className="text-sm font-semibold text-positive">
        {t("preferencesSaved")}
      </p>
    );
  }

  return (
    <section className="rounded-card border border-charcoal/8 bg-white p-5 shadow-[0_1px_3px_rgba(31,31,31,0.05)]">
      <h2 className="flex items-center gap-2 text-lg font-bold text-charcoal">
        <Gift className="size-5 shrink-0 text-[var(--sf-primary)]" aria-hidden />
        {t("preferencesTitle")}
      </h2>
      <p className="mt-1 text-sm text-stone">{t("preferencesSub")}</p>

      <div className="mt-4 flex flex-col gap-3">
        <label className="flex items-start gap-2.5 text-sm text-charcoal">
          <input
            type="checkbox"
            checked={smsOptIn}
            onChange={(e) => setSmsOptIn(e.target.checked)}
            className="mt-0.5 size-4 accent-[var(--sf-primary)]"
          />
          {t("smsMarketingOptIn")}
        </label>

        <label>
          <span className="text-sm font-bold text-charcoal">{t("emailOptional")}</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            dir="ltr"
            placeholder="you@example.com"
            className={`${inputCls} mt-1.5`}
          />
        </label>

        <label>
          <span className="text-sm font-bold text-charcoal">{t("birthdayOptional")}</span>
          <input
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            type="date"
            dir="ltr"
            className={`${inputCls} mt-1.5`}
          />
        </label>

        {error && (
          <p role="alert" className="text-sm font-semibold text-error">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="mt-1 h-11 rounded-btn bg-[var(--sf-primary)] font-bold text-white disabled:opacity-50"
        >
          {pending ? t("saving") : t("preferencesSave")}
        </button>
      </div>
    </section>
  );
}
