"use client";

import { useEffect, useRef } from "react";

const ARCH_TILE = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><path d='M30 180 V90 a60 60 0 0 1 120 0 V180' fill='none' stroke='%23F7F2E8' stroke-opacity='0.05' stroke-width='2'/></svg>`,
)}")`;

/**
 * Barely-visible repeating arch pattern with a very slow parallax drift
 * (design-pass §2). Static under reduced motion.
 */
export function ArchWatermark({ parallax = true }: { parallax?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !parallax) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translateY(${window.scrollY * 0.06}px)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [parallax]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        ref={ref}
        className="absolute -inset-y-40 inset-x-0 will-change-transform"
        style={{ backgroundImage: ARCH_TILE }}
      />
    </div>
  );
}
