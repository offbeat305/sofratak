"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ImageIcon, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  removeCoverImageAction,
  uploadCoverImageAction,
} from "@/app/[locale]/(dashboard)/dashboard/[slug]/actions";

/** Storefront banner upload — the picture at the top of the diner-facing page. */
export function BannerCard({ slug, coverUrl }: { slug: string; coverUrl: string | null }) {
  const t = useTranslations("dash");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const upload = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadCoverImageAction(slug, formData);
      if (!result.ok) setError(result.error);
      else router.refresh();
      if (fileInput.current) fileInput.current.value = "";
    });
  };

  const remove = () =>
    startTransition(async () => {
      setError(null);
      await removeCoverImageAction(slug);
      router.refresh();
    });

  return (
    <section className="rounded-card border border-olive/10 bg-white p-5">
      <h2 className="flex items-center gap-2 font-bold text-olive">
        <ImageIcon className="size-4" aria-hidden />
        {t("bannerTitle")}
      </h2>
      <p className="mt-1 text-sm text-stone">{t("bannerSub")}</p>

      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => upload(e.target.files?.[0])}
        className="hidden"
        aria-hidden
      />

      {coverUrl ? (
        <div className="relative mt-3 h-32 overflow-hidden rounded-field border border-olive/10">
          <Image src={coverUrl} alt="" fill unoptimized className="object-cover" />
        </div>
      ) : (
        <div className="mt-3 flex h-32 items-center justify-center rounded-field border border-dashed border-olive/25 text-stone">
          <ImageIcon className="size-6" aria-hidden />
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={pending}
          className="h-10 rounded-btn bg-brass px-4 text-sm font-bold text-ivory transition-colors hover:bg-brass-deep disabled:opacity-50"
        >
          {pending ? t("photoUploading") : coverUrl ? t("bannerChange") : t("bannerAdd")}
        </button>
        {coverUrl && !pending && (
          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone hover:text-error"
          >
            <Trash2 className="size-4" aria-hidden />
            {t("bannerRemove")}
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-stone">{t("bannerNote")}</p>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-error">
          {error}
        </p>
      )}
    </section>
  );
}
