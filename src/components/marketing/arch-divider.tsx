import { cn } from "@/lib/cn";

/**
 * The one signature shape (branding.md): a subtle arch used as a section
 * divider. Decorative only.
 */
export function ArchDivider({
  className,
  tone = "olive",
}: {
  className?: string;
  tone?: "olive" | "sand" | "ivory";
}) {
  const colors = {
    olive: "text-olive/15",
    sand: "text-sand",
    ivory: "text-ivory",
  } as const;
  return (
    <div className={cn("flex justify-center py-2", colors[tone], className)} aria-hidden>
      {/* strokes draw in when a parent .reveal becomes .revealed (design-pass §6) */}
      <svg viewBox="0 0 120 28" className="arch-draw h-5 w-28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M30 26 V16 a12 12 0 0 1 24 0 V26" />
        <path d="M2 26 h20" />
        <path d="M60 26 v-10 a12 12 0 0 1 24 0 v10" opacity="0.55" />
        <path d="M98 26 h20" />
      </svg>
    </div>
  );
}
