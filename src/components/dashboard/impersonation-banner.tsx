"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { ShieldAlert } from "lucide-react";
import { stopImpersonationAction } from "@/app/[locale]/(dashboard)/dashboard/[slug]/actions";

export function ImpersonationBanner({ adminEmail }: { adminEmail: string }) {
  const t = useTranslations("dash");
  const [pending, startTransition] = useTransition();

  const stop = () =>
    startTransition(async () => {
      await stopImpersonationAction();
      window.location.assign("/admin");
    });

  return (
    <p className="flex items-center justify-center gap-2 bg-olive px-4 py-1.5 text-center text-sm font-bold text-ivory">
      <ShieldAlert className="size-4 shrink-0" aria-hidden />
      {t("impersonatingAs", { email: adminEmail })}
      <button
        type="button"
        onClick={stop}
        disabled={pending}
        className="underline underline-offset-2 disabled:opacity-50"
      >
        {t("stopImpersonating")}
      </button>
    </p>
  );
}
