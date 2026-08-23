"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

/**
 * Design-pass navbar: transparent over the home hero, transitioning to
 * solid olive after ~80px of scroll (200ms). Other pages are solid olive
 * from the start. Ivory logo throughout (the bar is always dark or over
 * the olive hero).
 */
export function Navbar() {
  const t = useTranslations("site.nav");
  const locale = useLocale();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    { href: "/grader", label: t("grader") },
    { href: "/how-it-works", label: t("howItWorks") },
    { href: "/pricing", label: t("pricing") },
    { href: "/cities", label: t("cities") },
    { href: "/about", label: t("about") },
  ] as const;

  const solid = !isHome || scrolled;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow] duration-200",
        solid ? "bg-olive shadow-[0_2px_12px_rgba(31,31,31,0.18)]" : "bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="rounded-btn focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand"
        >
          <Image
            src="/brand/logo-ivory.png"
            alt="Sofratak"
            width={174}
            height={40}
            priority
            className="h-9 w-auto sm:h-10"
          />
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-btn px-3 py-2 text-sm font-semibold text-ivory/90 transition-colors hover:bg-ivory/10 hover:text-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand"
            >
              {link.label}
            </Link>
          ))}

          {/* EN | ع pill */}
          <Link
            href={pathname}
            locale={locale === "en" ? "ar" : "en"}
            className="ms-1 flex items-center gap-1 rounded-full border border-ivory/30 px-3 py-1.5 text-sm font-bold text-ivory/90 transition-colors hover:border-ivory/60 hover:text-ivory"
          >
            <span className={locale === "en" ? "text-brass brightness-150" : ""}>EN</span>
            <span className="text-ivory/40">|</span>
            <span className={cn("font-arabic", locale === "ar" ? "text-brass brightness-150" : "")}>ع</span>
          </Link>

          <Link
            href="/calculator"
            className="btn-shine ms-2 inline-flex h-10 items-center rounded-full bg-brass px-5 text-sm font-bold text-olive transition-transform duration-150 hover:scale-[1.03] motion-reduce:hover:scale-100"
          >
            {t("estimator")}
          </Link>
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-1 lg:hidden">
          <Link
            href={pathname}
            locale={locale === "en" ? "ar" : "en"}
            className="flex items-center gap-1 rounded-full border border-ivory/30 px-3 py-1.5 text-sm font-bold text-ivory/90"
          >
            <span className={locale === "en" ? "text-brass brightness-150" : ""}>EN</span>
            <span className="text-ivory/40">|</span>
            <span className={locale === "ar" ? "text-brass brightness-150" : ""}>ع</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-label="menu"
            className="rounded-btn p-2 text-ivory transition-colors hover:bg-ivory/10"
          >
            <Menu className="size-6" aria-hidden />
          </button>
        </div>
      </nav>

      {/* Full-screen olive drawer (design-pass §1) */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-olive lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Image
              src="/brand/logo-ivory.png"
              alt="Sofratak"
              width={174}
              height={40}
              className="h-9 w-auto"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="close"
              className="rounded-btn p-2 text-ivory hover:bg-ivory/10"
            >
              <X className="size-7" aria-hidden />
            </button>
          </div>
          <nav className="flex flex-1 flex-col justify-center gap-2 px-8">
            {[...links, { href: "/demo", label: t("demo") }].map((link, i) => (
              <div
                key={link.href}
                className="animate-rise-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="font-display block py-2 text-[28px] font-bold text-ivory transition-colors hover:text-sand"
                >
                  {link.label}
                </Link>
              </div>
            ))}
            <div className="animate-rise-in mt-6" style={{ animationDelay: "300ms" }}>
              <Link
                href="/calculator"
                onClick={() => setOpen(false)}
                className="inline-flex h-12 items-center rounded-full bg-brass px-7 font-bold text-olive"
              >
                {t("estimator")}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
