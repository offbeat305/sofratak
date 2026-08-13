"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import type { Order } from "@/lib/db/types";
import { cn } from "@/lib/cn";

const PICKUP_FLOW = ["received", "preparing", "ready", "completed"] as const;
const DELIVERY_FLOW = ["received", "preparing", "out_for_delivery", "completed"] as const;

/** Status stepper; refreshes the server component every 10s for live updates. */
export function OrderStatusView({ order }: { order: Order }) {
  const t = useTranslations("storefront");
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();

  useEffect(() => {
    if (order.status === "completed" || order.status === "canceled") return;
    const timer = setInterval(() => router.refresh(), 10_000);
    return () => clearInterval(timer);
  }, [order.status, router]);

  if (order.status === "canceled") {
    return (
      <p className="rounded-card border border-error/30 bg-error/5 p-4 font-semibold text-error">
        {t("status.canceled")}
      </p>
    );
  }

  const flow: readonly Order["status"][] =
    order.fulfillment === "delivery" ? DELIVERY_FLOW : PICKUP_FLOW;
  const currentIndex = flow.indexOf(order.status);

  const timeFormatter = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-u-nu-latn" : locale,
    { weekday: "short", hour: "numeric", minute: "2-digit" },
  );

  return (
    <div>
      {order.scheduledFor && (
        <p className="mb-4 text-sm font-semibold text-stone">
          {t("scheduledFor", { time: timeFormatter.format(new Date(order.scheduledFor)) })}
        </p>
      )}
      <ol className="flex flex-col gap-0">
        {flow.map((step, i) => {
          const done = i < currentIndex;
          const current = i === currentIndex;
          return (
            <li key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
                    done || current
                      ? "border-[var(--sf-primary)] bg-[var(--sf-primary)] text-white"
                      : "border-charcoal/20 text-charcoal/40",
                  )}
                  aria-hidden
                >
                  {done ? <Check className="size-4" /> : i + 1}
                </span>
                {i < flow.length - 1 && (
                  <span
                    className={cn(
                      "w-0.5 flex-1",
                      done ? "bg-[var(--sf-primary)]" : "bg-charcoal/15",
                    )}
                    aria-hidden
                  />
                )}
              </div>
              <p
                className={cn(
                  "pt-1 pb-6 font-semibold",
                  current
                    ? "text-[var(--sf-primary)]"
                    : done
                      ? "text-charcoal"
                      : "text-charcoal/40",
                )}
                aria-current={current ? "step" : undefined}
              >
                {t(`status.${step}`)}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
