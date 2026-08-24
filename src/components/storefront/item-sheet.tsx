"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { Minus, Plus, X } from "lucide-react";
import type { LocalizedText, MenuItem, ModifierGroup } from "@/lib/db/types";
import { formatCents } from "@/lib/money";
import { useCart } from "./cart-context";
import { cn } from "@/lib/cn";

type Props = {
  item: MenuItem;
  groups: ModifierGroup[];
  brand: { primary: string; accent: string };
  onClose: () => void;
};

export function ItemSheet({ item, groups, brand, onClose }: Props) {
  const t = useTranslations("storefront");
  const locale = useLocale() as "en" | "ar";
  const { addLine } = useCart();

  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Record<string, string[]>>(() => {
    // preselect the first option of each required single-choice group
    const initial: Record<string, string[]> = {};
    for (const g of groups) {
      if (g.min >= 1 && g.max === 1) initial[g.id] = [g.options[0].id];
    }
    return initial;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const toggle = (group: ModifierGroup, optionId: string) => {
    setSelected((prev) => {
      const current = prev[group.id] ?? [];
      if (group.max === 1) return { ...prev, [group.id]: [optionId] };
      if (current.includes(optionId))
        return { ...prev, [group.id]: current.filter((o) => o !== optionId) };
      if (current.length >= group.max) return prev;
      return { ...prev, [group.id]: [...current, optionId] };
    });
  };

  const { unitPriceCents, optionNames, valid } = useMemo(() => {
    let delta = 0;
    const names: LocalizedText[] = [];
    let ok = true;
    for (const g of groups) {
      const chosen = selected[g.id] ?? [];
      if (chosen.length < g.min) ok = false;
      for (const id of chosen) {
        const opt = g.options.find((o) => o.id === id);
        if (opt) {
          delta += opt.priceDeltaCents;
          names.push(opt.name);
        }
      }
    }
    return { unitPriceCents: item.priceCents + delta, optionNames: names, valid: ok };
  }, [groups, selected, item.priceCents]);

  const add = () => {
    if (!valid) return;
    addLine({
      menuItemId: item.id,
      name: item.name,
      unitPriceCents,
      qty,
      options: selected,
      optionNames,
      notes: notes.trim() || null,
    });
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={item.name[locale]}
      // The portal escapes the storefront wrapper that defines the brand
      // vars, so redeclare them here — without this, the Add button's
      // bg-[var(--sf-primary)] resolves to nothing and renders invisible.
      style={
        {
          "--sf-primary": brand.primary,
          "--sf-accent": brand.accent,
        } as React.CSSProperties
      }
    >
      <div
        className="animate-fade-in absolute inset-0 bg-charcoal/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="animate-rise-in relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-charcoal/8 p-5">
          <div>
            <h2 className="text-lg font-bold text-charcoal">{item.name[locale]}</h2>
            <p className="mt-1 text-sm text-stone">{item.description[locale]}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="shrink-0 rounded-full p-2 text-stone transition-colors hover:bg-charcoal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-primary)]"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {groups.map((group) => (
            <fieldset key={group.id} className="mb-5">
              <legend className="flex w-full items-center justify-between gap-2 text-sm font-bold text-charcoal">
                {group.name[locale]}
                <span className="text-xs font-semibold text-stone">
                  {group.min >= 1 && group.max === 1
                    ? t("required")
                    : t("chooseUpTo", { max: group.max })}
                </span>
              </legend>
              <div className="mt-2 flex flex-col gap-1">
                {group.options.map((opt) => {
                  const chosen = (selected[group.id] ?? []).includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-3 rounded-field border px-4 py-3 text-[15px] transition-colors",
                        chosen
                          ? "border-[var(--sf-primary)] bg-[var(--sf-primary)]/5"
                          : "border-charcoal/10 hover:border-charcoal/25",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type={group.max === 1 ? "radio" : "checkbox"}
                          name={group.id}
                          checked={chosen}
                          onChange={() => toggle(group, opt.id)}
                          className="size-4 accent-[var(--sf-primary)]"
                        />
                        {opt.name[locale]}
                      </span>
                      {opt.priceDeltaCents > 0 && (
                        <span className="text-sm font-semibold text-stone" dir="ltr">
                          +{formatCents(opt.priceDeltaCents, locale)}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <label className="block">
            <span className="text-sm font-bold text-charcoal">{t("kitchenNotes")}</span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={300}
              placeholder={t("kitchenNotesPlaceholder")}
              className="mt-2 h-11 w-full rounded-field border border-charcoal/15 bg-white px-4 text-[15px] placeholder:text-stone/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-primary)]/40"
            />
          </label>
        </div>

        <div className="flex items-center gap-3 border-t border-charcoal/8 p-4">
          <div className="flex items-center rounded-full border border-charcoal/15">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label={t("decrease")}
              className="p-2.5 text-charcoal disabled:opacity-40"
              disabled={qty <= 1}
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <span className="min-w-8 text-center font-bold tabular-nums" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(20, q + 1))}
              aria-label={t("increase")}
              className="p-2.5 text-charcoal"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
          <button
            type="button"
            onClick={add}
            disabled={!valid}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-btn bg-[var(--sf-primary)] font-bold text-white transition-opacity disabled:opacity-50"
          >
            {t("addToCart")}
            <span dir="ltr">{formatCents(unitPriceCents * qty, locale)}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
