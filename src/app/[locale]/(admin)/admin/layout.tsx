import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Building2, ConciergeBell, MapPin, Plus } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { getSuperAdmin } from "@/lib/auth/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Wordmark } from "@/components/Wordmark";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

export const metadata: Metadata = { robots: { index: false } };

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const admin = await getSuperAdmin();
  if (!admin) {
    redirect({ href: `/login?next=/${locale}/admin`, locale });
  }

  return (
    <div className="min-h-dvh bg-ivory">
      <header className="sticky top-0 z-40 border-b border-olive/10 bg-ivory/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Wordmark className="hidden sm:inline-flex" />
            <span className="truncate font-bold text-olive">{t("title")}</span>
          </div>
          <div className="flex items-center gap-1">
            <LocaleSwitcher className="text-olive hover:bg-olive/5" />
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <aside className="hidden w-52 shrink-0 flex-col gap-1 md:flex">
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-btn px-3 py-2 text-sm font-semibold text-stone hover:bg-olive/5 hover:text-olive"
          >
            <Building2 className="size-4" aria-hidden /> {t("tenants")}
          </Link>
          <Link
            href="/admin/new"
            className="flex items-center gap-2 rounded-btn px-3 py-2 text-sm font-semibold text-stone hover:bg-olive/5 hover:text-olive"
          >
            <Plus className="size-4" aria-hidden /> {t("newTenant")}
          </Link>
          <Link
            href="/admin/requests"
            className="flex items-center gap-2 rounded-btn px-3 py-2 text-sm font-semibold text-stone hover:bg-olive/5 hover:text-olive"
          >
            <ConciergeBell className="size-4" aria-hidden /> {t("requestsTitle")}
          </Link>
          <Link
            href="/admin/directory"
            className="flex items-center gap-2 rounded-btn px-3 py-2 text-sm font-semibold text-stone hover:bg-olive/5 hover:text-olive"
          >
            <MapPin className="size-4" aria-hidden /> {t("directoryReview")}
          </Link>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
