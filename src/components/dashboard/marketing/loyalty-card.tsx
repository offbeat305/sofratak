"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Award, Trash2 } from "lucide-react";
import { saveLoyaltySettingsAction } from "@/app/[locale]/(dashboard)/dashboard/[slug]/marketing/actions";
import type { Restaurant } from "@/lib/db/types";

const inputCls =
  "h-10 rounded-field border border-olive/20 bg-white px-3 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25";

export function LoyaltyCard({
  slug,
  settings,
}: {
  slug: string;
  settings: Restaurant["loyaltySettings"];
}) {
  const t = useTranslations("dash.marketing");
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState(settings);
  const [newReward, setNewReward] = useState({ nameEn: "", pointsCost: "100", valueCents: "500" });
  const [saved, setSaved] = useState(false);

  const save = (next: Restaurant["loyaltySettings"]) => {
    setState(next);
    setSaved(false);
    startTransition(async () => {
      const result = await saveLoyaltySettingsAction(slug, next);
      if (result.ok) setSaved(true);
    });
  };

  const addReward = () => {
    if (!newReward.nameEn.trim()) return;
    save({
      ...state,
      rewards: [
        ...state.rewards,
        {
          id: `rwd-${Date.now()}`,
          name: { en: newReward.nameEn, ar: newReward.nameEn },
          pointsCost: Number(newReward.pointsCost) || 0,
          valueCents: Number(newReward.valueCents) || 0,
        },
      ],
    });
    setNewReward({ nameEn: "", pointsCost: "100", valueCents: "500" });
  };

  const removeReward = (id: string) => save({ ...state, rewards: state.rewards.filter((r) => r.id !== id) });

  return (
    <section className="rounded-card border border-olive/10 bg-white p-5">
      <h2 className="flex items-center gap-2 font-bold text-olive">
        <Award className="size-4" aria-hidden />
        {t("loyaltyTitle")}
      </h2>
      <p className="mt-1 text-sm text-stone">{t("loyaltySub")}</p>

      <label className="mt-3 flex items-center gap-2.5 text-sm font-semibold text-charcoal">
        <input
          type="checkbox"
          checked={state.enabled}
          onChange={(e) => save({ ...state, enabled: e.target.checked })}
          className="size-4 accent-olive"
        />
        {t("loyaltyEnable")}
      </label>

      {state.enabled && (
        <>
          <label className="mt-3 flex flex-col gap-1 text-sm font-semibold text-charcoal">
            {t("earnRateLabel")}
            <input
              value={(state.centsPerPoint / 100).toFixed(2)}
              onChange={(e) => {
                const dollars = parseFloat(e.target.value || "0");
                if (Number.isFinite(dollars) && dollars > 0) {
                  setState({ ...state, centsPerPoint: Math.round(dollars * 100) });
                }
              }}
              onBlur={() => save(state)}
              dir="ltr"
              className={`${inputCls} max-w-32`}
            />
            <span className="text-xs font-normal text-stone">{t("earnRateNote")}</span>
          </label>

          <div className="mt-4 border-t border-olive/10 pt-4">
            <p className="mb-2 text-xs font-bold tracking-wide text-stone uppercase">
              {t("rewardsTitle")}
            </p>
            {state.rewards.length > 0 && (
              <ul className="mb-3 flex flex-col gap-1.5">
                {state.rewards.map((r) => (
                  <li key={r.id} className="flex items-center justify-between text-sm">
                    <span className="text-charcoal">
                      {r.name.en} — {r.pointsCost} {t("points")}
                    </span>
                    <button type="button" onClick={() => removeReward(r.id)} className="text-stone hover:text-error">
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              <input
                value={newReward.nameEn}
                onChange={(e) => setNewReward({ ...newReward, nameEn: e.target.value })}
                placeholder={t("rewardName")}
                className={`${inputCls} flex-1`}
              />
              <input
                value={newReward.pointsCost}
                onChange={(e) => setNewReward({ ...newReward, pointsCost: e.target.value.replace(/\D/g, "") })}
                placeholder={t("rewardPoints")}
                dir="ltr"
                className={`${inputCls} w-24`}
              />
              <button
                type="button"
                onClick={addReward}
                className="h-10 rounded-btn border border-olive/20 px-4 text-sm font-bold text-olive hover:bg-olive/5"
              >
                {t("addReward")}
              </button>
            </div>
          </div>
        </>
      )}

      {saved && !pending && <p className="mt-3 text-sm font-semibold text-positive">{t("saved")}</p>}
    </section>
  );
}
