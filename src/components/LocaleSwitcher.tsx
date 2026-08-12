"use client";

import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === "en" ? "ar" : "en";

  return (
    <Link
      href={pathname}
      locale={other}
      className={cn(
        "inline-flex items-center gap-2 rounded-btn px-3 py-2 text-sm font-semibold transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive",
        className,
      )}
    >
      <Globe className="size-4" aria-hidden />
      {t("switchLocale")}
    </Link>
  );
}
