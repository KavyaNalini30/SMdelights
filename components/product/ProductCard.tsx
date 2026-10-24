import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductImage } from "./ProductImage";

export function priceLabel(product: Product) {
  const prices = product.variants.map((v) => v.price_paise);
  const min = Math.min(...prices);
  return prices.length > 1 && Math.max(...prices) !== min ? `From ${formatPrice(min)}` : formatPrice(min);
}

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line/70 bg-paper shadow-soft transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="overflow-hidden">
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          priority={priority}
          sizes="(min-width: 1024px) 18rem, (min-width: 640px) 33vw, 50vw"
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5 sm:p-4">
        <h3 className="font-serif text-lg leading-snug sm:text-xl">{product.name}</h3>
        {product.description && (
          <p className="line-clamp-2 text-[0.8rem] leading-relaxed text-muted max-sm:hidden">{product.description}</p>
        )}
        <p className="mt-auto pt-1 font-medium text-caramel">{priceLabel(product)}</p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
