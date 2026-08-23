"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { UserCog } from "lucide-react";
import { startImpersonationAction } from "@/app/[locale]/(admin)/admin/actions";

export function ImpersonateButton({ slug }: { slug: string }) {
  const t = useTranslations("admin");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const go = () =>
    startTransition(async () => {
      setError(null);
      const result = await startImpersonationAction(slug);
      if (result.ok) {
        window.location.assign(`/dashboard/${slug}`);
      } else {
        setError(result.error);
      }
    });

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={pending}
        className="inline-flex h-10 items-center gap-2 rounded-btn border border-olive/20 px-4 text-sm font-bold text-olive transition-colors hover:bg-olive/5 disabled:opacity-50"
      >
        <UserCog className="size-4" aria-hidden />
        {t("impersonate")}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
}
