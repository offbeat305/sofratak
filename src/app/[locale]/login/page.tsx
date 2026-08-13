import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Wordmark } from "@/components/Wordmark";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signIn"), robots: { index: false } };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const { next } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-ivory p-4">
      <Wordmark />
      <div className="w-full max-w-sm rounded-card border border-olive/10 bg-white p-6 shadow-[0_1px_3px_rgba(31,31,31,0.06)] sm:p-8">
        <h1 className="text-xl font-bold text-olive">{t("loginTitle")}</h1>
        <p className="mt-1 text-sm text-stone">{t("loginSubtitle")}</p>
        <LoginForm next={next ?? null} />
      </div>
    </main>
  );
}
