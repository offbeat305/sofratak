"use client";

import { useState } from "react";
import { MessageCircle, Copy, Check, X as XIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * WhatsApp-first share (design-pass-6 B) — that's how this audience
 * actually shares. Desktop gets a floating rail on the START edge
 * (opposite corner from the WhatsApp bubble + Assistant launcher stack
 * that layout.tsx already floats on the end edge — a second cluster
 * there would be real clutter, not "restraint"). Mobile drops the
 * floating position and sits inline under the article header instead,
 * since the sticky CTA bar already owns the bottom edge on phones.
 */
export function ShareButtons({
  url,
  title,
  whatsappLabel,
  copyLabel,
  copiedLabel,
  xLabel,
  floating = false,
}: {
  url: string;
  title: string;
  whatsappLabel: string;
  copyLabel: string;
  copiedLabel: string;
  xLabel: string;
  floating?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard permission denied — link is still shareable via the other two buttons
    }
  };

  // No shared bg-* here — two background utilities on one element is the
  // same specificity trap documented for glow/texture classes (globals.css):
  // whichever rule Tailwind emits later in its own stylesheet wins,
  // regardless of class-string order, so bg-white silently beat the
  // WhatsApp button's bg-[#25D366] when both were merged onto one class.
  const btnCls = "press flex items-center justify-center rounded-full text-olive shadow-sm transition-colors";
  const size = floating ? "size-11" : "size-10";

  return (
    <div
      className={cn(
        floating
          ? "fixed top-1/2 start-4 z-30 hidden -translate-y-1/2 flex-col items-center gap-2 lg:flex"
          : "flex items-center gap-2",
      )}
    >
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
        target="_blank"
        rel="noreferrer"
        aria-label={whatsappLabel}
        className={cn(btnCls, size, "bg-[#25D366] text-white hover:bg-[#1ebe5a] hover:text-white")}
      >
        <MessageCircle className="size-[45%]" aria-hidden />
      </a>
      <button type="button" onClick={copy} aria-label={copyLabel} className={cn(btnCls, size, "border border-olive/10 bg-white hover:bg-brass")}>
        {copied ? <Check className="size-[45%]" aria-hidden /> : <Copy className="size-[45%]" aria-hidden />}
      </button>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
        aria-label={xLabel}
        className={cn(btnCls, size, "border border-olive/10 bg-white hover:bg-brass")}
      >
        <XIcon className="size-[40%]" aria-hidden />
      </a>
      {!floating && copied && <span className="text-xs font-semibold text-positive">{copiedLabel}</span>}
    </div>
  );
}
