"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Award, Trash2 } from "lucide-react";
import { saveLoyaltySettingsAction } from "@/app/[locale]/(dashboard)/dashboard/[slug]/marketing/actions";
import type { Restaurant } from "@/lib/db/types";

const inputCls =
  "h-10 rounded-field border border-olive/20 bg-white px-3 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25";

/**
 * Punch-card framing (Zizo's call): the owner thinks in "after N orders,
 * the customer gets X" — a points ledger does the math underneath at
 * 1 punch = 1 point per paid order.
 */
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
  const [newReward, setNewReward] = useState({ nameEn: "", orders: "10", worth: "10.00" });
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
    const orders = parseInt(newReward.orders, 10);
    const worthCents = Math.round(parseFloat(newReward.worth || "0") * 100);
    if (!newReward.nameEn.trim() || !Number.isInteger(orders) || orders < 1 || worthCents < 1) return;
    save({
      ...state,
      rewards: [
        ...state.rewards,
        {
          id: `rwd-${Date.now()}`,
          name: { en: newReward.nameEn.trim(), ar: newReward.nameEn.trim() },
          pointsCost: orders,
          valueCents: worthCents,
        },
      ],
    });
    setNewReward({ nameEn: "", orders: "10", worth: "10.00" });
  };

  const removeReward = (id: string) =>
    save({ ...state, rewards: state.rewards.filter((r) => r.id !== id) });

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
        <div className="mt-4 border-t border-olive/10 pt-4">
          <p className="mb-2 text-xs font-bold tracking-wide text-stone uppercase">
            {t("rewardsTitle")}
          </p>
          {state.rewards.length > 0 && (
            <ul className="mb-3 flex flex-col gap-1.5">
              {state.rewards.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-charcoal">
                    {t("rewardRow", {
                      orders: r.pointsCost,
                      reward: r.name.en,
                      worth: (r.valueCents / 100).toFixed(2),
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeReward(r.id)}
                    className="shrink-0 text-stone hover:text-error"
                    aria-label={t("removeReward")}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className="col-span-2 flex flex-col gap-1 text-xs font-semibold text-stone sm:col-span-2">
              {t("rewardName")}
              <input
                value={newReward.nameEn}
                onChange={(e) => setNewReward({ ...newReward, nameEn: e.target.value })}
                placeholder={t("rewardNamePlaceholder")}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-stone">
              {t("rewardAfterOrders")}
              <input
                value={newReward.orders}
                onChange={(e) => setNewReward({ ...newReward, orders: e.target.value.replace(/\D/g, "") })}
                inputMode="numeric"
                dir="ltr"
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-stone">
              {t("rewardWorth")}
              <input
                value={newReward.worth}
                onChange={(e) => setNewReward({ ...newReward, worth: e.target.value.replace(/[^\d.]/g, "") })}
                inputMode="decimal"
                dir="ltr"
                className={inputCls}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={addReward}
            disabled={pending || !newReward.nameEn.trim()}
            className="mt-2 h-10 rounded-btn border border-olive/20 px-4 text-sm font-bold text-olive hover:bg-olive/5 disabled:opacity-50"
          >
            {t("addReward")}
          </button>
          <p className="mt-2 text-xs text-stone">{t("punchExplainer")}</p>
        </div>
      )}

      {saved && !pending && <p className="mt-3 text-sm font-semibold text-positive">{t("saved")}</p>}
    </section>
  );
}
