"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CircleCheck, CircleDashed, Landmark } from "lucide-react";
import { startConnectOnboardingAction } from "@/app/[locale]/(dashboard)/dashboard/[slug]/actions";

export function PayoutsCard({
  slug,
  status,
}: {
  slug: string;
  status: "none" | "incomplete" | "active";
}) {
  const t = useTranslations("dash");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const connect = () =>
    startTransition(async () => {
      setError(null);
      const result = await startConnectOnboardingAction(slug, locale);
      if (result.ok) {
        window.location.assign(result.url);
      } else {
        setError(result.error);
      }
    });

  return (
    <section className="rounded-card border border-olive/10 bg-white p-5">
      <h2 className="flex items-center gap-2 font-bold text-olive">
        <Landmark className="size-4" aria-hidden />
        {t("payoutsTitle")}
      </h2>
      {status === "active" ? (
        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-positive">
          <CircleCheck className="size-4" aria-hidden />
          {t("payoutsActive")}
        </p>
      ) : (
        <>
          <p className="mt-2 flex items-center gap-2 text-sm text-stone">
            <CircleDashed className="size-4 shrink-0" aria-hidden />
            {status === "incomplete" ? t("payoutsIncomplete") : t("payoutsNone")}
          </p>
          <button
            type="button"
            onClick={connect}
            disabled={pending}
            className="mt-3 h-11 rounded-btn bg-brass px-5 text-sm font-bold text-ivory transition-colors hover:bg-brass-deep disabled:opacity-50"
          >
            {status === "incomplete" ? t("payoutsResume") : t("payoutsConnect")}
          </button>
          {error && (
            <p role="alert" className="mt-2 text-sm font-semibold text-error">
              {error}
            </p>
          )}
        </>
      )}
    </section>
  );
}
