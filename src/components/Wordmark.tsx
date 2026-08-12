import { cn } from "@/lib/cn";

/** Sofratak wordmark with the subtle arch mark — the one signature shape. */
export function Wordmark({
  className,
  tone = "olive",
}: {
  className?: string;
  tone?: "olive" | "ivory";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2",
        tone === "olive" ? "text-olive" : "text-ivory",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        aria-hidden
        fill="currentColor"
      >
        {/* arch shape */}
        <path d="M4 22V12C4 7.58 7.58 4 12 4s8 3.58 8 8v10h-3.5V12a4.5 4.5 0 1 0-9 0v10H4Z" />
      </svg>
      <span className="text-xl font-bold tracking-tight">Sofratak</span>
    </span>
  );
}
