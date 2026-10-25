import Image from "next/image";
import Link from "next/link";
import { toggleProductFlag } from "@/app/admin/actions";
import { Pill } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/Button";
import { requireAdmin } from "@/lib/admin";
import { cn, formatPrice } from "@/lib/format";

type Row = {
  id: string;
  name: string;
  images: string[];
  is_active: boolean;
  is_bestseller: boolean;
  sort: number;
  category: { name: string; sort: number };
  variants: { price_paise: number; is_active: boolean }[];
};

export default async function AdminProducts() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("products")
    .select("id, name, images, is_active, is_bestseller, sort, category:categories(name, sort), variants:product_variants(price_paise, is_active)")
    .order("sort");
  const rows = ((data ?? []) as unknown as Row[]).sort((a, b) => a.category.sort - b.category.sort || a.sort - b.sort);
  const groups = Map.groupBy(rows, (r) => r.category.name);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{rows.length} products · changes show in the shop straight away</p>
        <Link href="/admin/products/new" className={buttonClass("primary", "md")}>+ Add product</Link>
      </div>
      {[...groups].map(([category, items]) => (
        <section key={category}>
          <h2 className="mb-3 font-serif text-2xl">{category}</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper">
            {items.map((p) => {
              const prices = p.variants.filter((v) => v.is_active).map((v) => v.price_paise);
              return (
                <li key={p.id} className={cn("flex items-center gap-3 p-3", !p.is_active && "opacity-60")}>
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-cream">
                    {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="48px" className="object-contain" />}
                  </div>
                  <Link href={`/admin/products/${p.id}`} className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-sm text-muted">
                      {prices.length ? (prices.length > 1 ? `${formatPrice(Math.min(...prices))} – ${formatPrice(Math.max(...prices))}` : formatPrice(prices[0])) : "No price"}
                      {!p.images.length && " · no photo"}
                    </p>
                  </Link>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    {p.is_bestseller && <Pill tone="good">Bestseller</Pill>}
                    {!p.is_active && <Pill>Hidden</Pill>}
                    <form action={toggleProductFlag}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="field" value="is_active" />
                      <input type="hidden" name="value" value={String(!p.is_active)} />
                      <button className="rounded-full border border-line px-3 py-1 text-xs hover:bg-cream">{p.is_active ? "Hide" : "Show"}</button>
                    </form>
                    <form action={toggleProductFlag}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="field" value="is_bestseller" />
                      <input type="hidden" name="value" value={String(!p.is_bestseller)} />
                      <button className="rounded-full border border-line px-3 py-1 text-xs hover:bg-cream">{p.is_bestseller ? "★ Unmark" : "☆ Bestseller"}</button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
