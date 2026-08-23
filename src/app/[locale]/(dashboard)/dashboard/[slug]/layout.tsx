import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LayoutGrid, MonitorCheck } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { getMembership } from "@/lib/auth/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Wordmark } from "@/components/Wordmark";
import { PauseButton } from "@/components/dashboard/pause-button";
import { DashNav } from "@/components/dashboard/dash-nav";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { ImpersonationBanner } from "@/components/dashboard/impersonation-banner";

export const metadata: Metadata = { robots: { index: false } };

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as "en" | "ar";
  const t = await getTranslations("dash");

  const membership = await getMembership(slug);
  if (!membership) {
    redirect({ href: `/login?next=/${locale}/dashboard/${slug}`, locale });
  }
  const { restaurant, impersonating } = membership!;

  const tabs = [
    { href: `/dashboard/${slug}`, label: t("today"), icon: "today" },
    { href: `/dashboard/${slug}/orders`, label: t("orders"), icon: "orders" },
    { href: `/dashboard/${slug}/menu`, label: t("menu"), icon: "menu" },
    { href: `/dashboard/${slug}/customers`, label: t("customers"), icon: "customers" },
    { href: `/dashboard/${slug}/marketing`, label: t("marketing"), icon: "marketing" },
    { href: `/dashboard/${slug}/settings`, label: t("settings"), icon: "settings" },
  ] as const;

  return (
    <div className="min-h-dvh bg-ivory pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-olive/10 bg-ivory/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Wordmark className="hidden sm:inline-flex" />
            <span className="truncate font-bold text-olive">
              {restaurant.name[loc]}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <PauseButton slug={slug} paused={restaurant.ordering.paused} />
            <LocaleSwitcher className="text-olive hover:bg-olive/5" />
          </div>
        </div>
        {restaurant.ordering.paused && (
          <p className="bg-error px-4 py-1.5 text-center text-sm font-bold text-white">
            {t("paused")}
          </p>
        )}
        {impersonating && <ImpersonationBanner adminEmail={impersonating.adminEmail} />}
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        {/* desktop side nav */}
        <aside className="hidden w-52 shrink-0 flex-col gap-1 md:flex">
          <DashNav tabs={tabs} orientation="side" />
          <div className="mt-4 flex flex-col gap-1 border-t border-olive/10 pt-4">
            <Link
              href={`/kitchen/${slug}`}
              className="flex items-center gap-2 rounded-btn px-3 py-2 text-sm font-semibold text-stone hover:bg-olive/5 hover:text-olive"
            >
              <MonitorCheck className="size-4" aria-hidden /> {t("kitchen")}
            </Link>
            <Link
              href={`/s/${slug}`}
              className="flex items-center gap-2 rounded-btn px-3 py-2 text-sm font-semibold text-stone hover:bg-olive/5 hover:text-olive"
            >
              <LayoutGrid className="size-4" aria-hidden /> {t("storefront")}
            </Link>
            <SignOutButton />
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-olive/10 bg-white/95 backdrop-blur md:hidden">
        <DashNav tabs={tabs} orientation="bottom" />
      </nav>
    </div>
  );
}
