import { getTranslations, setRequestLocale } from "next-intl/server";

// Placeholder — Phase 1 replaces this with the super-admin panel.
export default async function AdminPlaceholder({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="flex min-h-dvh items-center justify-center p-8">
      <p className="text-lg text-stone">{t("placeholder.admin")}</p>
    </main>
  );
}
