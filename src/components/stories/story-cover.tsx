/**
 * Generated cover art (design-pass-6 A): deterministic per slug so no two
 * cards look alike, and so the "no scraping" rule stays unbreakable —
 * these are never photos. Arch motifs + geometric dividers only, per
 * branding.md's "subtle arch shapes, refined geometric dividers" rule.
 */
const PALETTES = [
  { bg: "#2F4A3C", line: "rgba(247,242,232,0.16)", accent: "#A9792B" }, // olive
  { bg: "#D8C19A", line: "rgba(47,74,60,0.14)", accent: "#2F4A3C" }, // sand
  { bg: "#3A5A48", line: "rgba(169,121,43,0.28)", accent: "#F7F2E8" }, // brass-lit olive
] as const;

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

export function StoryCover({ slug, className }: { slug: string; className?: string }) {
  const h = hashSlug(slug);
  const palette = PALETTES[h % PALETTES.length];
  const pattern = Math.floor(h / PALETTES.length) % 3;
  const patternId = `sc-${slug}`;

  return (
    <svg
      viewBox="0 0 400 225"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <rect width="400" height="225" fill={palette.bg} />
      {pattern === 0 && (
        <>
          <defs>
            <pattern id={patternId} width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M5 50 V30 a20 20 0 0 1 40 0 V50" fill="none" stroke={palette.line} strokeWidth="2" />
            </pattern>
          </defs>
          <rect width="400" height="225" fill={`url(#${patternId})`} />
        </>
      )}
      {pattern === 1 && (
        <>
          <defs>
            <pattern id={patternId} width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.6" fill={palette.line} />
            </pattern>
          </defs>
          <rect width="400" height="225" fill={`url(#${patternId})`} />
        </>
      )}
      {pattern === 2 && (
        <>
          <defs>
            <pattern id={patternId} width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
              <line x1="0" y1="0" x2="0" y2="34" stroke={palette.line} strokeWidth="2" />
            </pattern>
          </defs>
          <rect width="400" height="225" fill={`url(#${patternId})`} />
        </>
      )}
      <path
        d="M-20 225 V150 a120 120 0 0 1 240 0 V225"
        fill="none"
        stroke={palette.accent}
        strokeOpacity="0.5"
        strokeWidth="3"
      />
      <circle cx="352" cy="46" r="3" fill={palette.accent} fillOpacity="0.8" />
    </svg>
  );
}
