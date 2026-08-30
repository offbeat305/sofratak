import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchStorefront } from "./api";
import { useCart } from "./cart";
import type { StorefrontResponse } from "./types";

/**
 * The active restaurant's storefront (branding + menu), loaded once per
 * restaurant selection and shared by every screen. Reload is manual
 * (pull-to-refresh on the menu) — menus don't change mid-session often
 * enough to poll, and the server re-validates everything at checkout
 * anyway (sold-out items, price changes) with clear errors.
 */

type Storefront = {
  data: StorefrontResponse | null;
  loading: boolean;
  error: boolean;
  reload: () => void;
};

const StorefrontContext = createContext<Storefront>({
  data: null,
  loading: false,
  error: false,
  reload: () => {},
});

export function StorefrontProvider({ children }: { children: React.ReactNode }) {
  const { restaurantSlug } = useCart();
  const [data, setData] = useState<StorefrontResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!restaurantSlug) {
      setData(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(false);
    fetchStorefront(restaurantSlug)
      .then((res) => {
        if (alive) setData(res);
      })
      .catch(() => {
        if (alive) setError(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [restaurantSlug, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const value = useMemo(() => ({ data, loading, error, reload }), [data, loading, error, reload]);
  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>;
}

export function useStorefront(): Storefront {
  return useContext(StorefrontContext);
}
