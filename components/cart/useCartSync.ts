"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/store/cart";

/** Refreshes cart prices/names from the server once per page view and drops items no longer sold. */
export function useCartSync(enabled: boolean) {
  const lines = useCart((s) => s.lines);
  const sync = useCart((s) => s.sync);
  const [removed, setRemoved] = useState<string[]>([]);
  const [chennaiOnly, setChennaiOnly] = useState<Set<string>>(new Set());
  const done = useRef(false);

  useEffect(() => {
    if (!enabled || done.current || !lines.length) return;
    done.current = true;
    const ids = lines.map((l) => l.variantId);
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantIds: ids }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { items: Array<{ variantId: string; name: string; variantLabel: string; unitPrice: number; image: string | null; chennaiOnly: boolean }> } | null) => {
        // No answer, or an empty one (menu not reachable / not set up yet): keep the cart untouched.
        // Checkout re-checks every item on the server anyway.
        if (!data?.items?.length) return;
        const found = new Set(data.items.map((i) => i.variantId));
        setRemoved(lines.filter((l) => !found.has(l.variantId)).map((l) => l.name));
        setChennaiOnly(new Set(data.items.filter((i) => i.chennaiOnly).map((i) => i.variantId)));
        sync(data.items);
      })
      .catch(() => {});
  }, [enabled, lines, sync]);

  return { removed, chennaiOnly };
}
