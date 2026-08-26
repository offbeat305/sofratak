"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { reviewDirectoryListingAction } from "@/app/[locale]/(admin)/admin/actions";
import type { DirectoryListing } from "@/lib/db/types";

export function ReviewQueueList({ queue }: { queue: DirectoryListing[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const review = (id: string, approve: boolean) => {
    setBusyId(id);
    startTransition(async () => {
      await reviewDirectoryListingAction(id, approve);
      router.refresh();
      setBusyId(null);
    });
  };

  if (queue.length === 0) {
    return (
      <p className="rounded-card border border-olive/10 bg-white p-6 text-sm text-stone">
        {t("directoryReviewEmpty")}
      </p>
    );
  }

  return (
    <ul className="flex max-w-2xl flex-col gap-2">
      {queue.map((listing) => (
        <li
          key={listing.id}
          className="flex items-center gap-3 rounded-card border border-olive/10 bg-white p-4"
        >
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-charcoal">{listing.name}</p>
            <p className="truncate text-xs text-stone">
              {listing.city} · {listing.address || ""} · {listing.cuisines.join(", ") || "no cuisine tags"}
            </p>
          </div>
          <button
            type="button"
            disabled={pending && busyId === listing.id}
            onClick={() => review(listing.id, true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-btn bg-positive/10 px-3 text-sm font-bold text-positive hover:bg-positive/20 disabled:opacity-50"
          >
            <Check className="size-4" aria-hidden />
            {t("directoryApprove")}
          </button>
          <button
            type="button"
            disabled={pending && busyId === listing.id}
            onClick={() => review(listing.id, false)}
            className="inline-flex h-9 items-center gap-1.5 rounded-btn px-3 text-sm font-bold text-error hover:bg-error/5 disabled:opacity-50"
          >
            <X className="size-4" aria-hidden />
            {t("directoryReject")}
          </button>
        </li>
      ))}
    </ul>
  );
}
