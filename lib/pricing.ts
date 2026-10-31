import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

/*
 * Server-side pricing. The ONLY source of prices for an order is the database —
 * whatever the browser says a cart costs is ignored. Reads go through the public
 * client, so RLS also guarantees hidden products/variants can't be bought.
 */
export type PricedLine = {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantLabel: string;
  image: string | null;
  unitPricePaise: number;
  qty: number;
  note?: string;
  chennaiOnly: boolean;
  weightGrams: number | null;
};

type VariantRow = {
  id: string;
  label: string;
  price_paise: number;
  weight_grams: number | null;
  is_active: boolean;
  product: { id: string; slug: string; name: string; images: string[]; is_active: boolean; chennai_only: boolean; allows_note: boolean };
};

export async function loadVariants(variantIds: string[]) {
  const unique = [...new Set(variantIds)];
  if (!unique.length) return new Map<string, VariantRow>();
  const { data, error } = await createPublicClient()
    .from("product_variants")
    .select("id, label, price_paise, weight_grams, is_active, product:products!inner(id, slug, name, images, is_active, chennai_only, allows_note)")
    .in("id", unique);
  if (error) throw new Error(`Could not load prices: ${error.message}`);
  const rows = (data ?? []) as unknown as VariantRow[];
  return new Map(rows.filter((r) => r.is_active && r.product.is_active).map((r) => [r.id, r]));
}

/**
 * Prices a cart. Returns the lines that are still for sale plus the ids that aren't
 * (removed from the menu since the customer added them).
 */
export async function priceCart(lines: { variantId: string; qty: number; note?: string }[]) {
  const variants = await loadVariants(lines.map((l) => l.variantId));
  const priced: PricedLine[] = [];
  const unavailable: string[] = [];

  // Merge duplicate lines of the same variant.
  const merged = new Map<string, { qty: number; note?: string }>();
  for (const l of lines) {
    const prev = merged.get(l.variantId);
    merged.set(l.variantId, { qty: Math.min(50, (prev?.qty ?? 0) + l.qty), note: l.note ?? prev?.note });
  }

  for (const [variantId, { qty, note }] of merged) {
    const v = variants.get(variantId);
    if (!v) {
      unavailable.push(variantId);
      continue;
    }
    priced.push({
      variantId,
      productId: v.product.id,
      productSlug: v.product.slug,
      productName: v.product.name,
      variantLabel: v.label,
      image: v.product.images[0] ?? null,
      unitPricePaise: v.price_paise,
      qty,
      note: v.product.allows_note ? note : undefined,
      chennaiOnly: v.product.chennai_only,
      weightGrams: v.weight_grams,
    });
  }

  const subtotalPaise = priced.reduce((sum, l) => sum + l.unitPricePaise * l.qty, 0);
  return { lines: priced, unavailable, subtotalPaise };
}
