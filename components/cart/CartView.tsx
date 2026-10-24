"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { QtyStepper } from "@/components/product/AddToCart";
import { ProductImage } from "@/components/product/ProductImage";
import { ButtonLink } from "@/components/ui/Button";
import { BagIcon, CloseIcon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/format";
import { cartSubtotal, useCart, useHydrated } from "@/store/cart";
import { useCartSync } from "./useCartSync";

export function CartView() {
  const hydrated = useHydrated();
  const { lines, setQty, setNote, remove } = useCart();
  const { removed } = useCartSync(hydrated);

  if (!hydrated) {
    return <div className="mt-10 h-48 animate-pulse rounded-[var(--radius-card)] bg-cream" aria-busy="true" />;
  }

  if (!lines.length) {
    return (
      <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-line bg-paper/60 px-6 py-16 text-center">
        <BagIcon className="mx-auto text-caramel" width={40} height={40} />
        <p className="mt-4 font-serif text-2xl">Your cart is empty</p>
        <p className="mt-1 text-sm text-muted">Fudgy brownies are just a few taps away.</p>
        <ButtonLink href="/shop" className="mt-6">
          Browse the menu
        </ButtonLink>
      </div>
    );
  }

  const subtotal = cartSubtotal(lines);

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div>
        {removed.length > 0 && (
          <p role="alert" className="mb-4 rounded-xl bg-cream px-4 py-3 text-sm">
            {removed.join(", ")} {removed.length === 1 ? "is" : "are"} no longer available and{" "}
            {removed.length === 1 ? "was" : "were"} removed from your cart.
          </p>
        )}
        <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-paper">
          <AnimatePresence initial={false}>
            {lines.map((line) => (
              <motion.li
                key={line.variantId}
                layout
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex gap-4 p-4"
              >
                <Link href={`/product/${line.productSlug}`} className="w-20 shrink-0 sm:w-24">
                  <ProductImage src={line.image} alt={line.name} sizes="6rem" className="rounded-xl" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/product/${line.productSlug}`} className="font-serif text-xl leading-tight hover:text-cocoa">
                        {line.name}
                      </Link>
                      <p className="text-sm text-muted">
                        {line.variantLabel} · {formatPrice(line.unitPrice)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(line.variantId)}
                      className="-mr-2 -mt-1 grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-cream hover:text-chocolate"
                      aria-label={`Remove ${line.name}`}
                    >
                      <CloseIcon width={18} height={18} />
                    </button>
                  </div>
                  {line.note !== undefined && (
                    <input
                      className="field mt-2 py-2 text-sm"
                      value={line.note}
                      maxLength={200}
                      onChange={(e) => setNote(line.variantId, e.target.value)}
                      aria-label={`Note for ${line.name}`}
                      placeholder="Your flavour choices / note"
                    />
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <QtyStepper size="sm" value={line.qty} onChange={(n) => setQty(line.variantId, n)} label={`Quantity of ${line.name}`} />
                    <p className="font-medium">{formatPrice(line.unitPrice * line.qty)}</p>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <Link href="/shop" className="mt-4 inline-block text-sm text-muted hover:text-chocolate">
          ← Continue shopping
        </Link>
      </div>

      <aside className="rounded-[var(--radius-card)] border border-line bg-paper p-6 lg:sticky lg:top-24">
        <h2 className="font-serif text-2xl">Summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="font-medium">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Delivery</dt>
            <dd>Calculated at checkout</dd>
          </div>
        </dl>
        <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">
          Checkout
        </ButtonLink>
        <p className="mt-3 text-center text-xs text-muted">Orders need at least one day&apos;s notice.</p>
      </aside>
    </div>
  );
}
