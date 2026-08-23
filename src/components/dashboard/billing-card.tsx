"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CircleAlert, CircleCheck, CreditCard } from "lucide-react";
import {
  cancelSubscriptionAction,
  openBillingPortalAction,
  startSubscriptionCheckoutAction,
} from "@/app/[locale]/(dashboard)/dashboard/[slug]/actions";
import { PLANS, PLAN_ORDER } from "@/lib/billing/plans";
import type { Restaurant, SubscriptionTier } from "@/lib/db/types";

function formatPrice(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function BillingCard({
  slug,
  billing,
}: {
  slug: string;
  billing: Restaurant["billing"];
}) {
  const t = useTranslations("dash");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [busyTier, setBusyTier] = useState<SubscriptionTier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const choosePlan = (tier: SubscriptionTier) =>
    startTransition(async () => {
      setError(null);
      setBusyTier(tier);
      const result = await startSubscriptionCheckoutAction(slug, tier, locale);
      if (result.ok) {
        window.location.assign(result.url);
      } else {
        setBusyTier(null);
        setError(result.error);
      }
    });

  const manage = () =>
    startTransition(async () => {
      setError(null);
      const result = await openBillingPortalAction(slug, locale);
      if (result.ok) {
        window.location.assign(result.url);
      } else {
        setError(result.error);
      }
    });

  const cancel = () =>
    startTransition(async () => {
      setError(null);
      const result = await cancelSubscriptionAction(slug);
      setConfirmingCancel(false);
      if (!result.ok) setError(result.error);
    });

  const canceling = Boolean(billing.canceledAt) && billing.status !== "canceled";

  if (billing.status === "none" || billing.status === "canceled") {
    return (
      <section className="rounded-card border border-olive/10 bg-white p-5">
        <h2 className="flex items-center gap-2 font-bold text-olive">
          <CreditCard className="size-4" aria-hidden />
          {t("billingTitle")}
        </h2>
        {billing.status === "canceled" && (
          <p className="mt-2 text-sm text-stone">{t("billingCanceled")}</p>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {PLAN_ORDER.map((tier) => {
            const plan = PLANS[tier];
            return (
              <div
                key={tier}
                className="flex flex-col gap-2 rounded-btn border border-olive/10 p-4"
              >
                <p className="font-bold text-olive">{plan.name}</p>
                <p className="text-sm text-stone">
                  {formatPrice(plan.priceCents, locale)}/{t("billingMonth")}
                </p>
                <button
                  type="button"
                  onClick={() => choosePlan(tier)}
                  disabled={pending}
                  className="mt-1 h-10 rounded-btn bg-brass px-3 text-sm font-bold text-ivory transition-colors hover:bg-brass-deep disabled:opacity-50"
                >
                  {pending && busyTier === tier ? t("billingStarting") : t("billingChoose")}
                </button>
              </div>
            );
          })}
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm font-semibold text-error">
            {error}
          </p>
        )}
      </section>
    );
  }

  const plan = billing.tier ? PLANS[billing.tier] : null;

  return (
    <section className="rounded-card border border-olive/10 bg-white p-5">
      <h2 className="flex items-center gap-2 font-bold text-olive">
        <CreditCard className="size-4" aria-hidden />
        {t("billingTitle")}
      </h2>

      <div className="mt-2 flex items-center justify-between">
        <p className="font-semibold text-olive">{plan?.name ?? "—"}</p>
        {plan && (
          <p className="text-sm text-stone">
            {formatPrice(plan.priceCents, locale)}/{t("billingMonth")}
          </p>
        )}
      </div>

      {billing.status === "past_due" && (
        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-error">
          <CircleAlert className="size-4 shrink-0" aria-hidden />
          {t("billingPastDue")}
        </p>
      )}

      {canceling ? (
        <p className="mt-2 text-sm font-semibold text-error">
          {t("billingCanceling", {
            date: billing.periodEnd
              ? new Date(billing.periodEnd).toLocaleDateString(locale === "ar" ? "ar" : "en-US")
              : "",
          })}
        </p>
      ) : (
        billing.status === "active" && (
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-positive">
            <CircleCheck className="size-4" aria-hidden />
            {t("billingActive")}
          </p>
        )
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={manage}
          disabled={pending}
          className="h-10 rounded-btn border border-olive/20 px-4 text-sm font-bold text-olive transition-colors hover:bg-olive/5 disabled:opacity-50"
        >
          {t("billingManage")}
        </button>
        {!canceling && (
          <button
            type="button"
            onClick={() => setConfirmingCancel(true)}
            disabled={pending}
            className="h-10 rounded-btn px-4 text-sm font-bold text-error transition-colors hover:bg-error/5 disabled:opacity-50"
          >
            {t("billingCancelBtn")}
          </button>
        )}
      </div>

      {confirmingCancel && (
        <div className="mt-3 rounded-btn border border-error/30 bg-error/5 p-3">
          <p className="text-sm text-olive">{t("billingCancelConfirm")}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="h-9 rounded-btn bg-error px-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {t("billingCancelYes")}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingCancel(false)}
              disabled={pending}
              className="h-9 rounded-btn border border-olive/20 px-3 text-sm font-bold text-olive"
            >
              {t("billingCancelNo")}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-error">
          {error}
        </p>
      )}
    </section>
  );
}
