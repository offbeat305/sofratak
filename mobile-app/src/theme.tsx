import { createContext, useContext, useMemo } from "react";
import type { RestaurantView } from "./types";

/**
 * Per-tenant theming (docs/mobile-app-spec.md §2): the restaurant's own
 * brand colors drive the shell, exactly like the web storefront's
 * --sf-primary/--sf-accent CSS variables. Sofratak's olive/brass appears
 * only on the restaurant picker, before a tenant is chosen.
 */

export const SOFRATAK = {
  olive: "#2F4A3C",
  brass: "#A9792B",
  ivory: "#F7F2E8",
  sand: "#D8C19A",
  charcoal: "#1F1F1F",
  stone: "#6B6B62",
  positive: "#2E7D4F",
  error: "#B3372F",
} as const;

export type Theme = {
  /** tenant primary — headers, CTAs */
  primary: string;
  /** tenant accent — highlights, price tags */
  accent: string;
  bg: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  positive: string;
  error: string;
  onPrimary: string;
};

/** Relative luminance check so text on the tenant primary stays readable. */
function readableOn(hex: string): string {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.6 ? SOFRATAK.charcoal : "#FFFFFF";
}

export function themeFor(restaurant: RestaurantView | null): Theme {
  const primary = restaurant?.brand.primary ?? SOFRATAK.olive;
  const accent = restaurant?.brand.accent ?? SOFRATAK.brass;
  return {
    primary,
    accent,
    bg: "#FAF8F4",
    card: "#FFFFFF",
    text: SOFRATAK.charcoal,
    muted: SOFRATAK.stone,
    border: "rgba(31,31,31,0.10)",
    positive: SOFRATAK.positive,
    error: SOFRATAK.error,
    onPrimary: readableOn(primary),
  };
}

const ThemeContext = createContext<Theme>(themeFor(null));

export function ThemeProvider({
  restaurant,
  children,
}: {
  restaurant: RestaurantView | null;
  children: React.ReactNode;
}) {
  const theme = useMemo(() => themeFor(restaurant), [restaurant]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
