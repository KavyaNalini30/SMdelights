import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductImage } from "./ProductImage";
import { QuickAdd } from "./QuickAdd";

export function priceLabel(product: Product) {
  const prices = product.variants.map((v) => v.price_paise);
  const min = Math.min(...prices);
  return prices.length > 1 && Math.max(...prices) !== min ? `From ${formatPrice(min)}` : formatPrice(min);
}

/** Menu card: photo and name open the product page; size, quantity and Add to cart work in place. */
export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const href = `/product/${product.slug}`;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line/70 bg-paper shadow-soft transition-shadow duration-300 hover:shadow-lift">
      <Link href={href} tabIndex={-1} aria-hidden className="block overflow-hidden">
        <ProductImage
          src={product.images[0]}
          alt=""
          priority={priority}
          sizes="(min-width: 1024px) 18rem, (min-width: 640px) 33vw, 50vw"
          imageClassName="transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-1 border-t border-line/50 p-3 sm:p-4">
        <h3 className="font-serif text-lg leading-snug sm:text-xl">
          <Link href={href} className="hover:text-cocoa focus-visible:underline">
            {product.name}
          </Link>
        </h3>
        {product.description && (
          <p className="line-clamp-2 text-[0.8rem] leading-relaxed text-muted max-sm:hidden">{product.description}</p>
        )}
        <QuickAdd product={product} />
      </div>
    </article>
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
