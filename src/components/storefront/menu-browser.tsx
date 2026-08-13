"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Menu, MenuItem } from "@/lib/db/types";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/cn";
import { useCart } from "./cart-context";
import { ItemSheet } from "./item-sheet";

export function MenuBrowser({ slug, menu }: { slug: string; menu: Menu }) {
  const t = useTranslations("storefront");
  const locale = useLocale() as "en" | "ar";
  const { count, subtotalCents } = useCart();
  const [active, setActive] = useState<MenuItem | null>(null);

  const categories = useMemo(
    () => [...menu.categories].sort((a, b) => a.sort - b.sort),
    [menu.categories],
  );

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const cat of categories) map.set(cat.id, []);
    for (const item of [...menu.items].sort((a, b) => a.sort - b.sort)) {
      map.get(item.categoryId)?.push(item);
    }
    return map;
  }, [categories, menu.items]);

  const groupsFor = (item: MenuItem) =>
    menu.modifierGroups.filter((g) => item.modifierGroupIds.includes(g.id));

  return (
    <div className="pb-24">
      {/* category chips */}
      <nav
        aria-label={t("menu")}
        className="sticky top-0 z-30 -mx-4 overflow-x-auto border-b border-charcoal/8 bg-ivory/95 px-4 py-3 backdrop-blur"
      >
        <div className="flex gap-2">
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className="shrink-0 rounded-full border border-charcoal/15 px-4 py-1.5 text-sm font-semibold text-charcoal transition-colors hover:border-[var(--sf-primary)] hover:text-[var(--sf-primary)]"
            >
              {cat.name[locale]}
            </a>
          ))}
        </div>
      </nav>

      {categories.map((cat) => (
        <section key={cat.id} id={cat.id} className="scroll-mt-16 pt-8">
          <h2 className="text-xl font-bold text-charcoal">{cat.name[locale]}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {(itemsByCategory.get(cat.id) ?? []).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => !item.soldOut && setActive(item)}
                  disabled={item.soldOut}
                  className={cn(
                    "flex w-full items-stretch gap-3 rounded-card border border-charcoal/8 bg-white p-3 text-start shadow-[0_1px_3px_rgba(31,31,31,0.05)] transition-[transform,box-shadow]",
                    item.soldOut
                      ? "opacity-60"
                      : "hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(31,31,31,0.08)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                  )}
                >
                  <div className="flex flex-1 flex-col gap-1 py-1">
                    <span className="font-bold text-charcoal">{item.name[locale]}</span>
                    <span className="line-clamp-2 text-sm text-stone">
                      {item.description[locale]}
                    </span>
                    <span className="mt-auto pt-1 text-[15px] font-bold text-[var(--sf-primary)]" dir="ltr">
                      {formatCents(item.priceCents, locale)}
                    </span>
                    {item.soldOut && (
                      <span className="text-xs font-bold text-error">{t("soldOut")}</span>
                    )}
                  </div>
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      width={96}
                      height={96}
                      className="size-24 shrink-0 rounded-2xl object-cover"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {active && (
        <ItemSheet item={active} groups={groupsFor(active)} onClose={() => setActive(null)} />
      )}

      {/* floating cart bar */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-4">
          <Link
            href={`/s/${slug}/checkout`}
            className="mx-auto flex h-14 max-w-lg items-center justify-between rounded-btn bg-[var(--sf-primary)] px-5 font-bold text-white shadow-[0_12px_30px_rgba(31,31,31,0.25)]"
          >
            <span>
              {t("viewOrder")} · {t("items", { count })}
            </span>
            <span dir="ltr">{formatCents(subtotalCents, locale)}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
