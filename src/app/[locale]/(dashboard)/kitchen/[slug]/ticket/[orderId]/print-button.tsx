"use client";

import { useTranslations } from "next-intl";
import { Printer } from "lucide-react";

export function PrintButton() {
  const t = useTranslations("kitchen");
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-btn bg-olive font-sans font-bold text-ivory print:hidden"
    >
      <Printer className="size-5" aria-hidden />
      {t("printTicket")}
    </button>
  );
}
