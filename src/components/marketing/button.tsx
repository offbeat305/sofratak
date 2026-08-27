import type { ButtonHTMLAttributes } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

/**
 * Shared CTA component (fix 2, docs/design-pass-7 follow-up): the
 * brass-glow / edge-light treatment lives here once instead of being
 * copy-pasted per page. Marketing-surface only (home, pricing,
 * contact, grader, cities, how-it-works, /eat) — dashboard, admin, and
 * storefront keep their existing transactional button look on purpose;
 * a halo on every "Save" or "Add to cart" would blow the ≤8% brass
 * budget and stop meaning anything.
 *
 * Polymorphic: pass `href` for navigation (renders the i18n Link),
 * omit it for a real `<button>` (forms, onClick actions).
 */

const SIZES = {
  sm: "h-10 px-5 text-sm",
  md: "h-12 px-6 text-[15px]",
  lg: "h-13 px-8 text-lg",
} as const;

type Variant = "primary" | "secondary" | "ghost";
type Tone = "dark" | "light";
type Size = keyof typeof SIZES;

function classesFor(variant: Variant, tone: Tone, size: Size, className?: string) {
  return cn(
    "press btn-shine inline-flex items-center justify-center gap-2 rounded-btn font-bold",
    SIZES[size],
    // branding.md: primary = brass bg + OLIVE text, always — a few pages
    // had drifted to ivory-on-brass; the shared component is what stops
    // that drift instead of relying on every page to remember
    variant === "primary" && "btn-primary-glow bg-brass text-olive",
    variant === "secondary" &&
      cn(
        "btn-secondary-glow border-[1.5px]",
        tone === "dark" ? "border-ivory/40 text-ivory hover:bg-ivory/10" : "border-olive text-olive hover:bg-olive/5",
      ),
    variant === "ghost" &&
      cn(
        "btn-secondary-glow font-semibold underline-offset-4 hover:underline",
        tone === "dark" ? "text-ivory/85" : "text-olive",
      ),
    className,
  );
}

type CommonProps = {
  variant?: Variant;
  tone?: Tone;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

type LinkProps = CommonProps & {
  href: string;
  locale?: string;
};

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

export function Button(props: LinkProps | ButtonProps) {
  const { variant = "primary", tone = "dark", size = "md", className, children } = props;
  const cls = classesFor(variant, tone, size, className);

  if ("href" in props && props.href !== undefined) {
    const { href, locale } = props;
    // same-page anchors (e.g. "#grader-hero") bypass the i18n Link:
    // it resolves every href through the locale router, which mangles
    // a bare hash into a full navigation instead of an in-page scroll
    if (href.startsWith("#")) {
      return (
        <a href={href} className={cls}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} locale={locale} className={cls}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...rest } = props as ButtonProps;
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}
