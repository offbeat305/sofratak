import { getTranslations, setRequestLocale } from "next-intl/server";
import { getStore } from "@/lib/db/store";
import { ReviewQueueList } from "@/components/admin/review-queue-list";

/** Directory review queue — ambiguous OSM imports awaiting Zizo's call. */
export default async function AdminDirectoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const queue = await getStore().listDirectoryReviewQueue();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-olive">{t("directoryReview")}</h1>
      <p className="text-sm text-stone">{t("directoryReviewSub")}</p>
      <ReviewQueueList queue={queue} />
    </div>
  );
}
