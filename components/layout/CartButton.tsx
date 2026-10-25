"use client";

import Link from "next/link";
import { m } from "motion/react";
import { BagIcon } from "@/components/ui/icons";
import { cartCount, useCart, useHydrated } from "@/store/cart";

export function CartButton() {
  const hydrated = useHydrated();
  const count = useCart((s) => cartCount(s.lines));
  const shown = hydrated ? count : 0;

  return (
    <Link
      href="/cart"
      className="relative grid size-11 place-items-center rounded-full text-chocolate transition-colors hover:bg-cream"
      aria-label={shown ? `Cart, ${shown} item${shown === 1 ? "" : "s"}` : "Cart"}
    >
      <BagIcon />
      {shown > 0 && (
        // Keyed by the count so it "pops" each time something is added.
        <m.span
          key={shown}
          initial={{ scale: 1.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          className="absolute right-1 top-1 grid min-w-5 place-items-center rounded-full bg-caramel px-1 text-[0.7rem] font-semibold leading-5 text-ivory"
        >
          {shown > 99 ? "99+" : shown}
        </m.span>
      )}
    </Link>
  );
}
