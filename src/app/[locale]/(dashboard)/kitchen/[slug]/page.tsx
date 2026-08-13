import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getStore } from "@/lib/db/store";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Wordmark } from "@/components/Wordmark";
import { KitchenBoard } from "@/components/kitchen/kitchen-board";

export const metadata: Metadata = { robots: { index: false } };

// NOTE: unauthenticated until Phase 4 (owner/staff logins). Flagged in
// docs/PROGRESS.md — do not share kitchen URLs publicly before then.
export default async function KitchenPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as "en" | "ar";
  const t = await getTranslations("kitchen");

  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(slug);
  if (!restaurant) notFound();

  const orders = (await store.listOrders(restaurant.id)).filter(
    (o) => o.paymentStatus !== "pending",
  );
  const active = orders.filter(
    (o) => o.status !== "completed" && o.status !== "canceled",
  );
  const today = new Date().toISOString().slice(0, 10);
  const doneToday = orders.filter(
    (o) =>
      (o.status === "completed" || o.status === "canceled") &&
      o.createdAt.startsWith(today),
  );

  return (
    <div className="min-h-dvh bg-ivory">
      <header className="sticky top-0 z-40 border-b border-olive/10 bg-ivory/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Wordmark className="shrink-0 [&>span]:hidden sm:[&>span]:inline" />
            <h1 className="truncate font-bold text-olive">
              {t("title", { name: restaurant.name[loc] })}
            </h1>
          </div>
          <LocaleSwitcher className="shrink-0 text-olive hover:bg-olive/5" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <KitchenBoard slug={slug} initial={{ active, doneToday }} />
      </main>
    </div>
  );
}
