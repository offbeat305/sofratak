import type { StoryTocItem } from "@/lib/stories";

/**
 * Table of contents (design-pass-6 B) — sticky sidebar on desktop,
 * collapsible <details> on mobile. No JS needed for either: h2s already
 * carry scroll-margin-top (.story-prose h2) so a plain anchor jump lands
 * below the sticky nav/progress bar, not under it.
 *
 * Rendered from two call sites, not one: the desktop sidebar sits next
 * to the prose (mid-document in DOM order), but a reader wants the
 * mobile version as a jump-menu BEFORE the body, right under the
 * header — not after 1500 words, which is where it'd land if this
 * lived in the same grid cell as the desktop nav.
 */
export function Toc({
  items,
  label,
  variant = "both",
}: {
  items: StoryTocItem[];
  label: string;
  variant?: "desktop" | "mobile" | "both";
}) {
  if (items.length < 2) return null;

  const list = (
    <ol className="flex flex-col gap-2 text-sm">
      {items.map((item, i) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            className="flex gap-2 text-stone hover:text-brass-deep"
          >
            <span className="data-label text-olive/35">{String(i + 1).padStart(2, "0")}</span>
            <span>{item.text}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      {variant !== "mobile" && (
        <nav aria-label={label} className="hidden lg:sticky lg:top-28 lg:block">
          <p className="data-label text-olive/50">{label}</p>
          <div className="mt-3">{list}</div>
        </nav>
      )}

      {variant !== "desktop" && (
        <details className="card-crisp rounded-card bg-white p-4 lg:hidden">
          <summary className="cursor-pointer font-display text-sm font-bold text-olive">{label}</summary>
          <div className="mt-3">{list}</div>
        </details>
      )}
    </>
  );
}
