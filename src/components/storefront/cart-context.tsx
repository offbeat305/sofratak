"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { LocalizedText } from "@/lib/db/types";
import { fireFunnelEvent } from "./funnel-beacon";

export type CartLine = {
  /** stable key: itemId + serialized options */
  key: string;
  menuItemId: string;
  name: LocalizedText;
  /** display-only; the server reprices from the live menu at checkout */
  unitPriceCents: number;
  qty: number;
  options: Record<string, string[]>;
  optionNames: LocalizedText[];
  notes: string | null;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  addLine: (line: Omit<CartLine, "key">) => void;
  updateQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
  /**
   * Diner's pickup/delivery choice, made up front on the menu page and
   * carried into checkout (which can still change it). Persisted per
   * restaurant. Availability is enforced where it's consumed — the
   * toggle UI and checkout both know what the restaurant offers.
   */
  fulfillment: "pickup" | "delivery";
  setFulfillment: (value: "pickup" | "delivery") => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function lineKey(menuItemId: string, options: Record<string, string[]>, notes: string | null) {
  const opts = Object.keys(options)
    .sort()
    .map((g) => `${g}:${[...options[g]].sort().join(",")}`)
    .join("|");
  return `${menuItemId}|${opts}|${notes ?? ""}`;
}

export function CartProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const storageKey = `sofratak-cart-${slug}`;
  const fulfillmentKey = `sofratak-fulfillment-${slug}`;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [fulfillment, setFulfillmentState] = useState<"pickup" | "delivery">("pickup");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
      const savedFulfillment = window.localStorage.getItem(fulfillmentKey);
      if (savedFulfillment === "delivery" || savedFulfillment === "pickup") {
        setFulfillmentState(savedFulfillment);
      }
    } catch {
      // corrupted cart — start fresh
    }
    setHydrated(true);
  }, [storageKey, fulfillmentKey]);

  const setFulfillment = useCallback(
    (value: "pickup" | "delivery") => {
      setFulfillmentState(value);
      try {
        window.localStorage.setItem(fulfillmentKey, value);
      } catch {
        // storage blocked — choice still works in memory
      }
    },
    [fulfillmentKey],
  );

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {
      // storage full/blocked — cart still works in memory
    }
  }, [lines, hydrated, storageKey]);

  const addLine = useCallback(
    (line: Omit<CartLine, "key">) => {
      fireFunnelEvent(slug, "add_to_cart");
      const key = lineKey(line.menuItemId, line.options, line.notes);
      setLines((prev) => {
        const existing = prev.find((l) => l.key === key);
        if (existing) {
          return prev.map((l) =>
            l.key === key ? { ...l, qty: Math.min(20, l.qty + line.qty) } : l,
          );
        }
        return [...prev, { ...line, key }];
      });
    },
    [slug],
  );

  const updateQty = useCallback((key: string, qty: number) => {
    setLines((prev) =>
      qty < 1
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => (l.key === key ? { ...l, qty: Math.min(20, qty) } : l)),
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotalCents = lines.reduce((n, l) => n + l.unitPriceCents * l.qty, 0);
    return {
      lines,
      count,
      subtotalCents,
      addLine,
      updateQty,
      removeLine,
      clear,
      fulfillment,
      setFulfillment,
    };
  }, [lines, addLine, updateQty, removeLine, clear, fulfillment, setFulfillment]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
