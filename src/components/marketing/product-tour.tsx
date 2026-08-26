"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

type Slide = {
  src: string;
  frame: "phone" | "tablet";
  /** the EN→AR flip moment */
  flip?: boolean;
};

const SLIDES: Slide[] = [
  { src: "/tour/storefront-en.png", frame: "phone" },
  { src: "/tour/storefront-ar.png", frame: "phone", flip: true },
  { src: "/tour/kitchen.png", frame: "tablet" },
  { src: "/tour/dashboard.png", frame: "tablet" },
];

/**
 * Product tour carousel (design-pass §5): snap-scroll, dots, drag on
 * touch, 5s auto-advance with pause on hover, EN→AR flip on slide 2.
 */
export function ProductTour() {
  const t = useTranslations("site.tour");
  const captions = t.raw("captions") as string[];
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const paused = useRef(false);
  const interacted = useRef(false);
  const visible = useRef(false);

  /**
   * Horizontal-only scroll, scoped to the track's own scrollport.
   * `scrollIntoView` (the previous approach) also nudges the PAGE'S
   * vertical scroll to bring the target into view — with a 5s auto-
   * advance timer, that yanked the whole page back to this section
   * every 5 seconds no matter which way the visitor had scrolled.
   * `track.scrollTo` never touches anything outside the track.
   */
  const goTo = (index: number) => {
    const track = trackRef.current;
    const target = track?.children[index] as HTMLElement | undefined;
    if (!track || !target) return;
    const trackRect = track.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const delta =
      targetRect.left - trackRect.left - (track.clientWidth - target.clientWidth) / 2;
    track.scrollTo({ left: track.scrollLeft + delta, behavior: "smooth" });
  };

  // track active slide from scroll position (RTL-safe via per-slide offset)
  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    let best = 0;
    let bestDist = Infinity;
    const center = track.scrollLeft + track.clientWidth / 2;
    Array.from(track.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const mid = el.offsetLeft + el.offsetWidth / 2;
      const dist = Math.abs(mid - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setActive(best);
    if (best === 1) setFlipped(true);
  };

  // Only auto-advance while the carousel is actually on screen — belt and
  // suspenders on top of the horizontal-only goTo() above.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting;
      },
      { threshold: 0.4 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // auto-advance every 5s, pause on hover/touch/off-screen, off for reduced motion
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      if (paused.current || interacted.current || !visible.current) return;
      const track = trackRef.current;
      if (!track) return;
      const next = (Math.min(active, SLIDES.length - 1) + 1) % SLIDES.length;
      goTo(next);
    }, 5000);
    return () => clearInterval(timer);
  }, [active]);

  return (
    <div
      ref={sectionRef}
      onMouseEnter={() => {
        paused.current = true;
      }}
      onMouseLeave={() => {
        paused.current = false;
      }}
      onTouchStart={() => {
        interacted.current = true;
      }}
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="scrollbar-none flex snap-x snap-mandatory gap-6 overflow-x-auto px-[8vw] py-4"
        style={{ scrollbarWidth: "none" }}
      >
        {SLIDES.map((slide, i) => (
          <figure
            key={slide.src}
            className="flex w-[84vw] max-w-3xl shrink-0 snap-center flex-col items-center gap-5"
          >
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  // design-pass-3 §3: edge-lit frames, brass halo on the
                  // active slide (150ms fade via transition)
                  "edge-light overflow-hidden border-[6px] border-charcoal/85 bg-charcoal/85 shadow-[0_24px_60px_rgba(20,30,25,0.5)] transition-[box-shadow] duration-300",
                  slide.frame === "phone"
                    ? "w-56 rounded-[2.2rem] sm:w-64"
                    : "w-full rounded-2xl",
                  active === i && "glow-slide-active",
                  slide.flip && flipped && "animate-flip-in",
                )}
              >
                <Image
                  src={slide.src}
                  alt={captions[i]}
                  width={slide.frame === "phone" ? 390 : 1024}
                  height={slide.frame === "phone" ? 780 : 720}
                  className={cn(
                    "h-auto w-full",
                    slide.frame === "phone" ? "rounded-[1.8rem]" : "rounded-xl",
                  )}
                />
              </div>
              {/* reflective floor */}
              <div
                aria-hidden
                className="mt-3 h-6 w-3/5 rounded-[100%] bg-[radial-gradient(ellipse,rgba(20,30,25,0.55)_0%,transparent_70%)] blur-md"
              />
            </div>
            <figcaption className="font-display -mt-2 text-center text-xl font-bold text-ivory sm:text-2xl">
              {captions[i]}
            </figcaption>
          </figure>
        ))}
      </div>

      {/* dots */}
      <div className="mt-2 flex justify-center gap-2.5">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={captions[i]}
            aria-current={active === i}
            onClick={() => {
              interacted.current = true;
              goTo(i);
            }}
            className={cn(
              "size-2.5 rounded-full transition-colors",
              active === i ? "bg-brass brightness-125" : "bg-ivory/30 hover:bg-ivory/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}
