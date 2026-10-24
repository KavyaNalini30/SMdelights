import { NextResponse } from "next/server";
import { z } from "zod";
import { loadVariants } from "@/lib/pricing";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const bodySchema = z.object({ variantIds: z.array(z.uuid()).max(40) });

/** Current name/price/image for the variants in a cart, so the cart page never shows stale prices. */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) return NextResponse.json({ items: [] });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const variants = await loadVariants(parsed.data.variantIds);
  const items = [...variants.values()].map((v) => ({
    variantId: v.id,
    name: v.product.name,
    variantLabel: v.label,
    unitPrice: v.price_paise,
    image: v.product.images[0] ?? null,
    chennaiOnly: v.product.chennai_only,
  }));
  return NextResponse.json({ items });
}
