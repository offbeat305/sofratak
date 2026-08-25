import { getTranslations, setRequestLocale } from "next-intl/server";
import { getStore } from "@/lib/db/store";
import { signedRequestMediaUrl } from "@/lib/storage/request-media";
import { RequestsQueue, type AdminRequestView } from "@/components/admin/requests-queue";

/** Concierge queue (spec §4) — layout gates super_admin. */
export default async function AdminRequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const store = getStore();
  const [requests, restaurants] = await Promise.all([
    store.listAllServiceRequests(),
    store.listAllRestaurants(),
  ]);
  const nameOf = new Map(restaurants.map((r) => [r.id, r.name.en]));

  const views: AdminRequestView[] = await Promise.all(
    requests.map(async (r) => ({
      id: r.id,
      restaurantName: nameOf.get(r.restaurantId) ?? r.restaurantId,
      category: r.category,
      kind: r.kind,
      target: r.target,
      note: r.note,
      noteLocale: r.noteLocale,
      status: r.status,
      reply: r.reply,
      ownerReply: r.ownerReply,
      pricingFlag: r.pricingFlag,
      voiceUrl: r.voiceUrl ? await signedRequestMediaUrl(r.voiceUrl) : null,
      photoUrl: r.photoUrl ? await signedRequestMediaUrl(r.photoUrl) : null,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
    })),
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-olive">{t("requestsTitle")}</h1>
      <RequestsQueue requests={views} />
    </div>
  );
}
