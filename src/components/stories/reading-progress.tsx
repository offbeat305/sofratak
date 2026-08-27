"use client";

import { useEffect, useRef } from "react";

/**
 * Sticky 2px brass reading-progress bar (design-pass-6 B). Scroll-linked,
 * not decorative, so it isn't gated behind prefers-reduced-motion — it's
 * direct feedback for a user action, the thing that guidance exists to
 * protect, not the thing it warns against.
 */
export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.transform = `scaleX(${pct})`;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-[2px] bg-olive/10" aria-hidden>
      <div ref={barRef} className="h-full origin-left bg-brass" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}
