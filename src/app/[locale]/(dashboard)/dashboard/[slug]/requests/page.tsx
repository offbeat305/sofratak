import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/db/store";
import { signedRequestMediaUrl } from "@/lib/storage/request-media";
import { RequestsView, type RequestView } from "@/components/dashboard/requests/requests-view";
import type { ServiceRequest } from "@/lib/db/types";

// Layout already gates membership; this page just loads the data.
export default async function RequestsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = (await getLocale()) as "en" | "ar";
  const t = await getTranslations("dash.requests");

  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(slug);
  if (!restaurant) notFound();
  const [requests, menu] = await Promise.all([
    store.listServiceRequests(restaurant.id),
    store.getMenu(restaurant.id),
  ]);
  const itemName = (id: string) =>
    menu?.items.find((i) => i.id === id)?.name[loc] ?? null;

  const targetLabel = (r: ServiceRequest): string | null => {
    if (typeof r.target.section === "string") return t(`sections.${r.target.section}`);
    if (typeof r.target.area === "string") return t(`areas.${r.target.area}`);
    if (Array.isArray(r.target.menuItemIds)) {
      const names = (r.target.menuItemIds as string[]).map(itemName).filter(Boolean);
      return names.length ? names.join(" · ") : null;
    }
    return null;
  };

  const views: RequestView[] = await Promise.all(
    requests.map(async (r) => ({
      id: r.id,
      category: r.category,
      kind: r.kind,
      targetLabel: targetLabel(r),
      note: r.note,
      status: r.status,
      reply: r.reply,
      ownerReply: r.ownerReply,
      voiceUrl: r.voiceUrl ? await signedRequestMediaUrl(r.voiceUrl) : null,
      photoUrl: r.photoUrl ? await signedRequestMediaUrl(r.photoUrl) : null,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
    })),
  );

  return (
    <RequestsView
      slug={slug}
      requests={views}
      storefrontUrl={`/${locale}/s/${slug}`}
      menuItems={(menu?.items ?? []).map((i) => ({ id: i.id, name: i.name[loc] }))}
    />
  );
}
