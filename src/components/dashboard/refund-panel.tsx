"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { Order } from "@/lib/db/types";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/cn";
import { refundOrderAction } from "@/app/[locale]/(dashboard)/dashboard/[slug]/actions";

/**
 * Itemized refunds — full or partial per line item. Owner.com can't do
 * this; it's a selling point, keep it effortless on a phone.
 */
export function RefundPanel({ order, slug: _slug }: { order: Order; slug: string }) {
  const t = useTranslations("dash");
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [qtys, setQtys] = useState<Record<number, number>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refundedByLine = useMemo(() => {
    const map: Record<number, number> = {};
    for (const refund of order.refunds) {
      for (const l of refund.lines) {
        map[l.lineIndex] = (map[l.lineIndex] ?? 0) + l.qty;
      }
    }
    return map;
  }, [order.refunds]);

  const remaining =
    order.totalCents - order.refunds.reduce((n, r) => n + r.amountCents, 0);

  const selectedCents = useMemo(
    () =>
      Object.entries(qtys).reduce((sum, [index, qty]) => {
        const line = order.lines[Number(index)];
        return sum + (line ? line.unitPriceCents * qty : 0);
      }, 0),
    [qtys, order.lines],
  );

  if (remaining <= 0) {
    return (
      <p className="rounded-card border border-olive/10 bg-white p-5 text-sm font-semibold text-stone">
        {t("refundNothingLeft")}
      </p>
    );
  }

  const run = (request: Parameters<typeof refundOrderAction>[1]) => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await refundOrderAction(order.id, request);
      if (result.ok) {
        setMessage(t("refundDone", { amount: formatCents(result.amountCents, locale) }));
        setQtys({});
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <section className="rounded-card border border-olive/10 bg-white p-5">
      <h2 className="text-lg font-bold text-olive">{t("refundTitle")}</h2>
      <p className="mt-1 text-sm text-stone">{t("refundNote")}</p>

      <ul className="mt-4 flex flex-col gap-2">
        {order.lines.map((line, i) => {
          const refundable = line.qty - (refundedByLine[i] ?? 0);
          if (refundable <= 0) return null;
          const qty = qtys[i] ?? 0;
          return (
            <li
              key={i}
              className="flex items-center justify-between gap-3 rounded-field border border-charcoal/10 px-4 py-2.5"
            >
              <span className="text-sm font-semibold text-charcoal">
                {line.name[locale]}
                <span className="ms-2 text-stone" dir="ltr">
                  {formatCents(line.unitPriceCents, locale)}
                </span>
              </span>
              <select
                aria-label={t("refundQty", { item: line.name[locale] })}
                value={qty}
                onChange={(e) =>
                  setQtys((prev) => ({ ...prev, [i]: Number(e.target.value) }))
                }
                className="h-9 rounded-field border border-olive/20 bg-white px-2 text-sm"
              >
                {Array.from({ length: refundable + 1 }, (_, n) => (
                  <option key={n} value={n} dir="ltr">
                    {n}×
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={pending || selectedCents === 0}
          onClick={() =>
            run({
              kind: "lines",
              lines: Object.entries(qtys)
                .filter(([, qty]) => qty > 0)
                .map(([lineIndex, qty]) => ({ lineIndex: Number(lineIndex), qty })),
            })
          }
          className={cn(
            "h-11 flex-1 rounded-btn bg-olive px-4 text-sm font-bold text-ivory transition-opacity disabled:opacity-50",
          )}
        >
          {t("refundSelected", {
            amount: formatCents(Math.min(selectedCents, remaining), locale),
          })}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run({ kind: "full" })}
          className="h-11 flex-1 rounded-btn border-[1.5px] border-error/50 px-4 text-sm font-bold text-error transition-opacity hover:bg-error/5 disabled:opacity-50"
        >
          {t("refundFull", { amount: formatCents(remaining, locale) })}
        </button>
      </div>

      {message && (
        <p className="mt-3 text-sm font-semibold text-positive" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 text-sm font-semibold text-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
