"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Zap } from "lucide-react";
import { saveAutomationSettingsAction } from "@/app/[locale]/(dashboard)/dashboard/[slug]/marketing/actions";
import type { Restaurant } from "@/lib/db/types";

export function AutomationsCard({
  slug,
  settings,
  hasReviewsUrl,
}: {
  slug: string;
  settings: Restaurant["automations"];
  hasReviewsUrl: boolean;
}) {
  const t = useTranslations("dash.marketing");
  const [, startTransition] = useTransition();
  const [state, setState] = useState(settings);
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof Restaurant["automations"]) => {
    const next = { ...state, [key]: !state[key] };
    setState(next);
    setSaved(false);
    startTransition(async () => {
      const result = await saveAutomationSettingsAction(slug, next);
      if (result.ok) setSaved(true);
    });
  };

  const rows: Array<{ key: keyof Restaurant["automations"]; label: string; note: string; disabled?: boolean }> = [
    { key: "welcome", label: t("welcomeLabel"), note: t("welcomeNote") },
    { key: "winBack", label: t("winBackLabel"), note: t("winBackNote") },
    {
      key: "reviewRequest",
      label: t("reviewRequestLabel"),
      note: hasReviewsUrl ? t("reviewRequestNote") : t("reviewRequestDisabledNote"),
      disabled: !hasReviewsUrl,
    },
    { key: "birthday", label: t("birthdayLabel"), note: t("birthdayNote") },
  ];

  return (
    <section className="rounded-card border border-olive/10 bg-white p-5">
      <h2 className="flex items-center gap-2 font-bold text-olive">
        <Zap className="size-4" aria-hidden />
        {t("automationsTitle")}
      </h2>
      <p className="mt-1 text-sm text-stone">{t("automationsSub")}</p>

      <div className="mt-4 flex flex-col gap-3">
        {rows.map((row) => (
          <label
            key={row.key}
            className={`flex items-start gap-2.5 text-sm ${row.disabled ? "opacity-50" : ""}`}
          >
            <input
              type="checkbox"
              checked={state[row.key] && !row.disabled}
              disabled={row.disabled}
              onChange={() => toggle(row.key)}
              className="mt-0.5 size-4 accent-olive"
            />
            <span>
              <span className="font-semibold text-charcoal">{row.label}</span>
              <br />
              <span className="text-stone">{row.note}</span>
            </span>
          </label>
        ))}
      </div>

      {saved && <p className="mt-3 text-sm font-semibold text-positive">{t("saved")}</p>}
    </section>
  );
}
