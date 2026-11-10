"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { brand } from "@/config/brand";
import { lineTotal } from "@/lib/format";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  qty: number;
  max: number;
};

type State = { lines: CartLine[]; open: boolean; hydrated: boolean };
type Action =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; line: Omit<CartLine, "qty">; qty: number }
  | { type: "remove"; productId: string }
  | { type: "setQty"; productId: string; qty: number }
  | { type: "clear" }
  | { type: "open"; open: boolean };

const clamp = (qty: number, max: number) => Math.max(1, Math.min(qty, max, brand.maxQtyPerLine));

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...state, lines: action.lines, hydrated: true };
    case "add": {
      const existing = state.lines.find((l) => l.productId === action.line.productId);
      const lines = existing
        ? state.lines.map((l) =>
            l.productId === existing.productId
              ? { ...l, price: action.line.price, max: action.line.max, qty: clamp(l.qty + action.qty, action.line.max) }
              : l,
          )
        : [...state.lines, { ...action.line, qty: clamp(action.qty, action.line.max) }];
      return { ...state, lines, open: true };
    }
    case "remove":
      return { ...state, lines: state.lines.filter((l) => l.productId !== action.productId) };
    case "setQty":
      return {
        ...state,
        lines: state.lines.map((l) => (l.productId === action.productId ? { ...l, qty: clamp(action.qty, l.max) } : l)),
      };
    case "clear":
      return { ...state, lines: [] };
    case "open":
      return { ...state, open: action.open };
  }
}

type CartContextValue = {
  lines: CartLine[];
  open: boolean;
  hydrated: boolean;
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = `${brand.name.toLowerCase()}-cart-v1`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [], open: false, hydrated: false });

  // Restore the cart after the first render so server and client markup match.
  useEffect(() => {
    let lines: CartLine[] = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(parsed)) {
        lines = parsed.filter(
          (l): l is CartLine =>
            typeof l?.productId === "string" && typeof l?.name === "string" && typeof l?.price === "number" && Number.isInteger(l?.qty) && l.qty > 0,
        );
      }
    } catch {
      lines = [];
    }
    dispatch({ type: "hydrate", lines });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      /* storage can be blocked; the cart still works for this visit */
    }
  }, [state.lines, state.hydrated]);

  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => dispatch({ type: "add", line, qty }), []);
  const remove = useCallback((productId: string) => dispatch({ type: "remove", productId }), []);
  const setQty = useCallback((productId: string, qty: number) => dispatch({ type: "setQty", productId, qty }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const setOpen = useCallback((open: boolean) => dispatch({ type: "open", open }), []);

  const value = useMemo<CartContextValue>(() => {
    const count = state.lines.reduce((n, l) => n + l.qty, 0);
    const cents = state.lines.reduce((n, l) => n + Math.round(lineTotal(l.price, l.qty) * 100), 0);
    return { lines: state.lines, open: state.open, hydrated: state.hydrated, count, subtotal: cents / 100, add, remove, setQty, clear, setOpen };
  }, [state, add, remove, setQty, clear, setOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
