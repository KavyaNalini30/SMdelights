"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { Button, buttonClass } from "@/components/ui/Button";
import { CheckIcon, MinusIcon, PlusIcon } from "@/components/ui/icons";
import { cn, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { MAX_QTY, useCart } from "@/store/cart";

export function AddToCart({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const [variantId, setVariantId] = useState(product.variants[0]?.id);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);
  const noteId = useId();

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  if (!variant) return null;
  const hasChoice = product.variants.length > 1;

  function handleAdd() {
    add({
      variantId: variant.id,
      productSlug: product.slug,
      name: product.name,
      variantLabel: variant.label,
      image: product.images[0] ?? null,
      unitPrice: variant.price_paise,
      qty,
      note: note.trim() || undefined,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="space-y-6">
      {hasChoice && (
        <fieldset>
          <legend className="label">Choose an option</legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <label
                key={v.id}
                className={cn(
                  "cursor-pointer rounded-full border px-4 py-2.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-caramel",
                  v.id === variant.id
                    ? "border-chocolate bg-chocolate text-ivory"
                    : "border-line bg-paper hover:border-chocolate/60",
                )}
              >
                <input
                  type="radio"
                  name="variant"
                  value={v.id}
                  checked={v.id === variant.id}
                  onChange={() => setVariantId(v.id)}
                  className="sr-only"
                />
                {v.label} · {formatPrice(v.price_paise)}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {product.allows_note && (
        <div>
          <label htmlFor={noteId} className="label">
            {product.note_prompt ?? "Any special request?"} <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id={noteId}
            className="field"
            maxLength={200}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. KitKat and Pistachio"
          />
        </div>
      )}

      <div className="flex items-center gap-4">
        <span className="label mb-0">Quantity</span>
        <QtyStepper value={qty} onChange={setQty} />
      </div>

      {/* Desktop: inline. Mobile: sticky bar above the thumb zone. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-4 py-3 pr-22 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="flex items-center gap-3">
          <div className="min-w-20">
            <p className="text-xs text-muted">Total</p>
            <p className="font-serif text-2xl leading-none">{formatPrice(variant.price_paise * qty)}</p>
          </div>
          <Button size="lg" className="flex-1 md:max-w-xs" onClick={handleAdd} aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span key="added" className="flex items-center gap-2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <CheckIcon width={18} height={18} /> Added to cart
                </motion.span>
              ) : (
                <motion.span key="add" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  Add to cart
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
        {added && (
          <Link href="/cart" className={buttonClass("ghost", "sm", "mt-2 w-full md:w-auto")}>
            View cart &amp; checkout →
          </Link>
        )}
      </div>
    </div>
  );
}

export function QtyStepper({
  value,
  onChange,
  size = "md",
  label = "Quantity",
}: {
  value: number;
  onChange: (n: number) => void;
  size?: "sm" | "md";
  label?: string;
}) {
  const btn = cn(
    "grid place-items-center rounded-full transition-colors hover:bg-cream disabled:opacity-40",
    size === "sm" ? "size-8" : "size-10",
  );
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-paper p-0.5" role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        <MinusIcon width={16} height={16} />
      </button>
      <span className={cn("text-center font-medium tabular-nums", size === "sm" ? "w-7 text-sm" : "w-9")} aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= MAX_QTY} aria-label="Increase quantity">
        <PlusIcon width={16} height={16} />
      </button>
    </div>
  );
}
