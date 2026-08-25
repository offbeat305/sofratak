"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { DayHours, Restaurant } from "@/lib/db/types";
import { cn } from "@/lib/cn";
import {
  saveDirectoryBlurbAction,
  saveSettingsAction,
} from "@/app/[locale]/(dashboard)/dashboard/[slug]/actions";

export function SettingsForm({
  slug,
  restaurant,
  directoryBlurb,
}: {
  slug: string;
  restaurant: Restaurant;
  /** null = this restaurant hasn't claimed an /eat listing */
  directoryBlurb: { en: string; ar: string } | null;
}) {
  const t = useTranslations("dash");
  const tSf = useTranslations("storefront");
  const days = tSf.raw("days") as string[];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [ordering, setOrdering] = useState(restaurant.ordering);
  const [hours, setHours] = useState<Array<DayHours & { closed: boolean }>>(
    Array.from({ length: 7 }, (_, day) => {
      const h = restaurant.hours.find((x) => x.day === day);
      return h
        ? { ...h, closed: false }
        : { day, open: "11:00", close: "21:00", closed: true };
    }),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blurb, setBlurb] = useState(directoryBlurb ?? { en: "", ar: "" });
  const [blurbMessage, setBlurbMessage] = useState<string | null>(null);
  const [blurbPending, startBlurbTransition] = useTransition();

  const saveBlurb = () => {
    setBlurbMessage(null);
    startBlurbTransition(async () => {
      const result = await saveDirectoryBlurbAction(slug, blurb);
      setBlurbMessage(result.ok ? t("saved") : result.error);
    });
  };

  const save = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await saveSettingsAction(slug, {
        ordering,
        hours: hours.filter((h) => !h.closed).map(({ day, open, close }) => ({ day, open, close })),
      });
      if (result.ok) {
        setMessage(t("saved"));
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const dollars = (cents: number) => (cents / 100).toFixed(2);
  const cents = (value: string) => {
    const parsed = Math.round(parseFloat(value || "0") * 100);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };

  const sectionCls = "rounded-card border border-olive/10 bg-white p-5";
  const inputCls =
    "h-10 rounded-field border border-olive/20 bg-white px-3 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25";
  const checkCls = "size-4 accent-olive";

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <section className={sectionCls}>
        <h2 className="mb-3 font-bold text-olive">{t("orderingSettings")}</h2>
        <div className="flex flex-col gap-3 text-sm font-semibold text-charcoal">
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={ordering.pickup}
              onChange={(e) => setOrdering({ ...ordering, pickup: e.target.checked })}
              className={checkCls}
            />
            {t("pickupEnabled")}
          </label>
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={ordering.delivery}
              onChange={(e) => setOrdering({ ...ordering, delivery: e.target.checked })}
              className={checkCls}
            />
            {t("deliveryEnabled")}
          </label>
          {ordering.delivery && (
            <div className="grid grid-cols-2 gap-3 ps-6">
              <label className="flex flex-col gap-1">
                {t("deliveryFee")}
                <input
                  dir="ltr"
                  inputMode="decimal"
                  defaultValue={dollars(ordering.deliveryFeeCents)}
                  onChange={(e) =>
                    setOrdering({ ...ordering, deliveryFeeCents: cents(e.target.value) })
                  }
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1">
                {t("deliveryMinimum")}
                <input
                  dir="ltr"
                  inputMode="decimal"
                  defaultValue={dollars(ordering.deliveryMinimumCents)}
                  onChange={(e) =>
                    setOrdering({ ...ordering, deliveryMinimumCents: cents(e.target.value) })
                  }
                  className={inputCls}
                />
              </label>
            </div>
          )}
          <label className="flex flex-col gap-1">
            {t("prepMinutes")}
            <input
              dir="ltr"
              inputMode="numeric"
              defaultValue={ordering.prepMinutes}
              onChange={(e) =>
                setOrdering({
                  ...ordering,
                  prepMinutes: Math.max(0, parseInt(e.target.value || "0", 10) || 0),
                })
              }
              className={cn(inputCls, "max-w-32")}
            />
          </label>
        </div>
      </section>

      <section className={sectionCls}>
        <h2 className="mb-3 font-bold text-olive">{t("hoursTitle")}</h2>
        <ul className="flex flex-col gap-2">
          {hours.map((h, i) => (
            <li key={h.day} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="w-24 font-semibold text-charcoal">{days[h.day]}</span>
              <label className="flex items-center gap-1.5 text-stone">
                <input
                  type="checkbox"
                  checked={h.closed}
                  onChange={(e) =>
                    setHours(hours.map((x, j) => (j === i ? { ...x, closed: e.target.checked } : x)))
                  }
                  className={checkCls}
                />
                {t("closedDay")}
              </label>
              {!h.closed && (
                <span className="flex items-center gap-1.5" dir="ltr">
                  <input
                    type="time"
                    aria-label={t("open")}
                    value={h.open}
                    onChange={(e) =>
                      setHours(hours.map((x, j) => (j === i ? { ...x, open: e.target.value } : x)))
                    }
                    className={inputCls}
                  />
                  –
                  <input
                    type="time"
                    aria-label={t("close")}
                    value={h.close}
                    onChange={(e) =>
                      setHours(hours.map((x, j) => (j === i ? { ...x, close: e.target.value } : x)))
                    }
                    className={inputCls}
                  />
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {directoryBlurb !== null && (
        <section className={sectionCls}>
          <h2 className="mb-1 font-bold text-olive">{t("eatBlurbTitle")}</h2>
          <p className="mb-3 text-sm text-stone">{t("eatBlurbHint")}</p>
          <div className="flex flex-col gap-3 text-sm font-semibold text-charcoal">
            <label className="flex flex-col gap-1">
              {t("eatBlurbEn")}
              <textarea
                dir="ltr"
                rows={3}
                maxLength={500}
                value={blurb.en}
                onChange={(e) => setBlurb({ ...blurb, en: e.target.value })}
                className="rounded-field border border-olive/20 bg-white p-3 text-[15px] font-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
              />
            </label>
            <label className="flex flex-col gap-1">
              {t("eatBlurbAr")}
              <textarea
                dir="rtl"
                rows={3}
                maxLength={500}
                value={blurb.ar}
                onChange={(e) => setBlurb({ ...blurb, ar: e.target.value })}
                className="rounded-field border border-olive/20 bg-white p-3 text-[15px] font-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={saveBlurb}
                disabled={blurbPending}
                className="h-10 self-start rounded-btn bg-olive px-5 text-sm font-bold text-ivory disabled:opacity-50"
              >
                {blurbPending ? t("saving") : t("save")}
              </button>
              {blurbMessage && (
                <p className="text-sm font-semibold text-positive" role="status">
                  {blurbMessage}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="h-12 rounded-btn bg-olive px-8 font-bold text-ivory disabled:opacity-50"
        >
          {pending ? t("saving") : t("save")}
        </button>
        {message && (
          <p className="text-sm font-semibold text-positive" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="text-sm font-semibold text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
