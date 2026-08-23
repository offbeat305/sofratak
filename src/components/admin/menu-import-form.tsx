"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { commitMenuImportAction, parseMenuTextAction } from "@/app/[locale]/(admin)/admin/actions";
import type { ParsedMenuCategory } from "@/lib/menu-import/types";

const inputCls =
  "h-9 rounded-field border border-olive/20 bg-white px-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25";

export function MenuImportForm({ slug }: { slug: string }) {
  const t = useTranslations("admin");
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [categories, setCategories] = useState<ParsedMenuCategory[] | null>(null);
  const [skippedLines, setSkippedLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [committed, setCommitted] = useState<number | null>(null);

  const parse = () =>
    startTransition(async () => {
      setError(null);
      setCommitted(null);
      const result = await parseMenuTextAction(text);
      setCategories(result.categories);
      setSkippedLines(result.skippedLines);
    });

  const commit = () =>
    startTransition(async () => {
      setError(null);
      if (!categories) return;
      const result = await commitMenuImportAction(slug, categories);
      if (result.ok) {
        setCommitted(result.itemCount);
        setCategories(null);
        setText("");
      } else {
        setError(result.error);
      }
    });

  const updateItem = (ci: number, ii: number, patch: Partial<{ name: string; price: number }>) =>
    setCategories((prev) =>
      prev
        ? prev.map((c, i) =>
            i !== ci ? c : { ...c, items: c.items.map((it, j) => (j !== ii ? it : { ...it, ...patch })) },
          )
        : prev,
    );

  const removeItem = (ci: number, ii: number) =>
    setCategories((prev) =>
      prev ? prev.map((c, i) => (i !== ci ? c : { ...c, items: c.items.filter((_, j) => j !== ii) })) : prev,
    );

  const removeCategory = (ci: number) =>
    setCategories((prev) => (prev ? prev.filter((_, i) => i !== ci) : prev));

  const updateCategoryName = (ci: number, name: string) =>
    setCategories((prev) => (prev ? prev.map((c, i) => (i !== ci ? c : { ...c, name })) : prev));

  if (committed !== null) {
    return (
      <p className="max-w-xl rounded-card border border-positive/30 bg-positive/5 p-5 font-semibold text-olive">
        {t("importCommitted", { count: committed })}
      </p>
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <section className="rounded-card border border-olive/10 bg-white p-5">
        <p className="mb-2 text-sm text-stone">{t("importInstructions")}</p>
        <textarea
          className="h-48 w-full rounded-field border border-olive/20 bg-white p-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"APPETIZERS\nHummus 6.00\nBaba Ghanouj 6.50\n\nMAINS\nGrilled Chicken Plate 14.99"}
        />
        <button
          type="button"
          onClick={parse}
          disabled={pending || !text.trim()}
          className="mt-3 h-10 rounded-btn bg-brass px-5 text-sm font-bold text-ivory transition-colors hover:bg-brass-deep disabled:opacity-50"
        >
          {t("parse")}
        </button>
      </section>

      {categories && (
        <section className="flex flex-col gap-3">
          {categories.length === 0 ? (
            <p className="text-sm text-stone">{t("noItemsParsed")}</p>
          ) : (
            categories.map((category, ci) => (
              <div key={ci} className="rounded-card border border-olive/10 bg-white p-4">
                <div className="flex items-center gap-2">
                  <input
                    className={`${inputCls} flex-1 font-bold`}
                    value={category.name}
                    onChange={(e) => updateCategoryName(ci, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeCategory(ci)}
                    className="text-stone hover:text-error"
                    aria-label={t("removeCategory")}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
                <div className="mt-2 flex flex-col gap-1.5">
                  {category.items.map((item, ii) => (
                    <div key={ii} className="flex items-center gap-2">
                      <input
                        className={`${inputCls} flex-1`}
                        value={item.name}
                        onChange={(e) => updateItem(ci, ii, { name: e.target.value })}
                      />
                      <input
                        type="number"
                        step="0.01"
                        className={`${inputCls} w-24`}
                        value={item.price}
                        onChange={(e) => updateItem(ci, ii, { price: parseFloat(e.target.value) || 0 })}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(ci, ii)}
                        className="text-stone hover:text-error"
                        aria-label={t("removeItem")}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {skippedLines.length > 0 && (
            <details className="text-xs text-stone">
              <summary className="cursor-pointer font-semibold">
                {t("skippedLines", { count: skippedLines.length })}
              </summary>
              <ul className="mt-1 list-disc ps-4">
                {skippedLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </details>
          )}

          {error && (
            <p role="alert" className="text-sm font-semibold text-error">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={commit}
            disabled={pending || categories.length === 0}
            className="h-11 self-start rounded-btn bg-olive px-5 text-sm font-bold text-ivory transition-colors hover:bg-olive/90 disabled:opacity-50"
          >
            {t("commitImport")}
          </button>
        </section>
      )}
    </div>
  );
}
