"use client";

import { AnimatePresence, m } from "motion/react";
import { useId, useState } from "react";
import { CheckIcon } from "@/components/ui/icons";
import { cn, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart } from "@/store/cart";
import { QtyStepper } from "./AddToCart";

/**
 * Compact size picker + quantity + "Add to cart" for product cards on the menu.
 * The header cart count updates immediately (shared cart store).
 */
export function QuickAdd({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const [variantId, setVariantId] = useState(product.variants[0]?.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const selectId = useId();

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  if (!variant) return null;
  const variants = product.variants;
  // Pills for a few short sizes ("250 g" / "500 g"); a dropdown when there are more.
  const usePills = variants.length > 1 && variants.length <= 3 && variants.every((v) => v.label.length <= 9);

  function handleAdd() {
    add({
      variantId: variant.id,
      productSlug: product.slug,
      name: product.name,
      variantLabel: variant.label,
      image: product.images[0] ?? null,
      unitPrice: variant.price_paise,
      qty,
      ...(product.allows_note ? { note: "", notePrompt: product.note_prompt ?? undefined } : {}),
    });
    setAdded(true);
    setQty(1);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="mt-auto space-y-2.5 pt-2">
      <p className="font-medium text-caramel" aria-live="polite">
        {formatPrice(variant.price_paise)}
        {variants.length > 1 && <span className="ml-1 text-xs font-normal text-muted">· {variant.label}</span>}
      </p>

      {usePills && (
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Size of ${product.name}`}>
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={v.id === variant.id}
              onClick={() => setVariantId(v.id)}
              className={cn(
                "min-h-9 rounded-full border px-3 text-xs transition-colors",
                v.id === variant.id ? "border-chocolate bg-chocolate text-ivory" : "border-line bg-ivory hover:border-chocolate/60",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
      {variants.length > 1 && !usePills && (
        <div>
          <label htmlFor={selectId} className="sr-only">Size of {product.name}</label>
          <select
            id={selectId}
            value={variant.id}
            onChange={(e) => setVariantId(e.target.value)}
            className="field h-10 py-0 pr-8 text-sm"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label} — {formatPrice(v.price_paise)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <QtyStepper value={qty} onChange={setQty} size="card" label={`Quantity of ${product.name}`} />
        <button
          type="button"
          onClick={handleAdd}
          className={cn(
            "relative h-10 min-w-[7.5rem] flex-1 overflow-hidden rounded-full px-3 text-xs font-semibold uppercase tracking-[0.08em] transition-colors active:scale-[0.98]",
            added ? "bg-success text-ivory" : "bg-chocolate text-ivory hover:bg-cocoa",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {added ? (
              <m.span key="added" className="flex items-center justify-center gap-1.5" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <CheckIcon width={16} height={16} /> Added
              </m.span>
            ) : (
              <m.span key="add" className="block" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                Add to cart
              </m.span>
            )}
          </AnimatePresence>
        </button>
      </div>
      <p className="sr-only" role="status">{added ? `${product.name} added to cart` : ""}</p>
      {product.allows_note && <p className="text-[0.7rem] leading-snug text-muted">Choose your flavours in the cart.</p>}
    </div>
  );
}
