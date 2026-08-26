"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Clock, Flame } from "lucide-react";
import { cn } from "@/lib/cn";

type Ticket = { id: string; number: string; items: string; minutes: number };

const TICKETS: Ticket[] = [
  { id: "a", number: "A417", items: "2 × Chicken Shawarma · 1 × Fattoush", minutes: 0 },
  { id: "b", number: "A418", items: "1 × Mixed Grill · 2 × Hummus", minutes: 2 },
  { id: "c", number: "A419", items: "3 × Manakish Zaatar", minutes: 5 },
];

type State = "new" | "preparing" | "ready";

/**
 * Live kitchen feed (design-pass-5 §4): cards slide in on view, and the
 * visitor can tap through Accept, Preparing, Ready. Real interaction,
 * not a video. Reduced motion skips the slide-in and shows the feed
 * settled.
 */
export function KitchenFeed() {
  const t = useTranslations("site.how");
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);
  const [states, setStates] = useState<Record<string, State>>({});

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        if (reduced) {
          setShown(TICKETS.length);
          return;
        }
        TICKETS.forEach((_, i) =>
          setTimeout(() => setShown((n) => Math.max(n, i + 1)), i * 550),
        );
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const advance = (id: string) =>
    setStates((prev) => ({
      ...prev,
      [id]: prev[id] === "preparing" ? "ready" : prev[id] === "ready" ? "ready" : "preparing",
    }));

  return (
    <div ref={ref} className="card-crisp overflow-hidden rounded-card bg-white">
      {/* screen chrome */}
      <div className="flex items-center gap-2 border-b border-olive/10 bg-olive px-4 py-3 text-ivory">
        <Flame className="size-4 text-brass brightness-150" aria-hidden />
        <span className="text-sm font-bold">Beit Zizo Shawarma</span>
        <span className="ms-auto text-xs text-ivory/60" dir="ltr">
          Kitchen
        </span>
      </div>

      <ul className="divide-y divide-olive/8">
        {TICKETS.map((ticket, i) => {
          const state = states[ticket.id] ?? "new";
          return (
            <li
              key={ticket.id}
              className={cn(
                "flex flex-wrap items-center gap-3 p-4 transition-all duration-500 motion-reduce:transition-none",
                i < shown ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-charcoal" dir="ltr">
                    #{ticket.number}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-stone" dir="ltr">
                    <Clock className="size-3.5" aria-hidden />
                    {ticket.minutes}m
                  </span>
                  {state !== "new" && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-bold",
                        state === "preparing"
                          ? "bg-brass/15 text-brass-deep"
                          : "bg-positive/10 text-positive",
                      )}
                    >
                      {state === "preparing" ? t("orderPreparing") : t("orderReady")}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-stone">{ticket.items}</p>
              </div>

              <button
                type="button"
                onClick={() => advance(ticket.id)}
                disabled={state === "ready"}
                className={cn(
                  "press h-9 shrink-0 rounded-btn px-4 text-sm font-bold transition-colors",
                  state === "ready"
                    ? "bg-positive/10 text-positive"
                    : state === "preparing"
                      ? "bg-olive text-ivory"
                      : "btn-shine bg-brass text-ivory",
                )}
              >
                {state === "new" ? (
                  t("orderAccept")
                ) : state === "preparing" ? (
                  t("orderReady")
                ) : (
                  <Check className="size-4" aria-hidden />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
