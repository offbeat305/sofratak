import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CartLine, MenuView } from "./types";

/**
 * Cart state, persisted per restaurant (switching restaurants clears it —
 * a cart only makes sense against one menu). Client-side prices are
 * display-only; the server re-prices everything at order placement, same
 * trust model as web.
 */

type Cart = {
  /** false until the persisted cart has loaded — gate initial navigation on it */
  hydrated: boolean;
  restaurantSlug: string | null;
  lines: CartLine[];
  setRestaurant: (slug: string) => void;
  addLine: (line: CartLine) => void;
  updateQty: (index: number, qty: number) => void;
  removeLine: (index: number) => void;
  clear: () => void;
};

const CartContext = createContext<Cart | null>(null);
const CART_KEY = "sofratak.cart.v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [restaurantSlug, setSlug] = useState<string | null>(null);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CART_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as { restaurantSlug: string | null; lines: CartLine[] };
          setSlug(saved.restaurantSlug);
          setLines(Array.isArray(saved.lines) ? saved.lines : []);
        }
      } catch {
        // corrupted cart — start fresh
      } finally {
        hydratedRef.current = true;
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(CART_KEY, JSON.stringify({ restaurantSlug, lines })).catch(() => {});
  }, [restaurantSlug, lines]);

  const setRestaurant = useCallback((slug: string) => {
    setSlug((prev) => {
      if (prev !== slug) setLines([]);
      return slug;
    });
  }, []);

  const addLine = useCallback((line: CartLine) => {
    setLines((prev) => [...prev, line]);
  }, []);

  const updateQty = useCallback((index: number, qty: number) => {
    setLines((prev) =>
      qty < 1
        ? prev.filter((_, i) => i !== index)
        : prev.map((l, i) => (i === index ? { ...l, qty: Math.min(qty, 20) } : l)),
    );
  }, []);

  const removeLine = useCallback((index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({ hydrated, restaurantSlug, lines, setRestaurant, addLine, updateQty, removeLine, clear }),
    [hydrated, restaurantSlug, lines, setRestaurant, addLine, updateQty, removeLine, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): Cart {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart outside CartProvider");
  return ctx;
}

/** Display-only pricing against the loaded menu (server re-prices). */
export function priceCartLine(menu: MenuView, line: CartLine): number {
  const item = menu.items.find((i) => i.id === line.menuItemId);
  if (!item) return 0;
  let delta = 0;
  for (const group of menu.modifierGroups) {
    for (const optionId of line.options[group.id] ?? []) {
      delta += group.options.find((o) => o.id === optionId)?.priceDeltaCents ?? 0;
    }
  }
  return (item.priceCents + delta) * line.qty;
}

export function cartSubtotalCents(menu: MenuView, lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + priceCartLine(menu, line), 0);
}
