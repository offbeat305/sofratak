"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import type { Fulfillment, Restaurant } from "@/lib/db/types";
import { SERVICE_FEE_CENTS } from "@/lib/fees";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/cn";
import { placeOrderAction } from "@/app/[locale]/(storefront)/s/[slug]/actions";
import { useCart } from "./cart-context";

const TIP_PRESETS = [0.1, 0.15, 0.2] as const;

function scheduleSlots(prepMinutes: number): string[] {
  // next 48h in 30-min slots, starting after prep time, rounded up
  const slots: string[] = [];
  const start = new Date(Date.now() + prepMinutes * 60_000);
  start.setMinutes(start.getMinutes() + (30 - (start.getMinutes() % 30)), 0, 0);
  for (let i = 0; i < 96; i++) {
    slots.push(new Date(start.getTime() + i * 30 * 60_000).toISOString());
  }
  return slots;
}

export function CheckoutView({
  restaurant,
  paymentCanceled = false,
}: {
  restaurant: Restaurant;
  paymentCanceled?: boolean;
}) {
  const t = useTranslations("storefront");
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const cart = useCart();
  const [pending, startTransition] = useTransition();

  const initialFulfillment: Fulfillment = restaurant.ordering.pickup
    ? "pickup"
    : "delivery";
  const [fulfillment, setFulfillment] = useState<Fulfillment>(initialFulfillment);
  const [when, setWhen] = useState<"asap" | "scheduled">("asap");
  const [scheduledFor, setScheduledFor] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [address, setAddress] = useState("");
  // Business decision: preselect 15% on delivery, No tip on pickup — but an
  // explicit tap always wins, even across fulfillment switches.
  const [tipChoice, setTipChoiceRaw] = useState<number | "custom">(
    initialFulfillment === "delivery" ? 0.15 : 0,
  );
  const tipTouched = useRef(false);
  const setTipChoice = (value: number | "custom") => {
    tipTouched.current = true;
    setTipChoiceRaw(value);
  };
  const selectFulfillment = (value: Fulfillment) => {
    setFulfillment(value);
    if (!tipTouched.current) {
      setTipChoiceRaw(value === "delivery" ? 0.15 : 0);
    }
  };
  const [customTip, setCustomTip] = useState("");
  const [offerCode, setOfferCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const slots = useMemo(
    () => scheduleSlots(restaurant.ordering.prepMinutes),
    [restaurant.ordering.prepMinutes],
  );

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar-u-nu-latn" : locale, {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
      }),
    [locale],
  );

  const tipCents = useMemo(() => {
    if (tipChoice === "custom") {
      const parsed = Math.round(parseFloat(customTip || "0") * 100);
      return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 50_000) : 0;
    }
    return Math.round(cart.subtotalCents * tipChoice);
  }, [tipChoice, customTip, cart.subtotalCents]);

  const deliveryFeeCents =
    fulfillment === "delivery" ? restaurant.ordering.deliveryFeeCents : 0;
  const totalCents = cart.subtotalCents + SERVICE_FEE_CENTS + deliveryFeeCents + tipCents;
  const belowDeliveryMin =
    fulfillment === "delivery" &&
    cart.subtotalCents < restaurant.ordering.deliveryMinimumCents;

  const fmt = (cents: number) => formatCents(cents, locale);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await placeOrderAction({
        restaurantSlug: restaurant.slug,
        locale,
        fulfillment,
        scheduledFor: when === "scheduled" && scheduledFor ? scheduledFor : null,
        customer: { name, phone, smsOptIn },
        deliveryAddress: fulfillment === "delivery" ? address : null,
        tipCents,
        offerCode: offerCode.trim() || null,
        lines: cart.lines.map((l) => ({
          menuItemId: l.menuItemId,
          qty: l.qty,
          options: l.options,
          notes: l.notes,
        })),
      });
      if (result.ok) {
        if (result.redirectUrl) {
          // Stripe-hosted payment page. Cart stays until payment succeeds —
          // the order page clears it once the order is paid.
          window.location.assign(result.redirectUrl);
          return;
        }
        cart.clear();
        router.push(`/s/${restaurant.slug}/order/${result.orderId}?new=1`);
      } else {
        setError(result.error);
      }
    });
  };

  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-stone">{t("emptyCart")}</p>
        <Link
          href={`/s/${restaurant.slug}`}
          className="rounded-btn bg-[var(--sf-primary)] px-6 py-3 font-bold text-white"
        >
          {t("browseMenu")}
        </Link>
      </div>
    );
  }

  const sectionCls =
    "rounded-card border border-charcoal/8 bg-white p-5 shadow-[0_1px_3px_rgba(31,31,31,0.05)]";
  const chipCls = (selected: boolean) =>
    cn(
      "flex-1 rounded-field border px-4 py-3 text-center font-semibold transition-colors",
      selected
        ? "border-[var(--sf-primary)] bg-[var(--sf-primary)] text-white"
        : "border-charcoal/15 text-charcoal hover:border-charcoal/30",
    );
  const inputCls =
    "h-11 w-full rounded-field border border-charcoal/15 bg-white px-4 text-[15px] placeholder:text-stone/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-primary)]/40";

  return (
    <div className="flex flex-col gap-4 pb-28">
      {paymentCanceled && (
        <p className="rounded-card border border-clay/30 bg-clay/8 p-4 text-sm font-semibold text-clay">
          {t("paymentCanceled")}
        </p>
      )}
      {/* order lines */}
      <section className={sectionCls} aria-label={t("yourOrder")}>
        <h2 className="mb-3 text-lg font-bold text-charcoal">{t("yourOrder")}</h2>
        <ul className="flex flex-col divide-y divide-charcoal/8">
          {cart.lines.map((line) => (
            <li key={line.key} className="flex items-center gap-3 py-3">
              <div className="flex-1">
                <p className="font-semibold text-charcoal">{line.name[locale]}</p>
                {line.optionNames.length > 0 && (
                  <p className="text-sm text-stone">
                    {line.optionNames.map((n) => n[locale]).join(" · ")}
                  </p>
                )}
                {line.notes && <p className="text-sm text-stone italic">{line.notes}</p>}
                <p className="mt-0.5 text-sm font-bold text-[var(--sf-primary)]" dir="ltr">
                  {fmt(line.unitPriceCents * line.qty)}
                </p>
              </div>
              <div className="flex items-center rounded-full border border-charcoal/15">
                <button
                  type="button"
                  onClick={() => cart.updateQty(line.key, line.qty - 1)}
                  aria-label={line.qty === 1 ? t("remove") : t("decrease")}
                  className="p-2 text-charcoal"
                >
                  {line.qty === 1 ? (
                    <Trash2 className="size-4" aria-hidden />
                  ) : (
                    <Minus className="size-4" aria-hidden />
                  )}
                </button>
                <span className="min-w-7 text-center text-sm font-bold tabular-nums">
                  {line.qty}
                </span>
                <button
                  type="button"
                  onClick={() => cart.updateQty(line.key, line.qty + 1)}
                  aria-label={t("increase")}
                  className="p-2 text-charcoal"
                >
                  <Plus className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* fulfillment */}
      <section className={sectionCls}>
        <div className="flex gap-2" role="group">
          {restaurant.ordering.pickup && (
            <button type="button" onClick={() => selectFulfillment("pickup")} className={chipCls(fulfillment === "pickup")}>
              {t("pickup")}
            </button>
          )}
          {restaurant.ordering.delivery && (
            <button type="button" onClick={() => selectFulfillment("delivery")} className={chipCls(fulfillment === "delivery")}>
              {t("delivery")}
            </button>
          )}
        </div>
        {fulfillment === "delivery" && (
          <div className="mt-4">
            <label className="text-sm font-bold text-charcoal" htmlFor="address">
              {t("deliveryAddress")}
            </label>
            <input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("deliveryAddressPlaceholder")}
              autoComplete="street-address"
              className={cn(inputCls, "mt-2")}
            />
            {belowDeliveryMin && (
              <p className="mt-2 text-sm font-semibold text-error">
                {t("deliveryMinimumNote", {
                  amount: fmt(restaurant.ordering.deliveryMinimumCents),
                })}
              </p>
            )}
          </div>
        )}

        <h3 className="mt-5 text-sm font-bold text-charcoal">{t("whenTitle")}</h3>
        <div className="mt-2 flex gap-2" role="group">
          <button type="button" onClick={() => setWhen("asap")} className={chipCls(when === "asap")}>
            {t("asap", { minutes: restaurant.ordering.prepMinutes })}
          </button>
          <button type="button" onClick={() => setWhen("scheduled")} className={chipCls(when === "scheduled")}>
            {t("scheduleLater")}
          </button>
        </div>
        {when === "scheduled" && (
          <select
            aria-label={t("scheduleTime")}
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className={cn(inputCls, "mt-3 appearance-none")}
          >
            <option value="">{t("scheduleTime")}</option>
            {slots.map((iso) => (
              <option key={iso} value={iso}>
                {timeFormatter.format(new Date(iso))}
              </option>
            ))}
          </select>
        )}
      </section>

      {/* contact */}
      <section className={sectionCls}>
        <h2 className="mb-3 text-lg font-bold text-charcoal">{t("contactTitle")}</h2>
        <div className="flex flex-col gap-3">
          <label>
            <span className="text-sm font-bold text-charcoal">{t("name")}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className={cn(inputCls, "mt-1.5")}
            />
          </label>
          <label>
            <span className="text-sm font-bold text-charcoal">{t("phone")}</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              className={cn(inputCls, "mt-1.5")}
            />
            <span className="mt-1 block text-sm text-stone">{t("phoneHint")}</span>
          </label>
          <label className="flex items-start gap-2.5 text-sm text-charcoal">
            <input
              type="checkbox"
              checked={smsOptIn}
              onChange={(e) => setSmsOptIn(e.target.checked)}
              className="mt-0.5 size-4 accent-[var(--sf-primary)]"
            />
            {t("smsOptIn")}
          </label>
        </div>
      </section>

      {/* tip */}
      <section className={sectionCls}>
        <h2 className="text-lg font-bold text-charcoal">{t("tipTitle")}</h2>
        <p className="mt-0.5 text-sm text-stone">{t("tipNote")}</p>
        <div className="mt-3 flex flex-wrap gap-2" role="group">
          <button type="button" onClick={() => setTipChoice(0)} className={cn(chipCls(tipChoice === 0), "flex-none px-4")}>
            {t("noTip")}
          </button>
          {TIP_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setTipChoice(p)}
              className={cn(chipCls(tipChoice === p), "flex-none px-4")}
            >
              <span dir="ltr">{Math.round(p * 100)}%</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setTipChoice("custom")}
            className={cn(chipCls(tipChoice === "custom"), "flex-none px-4")}
          >
            {t("customTip")}
          </button>
        </div>
        {tipChoice === "custom" && (
          <input
            aria-label={t("customTipAmount")}
            value={customTip}
            onChange={(e) => setCustomTip(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            placeholder="5.00"
            dir="ltr"
            className={cn(inputCls, "mt-3 max-w-40")}
          />
        )}
      </section>

      {/* offer code */}
      <section className={sectionCls}>
        <label htmlFor="offerCode" className="text-sm font-bold text-charcoal">
          {t("offerCodeTitle")}
        </label>
        <input
          id="offerCode"
          value={offerCode}
          onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
          placeholder={t("offerCodePlaceholder")}
          autoCapitalize="characters"
          dir="ltr"
          className={cn(inputCls, "mt-1.5 uppercase")}
        />
        <p className="mt-1 text-sm text-stone">{t("offerCodeNote")}</p>
      </section>

      {/* totals */}
      <section className={sectionCls}>
        <dl className="flex flex-col gap-2 text-[15px]">
          <div className="flex justify-between">
            <dt className="text-stone">{t("subtotal")}</dt>
            <dd className="font-semibold tabular-nums" dir="ltr">{fmt(cart.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone">{t("serviceFee")}</dt>
            <dd className="font-semibold tabular-nums" dir="ltr">{fmt(SERVICE_FEE_CENTS)}</dd>
          </div>
          {fulfillment === "delivery" && (
            <div className="flex justify-between">
              <dt className="text-stone">{t("deliveryFee")}</dt>
              <dd className="font-semibold tabular-nums" dir="ltr">{fmt(deliveryFeeCents)}</dd>
            </div>
          )}
          {tipCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-stone">{t("tip")}</dt>
              <dd className="font-semibold tabular-nums" dir="ltr">{fmt(tipCents)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-charcoal/10 pt-2 text-lg font-bold">
            <dt>{t("total")}</dt>
            <dd className="tabular-nums" dir="ltr">{fmt(totalCents)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-stone">{t("testPayment")}</p>
        {error && (
          <p role="alert" className="mt-3 text-sm font-semibold text-error">
            {error}
          </p>
        )}
      </section>

      {/* pay bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-charcoal/8 bg-white/95 p-4 backdrop-blur">
        <button
          type="button"
          onClick={submit}
          disabled={pending || belowDeliveryMin || (when === "scheduled" && !scheduledFor)}
          className="mx-auto flex h-14 w-full max-w-lg items-center justify-center rounded-btn bg-[var(--sf-primary)] font-bold text-white transition-opacity disabled:opacity-50"
        >
          {pending ? t("placingOrder") : t("payNow", { amount: fmt(totalCents) })}
        </button>
      </div>
    </div>
  );
}
