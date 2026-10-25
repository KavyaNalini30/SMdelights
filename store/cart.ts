"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Cart, persisted to localStorage so it survives refreshes.
 * Name/price/image are a display snapshot only — the server re-reads every price
 * from the database at checkout and ignores anything the browser sends.
 */
export type CartLine = {
  variantId: string;
  productSlug: string;
  name: string;
  variantLabel: string;
  image: string | null;
  unitPrice: number; // paise, display only
  qty: number;
  note?: string; // e.g. chosen flavours for Brownie Duo. A string (even "") means the product asks for one.
  notePrompt?: string; // the product's question, e.g. "Which 2 flavours would you like?"
};

export const MAX_QTY = 50;

type CartState = {
  lines: CartLine[];
  add: (line: CartLine) => void;
  setQty: (variantId: string, qty: number) => void;
  setNote: (variantId: string, note: string) => void;
  remove: (variantId: string) => void;
  /** Replace display snapshots with fresh server data (prices may have changed). */
  sync: (fresh: Array<Pick<CartLine, "variantId" | "name" | "variantLabel" | "unitPrice" | "image">>) => void;
  clear: () => void;
};

const clampQty = (n: number) => Math.max(1, Math.min(MAX_QTY, Math.floor(n)));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line) =>
        set((s) => {
          const existing = s.lines.find((l) => l.variantId === line.variantId);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.variantId === line.variantId
                  ? { ...l, qty: clampQty(l.qty + line.qty), note: line.note || l.note }
                  : l,
              ),
            };
          }
          return { lines: [...s.lines, { ...line, qty: clampQty(line.qty) }] };
        }),
      setQty: (variantId, qty) =>
        set((s) => ({ lines: s.lines.map((l) => (l.variantId === variantId ? { ...l, qty: clampQty(qty) } : l)) })),
      setNote: (variantId, note) =>
        set((s) => ({ lines: s.lines.map((l) => (l.variantId === variantId ? { ...l, note: note.slice(0, 200) } : l)) })),
      remove: (variantId) => set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) })),
      sync: (fresh) =>
        set((s) => {
          const byId = new Map(fresh.map((f) => [f.variantId, f]));
          return {
            lines: s.lines.filter((l) => byId.has(l.variantId)).map((l) => ({ ...l, ...byId.get(l.variantId)! })),
          };
        }),
      clear: () => set({ lines: [] }),
    }),
    { name: "smd-cart", version: 1 },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty * l.unitPrice, 0);

const noopSubscribe = () => () => {};
/** False during SSR and the first client render, so persisted cart data never causes a hydration mismatch. */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
