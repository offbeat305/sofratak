"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Wordmark } from "@/components/Wordmark";

export function Navbar() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: t("home") },
    { href: "/styleguide", label: t("styleguide") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-olive/10 bg-ivory/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="rounded-btn focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive"
        >
          <Wordmark />
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-btn px-3 py-2 text-sm font-semibold text-olive transition-colors hover:bg-olive/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive"
            >
              {link.label}
            </Link>
          ))}
          <LocaleSwitcher className="text-olive hover:bg-olive/5" />
          <Link
            href="/calculator"
            className={buttonClasses({ size: "sm", className: "ms-2" })}
          >
            {t("calculateSavings")}
          </Link>
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-1 md:hidden">
          <LocaleSwitcher className="text-olive hover:bg-olive/5" />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? t("closeMenu") : t("openMenu")}
            className="rounded-btn p-2 text-olive transition-colors hover:bg-olive/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive"
          >
            {open ? (
              <X className="size-6" aria-hidden />
            ) : (
              <Menu className="size-6" aria-hidden />
            )}
          </button>
        </div>
      </nav>

      {open && (
        <div className="animate-rise-in border-t border-olive/10 bg-ivory px-4 pt-2 pb-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-btn px-3 py-2.5 font-semibold text-olive transition-colors hover:bg-olive/5"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/calculator"
              onClick={() => setOpen(false)}
              className={buttonClasses({ className: "mt-2" })}
            >
              {t("calculateSavings")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
