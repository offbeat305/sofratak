"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Check, ImageIcon, MessageSquare, Send } from "lucide-react";
import { cn } from "@/lib/cn";

type Stage = { badge: string; title: string; body: string };

/**
 * Day-by-day timeline (design-pass-5 §2). Desktop: the section is N
 * screens tall, an inner sticky viewport holds the track, and scroll
 * progress drives ONE transform on that track (scroll-scrubbed, never
 * autoplay). Mobile and reduced-motion fall back to a plain vertical
 * stack, which is also the no-JS state.
 *
 * 60fps rule: the scroll listener only stores a number in state via
 * rAF; every visual change is transform/opacity on a single element.
 */
export function HowTimeline() {
  const t = useTranslations("site.how");
  const locale = useLocale();
  const rtl = locale === "ar";
  const stages = t.raw("stages") as Stage[];

  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [scrubbed, setScrubbed] = useState(false);
  const frame = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    if (reduced || !wide) return;
    setScrubbed(true);

    const onScroll = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const el = sectionRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const scrollable = rect.height - window.innerHeight;
        if (scrollable <= 0) return;
        setProgress(Math.min(Math.max(-rect.top / scrollable, 0), 1));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const last = stages.length - 1;
  // which stage is "current" — drives each mockup's own animation
  const active = Math.min(Math.round(progress * last), last);
  // Travel in vw, NOT %: a percentage transform resolves against the
  // track's own width (five screens), which would overshoot 5x. Each
  // panel is exactly 100vw wide. RTL flips the direction so the
  // timeline still reads forward.
  const shift = progress * last * (rtl ? 1 : -1) * 100;

  return (
    <section
      ref={sectionRef}
      className={cn("relative bg-olive text-ivory", scrubbed && "lg:h-[500vh]")}
    >
      {/* Glow lives on its own layer, never on the sticky element:
          .olive-luminous sets position:relative (and overflow:hidden),
          which silently beat `lg:sticky` and killed the pin. */}
      <div
        className={cn(
          scrubbed &&
            "lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-center lg:overflow-hidden",
        )}
      >
        <div aria-hidden className="olive-luminous pointer-events-none absolute inset-0" />
        <div className="relative mx-auto w-full max-w-[1200px] shrink-0 px-4 pt-16 sm:px-6 lg:pt-0">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{t("timelineTitle")}</h2>
          <p className="mt-1 text-ivory/70">{t("timelineSub")}</p>

          {/* progress rail (desktop scrub only) */}
          {scrubbed && (
            <div className="mt-6 hidden items-center gap-3 lg:flex">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-ivory/15">
                <div
                  className="h-full rounded-full bg-brass"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold tabular-nums text-ivory/70" dir="ltr">
                {active + 1}/{stages.length}
              </span>
            </div>
          )}
        </div>

        {/* track */}
        <div className={cn("relative mt-8 lg:mt-10", scrubbed && "lg:overflow-hidden")}>
          <div
            className={cn(
              "flex flex-col gap-12 px-4 sm:px-6 lg:flex-row lg:gap-0 lg:px-0",
              scrubbed && "lg:will-change-transform",
            )}
            style={scrubbed ? { transform: `translate3d(${shift}vw, 0, 0)` } : undefined}
          >
            {stages.map((stage, i) => (
              <div
                key={stage.badge}
                className="lg:flex lg:w-screen lg:shrink-0 lg:items-center lg:justify-center lg:gap-12 lg:px-[max(1.5rem,calc((100vw-1200px)/2))]"
              >
                <div className="lg:w-[42%]">
                  <span className="inline-flex items-center rounded-full bg-brass px-3.5 py-1.5 text-xs font-extrabold tracking-wide text-ivory uppercase">
                    {stage.badge}
                  </span>
                  <h3 className="font-display mt-4 text-2xl font-bold sm:text-3xl">{stage.title}</h3>
                  <p className="mt-3 max-w-md text-lg text-ivory/75">{stage.body}</p>
                  <div className="mt-5 flex gap-1.5" aria-hidden>
                    {stages.map((s, j) => (
                      <span
                        key={s.badge}
                        className={cn(
                          "h-1 rounded-full transition-all duration-300",
                          j === (scrubbed ? active : i) ? "w-8 bg-brass" : "w-3 bg-ivory/25",
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-8 lg:mt-0 lg:w-[58%]">
                  <StageVisual index={i} active={!scrubbed || active === i} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {!scrubbed && <div className="h-16" />}
      </div>
    </section>
  );
}

/** Phone shell — real product screenshots live inside these. */
function Phone({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        // fixed height so the screenshot crops instead of overflowing the
        // stage frame (the approve bar pins to the visible bottom edge)
        "edge-light relative h-[17rem] w-40 overflow-hidden rounded-[2rem] border-[6px] border-charcoal/85 bg-charcoal/85 shadow-[0_24px_60px_rgba(20,30,25,0.5)] sm:h-[20rem] sm:w-48",
        className,
      )}
    >
      {children}
    </div>
  );
}

function StageVisual({ index, active }: { index: number; active: boolean }) {
  const t = useTranslations("site.how");

  // 1 · the owner photographs their paper menu (their menu, not our UI)
  if (index === 0) {
    return (
      <Frame active={active}>
        <div className="flex h-full items-center justify-center">
          <div
            className={cn(
              "w-44 rotate-[-4deg] rounded-lg bg-ivory p-4 shadow-[0_18px_40px_rgba(20,30,25,0.45)] transition-all duration-700 sm:w-52",
              active ? "opacity-100" : "translate-y-3 opacity-0",
            )}
          >
            <div className="flex items-center gap-2 border-b border-charcoal/15 pb-2">
              <ImageIcon className="size-4 text-brass" aria-hidden />
              <span className="text-[11px] font-bold text-charcoal/70">menu.jpg</span>
            </div>
            {[90, 70, 80, 55, 75].map((w, i) => (
              <div key={i} className="mt-2.5 flex items-center justify-between gap-3">
                <span className="h-2 rounded bg-charcoal/20" style={{ width: `${w}%` }} />
                <span className="h-2 w-6 shrink-0 rounded bg-brass/50" />
              </div>
            ))}
          </div>
        </div>
      </Frame>
    );
  }

  // 2 · the built storefront, flipping EN to AR (real screenshots)
  if (index === 1) {
    return (
      <Frame active={active}>
        <div className="flex h-full items-center justify-center gap-4">
          <Phone>
            <Image src="/tour/storefront-en.png" alt="" width={390} height={780} className="size-full object-cover object-top" />
          </Phone>
          <Phone className={cn("hidden transition-all duration-700 sm:block", active ? "opacity-100" : "translate-x-4 opacity-0")}>
            <Image src="/tour/storefront-ar.png" alt="" width={390} height={780} className="size-full object-cover object-top" />
          </Phone>
        </div>
      </Frame>
    );
  }

  // 3 · approve it on your phone
  if (index === 2) {
    return (
      <Frame active={active}>
        <div className="flex h-full items-center justify-center">
          <Phone>
            <Image src="/tour/storefront-en.png" alt="" width={390} height={780} className="size-full object-cover object-top" />
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-olive-deep/95 p-3 backdrop-blur transition-transform duration-700",
                active ? "translate-y-0" : "translate-y-full",
              )}
            >
              <span className="glow-brass inline-flex items-center gap-1.5 rounded-full bg-brass px-4 py-2 text-xs font-bold text-ivory">
                <Check className="size-4" aria-hidden />
                {t("approveLabel")}
              </span>
            </div>
          </Phone>
        </div>
      </Frame>
    );
  }

  // 4 · live: a real order lands on the kitchen screen (real screenshot)
  if (index === 3) {
    return (
      <Frame active={active}>
        <div className="flex h-full items-center justify-center">
          <div className="edge-light relative w-full max-w-md overflow-hidden rounded-2xl border-[6px] border-charcoal/85 bg-charcoal/85 shadow-[0_24px_60px_rgba(20,30,25,0.5)]">
            <Image src="/tour/kitchen.png" alt="" width={1024} height={720} className="h-auto w-full" />
            <div
              className={cn(
                "absolute start-3 top-3 rounded-xl bg-ivory p-3 shadow-lg transition-all duration-700",
                active ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0",
              )}
            >
              <p className="text-[11px] font-extrabold tracking-wide text-brass-deep uppercase">
                {t("orderNew")}
              </p>
              <p className="text-sm font-bold text-charcoal" dir="ltr">
                #A417 · 2 items
              </p>
            </div>
          </div>
        </div>
      </Frame>
    );
  }

  // 5 · marketing turns on
  return (
    <Frame active={active}>
      <div className="flex h-full flex-col items-center justify-center gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ transitionDelay: `${i * 140}ms` }}
            className={cn(
              "flex w-full max-w-xs items-start gap-2.5 rounded-2xl bg-ivory p-3.5 shadow-[0_12px_30px_rgba(20,30,25,0.35)] transition-all duration-500",
              active ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
            )}
          >
            <MessageSquare className="mt-0.5 size-4 shrink-0 text-brass" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="h-2 w-4/5 rounded bg-charcoal/20" />
              <div className="mt-1.5 h-2 w-3/5 rounded bg-charcoal/12" />
            </div>
            <Send className="size-3.5 shrink-0 text-positive rtl:-scale-x-100" aria-hidden />
          </div>
        ))}
      </div>
    </Frame>
  );
}

function Frame({ children, active }: { children: React.ReactNode; active: boolean }) {
  return (
    <div
      className={cn(
        "h-[19rem] transition-opacity duration-500 sm:h-[22rem]",
        active ? "opacity-100" : "opacity-60",
      )}
    >
      {children}
    </div>
  );
}
