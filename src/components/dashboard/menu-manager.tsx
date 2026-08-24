"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Camera, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import type { Menu, MenuItem } from "@/lib/db/types";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui/Modal";
import {
  deleteMenuItemAction,
  saveMenuItemAction,
  toggleSoldOutAction,
  uploadMenuImageAction,
  type MenuItemInput,
} from "@/app/[locale]/(dashboard)/dashboard/[slug]/actions";

/** Phone-first menu manager: price + sold-out are one tap from the list. */
export function MenuManager({ slug, menu }: { slug: string; menu: Menu }) {
  const t = useTranslations("dash");
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const [editing, setEditing] = useState<
    | { item: MenuItem | null; categoryId: string }
    | null
  >(null);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const toggleSoldOut = (item: MenuItem) => {
    setBusyItem(item.id);
    startTransition(async () => {
      await toggleSoldOutAction(slug, item.id, !item.soldOut);
      router.refresh();
      setBusyItem(null);
    });
  };

  const categories = [...menu.categories].sort((a, b) => a.sort - b.sort);

  return (
    <div className="flex flex-col gap-6">
      {categories.map((cat) => (
        <section key={cat.id}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-bold text-olive">{cat.name[locale]}</h2>
            <button
              type="button"
              onClick={() => setEditing({ item: null, categoryId: cat.id })}
              className="inline-flex items-center gap-1.5 rounded-btn px-3 py-1.5 text-sm font-bold text-brass-deep hover:bg-brass/10"
            >
              <Plus className="size-4" aria-hidden />
              {t("addItem")}
            </button>
          </div>
          <ul className="flex flex-col gap-2">
            {menu.items
              .filter((i) => i.categoryId === cat.id)
              .sort((a, b) => a.sort - b.sort)
              .map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 rounded-card border border-olive/10 bg-white p-3.5",
                    item.soldOut && "opacity-70",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-charcoal">
                      {item.name[locale]}
                    </p>
                    <p className="text-sm font-bold text-olive tabular-nums" dir="ltr">
                      {formatCents(item.priceCents, locale)}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!item.soldOut}
                    aria-label={item.soldOut ? t("soldOut") : t("available")}
                    disabled={busyItem === item.id}
                    onClick={() => toggleSoldOut(item)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50",
                      item.soldOut
                        ? "bg-error/10 text-error"
                        : "bg-positive/10 text-positive",
                    )}
                  >
                    {item.soldOut ? t("soldOut") : t("available")}
                  </button>
                  <button
                    type="button"
                    aria-label={t("editItem")}
                    onClick={() => setEditing({ item, categoryId: item.categoryId })}
                    className="rounded-btn p-2 text-stone hover:bg-olive/5 hover:text-olive"
                  >
                    <Pencil className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
          </ul>
        </section>
      ))}

      {editing && (
        <ItemEditor
          slug={slug}
          menu={menu}
          item={editing.item}
          categoryId={editing.categoryId}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ItemEditor({
  slug,
  menu,
  item,
  categoryId,
  onClose,
}: {
  slug: string;
  menu: Menu;
  item: MenuItem | null;
  categoryId: string;
  onClose: () => void;
}) {
  const t = useTranslations("dash");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<MenuItemInput>({
    id: item?.id ?? null,
    categoryId,
    name: item?.name ?? { en: "", ar: "" },
    description: item?.description ?? { en: "", ar: "" },
    price: item ? (item.priceCents / 100).toFixed(2) : "",
    soldOut: item?.soldOut ?? false,
    // /demo/ placeholders count as "no photo" in the editor
    imageUrl: item?.imageUrl && !item.imageUrl.startsWith("/demo/") ? item.imageUrl : null,
  });

  const pickPhoto = () => fileInput.current?.click();

  const uploadPhoto = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadMenuImageAction(slug, formData);
      setUploading(false);
      if (result.ok) {
        setForm((f) => ({ ...f, imageUrl: result.url }));
      } else {
        setError(result.error);
      }
      if (fileInput.current) fileInput.current.value = "";
    });
  };

  const save = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveMenuItemAction(slug, form);
      if (result.ok) {
        router.refresh();
        onClose();
      } else {
        setError(result.error);
      }
    });
  };

  const remove = () => {
    if (!item || !window.confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      await deleteMenuItemAction(slug, item.id);
      router.refresh();
      onClose();
    });
  };

  const inputCls =
    "h-11 w-full rounded-field border border-olive/20 bg-white px-3.5 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25";
  const labelCls = "text-sm font-bold text-olive";

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? t("editItem") : t("addItem")}
      dir={locale === "ar" ? "rtl" : "ltr"}
      footer={
        <>
          {item && (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="me-auto rounded-btn px-4 py-2.5 text-sm font-bold text-error hover:bg-error/5 disabled:opacity-50"
            >
              {t("delete")}
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-btn bg-olive px-6 py-2.5 text-sm font-bold text-ivory disabled:opacity-50"
          >
            {pending ? t("saving") : t("save")}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <span className={labelCls}>{t("photo")}</span>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => uploadPhoto(e.target.files?.[0])}
            className="hidden"
            aria-hidden
          />
          <div className="mt-1 flex items-center gap-3">
            {form.imageUrl ? (
              <Image
                src={form.imageUrl}
                alt=""
                width={64}
                height={64}
                unoptimized
                className="size-16 rounded-field border border-olive/10 object-cover"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-field border border-dashed border-olive/25 text-stone">
                <Camera className="size-5" aria-hidden />
              </div>
            )}
            <div className="flex flex-col items-start gap-1">
              <button
                type="button"
                onClick={pickPhoto}
                disabled={uploading}
                className="rounded-btn border border-olive/20 px-3 py-1.5 text-sm font-bold text-olive hover:bg-olive/5 disabled:opacity-50"
              >
                {uploading ? t("photoUploading") : form.imageUrl ? t("photoChange") : t("photoAdd")}
              </button>
              {form.imageUrl && !uploading && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, imageUrl: null }))}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-stone hover:text-error"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  {t("photoRemove")}
                </button>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-stone">{t("photoNote")}</p>
        </div>
        <label>
          <span className={labelCls}>{t("nameEn")}</span>
          <input
            dir="ltr"
            value={form.name.en}
            onChange={(e) => setForm({ ...form, name: { ...form.name, en: e.target.value } })}
            className={cn(inputCls, "mt-1")}
          />
        </label>
        <label>
          <span className={labelCls}>{t("nameAr")}</span>
          <input
            dir="rtl"
            value={form.name.ar}
            onChange={(e) => setForm({ ...form, name: { ...form.name, ar: e.target.value } })}
            className={cn(inputCls, "mt-1")}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className={labelCls}>{t("price")}</span>
            <input
              dir="ltr"
              inputMode="decimal"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: e.target.value.replace(/[^\d.]/g, "") })
              }
              className={cn(inputCls, "mt-1")}
            />
          </label>
          <label>
            <span className={labelCls}>{t("category")}</span>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className={cn(inputCls, "mt-1 appearance-none")}
            >
              {menu.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name[locale as "en" | "ar"]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <span className={labelCls}>{t("descEn")}</span>
          <input
            dir="ltr"
            value={form.description.en}
            onChange={(e) =>
              setForm({ ...form, description: { ...form.description, en: e.target.value } })
            }
            className={cn(inputCls, "mt-1")}
          />
        </label>
        <label>
          <span className={labelCls}>{t("descAr")}</span>
          <input
            dir="rtl"
            value={form.description.ar}
            onChange={(e) =>
              setForm({ ...form, description: { ...form.description, ar: e.target.value } })
            }
            className={cn(inputCls, "mt-1")}
          />
        </label>
        <label className="flex items-center gap-2.5 text-sm font-semibold text-charcoal">
          <input
            type="checkbox"
            checked={form.soldOut}
            onChange={(e) => setForm({ ...form, soldOut: e.target.checked })}
            className="size-4 accent-olive"
          />
          {t("soldOut")}
        </label>
        {error && (
          <p role="alert" className="text-sm font-semibold text-error">
            {error}
          </p>
        )}
        <p className="text-xs text-stone">{t("modifiersNote")}</p>
      </div>
    </Modal>
  );
}
