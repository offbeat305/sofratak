"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { resetDemoAction } from "@/app/[locale]/(admin)/admin/actions";

export function DemoResetButton() {
  const t = useTranslations("admin");
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () =>
    startTransition(async () => {
      setError(null);
      const result = await resetDemoAction();
      setConfirming(false);
      if (result.ok) setDone(true);
      else setError(result.error);
    });

  if (done) {
    return (
      <p role="status" className="text-sm font-semibold text-positive">
        {t("demoResetDone")}
      </p>
    );
  }

  if (confirming) {
    return (
      <div className="rounded-btn border border-error/30 bg-error/5 p-3">
        <p className="text-sm text-olive">{t("demoResetConfirm")}</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={reset}
            disabled={pending}
            className="h-9 rounded-btn bg-error px-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {pending ? t("demoResetting") : t("demoResetYes")}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="h-9 rounded-btn border border-olive/20 px-3 text-sm font-bold text-olive"
          >
            {t("demoResetNo")}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-sm font-semibold text-error">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex h-10 items-center gap-2 rounded-btn border border-olive/20 px-4 text-sm font-bold text-olive transition-colors hover:bg-olive/5"
    >
      <RotateCcw className="size-4" aria-hidden />
      {t("demoReset")}
    </button>
  );
}
