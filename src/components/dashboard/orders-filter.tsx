"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { ORDER_STATUSES } from "@/lib/db/types";

export function OrdersFilter({
  slug,
  initialQuery,
  initialStatus,
}: {
  slug: string;
  initialQuery: string;
  initialStatus: string;
}) {
  const t = useTranslations("dash");
  const tSf = useTranslations("storefront");
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (status) params.set("status", status);
      router.replace(`/dashboard/${slug}/orders${params.size ? `?${params}` : ""}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, status, router, slug]);

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-stone"
          aria-hidden
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchOrders")}
          className="h-11 w-full rounded-field border border-olive/20 bg-white ps-9 pe-4 text-[15px] placeholder:text-stone/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
        />
      </div>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        aria-label={t("allStatuses")}
        className="h-11 rounded-field border border-olive/20 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
      >
        <option value="">{t("allStatuses")}</option>
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {tSf(`status.${s}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
