"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, BellOff, Printer } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/db/types";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/cn";
import { advanceStatusAction } from "@/app/[locale]/(dashboard)/kitchen/[slug]/actions";

const POLL_MS = 5000;

/** Three loud beeps via WebAudio — no asset, works offline on any tablet. */
function beep(ctx: AudioContext) {
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain).connect(ctx.destination);
    osc.frequency.value = 880;
    const t = ctx.currentTime + i * 0.35;
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.start(t);
    osc.stop(t + 0.3);
  }
}

type Feed = { active: Order[]; doneToday: Order[] };

export function KitchenBoard({
  slug,
  initial,
}: {
  slug: string;
  initial: Feed;
}) {
  const t = useTranslations("kitchen");
  const locale = useLocale() as "en" | "ar";
  const [feed, setFeed] = useState<Feed>(initial);
  const [soundOn, setSoundOn] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const knownIds = useRef(new Set(initial.active.map((o) => o.id)));
  const audioCtx = useRef<AudioContext | null>(null);
  const soundOnRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/kitchen/${slug}/orders`, { cache: "no-store" });
      if (!res.ok) return;
      const next = (await res.json()) as Feed;
      const fresh = next.active.filter((o) => !knownIds.current.has(o.id));
      if (fresh.length > 0 && soundOnRef.current && audioCtx.current) {
        beep(audioCtx.current);
      }
      for (const o of next.active) knownIds.current.add(o.id);
      setFeed(next);
    } catch {
      // transient network error — next poll retries
    }
  }, [slug]);

  useEffect(() => {
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const toggleSound = () => {
    // AudioContext must be created inside a user gesture (autoplay policy)
    if (!audioCtx.current) audioCtx.current = new AudioContext();
    audioCtx.current.resume();
    const next = !soundOn;
    setSoundOn(next);
    soundOnRef.current = next;
    if (next && audioCtx.current) beep(audioCtx.current);
  };

  const advance = async (orderId: string, to: OrderStatus) => {
    setBusy(orderId);
    await advanceStatusAction(orderId, to);
    await refresh();
    setBusy(null);
  };

  const columns: Array<{ key: string; statuses: OrderStatus[] }> = [
    { key: "received", statuses: ["received"] },
    { key: "preparing", statuses: ["preparing"] },
    { key: "ready", statuses: ["ready", "out_for_delivery"] },
  ];

  const timeFmt = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-u-nu-latn" : locale,
    { hour: "numeric", minute: "2-digit" },
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-stone">
          {t("doneToday", { count: feed.doneToday.length })}
        </p>
        <button
          type="button"
          onClick={toggleSound}
          className={cn(
            "inline-flex items-center gap-2 rounded-btn border-[1.5px] px-4 py-2 text-sm font-bold transition-colors",
            soundOn
              ? "border-olive bg-olive text-ivory"
              : "border-olive text-olive",
          )}
        >
          {soundOn ? (
            <Bell className="size-4" aria-hidden />
          ) : (
            <BellOff className="size-4" aria-hidden />
          )}
          {soundOn ? t("soundOn") : t("soundOff")}
        </button>
      </div>

      {feed.active.length === 0 ? (
        <p className="rounded-card border border-olive/10 bg-white p-10 text-center text-stone">
          {t("empty")}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {columns.map((col) => {
            const orders = feed.active.filter((o) => col.statuses.includes(o.status));
            return (
              <section key={col.key} aria-label={t(`columns.${col.key}`)}>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-bold tracking-wide text-stone uppercase">
                  {t(`columns.${col.key}`)}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs text-white",
                      col.key === "received" ? "bg-clay" : "bg-olive",
                    )}
                  >
                    {orders.length}
                  </span>
                </h2>
                <div className="flex flex-col gap-3">
                  {orders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      slug={slug}
                      busy={busy === order.id}
                      onAdvance={advance}
                      timeFmt={timeFmt}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  slug,
  busy,
  onAdvance,
  timeFmt,
}: {
  order: Order;
  slug: string;
  busy: boolean;
  onAdvance: (id: string, to: OrderStatus) => void;
  timeFmt: Intl.DateTimeFormat;
}) {
  const t = useTranslations("kitchen");
  const locale = useLocale() as "en" | "ar";
  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60_000),
  );
  const isNew = order.status === "received";

  const primaryAction: { label: string; to: OrderStatus } | null =
    order.status === "received"
      ? { label: t("accept"), to: "preparing" }
      : order.status === "preparing"
        ? order.fulfillment === "delivery"
          ? { label: t("markOut"), to: "out_for_delivery" }
          : { label: t("markReady"), to: "ready" }
        : { label: t("complete"), to: "completed" };

  return (
    <article
      className={cn(
        "rounded-card border bg-white p-4 shadow-[0_1px_3px_rgba(31,31,31,0.06)]",
        isNew ? "border-clay/60 ring-2 ring-clay/30" : "border-olive/10",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xl font-bold text-charcoal" dir="ltr">
            {order.number}
          </p>
          <p className="text-sm text-stone">
            {t(order.fulfillment)} ·{" "}
            {order.scheduledFor
              ? t("scheduledFor", {
                  time: timeFmt.format(new Date(order.scheduledFor)),
                })
              : t("asap")}{" "}
            · {t("waiting", { minutes })}
          </p>
          <p className="text-sm font-semibold text-charcoal">
            {order.customer.name} ·{" "}
            <span dir="ltr">{order.customer.phone}</span>
          </p>
        </div>
        <a
          href={`/${locale}/kitchen/${slug}/ticket/${order.id}`}
          target="_blank"
          rel="noreferrer"
          aria-label={t("printTicket")}
          className="rounded-btn p-2 text-stone hover:bg-olive/5 hover:text-olive"
        >
          <Printer className="size-5" aria-hidden />
        </a>
      </div>

      <ul className="mt-3 flex flex-col gap-1.5 border-t border-charcoal/8 pt-3 text-[15px]">
        {order.lines.map((line, i) => (
          <li key={i}>
            <p className="font-semibold text-charcoal">
              <span dir="ltr">{line.qty}×</span> {line.name[locale]}
            </p>
            {line.modifiers.length > 0 && (
              <p className="text-sm text-stone">
                {line.modifiers.map((m) => m.optionName[locale]).join(" · ")}
              </p>
            )}
            {line.notes && (
              <p className="text-sm font-semibold text-clay">
                {t("customerNotes")}: {line.notes}
              </p>
            )}
          </li>
        ))}
      </ul>
      {order.deliveryAddress && (
        <p className="mt-2 text-sm text-stone">{order.deliveryAddress}</p>
      )}
      <p className="mt-2 text-sm font-bold text-charcoal" dir="ltr">
        {formatCents(order.totalCents, locale)}
      </p>

      <div className="mt-3 flex gap-2">
        {primaryAction && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAdvance(order.id, primaryAction.to)}
            className={cn(
              "h-12 flex-1 rounded-btn font-bold text-white transition-opacity disabled:opacity-50",
              isNew ? "bg-clay" : "bg-olive",
            )}
          >
            {primaryAction.label}
          </button>
        )}
        {(order.status === "received" || order.status === "preparing") && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAdvance(order.id, "canceled")}
            className="h-12 rounded-btn border-[1.5px] border-error/40 px-4 text-sm font-bold text-error transition-opacity disabled:opacity-50"
          >
            {t("cancel")}
          </button>
        )}
      </div>
    </article>
  );
}
