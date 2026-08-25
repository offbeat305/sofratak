/**
 * Designed missing-photo state (design-pass-2 A3): olive-tinted panel,
 * subtle arch motif, the listing's initial in display type. Replaces
 * every raw fallback — no broken images, no gray boxes. Server-safe.
 */
export function ListingPlaceholder({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const initial = (name.trim()[0] ?? "•").toUpperCase();
  return (
    <div
      aria-hidden
      className={`relative flex items-center justify-center overflow-hidden bg-olive/[0.08] ${className}`}
    >
      <svg
        viewBox="0 0 96 96"
        className="absolute inset-0 h-full w-full text-olive/[0.10]"
        preserveAspectRatio="xMidYMax slice"
      >
        <path
          d="M8 96 V56 a40 40 0 0 1 80 0 V96"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          d="M28 96 V64 a20 20 0 0 1 40 0 V96"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />
      </svg>
      <span className="relative font-display text-2xl font-bold text-olive/45">{initial}</span>
    </div>
  );
}
