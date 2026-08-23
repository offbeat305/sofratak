"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createTenantAction } from "@/app/[locale]/(admin)/admin/actions";

const inputCls =
  "h-10 rounded-field border border-olive/20 bg-white px-3 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25";

export function NewTenantForm() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ slug: string; ownerEmail: string; temporaryPassword: string | null } | null>(
    null,
  );

  const [form, setForm] = useState({
    nameEn: "",
    nameAr: "",
    slug: "",
    ownerEmail: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    zip: "",
    timezone: "America/New_York",
    halal: true,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createTenantAction({
        slug: form.slug,
        name: { en: form.nameEn, ar: form.nameAr },
        phone: form.phone,
        address: { line1: form.line1, city: form.city, state: form.state, zip: form.zip },
        timezone: form.timezone,
        halal: form.halal,
        ownerEmail: form.ownerEmail,
      });
      if (result.ok) {
        setCreated(result);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  if (created) {
    return (
      <div className="max-w-xl rounded-card border border-positive/30 bg-positive/5 p-5">
        <p className="font-bold text-olive">{t("tenantCreated", { slug: created.slug })}</p>
        {created.temporaryPassword ? (
          <p className="mt-2 text-sm text-charcoal">
            {t("tempPasswordNote", { email: created.ownerEmail })}
            <br />
            <span className="mt-1 inline-block rounded bg-white px-2 py-1 font-mono text-sm">
              {created.temporaryPassword}
            </span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-charcoal">{t("existingOwnerNote", { email: created.ownerEmail })}</p>
        )}
        <a
          href={`/admin/${created.slug}`}
          className="mt-3 inline-block font-semibold text-brass hover:text-brass-deep"
        >
          {t("manage")} →
        </a>
      </div>
    );
  }

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <section className="rounded-card border border-olive/10 bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-semibold text-charcoal">
            {t("nameEn")}
            <input className={inputCls} value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-charcoal">
            {t("nameAr")}
            <input className={inputCls} value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} dir="rtl" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-charcoal">
            {t("slug")}
            <input
              className={inputCls}
              value={form.slug}
              onChange={(e) => set("slug", e.target.value.toLowerCase())}
              placeholder="beit-zizo"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-charcoal">
            {t("ownerEmail")}
            <input
              type="email"
              className={inputCls}
              value={form.ownerEmail}
              onChange={(e) => set("ownerEmail", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-charcoal">
            {t("phone")}
            <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-charcoal">
            {t("timezone")}
            <input className={inputCls} value={form.timezone} onChange={(e) => set("timezone", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-charcoal sm:col-span-2">
            {t("addressLine1")}
            <input className={inputCls} value={form.line1} onChange={(e) => set("line1", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-charcoal">
            {t("city")}
            <input className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-semibold text-charcoal">
              {t("state")}
              <input className={inputCls} value={form.state} onChange={(e) => set("state", e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-charcoal">
              {t("zip")}
              <input className={inputCls} value={form.zip} onChange={(e) => set("zip", e.target.value)} />
            </label>
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2.5 text-sm font-semibold text-charcoal">
          <input
            type="checkbox"
            className="size-4 accent-olive"
            checked={form.halal}
            onChange={(e) => set("halal", e.target.checked)}
          />
          {t("halal")}
        </label>
      </section>

      {error && (
        <p role="alert" className="text-sm font-semibold text-error">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="h-11 self-start rounded-btn bg-brass px-5 text-sm font-bold text-ivory transition-colors hover:bg-brass-deep disabled:opacity-50"
      >
        {pending ? t("creating") : t("createTenant")}
      </button>
    </div>
  );
}
